import {
  prepareFilePackets,
  deserializePacket,
  serializePacket,
  crc32,
  base64ToUint8Array,
  PROTOCOLS,
} from './src/lib/acoustic/protocol.ts';
import {
  getDefaultParameters,
  init,
  encode,
  decode,
  free,
  GGWAVE_OPERATING_MODE_USE_DSS,
  ProtocolId,
} from 'ggwave-js';

console.log('--- 1. Testing CRC32 and Packet Serialization ---');
const originalText = 'Hello Acoustic Air-Gap! Testing soundwave file transfer.';
const originalBytes = new TextEncoder().encode(originalText);
const originalCrc = crc32(originalBytes);
console.log('Original Text Length:', originalBytes.length, 'CRC32:', originalCrc);

const { header, chunks, allPackets } = prepareFilePackets('TEST', 'hello.txt', 'text/plain', originalBytes, 32);
console.log(`Generated ${chunks.length} chunks + 1 header (${allPackets.length} total packets)`);

for (const pkt of allPackets) {
  const serialized = serializePacket(pkt);
  const deserialized = deserializePacket(serialized);
  if (!deserialized) throw new Error('Failed to deserialize: ' + serialized);
  if (deserialized.fileId !== 'TEST') throw new Error('File ID mismatch');
}
console.log('✓ All packets serialized and deserialized cleanly!');

console.log('--- 2. Testing ggwave Acoustic Modulation & Demodulation ---');
const params = getDefaultParameters();
params.operatingMode |= GGWAVE_OPERATING_MODE_USE_DSS;
const instance = init(params);

// Simulate full sound transmission and reception of each chunk
const receivedChunks = new Map();
let receivedHeader = null;

for (let i = 0; i < allPackets.length; i++) {
  const pkt = allPackets[i];
  const serialized = serializePacket(pkt);

  // Sender modulates to audio waveform
  const waveform = encode(instance, serialized, ProtocolId.GGWAVE_PROTOCOL_AUDIBLE_FAST, 50);
  if (!waveform || waveform.length === 0) {
    throw new Error('Encoding failed for packet index ' + i);
  }

  // Receiver microphone captures waveform and demods
  const decodedRaw = decode(instance, waveform);
  const decodedText = new TextDecoder('utf-8').decode(decodedRaw);
  const parsed = deserializePacket(decodedText);

  if (!parsed) {
    throw new Error(`Demod failed for packet ${i}: raw = "${decodedText}"`);
  }

  if (parsed.type === 'H') {
    receivedHeader = parsed;
    console.log(`✓ Header received over audio: file=${parsed.name}, size=${parsed.size}, chunks=${parsed.totalChunks}`);
  } else if (parsed.type === 'C') {
    const chunkBytes = base64ToUint8Array(parsed.data);
    receivedChunks.set(parsed.index, chunkBytes);
    console.log(`✓ Chunk ${parsed.index + 1}/${parsed.total} received over audio: bytes=${chunkBytes.length}`);
  }
}

// Reassemble received file
let totalReceivedBytes = 0;
for (let i = 0; i < receivedHeader.totalChunks; i++) {
  totalReceivedBytes += receivedChunks.get(i).length;
}

const reassembled = new Uint8Array(totalReceivedBytes);
let offset = 0;
for (let i = 0; i < receivedHeader.totalChunks; i++) {
  const c = receivedChunks.get(i);
  reassembled.set(c, offset);
  offset += c.length;
}

const reassembledCrc = crc32(reassembled);
const reassembledText = new TextDecoder('utf-8').decode(reassembled);

console.log('Reassembled CRC32:', reassembledCrc);
console.log('Reassembled text:', reassembledText);

if (reassembledCrc === originalCrc && reassembledText === originalText) {
  console.log('🎉 100% SUCCESS: File transmitted and reassembled over acoustic simulation with zero bit errors!');
} else {
  throw new Error('Data mismatch after acoustic transfer');
}

free(instance);
