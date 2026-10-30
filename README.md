# SonicDrop (Frequency-Transfer) 🎵📡

> **Air-Gapped Soundwave File Transfer Web App**  
> Send and receive files, images, code, and text messages between devices **purely through sound waves** using the Web Audio API and acoustic FSK/MFSK modulation. No Wi-Fi, Bluetooth, NFC, or cellular connection needed between the devices.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FSammy-l33t%2FFrequency-Transfer)

---

## 🚀 How It Works

1. **Device A (Transmitter / Send Mode)**:
   - Selects any file (image, document, text file, etc.) or types a text message.
   - Slices the file into compact binary chunks protected with CRC-32 checksums.
   - Modulates data packets into audio frequencies using multi-frequency shift keying (MFSK / ggwave DSP).
   - Plays the audio through the device speakers.

2. **Device B (Receiver / Receive Mode)**:
   - Activates its microphone and listens to ambient acoustic frequencies.
   - Performs Fast Fourier Transform (FFT) in real time to demodulate incoming sound waves.
   - Verifies each chunk using Reed-Solomon error correction and CRC-32 integrity validation.
   - Lights up the live **Chunk Assembly Matrix** as packets arrive.
   - Automatically reassembles the file, displays an inline preview (images, formatted text, code), and triggers 1-click download.

---

## ✨ Key Features

- **Multi-Frequency Acoustic Modulation**:
  - 🔊 **Audible Fast** (~1.9 – 6.4 kHz): Fast chirps, high reliability across room distances.
  - 🔊 **Audible Normal** (~1.9 – 6.4 kHz): Maximum noise-resistance for loud environments.
  - ⚡ **Audible Fastest** (~1.9 – 6.4 kHz): High throughput acoustic burst mode.
  - 🦇 **Ultrasound Fast / Normal** (~15.0 – 19.5 kHz): Inaudible or near-silent to human ears.
  - 📻 **Dual-Tone (DT)** (~1.1 – 2.6 kHz): Vintage acoustic modem synthesizer style.
- **Air-Gap Security**:
  - Simplex acoustic communication: Device A and Device B never need to be on the same network or share IP addresses.
- **Visual Real-Time Feedback**:
  - Live Canvas Spectrum Analyzer (FFT frequency bars).
  - Oscilloscope Waveform visualizer.
  - Acoustic signal detection LED indicator.
  - Interactive packet chunk matrix (`[✓][✓][✓]...`).
- **Quick 1-Click Presets**:
  - 📝 Classified Security Note
  - 🖼️ Cyber Sonic Pixel Art Badge (PNG image rendered directly on receiver)
  - 📶 Air-Gapped Wi-Fi Credential Onboarding
  - 📇 Electronic vCard Contact Card
- **Self-Test Loopback Diagnostics**:
  - Test encoding and decoding right in the browser on a single device with 1 click.
- **Responsive Mobile & Desktop**:
  - Dedicated Send Mode, Receive Mode, and Desktop Dual-View (side-by-side).

---

## 🛠️ Tech Stack

- **Framework**: React 19 + TypeScript
- **Bundler**: Vite 6 (Static SPA ready for Vercel)
- **Styling**: Tailwind CSS (Cyberpunk Sonic theme)
- **Audio DSP**: `ggwave-js` (Pure JS port of Georgi Gerganov's ggwave, zero WASM dependencies)
- **Audio API**: Web Audio API (`AudioContext`, `MediaStream`, `AnalyserNode`, `ScriptProcessorNode`)
- **Icons**: Lucide React
- **Celebrations**: Canvas Confetti

---

## ⚡ Local Development

```bash
# Clone the repository
git clone https://github.com/Sammy-l33t/Frequency-Transfer.git
cd Frequency-Transfer

# Install dependencies
npm install

# Start development server
npm run dev

# Run end-to-end acoustic simulation test
node test-e2e.mjs

# Build for production
npm run build
```

---

## 🌐 Deploy to Vercel

### Method 1: Connect GitHub to Vercel (Recommended)
1. Push your code to GitHub:
   ```bash
   git add .
   git commit -m "feat: air-gapped acoustic sound file transfer web app"
   git push origin main
   ```
2. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import the `Frequency-Transfer` repository.
4. Framework Preset will be automatically detected as **Vite**.
5. Click **Deploy**. Your site will be live on `https://<your-project>.vercel.app` in ~30 seconds!

### Method 2: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy directly
vercel --prod
```

---

## 📜 License

MIT License.
