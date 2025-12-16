// src/components/presets/PresetEditor.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Square, ArrowLeft, Monitor } from "lucide-react";
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

export default function PresetEditor({
  initialPreset,
  onSave, // kept for compatibility (not used here)
  onCancel,
  autoPlay = false,
}) {
  const player = useGlobalPlayer();
  const navigate = useNavigate();

  const presetId = initialPreset?.id || "__preview__";

  const name = useMemo(() => initialPreset?.name || "Aura Mode", [initialPreset]);
  const color = useMemo(() => initialPreset?.color || "#10b981", [initialPreset]);

  const [layers, setLayers] = useState(() => hydrateLayersFromPreset(initialPreset));

  // Reset layers when preset changes
  useEffect(() => {
    const hydrated = hydrateLayersFromPreset(initialPreset);
    setLayers(hydrated);

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
  // Only allow pointer-down to reach Radix Slider if it started on the thumb (role="slider")
  const requireThumbDrag = (e) => {
    const el = e?.target;
    const isThumb = typeof el?.closest === "function" && el.closest('[role="slider"]');
    if (!isThumb) {
      e.preventDefault();
      e.stopPropagation();
    }
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
        {/* STICKY HEADER (Back button always visible) */}
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
                    Preview mode — Volume only
                  </div>
                </div>

                <Button
                  onClick={() => {
                    navigate("/AuraEditor", {
                      state: { preset: { name, color, layers, id: initialPreset?.id } },
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

        {/* LAYERS */}
        <div className="px-4 grid gap-4">
          <AnimatePresence>
            {layers.map((layer, index) => (
              <motion.div
                key={layer.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                // ✅ TRUE SEE-THROUGH: no blur, no tinted background (no image distortion)
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
                  {/* ✅ TRUE SEE-THROUGH VOLUME CARD (no blur, no tint) */}
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
