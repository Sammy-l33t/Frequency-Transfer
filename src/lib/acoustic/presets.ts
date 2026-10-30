import { PresetItem } from '../../types/index';
import { base64ToUint8Array } from './protocol';

// Tiny 24x24 Cyber Sound Wave PNG (174 bytes)
const SAMPLE_IMAGE_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAHtJREFUeNpi/P//PwM1ARMD1QHjMhzm6O/v/08yHqUABmB2dfz784eBwZcZk+8ffuHAjGAYVUD9CgK/g/8z/Pv3H8P/f//+/ydfAUwD+r+fQfkfxidDAfoGBnQF1A9EGBiGBxgeh/pD/b9/f8Mh9o9kQ6A0iA8YfQEMACe4LwGgJ5dBAAAAAElFTkSuQmCC';

export const PRESET_ITEMS: PresetItem[] = [
  {
    id: 'secret-note',
    title: 'Secret Agent Note',
    category: 'Text',
    fileName: 'mission-brief.txt',
    mime: 'text/plain',
    icon: 'ShieldAlert',
    description: 'Air-gapped acoustic security brief (148 bytes)',
    getContent: async () => {
      const text =
        'TOP SECRET BRIEFING\nTarget: Air-gap acoustic relay\nStatus: Secure audio channel verified\nKey: AC-9842-OMEGA\nProtocol: Audible Fast FSK';
      return new TextEncoder().encode(text);
    },
  },
  {
    id: 'cyber-badge',
    title: 'Cyber Sonic Badge',
    category: 'Image',
    fileName: 'sonic-badge.png',
    mime: 'image/png',
    icon: 'Image',
    description: 'Miniature 24x24 pixel badge PNG (174 bytes)',
    getContent: async () => {
      return base64ToUint8Array(SAMPLE_IMAGE_BASE64);
    },
  },
  {
    id: 'wifi-setup',
    title: 'Secure Wi-Fi Config',
    category: 'Config',
    fileName: 'wifi-network.json',
    mime: 'application/json',
    icon: 'Wifi',
    description: 'Acoustic Wi-Fi device onboarding packet (132 bytes)',
    getContent: async () => {
      const config = {
        ssid: 'Quantum-Air-5G',
        security: 'WPA3-Personal',
        passcode: 'S0n1c#Dr0p!2026',
        frequency: 'Dual-Band',
      };
      return new TextEncoder().encode(JSON.stringify(config, null, 2));
    },
  },
  {
    id: 'vcard-contact',
    title: 'Digital Contact Card',
    category: 'Contact',
    fileName: 'dr-elena-vance.vcf',
    mime: 'text/vcard',
    icon: 'UserCheck',
    description: 'Full vCard electronic business card (165 bytes)',
    getContent: async () => {
      const vcard = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        'N:Vance;Elena;;Dr.;',
        'FN:Dr. Elena Vance',
        'ORG:Acoustic Labs Inc.',
        'TITLE:Chief Sonic Cryptographer',
        'TEL;TYPE=CELL:+1-555-0199',
        'EMAIL:elena@sonicdrop.io',
        'END:VCARD',
      ].join('\n');
      return new TextEncoder().encode(vcard);
    },
  },
];
