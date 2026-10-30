import {
  getDefaultParameters,
  GGWave,
  GGWAVE_OPERATING_MODE_RX,
  GGWAVE_OPERATING_MODE_USE_DSS,
} from 'ggwave-js';
import {
  AcousticPacket,
  deserializePacket,
  base64ToUint8Array,
  crc32,
  InFlightTransfer,
  ReceivedFile,
} from './protocol';

export interface ReceiverCallbacks {
  onPacketReceived?: (packet: AcousticPacket, raw: string) => void;
  onTransferProgress?: (transfer: InFlightTransfer, completedCount: number, totalCount: number) => void;
  onFileReceived?: (file: ReceivedFile) => void;
  onAudioLevel?: (rms: number, peakFreq: number) => void;
  onError?: (error: Error) => void;
}

export class AcousticReceiver {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private ggRx: InstanceType<typeof GGWave> | null = null;
  private rxStream: MediaStream | null = null;
  private rxSource: MediaStreamAudioSourceNode | null = null;
  private rxProcessor: ScriptProcessorNode | null = null;
  private muteGain: GainNode | null = null;

  private isListening: boolean = false;
  private sampleRate: number = 48000;
  private transfers: Map<string, InFlightTransfer> = new Map();
  private callbacks: ReceiverCallbacks = {};

  constructor(callbacks?: ReceiverCallbacks) {
    if (callbacks) {
      this.callbacks = callbacks;
    }
  }

  public setCallbacks(callbacks: ReceiverCallbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public getAudioContext(): AudioContext | null {
    return this.audioCtx;
  }

  public getIsListening(): boolean {
    return this.isListening;
  }

  /**
   * Start listening for acoustic data through the device microphone
   */
  public async startListening(): Promise<void> {
    if (this.isListening) return;

    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioContextClass({ sampleRate: this.sampleRate });

      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }

      // Initialize ggwave RX instance with DSS
      const rxParams = getDefaultParameters();
      rxParams.sampleRate = this.audioCtx.sampleRate || this.sampleRate;
      rxParams.sampleRateInp = rxParams.sampleRate;
      rxParams.sampleRateOut = rxParams.sampleRate;
      rxParams.operatingMode = GGWAVE_OPERATING_MODE_RX | GGWAVE_OPERATING_MODE_USE_DSS;
      this.ggRx = new GGWave(rxParams);

      // Request raw mic stream (disable echo cancellation and noise suppression for high frequency acoustic transfer)
      this.rxStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      this.rxSource = this.audioCtx.createMediaStreamSource(this.rxStream);

      // Create AnalyserNode for live visualization
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 1024;
      this.analyser.smoothingTimeConstant = 0.6;
      this.rxSource.connect(this.analyser);

      // Create ScriptProcessorNode (buffer 4096 = ~85ms at 48kHz)
      this.rxProcessor = this.audioCtx.createScriptProcessor(4096, 1, 1);

      // Connect processor to a zero-gain node so mic audio is never looped back to speaker
      this.muteGain = this.audioCtx.createGain();
      this.muteGain.gain.setValueAtTime(0, this.audioCtx.currentTime);

      this.rxProcessor.onaudioprocess = (e) => {
        if (!this.ggRx) return;
        const inputData = e.inputBuffer.getChannelData(0);

        // Compute RMS level for visual meter
        let sumSquares = 0;
        for (let i = 0; i < inputData.length; i++) {
          sumSquares += inputData[i] * inputData[i];
        }
        const rms = Math.sqrt(sumSquares / inputData.length);
        if (this.callbacks.onAudioLevel) {
          this.callbacks.onAudioLevel(rms, 0);
        }

        // Decode audio frame with ggwave
        this.ggRx.decode(inputData);

        const data = this.ggRx.rxTakeData();
        if (data && data.length > 0) {
          try {
            const rawText = new TextDecoder('utf-8').decode(data);
            this.handleIncomingPayload(data, rawText);
          } catch (err) {
            console.warn('Failed to decode incoming audio text payload:', err);
          }
        }
      };

      this.rxSource.connect(this.rxProcessor);
      this.rxProcessor.connect(this.muteGain);
      this.muteGain.connect(this.audioCtx.destination);

      this.isListening = true;
    } catch (err) {
      this.stopListening();
      const error = err instanceof Error ? err : new Error(String(err));
      if (this.callbacks.onError) {
        this.callbacks.onError(error);
      }
      throw error;
    }
  }

  /**
   * Handle parsed packet
   */
  private handleIncomingPayload(rawBytes: Uint8Array, rawText: string) {
    const packet = deserializePacket(rawText);
    if (!packet) {
      console.log('Unrecognized acoustic packet:', rawText);
      return;
    }

    if (this.callbacks.onPacketReceived) {
      this.callbacks.onPacketReceived(packet, rawText);
    }

    const now = Date.now();

    if (packet.type === 'T') {
      // Quick text message
      const textBytes = new TextEncoder().encode(packet.text);
      const blob = new Blob([textBytes], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const file: ReceivedFile = {
        id: packet.fileId,
        name: `message-${packet.fileId}.txt`,
        size: textBytes.length,
        mime: 'text/plain',
        data: textBytes,
        url,
        receivedAt: new Date(),
        isText: true,
        textContent: packet.text,
      };

      if (this.callbacks.onFileReceived) {
        this.callbacks.onFileReceived(file);
      }
      return;
    }

    if (packet.type === 'H') {
      // Header
      let transfer = this.transfers.get(packet.fileId);
      if (!transfer) {
        transfer = {
          fileId: packet.fileId,
          name: packet.name,
          size: packet.size,
          mime: packet.mime,
          totalChunks: packet.totalChunks,
          checksum: packet.checksum,
          receivedChunks: new Map(),
          firstReceivedAt: now,
          lastChunkAt: now,
        };
        this.transfers.set(packet.fileId, transfer);
      } else {
        // Update header info in case chunks arrived before header
        transfer.name = packet.name;
        transfer.size = packet.size;
        transfer.mime = packet.mime;
        transfer.totalChunks = packet.totalChunks;
        transfer.checksum = packet.checksum;
      }

      if (this.callbacks.onTransferProgress) {
        this.callbacks.onTransferProgress(transfer, transfer.receivedChunks.size, transfer.totalChunks);
      }

      this.checkCompletion(packet.fileId);
      return;
    }

    if (packet.type === 'C') {
      // Chunk
      let transfer = this.transfers.get(packet.fileId);
      if (!transfer) {
        // Chunk arrived before header
        transfer = {
          fileId: packet.fileId,
          name: `received-${packet.fileId}.bin`,
          size: 0,
          mime: 'application/octet-stream',
          totalChunks: packet.total,
          checksum: 0,
          receivedChunks: new Map(),
          firstReceivedAt: now,
          lastChunkAt: now,
        };
        this.transfers.set(packet.fileId, transfer);
      }

      transfer.lastChunkAt = now;
      if (!transfer.receivedChunks.has(packet.index)) {
        const chunkData = base64ToUint8Array(packet.data);
        transfer.receivedChunks.set(packet.index, chunkData);
      }

      if (this.callbacks.onTransferProgress) {
        this.callbacks.onTransferProgress(transfer, transfer.receivedChunks.size, transfer.totalChunks);
      }

      this.checkCompletion(packet.fileId);
    }
  }

  /**
   * Check if transfer has gathered all chunks and assemble the file
   */
  private checkCompletion(fileId: string) {
    const transfer = this.transfers.get(fileId);
    if (!transfer || transfer.totalChunks <= 0) return;

    if (transfer.receivedChunks.size >= transfer.totalChunks) {
      // Check that all indices from 0 to totalChunks - 1 exist
      for (let i = 0; i < transfer.totalChunks; i++) {
        if (!transfer.receivedChunks.has(i)) {
          return; // Missing chunk
        }
      }

      // Assemble all chunks in order
      let totalBytes = 0;
      for (let i = 0; i < transfer.totalChunks; i++) {
        const chunk = transfer.receivedChunks.get(i);
        if (chunk) totalBytes += chunk.length;
      }

      const assembled = new Uint8Array(totalBytes);
      let offset = 0;
      for (let i = 0; i < transfer.totalChunks; i++) {
        const chunk = transfer.receivedChunks.get(i)!;
        assembled.set(chunk, offset);
        offset += chunk.length;
      }

      // Verify CRC32
      const computedCrc = crc32(assembled);
      if (transfer.checksum !== 0 && computedCrc !== transfer.checksum) {
        console.warn(`Checksum mismatch: expected ${transfer.checksum}, computed ${computedCrc}`);
      }

      const mime = transfer.mime || 'application/octet-stream';
      const blob = new Blob([assembled], { type: mime });
      const url = URL.createObjectURL(blob);

      const isText =
        mime.startsWith('text/') ||
        mime === 'application/json' ||
        mime === 'application/javascript' ||
        transfer.name.endsWith('.txt') ||
        transfer.name.endsWith('.json') ||
        transfer.name.endsWith('.md');

      let textContent: string | undefined;
      if (isText) {
        try {
          textContent = new TextDecoder('utf-8').decode(assembled);
        } catch {
          // Binary fallback
        }
      }

      const isImage = mime.startsWith('image/') || /\.(png|jpe?g|gif|svg|webp)$/i.test(transfer.name);

      const receivedFile: ReceivedFile = {
        id: transfer.fileId,
        name: transfer.name,
        size: totalBytes,
        mime,
        data: assembled,
        url,
        receivedAt: new Date(),
        isText,
        textContent,
        isImage,
      };

      // Remove from active transfers map so we don't trigger completion repeatedly
      this.transfers.delete(fileId);

      if (this.callbacks.onFileReceived) {
        this.callbacks.onFileReceived(receivedFile);
      }
    }
  }

  /**
   * Stop listening and release media devices
   */
  public stopListening(): void {
    if (this.rxProcessor) {
      this.rxProcessor.disconnect();
      this.rxProcessor = null;
    }
    if (this.muteGain) {
      this.muteGain.disconnect();
      this.muteGain = null;
    }
    if (this.rxSource) {
      this.rxSource.disconnect();
      this.rxSource = null;
    }
    if (this.rxStream) {
      this.rxStream.getTracks().forEach((track) => track.stop());
      this.rxStream = null;
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close();
      this.audioCtx = null;
    }
    this.ggRx = null;
    this.isListening = false;
  }

  public clearTransfers() {
    this.transfers.clear();
  }
}
