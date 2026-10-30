import React from 'react';
import { Volume2, HelpCircle, Radio, Sparkles, RefreshCw } from 'lucide-react';

interface NavbarProps {
  onOpenHowItWorks: () => void;
  onOpenLoopbackTest: () => void;
  onPlayTestChirp: () => void;
  isPlayingTestChirp: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenHowItWorks,
  onOpenLoopbackTest,
  onPlayTestChirp,
  isPlayingTestChirp,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#080c14]/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20 text-white font-black text-xl">
            <Radio className="w-5 h-5 text-white animate-pulse" />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#080c14]" />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold bg-gradient-to-r from-white via-cyan-200 to-cyan-400 bg-clip-text text-transparent tracking-tight">
                SonicDrop
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/70 border border-cyan-800/80 text-cyan-300 font-semibold tracking-wide">
                DATA OVER SOUND
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Transfer files & data across devices using sound waves
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Quick Audio Test Button */}
          <button
            onClick={onPlayTestChirp}
            disabled={isPlayingTestChirp}
            title="Play an acoustic test tone through speaker"
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 rounded-lg transition-all shadow-sm active:scale-95"
          >
            <Volume2 className={`w-3.5 h-3.5 text-cyan-400 ${isPlayingTestChirp ? 'animate-bounce' : ''}`} />
            <span className="hidden md:inline">Test Tone</span>
          </button>

          {/* Loopback Test Button */}
          <button
            onClick={onOpenLoopbackTest}
            title="Test sending and receiving on this single device"
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-purple-300 bg-purple-950/40 hover:bg-purple-900/40 border border-purple-800/60 rounded-lg transition-all shadow-sm active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">Self-Test Loop</span>
          </button>

          {/* How It Works Button */}
          <button
            onClick={onOpenHowItWorks}
            title="How Acoustic Data Transmission works"
            className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Guide</span>
          </button>
        </div>
      </div>
    </header>
  );
};
