export type ProtocolType =
  | 'AUDIBLE_FAST'
  | 'AUDIBLE_NORMAL'
  | 'AUDIBLE_FASTEST'
  | 'ULTRASOUND_FAST'
  | 'ULTRASOUND_NORMAL'
  | 'ULTRASOUND_FASTEST'
  | 'DT_FAST'
  | 'DT_NORMAL';

export interface ProtocolOption {
  id: ProtocolType;
  numericId: number;
  name: string;
  category: 'audible' | 'ultrasound' | 'dualtone';
  frequency: string;
  speed: string;
  description: string;
  recommended?: boolean;
}

export interface FileHeaderPacket {
  type: 'H'; // Header
  fileId: string;
  name: string;
  size: number;
  mime: string;
  totalChunks: number;
  checksum: number;
}

export interface ChunkPacket {
  type: 'C'; // Chunk
  fileId: string;
  index: number;
  total: number;
  data: string; // Base64 chunk string
}

export interface QuickTextPacket {
  type: 'T'; // Direct short text message
  fileId: string;
  text: string;
  timestamp: number;
}

export type AcousticPacket = FileHeaderPacket | ChunkPacket | QuickTextPacket;

export interface InFlightTransfer {
  fileId: string;
  name: string;
  size: number;
  mime: string;
  totalChunks: number;
  checksum: number;
  receivedChunks: Map<number, Uint8Array>;
  firstReceivedAt: number;
  lastChunkAt: number;
}

export interface ReceivedFile {
  id: string;
  name: string;
  size: number;
  mime: string;
  data: Uint8Array;
  url: string;
  receivedAt: Date;
  isText?: boolean;
  textContent?: string;
  isImage?: boolean;
}

export interface PresetItem {
  id: string;
  title: string;
  category: string;
  fileName: string;
  mime: string;
  icon: string;
  description: string;
  getContent: () => Promise<Uint8Array | string>;
}

export interface AudioVisualizerState {
  isPlaying: boolean;
  isListening: boolean;
  rmsLevel: number; // 0 to 1
  peakFreq: number;
  detectedSignal: boolean;
}
