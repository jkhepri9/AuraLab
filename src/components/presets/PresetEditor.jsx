import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Square, ArrowLeft, Monitor } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import RotatePrompt from "@/components/RotatePrompt";

// --- AUDIO HELPERS ---
function createNoiseBuffer(ctx) {
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

export default function PresetEditor({
  initialPreset,
  onSave, // kept for compatibility, but not used in preview mode
  onCancel,
  autoPlay = false,
}) {
  const navigate = useNavigate();

  const [name] = useState(initialPreset?.name || "Aura Mode");
  const [color] = useState(initialPreset?.color || "#10b981");

  // Initialize Layers with defaults (keep original preset values; user can only adjust pan/volume)
  const [layers, setLayers] = useState(() => {
    if (initialPreset?.layers) {
      return initialPreset.layers.map((l, i) => ({
        ...l,
        id: l.id || Date.now() + i,
        pan: l.pan ?? 0,
        type: l.type || "oscillator",
        pulseRate: l.pulseRate ?? 0,
        pulseDepth: l.pulseDepth ?? 0,
        filter: l.filter || { frequency: 20000, Q: 1 },
      }));
    }
    return [
      {
        id: Date.now(),
        type: "oscillator",
        frequency: 432,
        waveform: "sine",
        volume: 0.5,
        pan: 0,
        enabled: true,
        pulseRate: 0,
        pulseDepth: 0,
        filter: { frequency: 20000, Q: 1 },
      },
    ];
  });

  const [isPlaying, setIsPlaying] = useState(false);

  const audioContextRef = useRef(null);
  const nodesRef = useRef(new Map());

  // Cleanup on unmount
  useEffect(() => {
    return () => stopAudio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // AutoPlay on load
  useEffect(() => {
    if (initialPreset && autoPlay && !isPlaying) startAudio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPreset, autoPlay]);

  // Update audio on pan/volume changes
  useEffect(() => {
    if (isPlaying) updateAudioParams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layers]);

  const startAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        window.webkitAudioContext)();
    }
    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume();
    }

    // Stop current nodes but keep context alive
    stopAudio(false);

    const ctx = audioContextRef.current;

    layers.forEach((layer) => {
      if (!layer.enabled) return;

      const gain = ctx.createGain();
      const panner = ctx.createStereoPanner();
      const filter = ctx.createBiquadFilter();

      filter.connect(gain);
      gain.connect(panner);
      panner.connect(ctx.destination);

      gain.gain.value = layer.volume ?? 0.5;
      panner.pan.value = layer.pan ?? 0;

      // Keep pulse behavior IF it exists in the preset, but user cannot edit it
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

        pulseGain.gain.value = 1 - layer.pulseDepth * 0.5;
        lfoOsc.connect(lfoGain);
        lfoGain.connect(pulseGain.gain);
        lfoOsc.start();
      }

      let source = null;

      if (layer.type === "oscillator" || layer.type === "synth") {
        source = ctx.createOscillator();
        const validWaves = ["sine", "square", "sawtooth", "triangle"];
        source.type = validWaves.includes(layer.waveform) ? layer.waveform : "sine";
        source.frequency.value = layer.frequency || 432;
        source.connect(filter);
        source.start();
      } else {
        // Noise/ambient fallback (legacy preview engine)
        const buffer = createNoiseBuffer(ctx);
        source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        if (layer.waveform === "pink" || layer.waveform === "ocean") {
          filter.type = "lowpass";
          filter.frequency.value = 400;
        } else if (layer.waveform === "brown" || layer.waveform === "thunder") {
          filter.type = "lowpass";
          filter.frequency.value = 150;
        } else if (layer.waveform === "wind") {
          filter.type = "bandpass";
          filter.frequency.value = 400;
        } else if (layer.waveform === "rain" || layer.waveform === "violet") {
          filter.type = "highpass";
          filter.frequency.value = 1000;
        } else {
          filter.type = "lowpass";
          filter.frequency.value = 20000;
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
        pulseGain,
      });
    });

    setIsPlaying(true);
  };

  const stopAudio = (fully = true) => {
    nodesRef.current.forEach((node) => {
      try {
        node.source.stop();
      } catch {}
      try {
        node.lfoOsc?.stop();
      } catch {}
      try {
        node.gain.disconnect();
      } catch {}
    });
    nodesRef.current.clear();
    if (fully) setIsPlaying(false);
  };

  const updateAudioParams = () => {
    const activeLayers = layers.filter((l) => l.enabled);
    if (activeLayers.length !== nodesRef.current.size) {
      startAudio();
      return;
    }

    activeLayers.forEach((layer) => {
      const node = nodesRef.current.get(layer.id);
      if (!node) return;

      const now = audioContextRef.current.currentTime;
      node.gain.gain.setTargetAtTime(layer.volume ?? 0.5, now, 0.1);
      node.panner.pan.setTargetAtTime(layer.pan ?? 0, now, 0.1);
    });
  };

  const togglePlay = () => {
    if (isPlaying) stopAudio();
    else startAudio();
  };

  // HARD LOCK: only allow volume + pan changes in Preview Editor
  const updateLayer = (id, field, value) => {
    if (field !== "volume" && field !== "pan") return;
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, [field]: value } : l))
    );
  };

  const backgroundUrl = initialPreset?.imageUrl || null;

  return (
    <div className="relative w-full overflow-hidden rounded-3xl border border-white/10">
      {/* MOBILE PORTRAIT ROTATION PROMPT */}
      <RotatePrompt />

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
        {/* TOP BAR */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6">
          <Button
            variant="ghost"
            onClick={() => {
              stopAudio();
              onCancel();
            }}
            className="text-gray-400 hover:text-white shrink-0"
          >
            <ArrowLeft className="w-5 h-5 mr-2" /> Back
          </Button>

          <div className="flex-1 w-full flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="text-2xl font-bold text-white truncate">{name}</div>
              <div className="text-xs text-gray-500 truncate">
                Preview mode — only Volume & Pan
              </div>
            </div>

            {/* Keep Studio access */}
            <Button
              onClick={() => {
                stopAudio();
                navigate("/AuraEditor", {
                  state: { preset: { name, color, layers, id: initialPreset?.id } },
                });
              }}
              className="bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 whitespace-nowrap"
            >
              <Monitor className="w-4 h-4 mr-2" /> Open Studio
            </Button>
          </div>
        </div>

        {/* LAYERS */}
        <div className="grid gap-4">
          <AnimatePresence>
            {layers.map((layer, index) => (
              <motion.div
                key={layer.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white/5 border border-white/10 p-4 rounded-xl"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-bold text-gray-500">
                      CHANNEL {index + 1}
                    </span>
                  </div>

                  <div className="text-xs text-gray-500 truncate max-w-[60%] text-right">
                    {layer.name || layer.type}
                  </div>
                </div>

                {/* ONLY: Volume + Pan */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Volume */}
                  <div className="bg-black/20 p-4 rounded-xl border border-white/5 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-3 border-b border-white/5 pb-2">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Volume
                      </span>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Slider
                        value={[layer.volume ?? 0.5]}
                        onValueChange={(v) => updateLayer(layer.id, "volume", v[0])}
                        max={1}
                        step={0.01}
                        className="flex-1"
                      />
                      <span className="text-[10px] text-gray-400 w-10 text-right font-mono">
                        {(layer.volume ?? 0.5).toFixed(2)}
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
                        value={[layer.pan ?? 0]}
                        onValueChange={(v) => updateLayer(layer.id, "pan", v[0])}
                        min={-1}
                        max={1}
                        step={0.01}
                        className="flex-1"
                      />
                      <span className="text-[10px] text-gray-400 w-10 text-right font-mono">
                        {(layer.pan ?? 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* BOTTOM PLAY BAR */}
        <div className="fixed bottom-8 left-0 right-0 px-6 flex justify-center pointer-events-none">
          <div className="bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 p-2 rounded-full shadow-2xl flex gap-2 pointer-events-auto">
            <Button
              onClick={togglePlay}
              className={cn(
                "rounded-full px-8 h-12 text-lg font-bold transition-all",
                isPlaying
                  ? "bg-red-500/90 hover:bg-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]"
                  : "bg-emerald-500/90 hover:bg-emerald-600 text-black shadow-[0_0_20px_rgba(16,185,129,0.4)]"
              )}
            >
              {isPlaying ? (
                <Square className="w-5 h-5 mr-2 fill-current" />
              ) : (
                <Play className="w-5 h-5 mr-2 fill-current" />
              )}
              {isPlaying ? "Stop" : "Play Audio"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
