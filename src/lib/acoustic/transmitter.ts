import {
  getDefaultParameters,
  init,
  encode,
  free,
  GGWAVE_OPERATING_MODE_TX,
  GGWAVE_OPERATING_MODE_USE_DSS,
} from 'ggwave-js';
import { AcousticPacket, serializePacket } from './protocol';

export interface TransmitterOptions {
  protocolId: number;
  volume: number; // 0 to 100
  interPacketDelayMs: number;
  loopTransmission: boolean;
}

export type TransmitterStatus = 'idle' | 'transmitting' | 'paused' | 'completed';

export interface TransmitterProgress {
  status: TransmitterStatus;
  currentPacketIndex: number;
  totalPackets: number;
  currentChunkIndex: number;
  totalChunks: number;
  currentPacket: AcousticPacket | null;
  repeatCycle: number;
  volume: number;
}

export class AcousticTransmitter {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private ggInstance: number = -1;
  private sampleRate: number = 48000;
  private packets: AcousticPacket[] = [];
  private options: TransmitterOptions = {
    protocolId: 5, // ULTRASOUND_FASTEST (near-silent, ultra-fast 15.0 - 19.5 kHz)
    volume: 65,
    interPacketDelayMs: 100,
    loopTransmission: false,
  };

  private status: TransmitterStatus = 'idle';
  private currentPacketIndex: number = 0;
  private repeatCycle: number = 0;
  private isCancelled: boolean = false;
  private isPaused: boolean = false;
  private activeSource: AudioBufferSourceNode | null = null;

  private onProgressCallback?: (progress: TransmitterProgress) => void;

  constructor(options?: Partial<TransmitterOptions>) {
    if (options) {
      this.options = { ...this.options, ...options };
    }
  }

  public setOptions(options: Partial<TransmitterOptions>) {
    this.options = { ...this.options, ...options };
  }

  public getOptions(): TransmitterOptions {
    return { ...this.options };
  }

  public setProgressCallback(cb: (progress: TransmitterProgress) => void) {
    this.onProgressCallback = cb;
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public getAudioContext(): AudioContext | null {
    return this.audioCtx;
  }

  public async initAudio(): Promise<AudioContext> {
    if (!this.audioCtx || this.audioCtx.state === 'closed') {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioContextClass({ sampleRate: this.sampleRate });
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 1024;
      this.analyser.smoothingTimeConstant = 0.8;
      this.analyser.connect(this.audioCtx.destination);
    }

    if (this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }

    if (this.ggInstance === -1) {
      const params = getDefaultParameters();
      params.sampleRate = this.audioCtx.sampleRate || this.sampleRate;
      params.sampleRateInp = params.sampleRate;
      params.sampleRateOut = params.sampleRate;
      params.operatingMode = GGWAVE_OPERATING_MODE_TX | GGWAVE_OPERATING_MODE_USE_DSS;
      this.ggInstance = init(params);
    }

    return this.audioCtx;
  }

  public emitProgress() {
    if (!this.onProgressCallback) return;

    let totalChunks = 0;
    let currentChunkIndex = -1;

    for (let i = 0; i < this.packets.length; i++) {
      if (this.packets[i].type === 'C') {
        totalChunks++;
      }
    }

    const currentPkt = this.packets[this.currentPacketIndex] || null;
    if (currentPkt && currentPkt.type === 'C') {
      currentChunkIndex = currentPkt.index;
    }

    this.onProgressCallback({
      status: this.status,
      currentPacketIndex: this.currentPacketIndex,
      totalPackets: this.packets.length,
      currentChunkIndex,
      totalChunks,
      currentPacket: currentPkt,
      repeatCycle: this.repeatCycle,
      volume: this.options.volume,
    });
  }

  /**
   * Play a short audio test chirp
   */
  public async playTestChirp(): Promise<void> {
    await this.initAudio();
    if (!this.audioCtx || !this.analyser) return;

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    const now = this.audioCtx.currentTime;

    osc.type = 'sine';
    // Smooth ultrasonic pulse (15.5 kHz – 18.5 kHz) - tests ultrasound transducer without loud piercing beep
    osc.frequency.setValueAtTime(15500, now);
    osc.frequency.exponentialRampToValueAtTime(18500, now + 0.15);

    gain.gain.setValueAtTime((this.options.volume / 100) * 0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.analyser);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  /**
   * Set packets to transmit and start broadcasting
   */
  public async startTransmission(packets: AcousticPacket[]): Promise<void> {
    if (packets.length === 0) return;

    await this.initAudio();
    this.packets = packets;
    this.status = 'transmitting';
    this.isCancelled = false;
    this.isPaused = false;
    this.currentPacketIndex = 0;
    this.repeatCycle = 0;

    this.emitProgress();
    this.transmitLoop();
  }

  /**
   * Main transmission loop
   */
  private async transmitLoop(): Promise<void> {
    while (!this.isCancelled) {
      if (this.isPaused) {
        await new Promise((r) => setTimeout(r, 100));
        continue;
      }

      if (this.currentPacketIndex >= this.packets.length) {
        if (this.options.loopTransmission && !this.isCancelled) {
          // Restart loop
          this.repeatCycle++;
          this.currentPacketIndex = 0;
          await new Promise((r) => setTimeout(r, 250)); // Short pause between loop repetitions
          continue;
        } else {
          // Done
          this.status = 'completed';
          this.emitProgress();
          break;
        }
      }

      const packet = this.packets[this.currentPacketIndex];
      this.emitProgress();

      try {
        await this.transmitPacket(packet);
      } catch (err) {
        console.error('Error transmitting packet:', err);
      }

      if (this.isCancelled) break;

      this.currentPacketIndex++;
      this.emitProgress();

      // Inter-packet delay
      if (this.currentPacketIndex < this.packets.length || this.options.loopTransmission) {
        await new Promise((r) => setTimeout(r, this.options.interPacketDelayMs));
      }
    }
  }

  /**
   * Encode a single packet and play its waveform through the Web Audio destination
   */
  public async transmitPacket(packet: AcousticPacket): Promise<void> {
    if (!this.audioCtx || this.ggInstance === -1 || !this.analyser) {
      await this.initAudio();
    }
    if (!this.audioCtx || !this.analyser) return;

    const payloadStr = serializePacket(packet);
    const rawWaveform = encode(
      this.ggInstance,
      payloadStr,
      this.options.protocolId,
      this.options.volume
    );

    if (!rawWaveform || rawWaveform.length === 0) {
      console.warn('Encoding returned null waveform for packet:', packet);
      return;
    }

    // Convert raw Uint8Array buffer into Float32Array
    const floatSamples = new Float32Array(
      rawWaveform.buffer,
      rawWaveform.byteOffset,
      rawWaveform.byteLength / 4
    );

    const audioBuffer = this.audioCtx.createBuffer(
      1,
      floatSamples.length,
      this.audioCtx.sampleRate || this.sampleRate
    );
    audioBuffer.getChannelData(0).set(floatSamples);

    const source = this.audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    this.activeSource = source;

    // Connect source to analyser which is connected to speakers
    source.connect(this.analyser);

    return new Promise((resolve) => {
      source.onended = () => {
        this.activeSource = null;
        resolve();
      };
      source.start();
    });
  }

  public pause() {
    if (this.status === 'transmitting') {
      this.status = 'paused';
      this.isPaused = true;
      this.emitProgress();
    }
  }

  public resume() {
    if (this.status === 'paused') {
      this.status = 'transmitting';
      this.isPaused = false;
      this.emitProgress();
    }
  }

  public stop() {
    this.isCancelled = true;
    this.status = 'idle';
    if (this.activeSource) {
      try {
        this.activeSource.stop();
      } catch {
        // Ignore if already stopped
      }
      this.activeSource = null;
    }
    this.emitProgress();
  }

  public destroy() {
    this.stop();
    if (this.ggInstance !== -1) {
      free(this.ggInstance);
      this.ggInstance = -1;
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close();
      this.audioCtx = null;
    }
  }
}
