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
  // oscillator / frequency
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

  // Derived (not state) so it always matches the selected preset.
  const name = useMemo(() => initialPreset?.name || "Aura Mode", [initialPreset]);
  const color = useMemo(() => initialPreset?.color || "#10b981", [initialPreset]);

  const [layers, setLayers] = useState(() => hydrateLayersFromPreset(initialPreset));

  // CRITICAL FIX:
  // When the selected preset changes, reset the editor’s internal layers state.
  // This prevents “stale layers” from the previous preset being replayed.
  useEffect(() => {
    const hydrated = hydrateLayersFromPreset(initialPreset);
    setLayers(hydrated);

    if (initialPreset && autoPlay) {
      // Play using the hydrated layers immediately (no stale state).
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

  // If user adjusts sliders while playing, update mix without restarting.
  useEffect(() => {
    if (!isPlaying) return;
    player.updateLayers(layers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layers, isPlaying]);

  return (
    <div className="relative w-full overflow-hidden rounded-3xl border border-white/10">
      {/* MOBILE: rotate prompt for Preset Editor */}
      <RotatePrompt
        title="Rotate your device"
        message="For the best experience in Preset Editor on mobile, rotate to landscape."
      />

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

        {/* Playback Control (in-flow to avoid overlapping the global sticky player) */}
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
