import React from 'react';
import { X, Radio, Mic, ShieldCheck, Zap, Volume2, Cpu, ArrowRight } from 'lucide-react';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowItWorksModal: React.FC<HowItWorksModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#0d1527] border border-slate-700/80 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">How Sound File Transfer Works</h2>
            <p className="text-xs text-slate-400">
              Acoustic FSK / MFSK Data Transmission & Demodulation
            </p>
          </div>
        </div>

        {/* Transmission Pipeline Diagram */}
        <div className="bg-[#070b16] border border-slate-800 rounded-xl p-4 mb-6">
          <p className="text-xs font-semibold text-cyan-300 uppercase tracking-wider mb-3">
            Air-Gap Transmission Pipeline
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-center">
            {/* Step 1 */}
            <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-cyan-950 text-cyan-400 flex items-center justify-center mb-2">
                <Volume2 className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-200">1. Audio Modulation</h4>
              <p className="text-[11px] text-slate-400 mt-1">
                Data bytes are sliced into chunks and encoded into multi-frequency soundwaves.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-purple-950 text-purple-400 flex items-center justify-center mb-2">
                <Zap className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-200">2. Air-Gap Acoustic Wave</h4>
              <p className="text-[11px] text-slate-400 mt-1">
                Sound travels through ambient air at 343 m/s (audible or ultrasound).
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-emerald-950 text-emerald-400 flex items-center justify-center mb-2">
                <Mic className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-200">3. FFT Demodulation</h4>
              <p className="text-[11px] text-slate-400 mt-1">
                Microphone captures audio; FFT converts frequencies back into exact bytes.
              </p>
            </div>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="space-y-3 mb-6">
          <div className="flex items-start space-x-3 p-3 bg-slate-900/40 rounded-xl border border-slate-800/80">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-slate-200">100% Offline & Air-Gapped</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                No Wi-Fi, Bluetooth, NFC, cell towers, or Internet connection required between devices. Two devices only need a speaker and a microphone.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3 bg-slate-900/40 rounded-xl border border-slate-800/80">
            <Cpu className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-slate-200">Reed-Solomon Error Correction</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Built-in error correction algorithms recover data even in noisy rooms, acoustic echo, or partial signal interference.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3 bg-slate-900/40 rounded-xl border border-slate-800/80">
            <Zap className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-slate-200">Ultrasound Frequency Mode</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Switch to Ultrasound mode (15 – 19.5 kHz) for silent data transmission that is nearly imperceptible to human ears.
              </p>
            </div>
          </div>
        </div>

        {/* Practical tips */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <h4 className="text-xs font-bold text-slate-200 mb-2">Pro Tips for Best Transfers:</h4>
          <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
            <li>Keep devices within 0.5 – 3 meters of each other.</li>
            <li>Set speaker volume to 60% – 85% for best signal-to-noise ratio.</li>
            <li>Keep the Repeat Loop enabled so any missed packet is caught automatically.</li>
            <li>Audible Fast is recommended for speed; Audible Normal is best in noisy rooms.</li>
          </ul>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-600/30 transition-all"
          >
            Got it, Let's Beam!
          </button>
        </div>
      </div>
    </div>
  );
};
