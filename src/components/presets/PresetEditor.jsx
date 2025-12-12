import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Play,
  Square,
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  Activity,
  Headphones,
  Wind,
  Monitor
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { cn } from "@/lib/utils";

// --- AUDIO HELPERS ---
function createNoiseBuffer(ctx) {
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

const NOISE_TYPES = ['white', 'pink', 'brown', 'violet', 'blue', 'gray', 'gold', 'silver', 'cosmic'];
const SYNTH_TYPES = ['analog', 'fm', 'wavetable', 'granular', 'drone', 'sub'];
const AMBIENT_TYPES = ['ocean', 'rain', 'thunder', 'wind', 'river', 'fire'];

export default function PresetEditor({
  initialPreset,
  onSave,
  onCancel,
  autoPlay = false, // 👈 NEW PROP
}) {
  const navigate = useNavigate();

  const [name, setName] = useState(initialPreset?.name || "New Aura Mode");
  const [color, setColor] = useState(initialPreset?.color || "#10b981");

  // Initialize Layers with defaults
  const [layers, setLayers] = useState(() => {
    if (initialPreset?.layers) {
      return initialPreset.layers.map((l, i) => ({
        ...l,
        id: l.id || Date.now() + i,
        pan: l.pan ?? 0,
        type: l.type || 'oscillator',
        pulseRate: l.pulseRate ?? 0,
        pulseDepth: l.pulseDepth ?? 0,
        filter: l.filter || { frequency: 20000, Q: 1 }
      }));
    }
    return [{
      id: Date.now(),
      type: 'oscillator',
      frequency: 432,
      waveform: 'sine',
      volume: 0.5,
      pan: 0,
      enabled: true,
      pulseRate: 0,
      pulseDepth: 0,
      filter: { frequency: 20000, Q: 1 }
    }];
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [soloLayerId, setSoloLayerId] = useState(null);
  const [selectedLayerId, setSelectedLayerId] = useState(null);

  const audioContextRef = useRef(null);
  const nodesRef = useRef(new Map());

  // 1. Cleanup on unmount
  useEffect(() => {
    return () => stopAudio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Start Audio when a NEW Preset is loaded (Activation) + autoPlay
  useEffect(() => {
    if (initialPreset && autoPlay && !isPlaying) {
      startAudio();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPreset, autoPlay]);

  // 3. Update Audio on Changes (Live Editing)
  useEffect(() => {
    if (isPlaying) {
      updateAudioParams();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layers, soloLayerId]);

  const startAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    // Stop current nodes but keep context alive
    stopAudio(false);

    const ctx = audioContextRef.current;

    layers.forEach(layer => {
      if (!layer.enabled) return;

      const gain = ctx.createGain();
      const panner = ctx.createStereoPanner();
      const filter = ctx.createBiquadFilter();

      filter.connect(gain);
      gain.connect(panner);
      panner.connect(ctx.destination);

      let targetVol = (soloLayerId && soloLayerId !== layer.id) ? 0 : layer.volume;
      gain.gain.value = targetVol;
      panner.pan.value = layer.pan;

      let lfoOsc = null;
      let lfoGain = null;
      let pulseGain = null;

      if (layer.pulseRate > 0 && layer.pulseDepth > 0) {
        pulseGain = ctx.createGain();
        filter.disconnect();
        filter.connect(pulseGain);
        pulseGain.connect(gain);

        lfoOsc = ctx.createOscillator();
        lfoOsc.frequency.value = layer.pulseRate;

        lfoGain = ctx.createGain();
        lfoGain.gain.value = layer.pulseDepth * 0.5;

        pulseGain.gain.value = 1 - (layer.pulseDepth * 0.5);
        lfoOsc.connect(lfoGain);
        lfoGain.connect(pulseGain.gain);
        lfoOsc.start();
      }

      let source = null;

      if (layer.type === 'oscillator' || layer.type === 'synth') {
        source = ctx.createOscillator();
        const validWaves = ['sine', 'square', 'sawtooth', 'triangle'];
        source.type = validWaves.includes(layer.waveform) ? layer.waveform : 'sine';
        source.frequency.value = layer.frequency || 432;
        source.connect(filter);
        source.start();
      } else {
        const buffer = createNoiseBuffer(ctx);
        source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        if (layer.waveform === 'pink' || layer.waveform === 'ocean') {
          filter.type = 'lowpass'; filter.frequency.value = 400;
        } else if (layer.waveform === 'brown' || layer.waveform === 'thunder') {
          filter.type = 'lowpass'; filter.frequency.value = 150;
        } else if (layer.waveform === 'wind') {
          filter.type = 'bandpass'; filter.frequency.value = 400;
        } else if (layer.waveform === 'rain' || layer.waveform === 'violet') {
          filter.type = 'highpass'; filter.frequency.value = 1000;
        } else {
          filter.type = 'lowpass'; filter.frequency.value = 20000;
        }

        source.connect(filter);
        source.start();
      }

      nodesRef.current.set(layer.id, {
        source,
        gain,
        panner,
        filter,
        lfoOsc,
        lfoGain,
        pulseGain
      });
    });

    setIsPlaying(true);
  };

  const stopAudio = (fully = true) => {
    nodesRef.current.forEach(node => {
      try { node.source.stop(); } catch (e) { }
      try { node.lfoOsc?.stop(); } catch (e) { }
      try { node.gain.disconnect(); } catch (e) { }
    });
    nodesRef.current.clear();
    if (fully) setIsPlaying(false);
  };

  const updateAudioParams = () => {
    const activeLayers = layers.filter(l => l.enabled);
    if (activeLayers.length !== nodesRef.current.size) {
      startAudio();
      return;
    }

    let needsRestart = false;
    activeLayers.forEach(layer => {
      const node = nodesRef.current.get(layer.id);
      if (!node) {
        needsRestart = true;
        return;
      }

      const now = audioContextRef.current.currentTime;

      let targetVol = (soloLayerId && soloLayerId !== layer.id) ? 0 : layer.volume;
      node.gain.gain.setTargetAtTime(targetVol, now, 0.1);
      node.panner.pan.setTargetAtTime(layer.pan, now, 0.1);

      if ((layer.type === 'oscillator' || layer.type === 'synth') && node.source.frequency) {
        node.source.frequency.setTargetAtTime(layer.frequency, now, 0.1);
        if (node.source.type !== layer.waveform && ['sine', 'square', 'sawtooth', 'triangle'].includes(layer.waveform)) {
          needsRestart = true;
        }
      }

      // Pulse Logic
      if (node.lfoOsc) {
        if (layer.pulseRate <= 0) {
          needsRestart = true;
        } else {
          node.lfoOsc.frequency.setTargetAtTime(layer.pulseRate, now, 0.1);
          node.lfoGain.gain.setTargetAtTime(layer.pulseDepth * 0.5, now, 0.1);
          node.pulseGain.gain.setTargetAtTime(1 - (layer.pulseDepth * 0.5), now, 0.1);
        }
      } else {
        if (layer.pulseRate > 0) needsRestart = true;
      }
    });

    if (needsRestart) startAudio();
  };

  const togglePlay = () => {
    if (isPlaying) stopAudio();
    else startAudio();
  };

  const addLayer = (type) => {
    const names = {
      oscillator: 'Frequency',
      noise: 'Noise',
      synth: 'Synth',
      ambient: 'Ambience'
    };
    const defaults = (type === 'oscillator' || type === 'synth')
      ? { frequency: 432, waveform: 'sine' }
      : { frequency: 0, waveform: 'white' };

    setLayers([
      ...layers,
      {
        id: Date.now(),
        type,
        name: names[type],
        volume: 0.5,
        pan: 0,
        enabled: true,
        pulseRate: 0,
        pulseDepth: 0,
        ...defaults,
        filter: { frequency: 20000, Q: 1 }
      }
    ]);
  };

  const updateLayer = (id, field, value) => {
    setLayers(layers.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const removeLayer = (id) => {
    setLayers(layers.filter(l => l.id !== id));
  };

  const handleSave = () => {
    onSave({
      name,
      color,
      layers: layers.map(l => ({
        ...l,
        id: l.id
      }))
    });
  };

  const selectedLayer = layers.find(l => l.id === selectedLayerId);
  const backgroundUrl = initialPreset?.imageUrl || null;
  return (
    <div className="relative w-full overflow-hidden rounded-3xl border border-white/10">
      {backgroundUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${backgroundUrl})` }}
        />
      )}

      <div
        className={cn(
          "absolute inset-0",
          backgroundUrl
            ? isPlaying
              ? "bg-gradient-to-b from-black/45 via-black/60 to-black/85"
              : "bg-gradient-to-b from-black/65 via-black/75 to-black/90"
            : "bg-transparent"
        )}
      />

      <div className="relative z-10 space-y-6 pb-32">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6">
        <Button
          variant="ghost"
          onClick={() => {
            stopAudio(); // ensure audio stops when leaving editor
            onCancel();
          }}
          className="text-gray-400 hover:text-white shrink-0"
        >
          <ArrowLeft className="w-5 h-5 mr-2" /> Back
        </Button>

        <div className="flex-1 w-full flex items-center gap-4">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-2xl font-bold bg-transparent border-none focus:ring-0 text-white placeholder:text-gray-600 h-auto p-0 w-full"
            placeholder="Mode Name"
          />

          {/* --- OPEN STUDIO BUTTON --- */}
          <Button
            onClick={() => {
              stopAudio(); // Stop Quick Editor audio before leaving
              navigate('/AuraEditor', {
                state: { preset: { name, color, layers, id: initialPreset?.id } }
              });
            }}
            className="bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 whitespace-nowrap"
          >
            <Monitor className="w-4 h-4 mr-2" /> Open Studio
          </Button>
          {/* ------------------------------- */}

          <div className="flex items-center gap-2">
            <Select value={color} onValueChange={setColor}>
              <SelectTrigger className="w-48 bg-white/5 border-white/10 text-xs h-9">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full border border-white/20"
                    style={{
                      background: color.includes('gradient')
                        ? color
                        : `linear-gradient(135deg, ${color}, #000)`
                    }}
                  />
                  <SelectValue placeholder="Select Cover" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-black border-zinc-800 text-white max-h-[300px]">
                {/* Color select options remain the same */}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        <AnimatePresence>
          {layers.map((layer, index) => (
            <motion.div
              key={layer.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white/5 border border-white/10 p-4 rounded-xl space-y-4 md:space-y-0"
              onClick={() => setSelectedLayerId(layer.id)}
            >
              <div className="flex flex-col md:flex-row gap-6">

                {/* Left Column: Source & Identity */}
                <div className="md:w-1/3 space-y-4 md:border-r md:border-white/10 md:pr-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${layer.enabled ? 'bg-emerald-500' : 'bg-gray-600'}`} />
                      <span className="text-xs font-bold text-gray-500">CHANNEL {index + 1}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className={`h-6 w-6 ${soloLayerId === layer.id ? "text-yellow-400" : "text-gray-600"}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSoloLayerId(soloLayerId === layer.id ? null : layer.id);
                        }}
                        title="Solo"
                      >
                        <Headphones className="w-3 h-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className={`h-6 w-6 ${layer.enabled ? "text-emerald-400" : "text-gray-600"}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          updateLayer(layer.id, 'enabled', !layer.enabled);
                        }}
                        title="Mute/Unmute"
                      >
                        <Play className="w-3 h-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-gray-600 hover:text-red-400"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeLayer(layer.id);
                        }}
                        title="Remove"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="bg-black/20 p-3 rounded-lg space-y-3 border border-white/5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-12">Type</span>
                      <Select
                        value={layer.type}
                        onValueChange={(v) => updateLayer(layer.id, 'type', v)}
                      >
                        <SelectTrigger className="h-7 text-xs bg-white/5 border-white/10 flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="oscillator">Tone</SelectItem>
                          <SelectItem value="noise">Noise</SelectItem>
                          <SelectItem value="synth">Synth</SelectItem>
                          <SelectItem value="ambient">Ambience</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {(layer.type === 'oscillator' || layer.type === 'synth') && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-12">Freq</span>
                        <Input
                          type="number"
                          value={layer.frequency}
                          onChange={(e) =>
                            updateLayer(layer.id, 'frequency', parseFloat(e.target.value))
                          }
                          className="h-7 bg-white/5 border-white/10 text-white font-mono text-xs flex-1"
                        />
                        <span className="text-xs text-gray-500">Hz</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-12">Wave</span>
                      <Select
                        value={layer.waveform}
                        onValueChange={(v) => updateLayer(layer.id, 'waveform', v)}
                      >
                        <SelectTrigger className="h-7 text-xs bg-white/5 border-white/10 flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {layer.type === 'oscillator'
                            ? ['sine', 'square', 'sawtooth', 'triangle'].map(t => (
                              <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))
                            : layer.type === 'synth'
                              ? SYNTH_TYPES.map(t => (
                                <SelectItem key={t} value={t}>{t}</SelectItem>
                              ))
                              : layer.type === 'noise'
                                ? NOISE_TYPES.map(t => (
                                  <SelectItem key={t} value={t}>{t}</SelectItem>
                                ))
                                : AMBIENT_TYPES.map(t => (
                                  <SelectItem key={t} value={t}>{t}</SelectItem>
                                ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Right Column: Mix & Effects */}
                <div className="md:w-2/3 grid grid-cols-2 gap-4">

                  {/* Pulse Section */}
                  <div className="bg-black/20 p-4 rounded-xl border border-white/5 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-3 border-b border-white/5 pb-2">
                      <Activity className="w-3 h-3 text-emerald-500" />
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Pulse
                      </span>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-gray-500">
                          <span>Rate</span>
                        </div>
                        <div className="flex gap-2 items-center">
                          <Slider
                            value={[layer.pulseRate]}
                            onValueChange={(v) =>
                              updateLayer(layer.id, 'pulseRate', v[0])
                            }
                            max={20}
                            step={0.1}
                            className="flex-1"
                          />
                          <span className="text-[10px] text-gray-400 w-10 text-right font-mono">
                            {layer.pulseRate.toFixed(1)}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-gray-500">
                          <span>Depth</span>
                        </div>
                        <div className="flex gap-2 items-center">
                          <Slider
                            value={[layer.pulseDepth]}
                            onValueChange={(v) =>
                              updateLayer(layer.id, 'pulseDepth', v[0])
                            }
                            max={1}
                            step={0.01}
                            className="flex-1"
                          />
                          <span className="text-[10px] text-gray-400 w-10 text-right font-mono">
                            {layer.pulseDepth.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Volume */}
                  <div className="bg-black/20 p-4 rounded-xl border border-white/5 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-3 border-b border-white/5 pb-2">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Volume
                      </span>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Slider
                        value={[layer.volume]}
                        onValueChange={(v) => updateLayer(layer.id, 'volume', v[0])}
                        max={1}
                        step={0.01}
                        className="flex-1"
                      />
                      <span className="text-[10px] text-gray-400 w-10 text-right font-mono">
                        {layer.volume.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Pan */}
                  <div className="bg-black/20 p-4 rounded-xl border border-white/5 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-3 border-b border-white/5 pb-2">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Pan
                      </span>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Slider
                        value={[layer.pan]}
                        onValueChange={(v) => updateLayer(layer.id, 'pan', v[0])}
                        min={-1}
                        max={1}
                        step={0.01}
                        className="flex-1"
                      />
                      <span className="text-[10px] text-gray-400 w-10 text-right font-mono">
                        {layer.pan.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Placeholder for any future effect panels */}
                  <div className="bg-black/10 p-4 rounded-xl border border-white/5 flex items-center justify-center text-[10px] text-gray-500">
                    Effects coming soon
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Button
          onClick={() => addLayer('oscillator')}
          variant="outline"
          className="border-dashed border-white/20 hover:bg-white/5 text-gray-400 hover:text-white py-8"
        >
          <Activity className="w-5 h-5 mr-2" /> Add Frequency
        </Button>
        <Button
          onClick={() => addLayer('ambient')}
          variant="outline"
          className="border-dashed border-white/20 hover:bg-white/5 text-gray-400 hover:text-white py-8"
        >
          <Wind className="w-5 h-5 mr-2" /> Add Ambience
        </Button>
      </div>

      <div className="fixed bottom-8 left-0 right-0 px-6 flex justify-center pointer-events-none">
        <div className="bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 p-2 rounded-full shadow-2xl flex gap-2 pointer-events-auto">

          <Button
            onClick={togglePlay}
            className={`
              rounded-full px-8 h-12 text-lg font-bold transition-all
              ${isPlaying
                ? 'bg-red-500/90 hover:bg-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]'
                : 'bg-emerald-500/90 hover:bg-emerald-600 text-black shadow-[0_0_20px_rgba(16,185,129,0.4)]'
              }
            `}
          >
            {isPlaying
              ? <Square className="w-5 h-5 mr-2 fill-current" />
              : <Play className="w-5 h-5 mr-2 fill-current" />}
            {isPlaying ? 'Stop' : 'Play Audio'}
          </Button>

          <div className="w-px bg-white/10 mx-2"></div>

          <Button
            onClick={handleSave}
            className="rounded-full px-8 h-12 bg-white text-black hover:bg-gray-200"
          >
            <Save className="w-5 h-5 mr-2" /> Save Mode
          </Button>
        </div>
      </div>
      </div>
    </div>
  );
}
