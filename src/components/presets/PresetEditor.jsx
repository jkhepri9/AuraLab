// src/components/presets/PresetEditor.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Square, ArrowLeft, Monitor } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

// ✅ Correct relative path from: src/components/presets -> src/audio
import { loadAmbientBuffer } from "../../audio/AmbientLoader";

// ✅ Optional: show human label for ambient waveform
import { getAmbientLabel } from "../../editor/effects/sourceDefs";

// ✅ GLOBAL AMBIENT BOOST for preset preview
const AMBIENT_GAIN_BOOST = 1.8;

// --- NOISE HELPERS (noise layers only) ---
function createNoiseBuffer(ctx, seconds = 2) {
  const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * seconds));
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

function safeNum(v, fallback) {
  return typeof v === "number" && !Number.isNaN(v) ? v : fallback;
}

export default function PresetEditor({
  initialPreset,
  onSave, // kept for compatibility (preview mode does not use it)
  onCancel,
  autoPlay = false,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const prevPathRef = useRef(location.pathname);

  const [name] = useState(initialPreset?.name || "Aura Mode");
  const [color] = useState(initialPreset?.color || "#10b981");

  // Keep original preset values; user can only adjust pan/volume here
  const [layers, setLayers] = useState(() => {
    if (initialPreset?.layers?.length) {
      return initialPreset.layers.map((l, i) => ({
        ...l,
        id: l.id || `${Date.now()}_${i}`,
        type: l.type || "oscillator",
        enabled: l.enabled !== false,
        volume: safeNum(l.volume, 0.5),
        pan: safeNum(l.pan, 0),
        frequency: safeNum(l.frequency, 432),
        waveform: l.waveform ?? "sine",
        name: l.name || "",
      }));
    }

    return [
      {
        id: `${Date.now()}`,
        type: "oscillator",
        frequency: 432,
        waveform: "sine",
        volume: 0.5,
        pan: 0,
        enabled: true,
        name: "Frequency",
      },
    ];
  });

  const [isPlaying, setIsPlaying] = useState(false);

  const audioContextRef = useRef(null);
  const nodesRef = useRef(new Map());

  // Cache decoded ambient WAV buffers across play/stop cycles
  const ambientCacheRef = useRef(new Map());

  const ensureCtx = async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        window.webkitAudioContext)();
    }
    if (audioContextRef.current.state === "suspended") {
      await audioContextRef.current.resume();
    }
    return audioContextRef.current;
  };

  // Stops nodes. If fully=true, also updates UI state.
  const stopAudio = useCallback((fully = true) => {
    nodesRef.current.forEach((node) => {
      try {
        node.source?.stop?.();
      } catch {}
      try {
        node.source?.disconnect?.();
      } catch {}
      try {
        node.gain?.disconnect?.();
      } catch {}
      try {
        node.panner?.disconnect?.();
      } catch {}
    });
    nodesRef.current.clear();
    if (fully) setIsPlaying(false);
  }, []);

  // HARD STOP: stop nodes + CLOSE AudioContext
  // This prevents “ghost audio” when navigation doesn’t unmount, especially on iOS.
  const hardStop = useCallback(async () => {
    stopAudio(true);

    const ctx = audioContextRef.current;
    audioContextRef.current = null;

    if (ctx) {
      try {
        await ctx.close();
      } catch {}
    }
  }, [stopAudio]);

  const startAudio = async () => {
    const ctx = await ensureCtx();

    // Stop current nodes but keep context alive for immediate restart
    stopAudio(false);

    for (const layer of layers) {
      if (!layer?.enabled) continue;

      const gain = ctx.createGain();
      const panner = ctx.createStereoPanner();

      const baseVol = safeNum(layer.volume, 0.5);
      const effectiveVol =
        layer.type === "ambient" ? baseVol * AMBIENT_GAIN_BOOST : baseVol;

      gain.gain.value = effectiveVol;
      panner.pan.value = safeNum(layer.pan, 0);

      gain.connect(panner);
      panner.connect(ctx.destination);

      let source = null;

      // OSCILLATOR
      if (layer.type === "oscillator") {
        source = ctx.createOscillator();
        const validWaves = ["sine", "square", "sawtooth", "triangle"];
        source.type = validWaves.includes(layer.waveform) ? layer.waveform : "sine";
        source.frequency.value = safeNum(layer.frequency, 432);
        source.connect(gain);
        source.start();
      }

      // SYNTH (preview: treat as tone so it always plays reliably)
      else if (layer.type === "synth") {
        source = ctx.createOscillator();
        source.type = "sine";
        source.frequency.value = safeNum(layer.frequency, 432);
        source.connect(gain);
        source.start();
      }

      // NOISE
      else if (layer.type === "noise") {
        const buffer = createNoiseBuffer(ctx, 2);
        source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        source.connect(gain);
        source.start();
      }

      // ✅ AMBIENT (REAL WAV) — uses SAME ctx as playback
      else if (layer.type === "ambient") {
        const buffer = await loadAmbientBuffer(
          layer.waveform,
          ambientCacheRef.current,
          ctx
        );
        if (!buffer) continue;

        source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        source.connect(gain);
        source.start();
      } else {
        continue;
      }

      nodesRef.current.set(layer.id, { source, gain, panner });
    }

    setIsPlaying(true);
  };

  const updateAudioParams = () => {
    const ctx = audioContextRef.current;
    if (!ctx) return;
    const now = ctx.currentTime;

    for (const layer of layers) {
      const node = nodesRef.current.get(layer.id);
      if (!node) continue;

      const baseVol = safeNum(layer.volume, 0.5);
      const effectiveVol =
        layer.type === "ambient" ? baseVol * AMBIENT_GAIN_BOOST : baseVol;

      const pan = safeNum(layer.pan, 0);

      node.gain.gain.setTargetAtTime(effectiveVol, now, 0.05);
      node.panner.pan.setTargetAtTime(pan, now, 0.05);
    }
  };

  const togglePlay = async () => {
    if (isPlaying) {
      await hardStop();
    } else {
      await startAudio();
    }
  };

  // HARD LOCK: only allow volume + pan changes
  const updateLayer = (id, field, value) => {
    if (field !== "volume" && field !== "pan") return;
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, [field]: value } : l))
    );
  };

  const backgroundUrl = initialPreset?.imageUrl || null;

  const layerRightLabel = (layer) => {
    if (layer?.name) return layer.name;
    if (layer?.type === "ambient") return getAmbientLabel(layer.waveform);
    return layer?.type || "";
  };

  // ✅ If user adjusts sliders while playing, update mix
  useEffect(() => {
    if (isPlaying) updateAudioParams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layers]);

  // ✅ Autoplay
  useEffect(() => {
    if (initialPreset && autoPlay && !isPlaying) {
      startAudio();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPreset, autoPlay]);

  // ✅ Stop audio if route/path changes (covers “leave page” without unmount)
  useEffect(() => {
    const prev = prevPathRef.current;
    if (prev && prev !== location.pathname) {
      hardStop();
    }
    prevPathRef.current = location.pathname;
  }, [location.pathname, hardStop]);

  // ✅ Stop audio on tab hide / pagehide / unload (critical for mobile Safari)
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "hidden") hardStop();
    };
    const onPageHide = () => hardStop();
    const onBeforeUnload = () => hardStop();

    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("beforeunload", onBeforeUnload);

    // Cleanup: always hard stop (works whether unmount happens or not)
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("beforeunload", onBeforeUnload);
      hardStop();
    };
  }, [hardStop]);

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
        {/* TOP BAR */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6">
          <Button
            variant="ghost"
            onClick={async () => {
              await hardStop();
              onCancel?.();
            }}
            className="text-gray-400 hover:text-white shrink-0"
          >
            <ArrowLeft className="w-5 h-5 mr-2" /> Back
          </Button>

          <div className="flex-1 w-full flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="text-2xl font-bold text-white truncate">{name}</div>
              <div className="text-xs text-gray-500 truncate">
                Preview mode — only Volume &amp; Pan
              </div>
            </div>

            <Button
              onClick={async () => {
                await hardStop();
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

                  <div className="text-xs text-gray-400 truncate max-w-[60%] text-right">
                    {layerRightLabel(layer)}
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
                        value={[safeNum(layer.volume, 0.5)]}
                        onValueChange={(v) => updateLayer(layer.id, "volume", v[0])}
                        max={1}
                        step={0.01}
                        className="flex-1"
                      />
                      <span className="text-[10px] text-gray-400 w-10 text-right font-mono">
                        {safeNum(layer.volume, 0.5).toFixed(2)}
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
                        value={[safeNum(layer.pan, 0)]}
                        onValueChange={(v) => updateLayer(layer.id, "pan", v[0])}
                        min={-1}
                        max={1}
                        step={0.01}
                        className="flex-1"
                      />
                      <span className="text-[10px] text-gray-400 w-10 text-right font-mono">
                        {safeNum(layer.pan, 0).toFixed(2)}
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
