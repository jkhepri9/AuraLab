import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Square, Volume2, Activity, Download, Loader2 } from 'lucide-react';
import { bufferToWave } from '@/components/utils';
import Visualizer from '../components/Visualizer';

import { useGlobalPlayer } from '../audio/GlobalPlayerContext';

export default function AuraGenerator() {
  const player = useGlobalPlayer();

  const [frequency, setFrequency] = useState(432);
  const [waveform, setWaveform] = useState('sine');
  const [volume, setVolume] = useState(0.5);
  const [isDownloading, setIsDownloading] = useState(false);

  const generatorPreset = useMemo(() => {
    const title = `Generator: ${frequency}Hz ${waveform}`;
    return {
      id: "__generator__",
      name: title,
      color: "linear-gradient(135deg, #0f172a, #10b981)",
      imageUrl: null,
      layers: [
        {
          id: "__generator_layer__",
          type: "oscillator",
          frequency,
          waveform,
          volume,
          pan: 0,
          enabled: true,
          filterEnabled: false,
          filter: { type: "lowpass", frequency: 20000, Q: 1 },
        },
      ],
    };
  }, [frequency, waveform, volume]);

  const isActiveGenerator = player.currentPlayingPreset?.id === "__generator__";
  const isPlaying = player.isPlaying && isActiveGenerator;

  const togglePlay = async () => {
    if (isPlaying) {
      player.stop();
    } else {
      await player.playPreset(generatorPreset);
    }
  };

  // Live-update the running tone without stopping playback.
  useEffect(() => {
    if (!isPlaying) return;
    player.updateLayers(generatorPreset.layers);
    player.updateNowPlaying(generatorPreset, {
      title: generatorPreset.name,
      artist: "AuraLab",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generatorPreset, isPlaying]);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      // Create offline context for rendering 3 minutes of audio
      const duration = 180; // 180 seconds
      const sampleRate = 44100;
      const offlineCtx = new OfflineAudioContext(1, sampleRate * duration, sampleRate);

      const osc = offlineCtx.createOscillator();
      osc.type = waveform;
      osc.frequency.value = frequency;

      const gain = offlineCtx.createGain();
      gain.gain.value = volume;

      osc.connect(gain);
      gain.connect(offlineCtx.destination);

      osc.start();
      osc.stop(duration);

      const renderedBuffer = await offlineCtx.startRendering();
      const wavBlob = bufferToWave(renderedBuffer, renderedBuffer.length);
      const url = URL.createObjectURL(wavBlob);

      // Create download link
      const a = document.createElement('a');
      a.href = url;
      a.download = `${frequency}Hz_${waveform}_3min.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="space-y-2 mb-10">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
          <span className="text-white">Aura</span>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
            {" "}
            Generator
          </span>
        </h1>
        <p className="text-gray-400 text-sm sm:text-base">
          Pure tone frequencies from 0.1Hz to 20kHz.
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-8 items-start">
        {/* Controls Panel */}
        <div className="space-y-8 bg-white/5 p-8 rounded-3xl border border-white/10 backdrop-blur-sm">
          {/* Play/Stop Button */}
          <div className="flex justify-center pb-6">
            <Button
              onClick={togglePlay}
              className={`
                w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 shadow-lg
                ${isPlaying
                  ? 'bg-red-500/20 hover:bg-red-500/30 text-red-500 border-2 border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.3)]'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-black border-none shadow-[0_0_30px_rgba(16,185,129,0.4)]'}
              `}
            >
              {isPlaying ? (
                <Square className="w-8 h-8 fill-current" />
              ) : (
                <Play className="w-8 h-8 fill-current ml-1" />
              )}
            </Button>
          </div>

          {/* Frequency Control */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500" /> Frequency
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={frequency}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val)) {
                      setFrequency(Math.min(Math.max(val, 0.1), 20000));
                    }
                  }}
                  className="w-32 text-right font-mono text-2xl font-bold text-white bg-transparent border-white/10 h-12 focus-visible:ring-emerald-500"
                  step="0.1"
                  min="0.1"
                  max="20000"
                />
                <span className="text-sm text-gray-500">Hz</span>
              </div>
            </div>

            <Slider
              value={[frequency]}
              onValueChange={(val) => setFrequency(val[0])}
              min={0.1}
              max={20000}
              step={0.1}
              className="py-4"
            />

            <div className="flex gap-2">
              {[432, 528, 963].map((freq) => (
                <button
                  key={freq}
                  onClick={() => setFrequency(freq)}
                  className="px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 text-xs text-gray-400 border border-white/5 transition-colors"
                >
                  {freq}Hz
                </button>
              ))}
            </div>
          </div>

          {/* Download Button */}
          <Button
            onClick={handleDownload}
            disabled={isDownloading}
            variant="outline"
            className="w-full border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating WAV...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" /> Download 3m WAV
              </>
            )}
          </Button>

          {/* Waveform & Volume */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Waveform</label>
              <Select
                value={waveform}
                onValueChange={(val) => {
                  setWaveform(val);
                }}
              >
                <SelectTrigger className="bg-black/20 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                  <SelectItem value="sine">Sine Wave</SelectItem>
                  <SelectItem value="square">Square Wave</SelectItem>
                  <SelectItem value="sawtooth">Sawtooth Wave</SelectItem>
                  <SelectItem value="triangle">Triangle Wave</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Volume2 className="w-4 h-4" /> Volume
              </label>
              <Slider
                value={[volume]}
                onValueChange={(val) => setVolume(val[0])}
                min={0}
                max={1}
                step={0.01}
                className="py-3"
              />
            </div>
          </div>
        </div>

        {/* Visualizer Panel */}
        <div className="space-y-4">
          <div className="bg-black/40 p-1 rounded-3xl border border-white/10 shadow-2xl overflow-hidden relative">
            <div className="absolute top-4 right-6 flex items-center gap-2 z-10">
              <div
                className={`w-2 h-2 rounded-full ${
                  isPlaying ? 'bg-emerald-500 animate-pulse' : 'bg-red-900'
                }`}
              ></div>
              <span className="text-xs font-mono text-gray-500">
                {isPlaying ? 'LIVE SIGNAL' : 'OFFLINE'}
              </span>
            </div>

            <Visualizer
              audioContext={player.engine?.ctx}
              sourceNode={player.engine?.master?.output}
              isPlaying={isPlaying}
            />
          </div>

          <div className="bg-white/5 p-6 rounded-2xl border border-white/10 text-sm text-gray-400">
            <h3 className="text-white font-medium mb-2 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              Signal Info
            </h3>
            <ul className="space-y-2">
              <li className="flex justify-between">
                <span>Period:</span>
                <span className="font-mono text-white">{(1000 / frequency).toFixed(2)} ms</span>
              </li>
              <li className="flex justify-between">
                <span>Wavelength (Air):</span>
                <span className="font-mono text-white">{(343 / frequency).toFixed(2)} m</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
