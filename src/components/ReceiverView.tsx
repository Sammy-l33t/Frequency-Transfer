import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Download,
  Copy,
  Check,
  FileCheck,
  FileText,
  Image as ImageIcon,
  Radio,
  Zap,
  Trash2,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AcousticReceiver } from '../lib/acoustic/receiver';
import { InFlightTransfer, ReceivedFile, AcousticPacket } from '../types';
import { Visualizer } from './Visualizer';

interface ReceiverViewProps {
  receiver: AcousticReceiver;
}

export const ReceiverView: React.FC<ReceiverViewProps> = ({ receiver }) => {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [activeTransfer, setActiveTransfer] = useState<InFlightTransfer | null>(null);
  const [receivedFiles, setReceivedFiles] = useState<ReceivedFile[]>([]);
  const [latestFile, setLatestFile] = useState<ReceivedFile | null>(null);
  const [signalDetected, setSignalDetected] = useState<boolean>(false);
  const [lastPacketTime, setLastPacketTime] = useState<number>(0);
  const [micError, setMicError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    receiver.setCallbacks({
      onPacketReceived: (packet: AcousticPacket) => {
        setSignalDetected(true);
        setLastPacketTime(Date.now());
        setTimeout(() => setSignalDetected(false), 800);
      },
      onTransferProgress: (transfer: InFlightTransfer) => {
        // Clone so React state triggers re-render
        setActiveTransfer({
          ...transfer,
          receivedChunks: new Map(transfer.receivedChunks),
        });
      },
      onFileReceived: (file: ReceivedFile) => {
        setLatestFile(file);
        setReceivedFiles((prev) => [file, ...prev]);
        setActiveTransfer(null);

        // Trigger celebratory confetti effect
        try {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.6 },
            colors: ['#06b6d4', '#9d4edd', '#10b981'],
          });
        } catch {
          // Ignore if canvas confetti not supported
        }
      },
      onError: (err: Error) => {
        setMicError(err.message || 'Microphone access denied or audio error.');
        setIsListening(false);
      },
    });

    return () => {
      receiver.stopListening();
    };
  }, [receiver]);

  const handleToggleListening = async () => {
    setMicError(null);
    if (isListening) {
      receiver.stopListening();
      setIsListening(false);
    } else {
      try {
        await receiver.startListening();
        setIsListening(true);
      } catch (err) {
        console.error('Failed to start receiver listening:', err);
      }
    }
  };

  const handleDownload = (file: ReceivedFile) => {
    const a = document.createElement('a');
    a.href = file.url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const completedChunksCount = activeTransfer?.receivedChunks.size || 0;
  const totalChunksCount = activeTransfer?.totalChunks || 1;
  const transferPercent = Math.min(
    100,
    Math.round((completedChunksCount / totalChunksCount) * 100)
  );

  return (
    <div className="space-y-5">
      {/* Visualizer for incoming microphone sound */}
      <Visualizer
        analyser={receiver.getAnalyser()}
        isActive={isListening}
        modeLabel="Microphone Acoustic Receiver"
        accentColor="emerald"
      />

      {/* Main Receiver Card */}
      <div className="bg-[#0b1329]/90 border border-slate-800 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
        {/* Glowing cyber edge */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-80" />

        {/* Header & Status Indicator */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
          <div className="flex items-center space-x-3">
            <div
              className={`w-3.5 h-3.5 rounded-full transition-colors ${
                isListening
                  ? signalDetected
                    ? 'bg-emerald-400 animate-ping'
                    : 'bg-emerald-500 shadow-md shadow-emerald-500/50'
                  : 'bg-slate-700'
              }`}
            />
            <div>
              <h2 className="text-sm font-bold text-slate-200">
                {isListening
                  ? signalDetected
                    ? 'Capturing Audio Signal...'
                    : 'Acoustic Receiver Active'
                  : 'Acoustic Receiver Standby'}
              </h2>
              <p className="text-xs text-slate-400">
                {isListening
                  ? 'Listening for data sounds from nearby device speakers'
                  : 'Activate microphone to receive files over sound'}
              </p>
            </div>
          </div>

          {/* Signal detection badge */}
          {isListening && (
            <div className="flex items-center space-x-2">
              <span
                className={`text-[10px] font-mono px-2 py-1 rounded-full border transition-all ${
                  signalDetected
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-500 animate-pulse'
                    : 'bg-slate-900 text-slate-400 border-slate-700'
                }`}
              >
                <span className="flex items-center space-x-1">
                  <Zap className="w-3 h-3 text-emerald-400" />
                  <span>{signalDetected ? 'DATA DETECTED' : 'LISTENING'}</span>
                </span>
              </span>
            </div>
          )}
        </div>

        {/* Error message */}
        {micError && (
          <div className="mt-4 p-3 rounded-xl bg-red-950/40 border border-red-700/60 text-xs text-red-300">
            {micError}
          </div>
        )}

        {/* Start / Stop Listening Button */}
        <div className="mt-4">
          <button
            onClick={handleToggleListening}
            className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-sm font-bold text-white transition-all shadow-lg active:scale-[0.98] ${
              isListening
                ? 'bg-red-900/60 hover:bg-red-800/60 border border-red-600/80 text-red-200'
                : 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:shadow-emerald-500/25 border border-emerald-400/30'
            }`}
          >
            {isListening ? (
              <>
                <MicOff className="w-4 h-4 text-red-300" />
                <span>Stop Listening</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 text-white" />
                <span>Start Listening for Sound</span>
              </>
            )}
          </button>
        </div>

        {/* In-Flight File Transfer Progress & Block Matrix */}
        {activeTransfer && (
          <div className="mt-5 p-4 rounded-xl bg-emerald-950/30 border border-emerald-600/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="truncate pr-2">
                <p className="text-xs font-bold text-emerald-200 truncate">
                  Receiving: {activeTransfer.name}
                </p>
                <p className="text-[11px] text-emerald-400/80">
                  {completedChunksCount} of {activeTransfer.totalChunks} chunks captured (
                  {((activeTransfer.size || 0) / 1024).toFixed(1)} KB)
                </p>
              </div>
              <span className="text-sm font-mono font-bold text-emerald-300">
                {transferPercent}%
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-200 rounded-full"
                style={{ width: `${transferPercent}%` }}
              />
            </div>

            {/* Visual Chunk Matrix Grid */}
            <div className="pt-2">
              <p className="text-[10px] font-mono uppercase text-slate-400 mb-1.5 flex items-center justify-between">
                <span>Packet Assembly Matrix</span>
                <span>{completedChunksCount}/{activeTransfer.totalChunks}</span>
              </p>
              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                {Array.from({ length: activeTransfer.totalChunks }).map((_, idx) => {
                  const hasChunk = activeTransfer.receivedChunks.has(idx);
                  return (
                    <div
                      key={idx}
                      title={`Chunk #${idx + 1}: ${hasChunk ? 'Received' : 'Pending'}`}
                      className={`w-6 h-6 rounded flex items-center justify-center text-[9px] font-mono transition-all ${
                        hasChunk
                          ? 'bg-emerald-500 text-black font-bold shadow-sm shadow-emerald-500/50 scale-105'
                          : 'bg-slate-800/80 text-slate-500 border border-slate-700/60'
                      }`}
                    >
                      {hasChunk ? '✓' : idx + 1}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Latest Received File Showcase */}
        {latestFile && (
          <div className="mt-5 p-4 rounded-xl bg-slate-900/90 border border-emerald-500/50 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-lg bg-emerald-950 border border-emerald-700 flex items-center justify-center text-emerald-400">
                  {latestFile.isImage ? (
                    <ImageIcon className="w-5 h-5" />
                  ) : latestFile.isText ? (
                    <FileText className="w-5 h-5" />
                  ) : (
                    <FileCheck className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-bold text-slate-100">{latestFile.name}</p>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 border border-emerald-700 text-emerald-300">
                      COMPLETE
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {(latestFile.size / 1024).toFixed(1)} KB • {latestFile.mime}
                  </p>
                </div>
              </div>

              {/* Download Action */}
              <button
                onClick={() => handleDownload(latestFile)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/30 transition-all active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </div>

            {/* Inline Preview */}
            {latestFile.isImage && (
              <div className="mt-3 p-2 bg-[#060a14] rounded-lg border border-slate-800 flex justify-center">
                <img
                  src={latestFile.url}
                  alt={latestFile.name}
                  className="max-h-48 max-w-full object-contain rounded pixelated"
                />
              </div>
            )}

            {latestFile.isText && latestFile.textContent && (
              <div className="mt-3 relative">
                <pre className="p-3 bg-[#060a14] rounded-lg border border-slate-800 text-xs font-mono text-slate-300 max-h-40 overflow-y-auto whitespace-pre-wrap select-all">
                  {latestFile.textContent}
                </pre>
                <button
                  onClick={() => handleCopyText(latestFile.textContent!, latestFile.id)}
                  className="absolute top-2 right-2 p-1.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                  title="Copy text to clipboard"
                >
                  {copiedId === latestFile.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Empty state when listening and waiting */}
        {!latestFile && !activeTransfer && isListening && (
          <div className="mt-4 p-8 border border-dashed border-slate-800 rounded-xl text-center">
            <Radio className="w-8 h-8 text-emerald-400 mx-auto mb-2 animate-pulse" />
            <p className="text-xs font-semibold text-slate-300">
              Microphone is listening...
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Play sound from the transmitter device to receive the file
            </p>
          </div>
        )}

        {/* Session Received Files History */}
        {receivedFiles.length > 1 && (
          <div className="mt-5 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Session History ({receivedFiles.length})</span>
              </span>
              <button
                onClick={() => setReceivedFiles([])}
                className="text-[11px] text-slate-500 hover:text-red-400 transition-colors"
              >
                Clear
              </button>
            </div>

            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {receivedFiles.map((f, i) => (
                <div
                  key={`${f.id}-${i}`}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 text-xs"
                >
                  <div className="truncate pr-2">
                    <p className="font-medium text-slate-300 truncate">{f.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {(f.size / 1024).toFixed(1)} KB • {f.receivedAt.toLocaleTimeString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDownload(f)}
                    className="p-1 text-slate-400 hover:text-cyan-400"
                    title="Download again"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
