import React, { useState, useMemo } from 'react';
import { Radio, ArrowDownToLine, ArrowUpFromLine, Columns, HelpCircle, Sparkles } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { TransmitterView } from './components/TransmitterView';
import { ReceiverView } from './components/ReceiverView';
import { HowItWorksModal } from './components/HowItWorksModal';
import { LoopbackTestModal } from './components/LoopbackTestModal';
import { AcousticTransmitter } from './lib/acoustic/transmitter';
import { AcousticReceiver } from './lib/acoustic/receiver';

export function App() {
  const [deviceMode, setDeviceMode] = useState<'send' | 'receive' | 'dual'>('send');
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState<boolean>(false);
  const [isLoopbackOpen, setIsLoopbackOpen] = useState<boolean>(false);
  const [isPlayingTestChirp, setIsPlayingTestChirp] = useState<boolean>(false);

  // Singletons for audio transmitter & receiver
  const transmitter = useMemo(() => new AcousticTransmitter(), []);
  const receiver = useMemo(() => new AcousticReceiver(), []);

  const handlePlayTestChirp = async () => {
    if (isPlayingTestChirp) return;
    setIsPlayingTestChirp(true);
    try {
      await transmitter.playTestChirp();
    } catch (err) {
      console.error('Failed to play test chirp:', err);
    } finally {
      setTimeout(() => setIsPlayingTestChirp(false), 300);
    }
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-200">
      {/* Top Navbar */}
      <Navbar
        onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
        onOpenLoopbackTest={() => setIsLoopbackOpen(true)}
        onPlayTestChirp={handlePlayTestChirp}
        isPlayingTestChirp={isPlayingTestChirp}
      />

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Intro banner */}
        <div className="mb-6 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/50 border border-cyan-800/60 text-cyan-300 text-xs mb-3 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Air-Gapped Soundwave File Transfer</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Transfer Any File Over{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-200 bg-clip-text text-transparent">
              Sound Waves
            </span>
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-400">
            Open this website on two devices. Device A transmits the file through sound, and Device B listens with its microphone to receive and save the file!
          </p>
        </div>

        {/* Device Mode Switcher */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex p-1 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md">
            <button
              onClick={() => setDeviceMode('send')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                deviceMode === 'send'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <ArrowUpFromLine className="w-3.5 h-3.5" />
              <span>Send Mode (Make Sound)</span>
            </button>

            <button
              onClick={() => setDeviceMode('receive')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                deviceMode === 'receive'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <ArrowDownToLine className="w-3.5 h-3.5" />
              <span>Receive Mode (Listen)</span>
            </button>

            <button
              onClick={() => setDeviceMode('dual')}
              className={`hidden lg:flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                deviceMode === 'dual'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Dual View</span>
            </button>
          </div>
        </div>

        {/* View Layouts */}
        {deviceMode === 'send' && (
          <div className="max-w-2xl mx-auto">
            <TransmitterView transmitter={transmitter} />
          </div>
        )}

        {deviceMode === 'receive' && (
          <div className="max-w-2xl mx-auto">
            <ReceiverView receiver={receiver} />
          </div>
        )}

        {deviceMode === 'dual' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center space-x-1.5">
                  <ArrowUpFromLine className="w-3.5 h-3.5" />
                  <span>Transmitter (Speaker Out)</span>
                </span>
              </div>
              <TransmitterView transmitter={transmitter} />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center space-x-1.5">
                  <ArrowDownToLine className="w-3.5 h-3.5" />
                  <span>Receiver (Microphone In)</span>
                </span>
              </div>
              <ReceiverView receiver={receiver} />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-[#05080e] py-5 mt-10">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500">
          <p>
            SonicDrop • Acoustic Air-Gap Data Transmission Engine • Built with Web Audio API & ggwave-js
          </p>
          <p className="mt-1 text-[11px] text-slate-600">
            Encodes data into audio waveforms • 100% Client-Side • No server storage or Internet connection needed
          </p>
        </div>
      </footer>

      {/* Modals */}
      <HowItWorksModal
        isOpen={isHowItWorksOpen}
        onClose={() => setIsHowItWorksOpen(false)}
      />

      <LoopbackTestModal
        isOpen={isLoopbackOpen}
        onClose={() => setIsLoopbackOpen(false)}
      />
    </div>
  );
}
export default App;
