import type {
  FileHeaderPacket,
  ChunkPacket,
  QuickTextPacket,
  AcousticPacket,
  ProtocolOption,
  InFlightTransfer,
  ReceivedFile,
} from '../../types/index.ts';

export type {
  FileHeaderPacket,
  ChunkPacket,
  QuickTextPacket,
  AcousticPacket,
  ProtocolOption,
  InFlightTransfer,
  ReceivedFile,
};

// Supported protocols with detailed metadata
export const PROTOCOLS: ProtocolOption[] = [
  {
    id: 'AUDIBLE_FAST',
    numericId: 1,
    name: 'Audible Fast',
    category: 'audible',
    frequency: '1.9 – 6.4 kHz',
    speed: '~1.2 sec/packet',
    description: 'Fast acoustic chirps. Highly reliable across room distances.',
    recommended: true,
  },
  {
    id: 'AUDIBLE_NORMAL',
    numericId: 0,
    name: 'Audible Normal',
    category: 'audible',
    frequency: '1.9 – 6.4 kHz',
    speed: '~2.8 sec/packet',
    description: 'Maximum error correction and noise resistance.',
  },
  {
    id: 'AUDIBLE_FASTEST',
    numericId: 2,
    name: 'Audible Fastest',
    category: 'audible',
    frequency: '1.9 – 6.4 kHz',
    speed: '~0.7 sec/packet',
    description: 'High-speed audio transmission. Best in quiet environments.',
  },
  {
    id: 'ULTRASOUND_FAST',
    numericId: 4,
    name: 'Ultrasound Fast',
    category: 'ultrasound',
    frequency: '15.0 – 19.5 kHz',
    speed: '~1.5 sec/packet',
    description: 'Near-silent to human ears. Covert acoustic data transfer.',
  },
  {
    id: 'ULTRASOUND_NORMAL',
    numericId: 3,
    name: 'Ultrasound Normal',
    category: 'ultrasound',
    frequency: '15.0 – 19.5 kHz',
    speed: '~3.2 sec/packet',
    description: 'Silent ultrasound transmission with high redundancy.',
  },
  {
    id: 'DT_FAST',
    numericId: 7,
    name: 'Dual-Tone Fast',
    category: 'dualtone',
    frequency: '1.1 – 2.6 kHz',
    speed: '~2.0 sec/packet',
    description: 'Retro telephone/modem DTMF tone synthesis.',
  },
];

/**
 * Standard CRC32 checksum for validating file integrity
 */
export function crc32(data: Uint8Array): number {
  let crc = 0 ^ -1;
  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ CRC32_TABLE[(crc ^ data[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

const CRC32_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC32_TABLE[i] = c;
}

/**
 * Convert Uint8Array to Base64
 */
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert Base64 string to Uint8Array
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Generate a short 4-character hex ID
 */
export function generateTransferId(): string {
  return Math.random().toString(16).substring(2, 6).toUpperCase();
}

/**
 * Serialize a packet into a compact string format
 */
export function serializePacket(packet: AcousticPacket): string {
  if (packet.type === 'H') {
    // Header: H|<fileId>|<totalChunks>|<size>|<checksum>|<mime>|<name>
    return ['H', packet.fileId, packet.totalChunks, packet.size, packet.checksum, packet.mime, packet.name].join('|');
  }
  if (packet.type === 'C') {
    // Chunk: C|<fileId>|<index>|<total>|<base64Data>
    return ['C', packet.fileId, packet.index, packet.total, packet.data].join('|');
  }
  if (packet.type === 'T') {
    // Quick Text: T|<fileId>|<timestamp>|<text>
    return ['T', packet.fileId, packet.timestamp, packet.text].join('|');
  }
  throw new Error('Unknown packet type');
}

/**
 * Deserialize a raw payload into an AcousticPacket
 */
export function deserializePacket(raw: string): AcousticPacket | null {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed.includes('|')) return null;

  const parts = trimmed.split('|');
  const type = parts[0];

  try {
    if (type === 'H' && parts.length >= 7) {
      return {
        type: 'H',
        fileId: parts[1],
        totalChunks: parseInt(parts[2], 10),
        size: parseInt(parts[3], 10),
        checksum: parseInt(parts[4], 10),
        mime: parts[5],
        name: parts.slice(6).join('|'), // In case name contains pipe
      };
    }
    if (type === 'C' && parts.length >= 5) {
      return {
        type: 'C',
        fileId: parts[1],
        index: parseInt(parts[2], 10),
        total: parseInt(parts[3], 10),
        data: parts.slice(4).join('|'),
      };
    }
    if (type === 'T' && parts.length >= 4) {
      return {
        type: 'T',
        fileId: parts[1],
        timestamp: parseInt(parts[2], 10),
        text: parts.slice(3).join('|'),
      };
    }
  } catch (err) {
    console.warn('Failed to parse acoustic packet:', raw, err);
  }

  return null;
}

/**
 * Split arbitrary file bytes into chunk packets
 */
export function prepareFilePackets(
  fileId: string,
  fileName: string,
  mimeType: string,
  data: Uint8Array,
  chunkSize: number = 64
): { header: FileHeaderPacket; chunks: ChunkPacket[]; allPackets: AcousticPacket[] } {
  const checksum = crc32(data);
  const totalChunks = Math.max(1, Math.ceil(data.length / chunkSize));

  const header: FileHeaderPacket = {
    type: 'H',
    fileId,
    name: fileName,
    size: data.length,
    mime: mimeType || 'application/octet-stream',
    totalChunks,
    checksum,
  };

  const chunks: ChunkPacket[] = [];
  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(data.length, start + chunkSize);
    const slice = data.subarray(start, end);
    chunks.push({
      type: 'C',
      fileId,
      index: i,
      total: totalChunks,
      data: uint8ArrayToBase64(slice),
    });
  }

  return {
    header,
    chunks,
    allPackets: [header, ...chunks],
  };
}
