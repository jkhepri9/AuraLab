// src/components/presets/PresetEditor.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Square, ArrowLeft, Monitor, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

import RotatePrompt from "@/components/RotatePrompt";
import { useGlobalPlayer } from "../../audio/GlobalPlayerContext";

// ✅ Optional: show human label for ambient waveform
import { getAmbientLabel } from "../../editor/effects/sourceDefs";

function safeNum(v, fallback) {
  return typeof v === "number" && !Number.isNaN(v) ? v : fallback;
}

function defaultWaveformForType(t) {
  const type = (t || "").toLowerCase();
  if (type === "noise" || type === "color") return "white";
  if (type === "ambient") return "ocean_soft";
  if (type === "synth") return "analog";
  return "sine";
}

function hydrateLayersFromPreset(preset) {
  const src = preset?.layers?.length ? preset.layers : [];

  if (src.length === 0) {
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
  }

  return src.map((l, i) => {
    const type = l.type || "oscillator";
    const waveform = l.waveform ?? defaultWaveformForType(type);

    return {
      ...l,
      id: l.id || `${Date.now()}_${i}`,
      type,
      enabled: l.enabled !== false,
      volume: safeNum(l.volume, 0.5),
      pan: safeNum(l.pan, 0),
      frequency: safeNum(l.frequency, 432),
      waveform,
      name: l.name || "",
    };
  });
}

// -----------------------------------------------------------------------------
// Discover metadata helpers (matches db.js intent: minimal + safe heuristics)
// -----------------------------------------------------------------------------
const GOAL_OPTIONS = [
  { key: "sleep", label: "Sleep" },
  { key: "focus", label: "Focus" },
  { key: "calm", label: "Calm" },
  { key: "energy", label: "Energy" },
  { key: "meditate", label: "Meditate" },
  { key: "recovery", label: "Recovery" },
];

const COLLECTION_OPTIONS = [
  { key: "Featured", label: "Featured" },
  { key: "Community", label: "Community" },
  { key: "Fan Favorites", label: "Fan Favorites" },
  { key: "Custom", label: "Custom" },
];

const DURATION_OPTIONS = ["10m", "15m", "30m", "60m", "90m"];

function uniq(arr) {
  const out = [];
  const seen = new Set();
  for (const v of arr || []) {
    const s = String(v || "").trim();
    if (!s) continue;
    if (seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

function detectBinaural(layers) {
  // Heuristic:
  // - two oscillators
  // - opposite pan
  // - small frequency difference (0.5–40 Hz)
  const oscs = (layers || [])
    .filter((l) => (l?.type === "oscillator" || l?.type === "frequency") && (l?.enabled ?? true))
    .map((l) => ({
      pan: Number(l?.pan ?? 0),
      frequency: Number(l?.frequency ?? 0),
    }))
    .filter((x) => Number.isFinite(x.frequency));

  for (let i = 0; i < oscs.length; i++) {
    for (let j = i + 1; j < oscs.length; j++) {
      const a = oscs[i];
      const b = oscs[j];

      const oppositePans =
        (a.pan < -0.25 && b.pan > 0.25) || (b.pan < -0.25 && a.pan > 0.25);
      if (!oppositePans) continue;

      const diff = Math.abs(a.frequency - b.frequency);
      if (diff >= 0.5 && diff <= 40) return true;
    }
  }
  return false;
}

function defaultDurationForGoals(goals = []) {
  const g = new Set(goals);
  if (g.has("sleep") || g.has("recovery")) return "60m";
  if (g.has("energy")) return "15m";
  return "30m";
}

export default function PresetEditor({
  initialPreset,
  onSave,
  onCancel,
  autoPlay = false,
}) {
  const player = useGlobalPlayer();
  const navigate = useNavigate();

  const setStickyPlayerHidden = player?.setStickyPlayerHidden;

  // Hide the global sticky mini player while this editor is mounted.
  useEffect(() => {
    setStickyPlayerHidden?.(true);
    return () => setStickyPlayerHidden?.(false);
  }, [setStickyPlayerHidden]);

  const presetId = initialPreset?.id || "__preview__";
  const isExisting = Boolean(initialPreset?.id);

  const name = useMemo(() => initialPreset?.name || "Aura Mode", [initialPreset]);
  const color = useMemo(() => initialPreset?.color || "#10b981", [initialPreset]);

  const [layers, setLayers] = useState(() => hydrateLayersFromPreset(initialPreset));

  // Discover metadata state
  const [goals, setGoals] = useState(() =>
    Array.isArray(initialPreset?.goals) ? uniq(initialPreset.goals) : []
  );

  const [collection, setCollection] = useState(() => initialPreset?.collection || "Custom");

  const [intensity, setIntensity] = useState(() => {
    const v = Number(initialPreset?.intensity);
    return Number.isFinite(v) ? Math.max(1, Math.min(5, Math.round(v))) : 3;
  });

  const binauralAuto = useMemo(() => detectBinaural(layers), [layers]);

  // If the preset already has an explicit headphones flag, treat that as “override”.
  const [headphonesOverride, setHeadphonesOverride] = useState(() =>
    typeof initialPreset?.headphonesRecommended === "boolean"
  );

  const [headphonesRecommended, setHeadphonesRecommended] = useState(() => {
    if (typeof initialPreset?.headphonesRecommended === "boolean") {
      return initialPreset.headphonesRecommended;
    }
    return binauralAuto;
  });

  const [durationHint, setDurationHint] = useState(() => {
    const d = String(initialPreset?.durationHint || "").trim();
    if (d) return d;
    return defaultDurationForGoals(goals);
  });

  // Reset state when preset changes
  useEffect(() => {
    const hydrated = hydrateLayersFromPreset(initialPreset);
    setLayers(hydrated);

    setGoals(Array.isArray(initialPreset?.goals) ? uniq(initialPreset.goals) : []);
    setCollection(initialPreset?.collection || "Custom");

    const v = Number(initialPreset?.intensity);
    setIntensity(Number.isFinite(v) ? Math.max(1, Math.min(5, Math.round(v))) : 3);

    setHeadphonesOverride(typeof initialPreset?.headphonesRecommended === "boolean");
    setHeadphonesRecommended(
      typeof initialPreset?.headphonesRecommended === "boolean"
        ? initialPreset.headphonesRecommended
        : detectBinaural(hydrated)
    );

    const d = String(initialPreset?.durationHint || "").trim();
    setDurationHint(d || defaultDurationForGoals(Array.isArray(initialPreset?.goals) ? initialPreset.goals : []));

    if (initialPreset && autoPlay) {
      player.playPreset({
        ...initialPreset,
        id: presetId,
        name,
        color,
        layers: hydrated,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetId]);

  // Keep headphonesRecommended synced to auto-detection unless overridden.
  useEffect(() => {
    if (headphonesOverride) return;
    setHeadphonesRecommended(binauralAuto);
  }, [binauralAuto, headphonesOverride]);

  // Keep duration default reasonable if user has not touched it.
  useEffect(() => {
    // Only auto-set duration when it's empty or one of the defaults that might have been auto-filled.
    // If user picks a duration explicitly, we keep it.
    setDurationHint((prev) => (prev ? prev : defaultDurationForGoals(goals)));
  }, [goals]);

  const isActivePreset =
    Boolean(player.currentPlayingPreset?.id) &&
    player.currentPlayingPreset?.id === presetId;

  const isPlaying = player.isPlaying && isActivePreset;

  const togglePlay = async () => {
    if (isPlaying) {
      player.stop();
      return;
    }

    await player.playPreset({
      ...(initialPreset || {}),
      id: presetId,
      name,
      color,
      layers,
    });
  };

  // HARD LOCK: only allow volume changes in this editor
  const updateLayer = (id, field, value) => {
    if (field !== "volume") return;
    setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, [field]: value } : l)));
  };

  const backgroundUrl = initialPreset?.imageUrl || null;

  const layerRightLabel = (layer) => {
    if (!layer) return "";
    if (layer?.name) return layer.name;

    const type = (layer?.type || "").toLowerCase();

    if (type === "ambient") return getAmbientLabel(layer.waveform) || "Ambient";

    if (type === "oscillator" || type === "frequency") {
      const hz =
        typeof layer.frequency === "number" && !Number.isNaN(layer.frequency)
          ? layer.frequency
          : null;
      if (hz == null) return "Frequency";
      const rounded = Math.round(hz);
      const display = Math.abs(hz - rounded) < 0.01 ? rounded : hz;
      return `${display} Hz`;
    }

    if (type === "noise" || type === "color") return `Noise: ${layer.waveform || "white"}`;
    if (type === "synth") return `Synth: ${layer.waveform || "analog"}`;

    return type || "Layer";
  };

  // Live-mix updates while playing
  useEffect(() => {
    if (!isPlaying) return;
    player.updateLayers(layers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layers, isPlaying]);

  // ✅ Prevent “tap anywhere to jump slider”
  const requireThumbDrag = (e) => {
    const el = e?.target;
    const isThumb = typeof el?.closest === "function" && el.closest('[role="slider"]');
    if (!isThumb) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const pill = (active) =>
    cn(
      "h-9 rounded-full px-4 text-sm font-semibold border transition",
      active
        ? "bg-emerald-500/90 text-black border-emerald-300/40 shadow-[0_0_16px_rgba(16,185,129,0.25)]"
        : "bg-black/50 text-white border-white/15 hover:bg-black/70"
    );

  const toggleGoal = (key) => {
    setGoals((prev) => {
      const has = prev.includes(key);
      if (has) return prev.filter((g) => g !== key);

      // Keep it clean: max 2 goals.
      if (prev.length >= 2) {
        const trimmed = prev.slice(0, 1);
        return uniq([...trimmed, key]);
      }
      return uniq([...prev, key]);
    });
  };

  const handleSave = () => {
    if (typeof onSave !== "function") return;

    const data = {
      // Keep existing fields (safe for update path)
      ...(initialPreset || {}),

      // Ensure core preview data stays aligned
      name,
      color,
      layers,

      // Discover metadata
      collection: collection || "Custom",
      goals: uniq(goals),
      intensity: Math.max(1, Math.min(5, Math.round(Number(intensity) || 3))),
      durationHint: String(durationHint || "").trim() || defaultDurationForGoals(goals),
      headphonesRecommended: Boolean(headphonesRecommended),
    };

    onSave(data);
  };

  return (
    <div className="relative w-full overflow-hidden rounded-3xl border border-white/10">
      {/* MOBILE: rotate prompt for Preset Editor */}
      <RotatePrompt
        title="Rotate your device"
        message="For the best experience in Preset Editor on mobile, rotate to landscape."
      />

      {/* Background image (CLEAR) */}
      {backgroundUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${backgroundUrl})` }}
        />
      )}

      {/* CONTENT */}
      <div className="relative z-10 space-y-6 pb-32">
        {/* STICKY HEADER */}
        <div className="sticky top-0 z-30 px-4 pt-4">
          <div className="rounded-2xl border border-white/10 bg-black/25 backdrop-blur-md shadow-xl">
            <div className="p-3 md:p-4 flex flex-col md:flex-row items-start md:items-center gap-4">
              <Button
                variant="secondary"
                onClick={() => onCancel?.()}
                className={cn(
                  "shrink-0",
                  "bg-black/70 hover:bg-black/80 text-white",
                  "border border-white/15 shadow-lg",
                  "backdrop-blur-md"
                )}
              >
                <ArrowLeft className="w-5 h-5 mr-2" /> Back
              </Button>

              <div className="flex-1 w-full flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-2xl font-bold text-white truncate drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)]">
                    {name}
                  </div>
                  <div className="text-xs text-white/80 truncate">
                    Preview mode — Volume only (Discover settings below)
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleSave}
                    disabled={typeof onSave !== "function"}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-300/30 whitespace-nowrap shadow-lg"
                    title={isExisting ? "Save changes" : "Create this mode"}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isExisting ? "Save" : "Create"}
                  </Button>

                  <Button
                    onClick={() => {
                      navigate("/AuraEditor", {
                        state: { preset: { ...(initialPreset || {}), name, color, layers, id: initialPreset?.id } },
                      });
                    }}
                    className="bg-black/70 hover:bg-black/80 text-white border border-white/15 whitespace-nowrap backdrop-blur-md shadow-lg"
                  >
                    <Monitor className="w-4 h-4 mr-2" /> Open Studio
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* DISCOVER SETTINGS (Calm-like “Discover” metadata) */}
        <div className="px-4">
          <div className="rounded-2xl border border-white/10 bg-black/35 backdrop-blur-md shadow-xl p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-extrabold text-white tracking-wide">
                  Discover Settings
                </div>
                <div className="text-xs text-white/70">
                  This controls how modes are grouped, recommended, and filtered on Aura Modes.
                </div>
              </div>

              <div className="text-[11px] text-white/60 text-right">
                {binauralAuto ? "Binaural detected" : "No binaural detected"}
              </div>
            </div>

            {/* Goals */}
            <div className="mt-4">
              <div className="text-xs font-bold text-white/80 mb-2">
                Goals (pick up to 2)
              </div>
              <div className="flex flex-wrap gap-2">
                {GOAL_OPTIONS.map((g) => (
                  <button
                    key={g.key}
                    type="button"
                    onClick={() => toggleGoal(g.key)}
                    className={pill(goals.includes(g.key))}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Controls grid */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Headphones */}
              <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                <div className="text-xs font-bold text-white/80">Headphones</div>
                <div className="text-sm font-semibold text-white mt-1">
                  {headphonesRecommended ? "Recommended" : "Not required"}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setHeadphonesOverride(false);
                      setHeadphonesRecommended(binauralAuto);
                    }}
                    className={pill(!headphonesOverride)}
                    title="Use auto-detection"
                  >
                    Auto
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setHeadphonesOverride(true);
                      setHeadphonesRecommended(true);
                    }}
                    className={pill(headphonesOverride && headphonesRecommended)}
                    title="Force on"
                  >
                    On
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setHeadphonesOverride(true);
                      setHeadphonesRecommended(false);
                    }}
                    className={pill(headphonesOverride && !headphonesRecommended)}
                    title="Force off"
                  >
                    Off
                  </button>
                </div>
              </div>

              {/* Intensity */}
              <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-white/80">Intensity</div>
                  <div className="text-[11px] text-white/70 font-mono tabular-nums">
                    {Math.max(1, Math.min(5, Math.round(Number(intensity) || 3)))}/5
                  </div>
                </div>

                <div className="mt-3">
                  <Slider
                    value={[Math.max(1, Math.min(5, Number(intensity) || 3))]}
                    onValueChange={(v) => setIntensity(v[0])}
                    min={1}
                    max={5}
                    step={1}
                    onPointerDownCapture={requireThumbDrag}
                  />
                </div>

                <div className="mt-2 text-[11px] text-white/60">
                  Higher intensity = more “forward” mix / stronger feel (for sorting).
                </div>
              </div>

              {/* Duration */}
              <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                <div className="text-xs font-bold text-white/80">Suggested Duration</div>
                <div className="text-sm font-semibold text-white mt-1">
                  {durationHint || defaultDurationForGoals(goals)}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {DURATION_OPTIONS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDurationHint(d)}
                      className={pill((durationHint || "").trim() === d)}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Collection */}
            <div className="mt-4">
              <div className="text-xs font-bold text-white/80 mb-2">Collection</div>
              <div className="flex flex-wrap gap-2">
                {COLLECTION_OPTIONS.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setCollection(c.key)}
                    className={pill(collection === c.key)}
                    title="Used for grouping on Aura Modes"
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              <div className="mt-2 text-[11px] text-white/60">
                For user-made modes, keep this on <span className="text-white/80 font-semibold">Custom</span>.
              </div>
            </div>
          </div>
        </div>

        {/* LAYERS */}
        <div className="px-4 grid gap-4">
          <AnimatePresence>
            {layers.map((layer, index) => (
              <motion.div
                key={layer.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-transparent border border-white/10 p-4 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.25)]"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-bold text-white/80 drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)]">
                      CHANNEL {index + 1}
                    </span>
                  </div>

                  <div className="max-w-[70%] text-right">
                    <span className="inline-flex items-center rounded-full bg-black/60 px-3 py-1 text-sm font-semibold text-white shadow-sm ring-1 ring-white/20 backdrop-blur-sm truncate">
                      {layerRightLabel(layer)}
                    </span>
                  </div>
                </div>

                {/* ONLY: Volume */}
                <div className="grid grid-cols-1 gap-4">
                  <div className="overflow-hidden rounded-xl border border-white/10 bg-transparent shadow-[0_8px_30px_rgba(0,0,0,0.18)]">
                    <div className="p-4 flex flex-col justify-center">
                      <div className="flex items-center justify-between gap-3 mb-3 border-b border-white/10 pb-2">
                        <span className="text-xs font-bold text-white/90 uppercase tracking-wider">
                          Volume
                        </span>
                        <span className="text-[11px] text-white/80 font-mono tabular-nums">
                          {safeNum(layer.volume, 0.5).toFixed(2)}
                        </span>
                      </div>

                      <div className="flex gap-3 items-center">
                        <Slider
                          value={[safeNum(layer.volume, 0.5)]}
                          onValueChange={(v) => updateLayer(layer.id, "volume", v[0])}
                          max={1}
                          step={0.01}
                          className="flex-1"
                          onPointerDownCapture={requireThumbDrag}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Playback Control */}
        <div className="mt-8 flex justify-center">
          <div className="bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 p-2 rounded-full shadow-2xl flex gap-2">
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
