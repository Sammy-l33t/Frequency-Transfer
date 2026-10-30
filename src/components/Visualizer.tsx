import React, { useEffect, useRef, useState } from 'react';
import { BarChart3, Activity, Zap } from 'lucide-react';

interface VisualizerProps {
  analyser: AnalyserNode | null;
  isActive: boolean;
  modeLabel?: string;
  accentColor?: 'cyan' | 'purple' | 'emerald';
}

export const Visualizer: React.FC<VisualizerProps> = ({
  analyser,
  isActive,
  modeLabel = 'Audio Spectrum',
  accentColor = 'cyan',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [viewType, setViewType] = useState<'bars' | 'wave'>('bars');
  const [detectedFrequency, setDetectedFrequency] = useState<number>(0);
  const [currentRms, setCurrentRms] = useState<number>(0);
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let bufferLength = 0;
    let dataArray: Uint8Array | null = null;
    let timeDomainArray: Uint8Array | null = null;

    if (analyser) {
      bufferLength = analyser.frequencyBinCount;
      dataArray = new Uint8Array(bufferLength);
      timeDomainArray = new Uint8Array(bufferLength);
    }

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Cyber grid background
      ctx.strokeStyle = 'rgba(30, 46, 84, 0.35)';
      ctx.lineWidth = 1;

      // Horizontal grid lines
      for (let y = 0; y < height; y += 24) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Vertical grid lines
      for (let x = 0; x < width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      if (!analyser || !dataArray || !timeDomainArray || !isActive) {
        // Idle ambient scan line
        const time = Date.now() / 1000;
        ctx.beginPath();
        ctx.strokeStyle =
          accentColor === 'purple'
            ? 'rgba(157, 78, 221, 0.4)'
            : 'rgba(6, 182, 212, 0.4)';
        ctx.lineWidth = 1.5;

        const centerY = height / 2;
        for (let x = 0; x < width; x += 4) {
          const y = centerY + Math.sin(x * 0.02 + time * 3) * 4;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        animationFrameId.current = requestAnimationFrame(render);
        return;
      }

      analyser.getByteFrequencyData(dataArray as unknown as Uint8Array<ArrayBuffer>);
      analyser.getByteTimeDomainData(timeDomainArray as unknown as Uint8Array<ArrayBuffer>);

      // Calculate RMS and Peak Frequency
      let sumSquares = 0;
      let maxVal = 0;
      let maxIndex = 0;
      const sampleRate = analyser.context.sampleRate || 48000;

      for (let i = 0; i < bufferLength; i++) {
        const val = dataArray[i];
        if (val > maxVal) {
          maxVal = val;
          maxIndex = i;
        }
        const normalized = (timeDomainArray[i] - 128) / 128;
        sumSquares += normalized * normalized;
      }

      const rms = Math.sqrt(sumSquares / bufferLength);
      setCurrentRms(rms);

      const peakFreq = Math.round((maxIndex * sampleRate) / (bufferLength * 2));
      if (maxVal > 50) {
        setDetectedFrequency(peakFreq);
      }

      if (viewType === 'bars') {
        // Frequency Bars Spectrum
        const barCount = 48;
        const barWidth = Math.max(2, (width / barCount) - 2);

        for (let i = 0; i < barCount; i++) {
          const dataIndex = Math.floor(Math.pow(i / barCount, 1.4) * (bufferLength / 2));
          const value = dataArray[dataIndex] || 0;
          const percent = value / 255;
          const barHeight = Math.max(3, percent * (height - 8));
          const x = i * (barWidth + 2);
          const y = height - barHeight;

          // Gradient color depending on frequency band
          const gradient = ctx.createLinearGradient(0, height, 0, y);
          if (accentColor === 'purple') {
            gradient.addColorStop(0, 'rgba(123, 44, 191, 0.8)');
            gradient.addColorStop(0.6, 'rgba(157, 78, 221, 0.9)');
            gradient.addColorStop(1, 'rgba(224, 170, 255, 1)');
          } else if (accentColor === 'emerald') {
            gradient.addColorStop(0, 'rgba(5, 150, 105, 0.8)');
            gradient.addColorStop(0.6, 'rgba(16, 185, 129, 0.9)');
            gradient.addColorStop(1, 'rgba(52, 211, 153, 1)');
          } else {
            gradient.addColorStop(0, 'rgba(8, 145, 178, 0.8)');
            gradient.addColorStop(0.6, 'rgba(6, 182, 212, 0.9)');
            gradient.addColorStop(1, 'rgba(103, 232, 249, 1)');
          }

          ctx.fillStyle = gradient;
          ctx.fillRect(x, y, barWidth, barHeight);

          // Top glow cap
          if (percent > 0.15) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(x, y, barWidth, 2);
          }
        }
      } else {
        // Oscilloscope Waveform
        ctx.beginPath();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle =
          accentColor === 'purple'
            ? '#c77dff'
            : accentColor === 'emerald'
            ? '#34d399'
            : '#22d3ee';

        const sliceWidth = width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = timeDomainArray[i] / 128.0;
          const y = (v * height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }

          x += sliceWidth;
        }

        ctx.stroke();

        // Glow effect
        ctx.shadowBlur = 8;
        ctx.shadowColor = accentColor === 'purple' ? '#9d4edd' : '#06b6d4';
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      animationFrameId.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [analyser, isActive, viewType, accentColor]);

  // Frequency band detection badge
  const isUltrasound = detectedFrequency >= 14000;
  const isAudible = detectedFrequency >= 1000 && detectedFrequency < 14000;

  return (
    <div className="bg-[#0b1329]/80 border border-slate-800/80 rounded-xl p-3 backdrop-blur-md shadow-xl relative overflow-hidden group">
      {/* Header controls */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isActive ? 'bg-cyan-400 animate-ping' : 'bg-slate-600'
            }`}
          />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            {modeLabel}
          </span>
          {isActive && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-800 text-cyan-300">
              LIVE
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {detectedFrequency > 0 && isActive && (
            <div className="text-[11px] font-mono text-slate-400 flex items-center space-x-1">
              <Zap className="w-3 h-3 text-cyan-400" />
              <span>{detectedFrequency} Hz</span>
              {isUltrasound && (
                <span className="text-[9px] px-1 py-0.2 rounded bg-purple-900/80 text-purple-200 border border-purple-700">
                  🦇 ULTRASOUND
                </span>
              )}
              {isAudible && (
                <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-900/80 text-cyan-200 border border-cyan-700">
                  🔊 AUDIBLE
                </span>
              )}
            </div>
          )}

          <div className="flex items-center bg-slate-900/90 border border-slate-700/60 rounded-lg p-0.5">
            <button
              onClick={() => setViewType('bars')}
              title="Spectrum Bars"
              className={`p-1 rounded text-xs transition-colors ${
                viewType === 'bars'
                  ? 'bg-cyan-600/30 text-cyan-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewType('wave')}
              title="Oscilloscope Waveform"
              className={`p-1 rounded text-xs transition-colors ${
                viewType === 'wave'
                  ? 'bg-cyan-600/30 text-cyan-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main visualizer canvas */}
      <div className="relative w-full h-24 bg-[#060a14] rounded-lg border border-slate-800/80 overflow-hidden">
        <canvas
          ref={canvasRef}
          width={640}
          height={160}
          className="w-full h-full block"
        />

        {/* Ambient RMS audio power meter overlay */}
        <div className="absolute bottom-1 right-2 flex items-center space-x-1.5 pointer-events-none">
          <span className="text-[9px] font-mono text-slate-500">LEVEL</span>
          <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-75 ${
                currentRms > 0.4
                  ? 'bg-red-400'
                  : currentRms > 0.15
                  ? 'bg-amber-400'
                  : 'bg-cyan-400'
              }`}
              style={{ width: `${Math.min(100, currentRms * 300)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
