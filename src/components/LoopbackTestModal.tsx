import React, { useState } from 'react';
import { X, RefreshCw, CheckCircle2, AlertCircle, Play, Sparkles } from 'lucide-react';
import {
  getDefaultParameters,
  init,
  encode,
  decode,
  free,
  GGWAVE_OPERATING_MODE_USE_DSS,
  ProtocolId,
} from 'ggwave-js';

interface LoopbackTestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoopbackTestModal: React.FC<LoopbackTestModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [testStatus, setTestStatus] = useState<'idle' | 'running' | 'success' | 'failed'>('idle');
  const [testOutput, setTestOutput] = useState<string>('');
  const [encodedLength, setEncodedLength] = useState<number>(0);

  if (!isOpen) return null;

  const runTest = async () => {
    setTestStatus('running');
    setTestOutput('Initializing acoustic DSP core...');

    try {
      await new Promise((r) => setTimeout(r, 200));

      const params = getDefaultParameters();
      params.operatingMode |= GGWAVE_OPERATING_MODE_USE_DSS;
      const instance = init(params);

      const testPayload = 'SonicDrop Ultra-Sonic Link Verified!';
      setTestOutput(`Encoding payload using Ultra-Sonic Fastest (15–19.5 kHz): "${testPayload}"...`);

      const waveform = encode(instance, testPayload, ProtocolId.GGWAVE_PROTOCOL_ULTRASOUND_FASTEST, 50);
      if (!waveform) {
        throw new Error('Encoding failed: null waveform returned.');
      }
      setEncodedLength(waveform.length);

      setTestOutput(`Modulated ${waveform.length} bytes of audio PCM data. Decoding...`);
      await new Promise((r) => setTimeout(r, 400));

      const decodedBytes = decode(instance, waveform);
      const decodedText = new TextDecoder('utf-8').decode(decodedBytes);

      free(instance);

      if (decodedText === testPayload) {
        setTestOutput(`SUCCESS: Decoded exact payload: "${decodedText}"`);
        setTestStatus('success');
      } else {
        throw new Error(`Decoded mismatch: got "${decodedText}"`);
      }
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : String(err);
      setTestOutput(`FAILED: ${message}`);
      setTestStatus('failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#0d1527] border border-slate-700/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-950 border border-purple-800 flex items-center justify-center text-purple-400">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Acoustic Loopback Diagnostics</h2>
            <p className="text-xs text-slate-400">
              Verify audio codec, FFT, and Reed-Solomon DSP in this browser
            </p>
          </div>
        </div>

        <div className="p-4 bg-[#060a14] rounded-xl border border-slate-800 font-mono text-xs text-slate-300 space-y-2 mb-4">
          <p className="text-slate-400">// DSP Verification Test Console</p>
          {testOutput ? (
            <p className={testStatus === 'success' ? 'text-emerald-400' : testStatus === 'failed' ? 'text-red-400' : 'text-cyan-300'}>
              {testOutput}
            </p>
          ) : (
            <p className="text-slate-500">Ready to test acoustic DSP engine...</p>
          )}

          {encodedLength > 0 && (
            <p className="text-[11px] text-slate-500">
              PCM Samples: {encodedLength / 4} • Size: {(encodedLength / 1024).toFixed(1)} KB
            </p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {testStatus === 'success' && (
              <span className="flex items-center space-x-1 text-xs text-emerald-400 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                <span>Engine 100% Operational</span>
              </span>
            )}
            {testStatus === 'failed' && (
              <span className="flex items-center space-x-1 text-xs text-red-400 font-medium">
                <AlertCircle className="w-4 h-4" />
                <span>Verification Failed</span>
              </span>
            )}
          </div>

          <button
            onClick={runTest}
            disabled={testStatus === 'running'}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/30 transition-all active:scale-95 disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{testStatus === 'running' ? 'Testing...' : 'Run Diagnostics'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
