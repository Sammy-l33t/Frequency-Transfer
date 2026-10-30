import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Send,
  Pause,
  Play,
  Square,
  FileText,
  Repeat,
  Sliders,
  Volume2,
  FileCheck,
  Radio,
  FileCode,
  Sparkles,
  Zap,
} from 'lucide-react';
import {
  AcousticTransmitter,
  TransmitterProgress,
} from '../lib/acoustic/transmitter';
import {
  prepareFilePackets,
  PROTOCOLS,
  generateTransferId,
} from '../lib/acoustic/protocol';
import { AcousticPacket, ProtocolType } from '../types';
import { PRESET_ITEMS } from '../lib/acoustic/presets';
import { Visualizer } from './Visualizer';

interface TransmitterViewProps {
  transmitter: AcousticTransmitter;
}

export const TransmitterView: React.FC<TransmitterViewProps> = ({
  transmitter,
}) => {
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    size: number;
    mime: string;
    data: Uint8Array;
  } | null>(null);

  const [activeTab, setActiveTab] = useState<'file' | 'text' | 'preset'>('file');
  const [textMessage, setTextMessage] = useState<string>('Hello from SonicDrop! Air-gapped file transfer via sound waves.');
  const [selectedProtocolId, setSelectedProtocolId] = useState<number>(5); // ULTRASOUND_FASTEST (near-silent & fast)
  const [chunkSize, setChunkSize] = useState<number>(84);
  const [volume, setVolume] = useState<number>(75);
  const [interPacketDelayMs, setInterPacketDelayMs] = useState<number>(100);
  const [loopTransmission, setLoopTransmission] = useState<boolean>(true);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  const [progress, setProgress] = useState<TransmitterProgress>({
    status: 'idle',
    currentPacketIndex: 0,
    totalPackets: 0,
    currentChunkIndex: -1,
    totalChunks: 0,
    currentPacket: null,
    repeatCycle: 0,
    volume: 65,
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isBroadcasting = progress.status === 'transmitting';
  const isPaused = progress.status === 'paused';

  useEffect(() => {
    transmitter.setProgressCallback((prog) => {
      setProgress(prog);
    });

    return () => {
      transmitter.stop();
    };
  }, [transmitter]);

  // Sync options
  useEffect(() => {
    transmitter.setOptions({
      protocolId: selectedProtocolId,
      volume,
      interPacketDelayMs,
      loopTransmission,
    });
  }, [transmitter, selectedProtocolId, volume, interPacketDelayMs, loopTransmission]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const buffer = await file.arrayBuffer();
    setSelectedFile({
      name: file.name,
      size: file.size,
      mime: file.type || 'application/octet-stream',
      data: new Uint8Array(buffer),
    });
  };

  const handlePresetSelect = async (presetId: string) => {
    const preset = PRESET_ITEMS.find((p) => p.id === presetId);
    if (!preset) return;

    const content = await preset.getContent();
    const data = typeof content === 'string' ? new TextEncoder().encode(content) : content;

    setSelectedFile({
      name: preset.fileName,
      size: data.length,
      mime: preset.mime,
      data,
    });
    setActiveTab('preset');
  };

  const handleStartTransmit = async () => {
    let fileData: Uint8Array;
    let fileName: string;
    let mime: string;

    if (activeTab === 'text') {
      const trimmed = textMessage.trim();
      if (!trimmed) return;

      // Ultra-fast single packet burst for messages up to 110 characters
      if (trimmed.length <= 110) {
        const quickPkt: AcousticPacket = {
          type: 'T',
          fileId: generateTransferId(),
          text: trimmed,
          timestamp: Date.now(),
        };
        await transmitter.startTransmission([quickPkt]);
        return;
      }

      fileData = new TextEncoder().encode(trimmed);
      fileName = 'message.txt';
      mime = 'text/plain';
    } else {
      if (!selectedFile) return;
      fileData = selectedFile.data;
      fileName = selectedFile.name;
      mime = selectedFile.mime;
    }

    const transferId = generateTransferId();
    const { allPackets } = prepareFilePackets(transferId, fileName, mime, fileData, chunkSize);

    await transmitter.startTransmission(allPackets);
  };

  const handleStop = () => {
    transmitter.stop();
  };

  const handlePauseResume = () => {
    if (isPaused) {
      transmitter.resume();
    } else {
      transmitter.pause();
    }
  };

  const currentProtocol = PROTOCOLS.find((p) => p.numericId === selectedProtocolId);

  // Calculate packet estimation
  let estimatedTotalPackets = 0;
  if (activeTab === 'text') {
    const bytes = new TextEncoder().encode(textMessage.trim()).length;
    estimatedTotalPackets = bytes <= 110 ? 1 : 1 + Math.max(1, Math.ceil(bytes / chunkSize));
  } else if (selectedFile) {
    estimatedTotalPackets = 1 + Math.max(1, Math.ceil(selectedFile.size / chunkSize));
  }
  const estimatedSeconds = Math.max(1.2, Number((estimatedTotalPackets * 1.3).toFixed(1)));

  const percent =
    progress.totalPackets > 0
      ? Math.round((progress.currentPacketIndex / progress.totalPackets) * 100)
      : 0;

  return (
    <div className="space-y-5">
      {/* Visualizer for outgoing sound */}
      <Visualizer
        analyser={transmitter.getAnalyser()}
        isActive={isBroadcasting}
        modeLabel="Transmitter Acoustic Output"
        accentColor="cyan"
      />

      {/* Main Send Card */}
      <div className="bg-[#0b1329]/90 border border-slate-800 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
        {/* Glowing cyber edge */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-80" />

        {/* Mode Selector Tabs */}
        <div className="flex border-b border-slate-800 pb-3 mb-5 gap-2">
          <button
            onClick={() => setActiveTab('file')}
            disabled={isBroadcasting}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'file'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload File</span>
          </button>

          <button
            onClick={() => setActiveTab('text')}
            disabled={isBroadcasting}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'text'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Send Text</span>
          </button>

          <button
            onClick={() => setActiveTab('preset')}
            disabled={isBroadcasting}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'preset'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>Quick Presets</span>
          </button>
        </div>

        {/* Tab 1: File Upload */}
        {activeTab === 'file' && (
          <div className="space-y-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              disabled={isBroadcasting}
              className="hidden"
            />

            {!selectedFile ? (
              <div
                onClick={() => !isBroadcasting && fileInputRef.current?.click()}
                className={`border-2 border-dashed border-slate-700/80 hover:border-cyan-500/60 rounded-xl p-8 text-center cursor-pointer transition-all bg-slate-900/40 hover:bg-slate-900/70 group ${
                  isBroadcasting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <div className="w-12 h-12 mx-auto rounded-full bg-cyan-950/60 border border-cyan-800/60 flex items-center justify-center text-cyan-400 mb-3 group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-slate-200 mb-1">
                  Click or drag any file to beam over sound
                </p>
                <p className="text-xs text-slate-400">
                  Images, text, documents, code, notes (Recommended: under 100 KB for fast sound transfer)
                </p>
              </div>
            ) : (
              <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3 truncate">
                  <div className="w-10 h-10 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 shrink-0">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-medium text-slate-200 truncate">{selectedFile.name}</p>
                    <p className="text-xs text-slate-400">
                      {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.mime || 'binary'} •{' '}
                      {Math.ceil(selectedFile.size / chunkSize)} chunks
                    </p>
                  </div>
                </div>

                {!isBroadcasting && (
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="text-xs text-slate-400 hover:text-red-400 px-2 py-1 rounded transition-colors"
                  >
                    Change
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Text Message */}
        {activeTab === 'text' && (
          <div className="space-y-3">
            <textarea
              value={textMessage}
              onChange={(e) => setTextMessage(e.target.value)}
              disabled={isBroadcasting}
              rows={4}
              placeholder="Type any message, passcode, or notes to beam through sound..."
              className="w-full bg-[#060a14] border border-slate-700/80 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono resize-none"
            />
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span>{new TextEncoder().encode(textMessage.trim()).length} bytes</span>
              <span className="text-cyan-400 font-medium">
                {new TextEncoder().encode(textMessage.trim()).length <= 110
                  ? '⚡ 1 burst packet (instant ~1.2s)'
                  : `${1 + Math.max(1, Math.ceil(new TextEncoder().encode(textMessage.trim()).length / chunkSize))} audio packets`}
              </span>
            </div>
          </div>
        )}

        {/* Tab 3: Presets */}
        {activeTab === 'preset' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {PRESET_ITEMS.map((preset) => {
              const isSelected = selectedFile?.name === preset.fileName;
              return (
                <div
                  key={preset.id}
                  onClick={() => !isBroadcasting && handlePresetSelect(preset.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-purple-950/30 border-purple-500/60 shadow-md shadow-purple-900/20'
                      : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                  } ${isBroadcasting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center space-x-2.5 mb-1">
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800/80">
                      {preset.category}
                    </span>
                    <span className="text-xs font-semibold text-slate-200">{preset.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-400">{preset.description}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Protocol & Sound Config */}
        <div className="mt-5 pt-4 border-t border-slate-800 space-y-4">
          {/* Ultrasound Status Banner */}
          <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/50 flex items-center justify-between text-xs shadow-sm">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-lg bg-purple-900/80 border border-purple-700 flex items-center justify-center text-purple-300 shrink-0">
                <Zap className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <span className="font-bold text-purple-200">Ultra-Sonic Transmission (15.0 – 19.5 kHz)</span>
                <p className="text-[11px] text-purple-300/80">Inaudible / near-silent high frequencies. Zero loud chirps, ultra-fast data transfer.</p>
              </div>
            </div>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-purple-900/80 text-purple-200 font-mono text-[10px] border border-purple-600/70 font-semibold uppercase">
              Silent & Fast
            </span>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between mb-2">
              <span className="flex items-center space-x-1.5">
                <Radio className="w-3.5 h-3.5 text-cyan-400" />
                <span>Acoustic Protocol</span>
              </span>
              <span className="text-[11px] font-mono text-cyan-400">
                {currentProtocol?.speed}
              </span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PROTOCOLS.map((proto) => {
                const isSelected = selectedProtocolId === proto.numericId;
                const isUltrasound = proto.category === 'ultrasound';
                return (
                  <button
                    key={proto.id}
                    onClick={() => setSelectedProtocolId(proto.numericId)}
                    disabled={isBroadcasting}
                    className={`text-left p-2.5 rounded-xl border transition-all ${
                      isSelected
                        ? isUltrasound
                          ? 'bg-purple-950/40 border-purple-500/80 text-purple-200 shadow-sm'
                          : 'bg-cyan-950/40 border-cyan-500/80 text-cyan-200 shadow-sm'
                        : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">{proto.name}</span>
                      {proto.recommended ? (
                        <span className="text-[9px] px-1 rounded bg-purple-900/80 text-purple-200 border border-purple-600 font-semibold">
                          ⚡ FASTEST
                        </span>
                      ) : isUltrasound ? (
                        <span className="text-[9px] px-1 rounded bg-slate-800 text-purple-300 border border-purple-800/60">
                          🦇 SILENT
                        </span>
                      ) : null}
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono">{proto.frequency}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Advanced toggle */}
          <div>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs text-slate-400 hover:text-slate-300 flex items-center space-x-1"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{showAdvanced ? 'Hide Advanced Acoustic Settings' : 'Advanced Acoustic Settings'}</span>
            </button>

            {showAdvanced && (
              <div className="mt-3 p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Volume Slider */}
                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                      <span className="flex items-center space-x-1">
                        <Volume2 className="w-3 h-3 text-cyan-400" />
                        <span>Speaker Volume</span>
                      </span>
                      <span className="font-mono">{volume}%</span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="100"
                      value={volume}
                      onChange={(e) => setVolume(Number(e.target.value))}
                      disabled={isBroadcasting}
                      className="w-full accent-cyan-400"
                    />
                  </div>

                  {/* Inter-packet Delay Slider */}
                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                      <span>Inter-Packet Pause</span>
                      <span className="font-mono">{interPacketDelayMs}ms</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="500"
                      step="25"
                      value={interPacketDelayMs}
                      onChange={(e) => setInterPacketDelayMs(Number(e.target.value))}
                      disabled={isBroadcasting}
                      className="w-full accent-cyan-400"
                    />
                  </div>

                  {/* Chunk Size Slider */}
                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                      <span>Chunk Size</span>
                      <span className="font-mono">{chunkSize} bytes</span>
                    </div>
                    <input
                      type="range"
                      min="32"
                      max="84"
                      step="4"
                      value={chunkSize}
                      onChange={(e) => setChunkSize(Number(e.target.value))}
                      disabled={isBroadcasting}
                      className="w-full accent-cyan-400"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <div className="flex items-center space-x-2">
                    <Repeat className="w-4 h-4 text-cyan-400" />
                    <div>
                      <p className="text-xs font-medium text-slate-200">Continuous Repeat Loop</p>
                      <p className="text-[10px] text-slate-400">
                        Loops file packets so the receiver is guaranteed to capture any missed chunks
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={loopTransmission}
                    onChange={(e) => setLoopTransmission(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-cyan-500 accent-cyan-400 cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Live Broadcasting Status Banner */}
        {isBroadcasting && (
          <div className="mt-5 p-4 rounded-xl bg-cyan-950/40 border border-cyan-600/50 space-y-3 animate-glow">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="flex items-center space-x-1">
                  <span className="w-1.5 h-4 bg-cyan-400 rounded-full animate-soundwave" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-6 bg-cyan-300 rounded-full animate-soundwave" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-3 bg-cyan-400 rounded-full animate-soundwave" style={{ animationDelay: '300ms' }} />
                </div>
                <div>
                  <p className="text-xs font-bold text-cyan-200 uppercase tracking-wider">
                    {isPaused ? 'Transmission Paused' : 'Broadcasting Over Sound...'}
                  </p>
                  <p className="text-[11px] text-cyan-300/80">
                    {progress.currentPacket?.type === 'H'
                      ? 'Sending Header Metadata Packet...'
                      : `Sending Chunk [${(progress.currentChunkIndex ?? 0) + 1} / ${progress.totalChunks}]`}
                    {progress.repeatCycle > 0 && ` • Loop #${progress.repeatCycle + 1}`}
                  </p>
                </div>
              </div>

              <span className="text-sm font-mono font-bold text-cyan-300">{percent}%</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-slate-800/80 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300 rounded-full"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        )}

        {/* Completed notification */}
        {progress.status === 'completed' && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-600/50 flex items-center justify-between text-emerald-300 text-xs font-medium">
            <span className="flex items-center space-x-2">
              <FileCheck className="w-4 h-4 text-emerald-400" />
              <span>Acoustic broadcast finished! File transmitted.</span>
            </span>
            <button
              onClick={() => handleStartTransmit()}
              className="text-[11px] underline hover:text-white"
            >
              Re-transmit
            </button>
          </div>
        )}

        {/* Estimated Transfer Info */}
        {!isBroadcasting && (
          <div className="mt-4 flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="flex items-center space-x-1.5 text-purple-300">
              <Zap className="w-3.5 h-3.5 text-purple-400" />
              <span>Est. Transfer: ~{estimatedSeconds}s</span>
            </span>
            <span className="font-mono text-slate-400">
              {estimatedTotalPackets} packet{estimatedTotalPackets > 1 ? 's' : ''} • {currentProtocol?.name || 'Ultrasound Fastest'}
            </span>
          </div>
        )}

        {/* Primary Action Buttons */}
        <div className="mt-3 flex items-center gap-3">
          {!isBroadcasting && !isPaused ? (
            <button
              onClick={handleStartTransmit}
              disabled={activeTab === 'file' && !selectedFile}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-sm font-bold text-white transition-all shadow-lg active:scale-[0.98] ${
                activeTab === 'file' && !selectedFile
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-gradient-to-r from-cyan-500 via-blue-600 to-cyan-500 bg-size-200 hover:shadow-cyan-500/25 border border-cyan-400/30'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>Transmit Over Sound</span>
            </button>
          ) : (
            <>
              <button
                onClick={handlePauseResume}
                className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-sm font-bold text-cyan-200 bg-cyan-950/80 hover:bg-cyan-900/80 border border-cyan-700 transition-all active:scale-[0.98]"
              >
                {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                <span>{isPaused ? 'Resume Broadcast' : 'Pause'}</span>
              </button>

              <button
                onClick={handleStop}
                className="flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-sm font-bold text-red-300 bg-red-950/60 hover:bg-red-900/60 border border-red-700/80 transition-all active:scale-[0.98]"
              >
                <Square className="w-4 h-4" />
                <span>Stop</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
