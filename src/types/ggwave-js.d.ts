declare module 'ggwave-js' {
  export interface Parameters {
    payloadLength: number;
    sampleRateInp: number;
    sampleRateOut: number;
    sampleRate: number;
    samplesPerFrame: number;
    soundMarkerThreshold: number;
    sampleFormatInp: number;
    sampleFormatOut: number;
    operatingMode: number;
  }

  export function getDefaultParameters(): Parameters;
  export function init(parameters: Parameters): number;
  export function free(instanceId: number): void;
  export function encode(
    instanceId: number,
    data: string | Uint8Array,
    protocolId: number,
    volume: number
  ): Uint8Array | null;
  export function decode(
    instanceId: number,
    waveformData: Uint8Array | Float32Array
  ): Uint8Array;
  export function rxToggleProtocol(protocolId: number, state: number | boolean): void;
  export function txToggleProtocol(protocolId: number, state: number | boolean): void;

  export class GGWave {
    constructor(parameters: Parameters);
    initTx(data: string | Uint8Array, protocolId: number, volume: number): void;
    encode(): Float32Array | null;
    decode(audioSamples: Float32Array): void;
    rxTakeData(): Uint8Array | null;
  }

  export const ProtocolId: {
    GGWAVE_PROTOCOL_AUDIBLE_NORMAL: number;
    GGWAVE_PROTOCOL_AUDIBLE_FAST: number;
    GGWAVE_PROTOCOL_AUDIBLE_FASTEST: number;
    GGWAVE_PROTOCOL_ULTRASOUND_NORMAL: number;
    GGWAVE_PROTOCOL_ULTRASOUND_FAST: number;
    GGWAVE_PROTOCOL_ULTRASOUND_FASTEST: number;
    GGWAVE_PROTOCOL_DT_NORMAL: number;
    GGWAVE_PROTOCOL_DT_FAST: number;
    GGWAVE_PROTOCOL_DT_FASTEST: number;
    GGWAVE_PROTOCOL_MT_NORMAL: number;
    GGWAVE_PROTOCOL_MT_FAST: number;
    GGWAVE_PROTOCOL_MT_FASTEST: number;
  };

  export const GGWAVE_OPERATING_MODE_RX: number;
  export const GGWAVE_OPERATING_MODE_TX: number;
  export const GGWAVE_OPERATING_MODE_RX_AND_TX: number;
  export const GGWAVE_OPERATING_MODE_USE_DSS: number;
}
