// src/pages/AuraEditor.jsx
// -----------------------------------------------------------------------------
// AURA LAB — AURA STUDIO (AuraEditor)
// - Stable AudioEngine wiring
// - Layer types aligned with LayerList + SourceControls (oscillator/noise/synth/ambient)
// - Unsaved Changes guard WITHOUT react-router useBlocker (BrowserRouter-safe)
//   • refresh/close prompt (beforeunload)
//   • browser back prompt (popstate)
// -----------------------------------------------------------------------------
//
// FIX IN THIS PATCH:
// - While playing in Aura Studio, layer parameter edits (volume/filter/pulse/etc.)
//   must be pushed to the engine live. Previously, edits updated React state only,
//   and you heard changes only after pause/play (engine rebuild).
// - We now coalesce rapid edits and call player.updateLayers(...) while playing.
// -----------------------------------------------------------------------------

import React, { useEffect, useMemo, useRef, useState } from "react";

import { useGlobalPlayer } from "../audio/GlobalPlayerContext";
import Timeline from "../editor/timeline/Timeline";
import TransportBar from "../editor/transport/TransportBar";
import LayerList from "../editor/layers/LayerList";
import EffectsPanel from "../editor/effects/EffectsPanel";
import RotatePrompt from "@/components/RotatePrompt";

import { db } from "../lib/db";

import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Download, Save } from "lucide-react";
import { toast } from "sonner";

import useUnsavedChangesGuard from "../hooks/useUnsavedChangesGuard";

export default function AuraEditor() {
  const player = useGlobalPlayer();

  // ----------------------------
  // LIVE LAYER UPDATES (apply volume/filter/pulse immediately while playing)
  // - Coalesces rapid slider updates to 1 call per animation frame.
  // ----------------------------
  const liveRafRef = useRef(null);
  const pendingLayersRef = useRef(null);

  const scheduleLiveUpdate = (nextLayers) => {
    if (!player?.updateLayers) return;
    pendingLayersRef.current = nextLayers;

    if (liveRafRef.current) return;
    liveRafRef.current = requestAnimationFrame(() => {
      liveRafRef.current = null;
      const latest = pendingLayersRef.current;
      pendingLayersRef.current = null;

      // Only push live updates while Studio transport is playing.
      if (isPlaying && latest) player.updateLayers(latest);
    });
  };

  useEffect(() => {
    return () => {
      if (liveRafRef.current) cancelAnimationFrame(liveRafRef.current);
      liveRafRef.current = null;
      pendingLayersRef.current = null;
    };
  }, []);

  // ----------------------------
  // PROJECT
  // ----------------------------
  const [projectName, setProjectName] = useState("New Aura Session");
  const [layers, setLayers] = useState([]);
  const [selectedLayerId, setSelectedLayerId] = useState(null);

  // ----------------------------
  // TRANSPORT
  // ----------------------------
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration] = useState(1200);

  // ----------------------------
  // FX STATE (UI STATE)
  // ----------------------------
  const [reverbWet, setReverbWet] = useState(0);
  const [delayWet, setDelayWet] = useState(0);
  const [delayTime, setDelayTime] = useState(0.5);

  // ----------------------------
  // AUDIO ENGINE (GLOBAL)
  // ----------------------------
  // We use the single global engine so playback is continuous across pages
  // and selecting another sound/preset always replaces the previous mix.
  useEffect(() => {
    if (!player?.engine) return;
    player.engine.onTick = (time) => setCurrentTime(time);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player?.engine]);

  // Keep FX applied live to the running engine (including after play/stop and HMR re-init).
  useEffect(() => {
    if (!player?.engine) return;
    player.engine.setReverb?.(reverbWet);
    player.engine.setDelayWet?.(delayWet);
    player.engine.setDelayTime?.(delayTime);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player?.engine, reverbWet, delayWet, delayTime]);

  // ----------------------------
  // UNSAVED CHANGES (baseline snapshot)
  // ----------------------------
  const baselineRef = useRef("");

  const snapshot = useMemo(() => {
    // Keep it deterministic and lightweight
    return JSON.stringify({
      projectName,
      layers,
      fx: { reverbWet, delayWet, delayTime },
    });
  }, [projectName, layers, reverbWet, delayWet, delayTime]);

  // Initialize baseline once
  if (!baselineRef.current) baselineRef.current = snapshot;

  const isDirty = baselineRef.current !== snapshot;

  // BrowserRouter-safe unsaved guard:
  // - handles refresh/close automatically
  // - (return value can be used before manual navigation; not needed here)
  useUnsavedChangesGuard(isDirty);

  // Also protect browser BACK when dirty (BrowserRouter-safe)
  useEffect(() => {
    // Push a dummy state so the first "Back" triggers popstate inside the app
    window.history.pushState({ __aura_guard: true }, "", window.location.href);

    const onPopState = () => {
      if (!isDirty) return;

      const ok = window.confirm("You have unsaved changes. Leave without saving?");
      if (!ok) {
        // Re-push state to prevent leaving
        window.history.pushState({ __aura_guard: true }, "", window.location.href);
      }
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [isDirty]);

  // ----------------------------
  // SAVE PROJECT
  // ----------------------------
  const handleSaveProject = async () => {
    try {
      await db.presets.create({
        name: projectName,
        description: "Created in AuraEditor",
        color: "linear-gradient(135deg, #0f172a, #10b981)",
        layers,
      });

      // Reset baseline = not dirty anymore
      baselineRef.current = snapshot;

      toast.success("Project saved!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to save project.");
    }
  };

  // ----------------------------
  // TRANSPORT HANDLERS
  // ----------------------------
  const handlePlay = async () => {
    if (!player) return;
    await player.playLayers(layers, {
      title: projectName || "Aura Studio",
      artist: "AuraLab",
    });

    // Apply current Studio FX values immediately after starting.
    player.engine?.setReverb?.(reverbWet);
    player.engine?.setDelayWet?.(delayWet);
    player.engine?.setDelayTime?.(delayTime);

    player.updateNowPlaying(
      {
        id: "__studio__",
        name: projectName || "Aura Studio",
        color: "linear-gradient(135deg, #0f172a, #10b981)",
        imageUrl: null,
      },
      {
        title: projectName || "Aura Studio",
        artist: "AuraLab",
      }
    );
    setIsPlaying(true);
  };

  const handlePause = () => {
    if (!player) return;
    player.pause();
    setIsPlaying(false);
  };

  const handleStop = () => {
    if (!player) return;
    player.stop();
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleJumpForward = () => {
    const next = Math.min(duration, currentTime + 10);
    setCurrentTime(next);
    player?.engine?.seek?.(next);
  };

  const handleJumpBackward = () => {
    const next = Math.max(0, currentTime - 10);
    setCurrentTime(next);
    player?.engine?.seek?.(next);
  };

  // ----------------------------
  // LAYER OPS (types aligned with LayerList + SourceControls)
  // ----------------------------
  const addLayer = (type) => {
    const safeType = ["oscillator", "noise", "synth", "ambient"].includes(type)
      ? type
      : "oscillator";

    const newLayer = {
      id: crypto.randomUUID(),
      type: safeType,

      name:
        safeType === "oscillator"
          ? "Frequency"
          : safeType === "noise"
          ? "Noise"
          : safeType === "synth"
          ? "Synth"
          : "Ambient",

      frequency: safeType === "oscillator" ? 432 : safeType === "synth" ? 432 : 0,

      waveform:
        safeType === "oscillator"
          ? "sine"
          : safeType === "noise"
          ? "white"
          : safeType === "synth"
          ? "analog"
          : "ocean_soft",

      volume: 0.5,
      pan: 0,
      enabled: true,

      pulseRate: 0,
      pulseDepth: 0,
      phaseShift: 0,

      // Filter default ON for everything except oscillator
      filterEnabled: safeType !== "oscillator",
      filter: { type: "lowpass", frequency: 20000, Q: 1 },
    };

    setLayers((prev) => {
      const next = [...prev, newLayer];
      if (isPlaying) scheduleLiveUpdate(next);
      return next;
    });
    setSelectedLayerId(newLayer.id);
  };

  const updateLayer = (id, updates) => {
    setLayers((prev) => {
      const next = prev.map((layer) => (layer.id === id ? { ...layer, ...updates } : layer));
      if (isPlaying) scheduleLiveUpdate(next);
      return next;
    });
  };

  const deleteLayer = (id) => {
    setLayers((prev) => {
      const next = prev.filter((l) => l.id !== id);
      if (isPlaying) scheduleLiveUpdate(next);
      return next;
    });
    if (selectedLayerId === id) setSelectedLayerId(null);
  };

  const selectedLayer = layers.find((l) => l.id === selectedLayerId) || null;

  // ----------------------------
  // EXPORT WAV
  // ----------------------------
  const handleExportWAV = async () => {
    if (!player?.engine) return;

    // The current engine does not yet implement an offline renderer for all
    // layer types (ambient buffers, synth graphs, FX). Avoid a runtime crash.
    if (typeof player.engine.render !== "function") {
      toast.error("Export is not enabled yet in this build.");
      return;
    }

    try {
      toast("Rendering audio…");
      const blob = await player.engine.render(layers, duration);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${projectName.replace(/\s+/g, "_")}.wav`;
      a.click();
      toast.success("Exported WAV successfully!");
    } catch (e) {
      console.error(e);
      toast.error("Export failed.");
    }
  };

  // ----------------------------
  // RENDER
  // ----------------------------
  return (
    <div className="h-[calc(100vh-4rem)] w-full flex flex-col bg-[#080808]">
      {/* MOBILE PORTRAIT ROTATION PROMPT */}
      <RotatePrompt />

      {/* TOP BAR */}
      <div className="h-14 flex items-center justify-between border-b border-white/10 px-5 bg-[#0a0a0a]">
        <div className="flex items-center gap-3">
          <Input
            className="w-52 h-9 bg-white/5 border-white/10 text-sm"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleExportWAV}
            variant="outline"
            size="sm"
            className="gap-2 border-white/10 text-gray-400 hover:text-white"
          >
            <Download className="w-4 h-4" />
            Export WAV
          </Button>

          <Button
            onClick={handleSaveProject}
            className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-black"
            size="sm"
          >
            <Save className="w-4 h-4" />
            Save Project
          </Button>
        </div>
      </div>

      {/* BODY */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT SIDEBAR */}
        <LayerList
          layers={layers}
          selectedLayerId={selectedLayerId}
          onSelectLayer={setSelectedLayerId}
          onAddLayer={addLayer}
          onUpdateLayer={updateLayer}
          onDeleteLayer={deleteLayer}
        />

        {/* CENTER TIMELINE */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <TransportBar
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            onPlay={handlePlay}
            onPause={handlePause}
            onStop={handleStop}
            onJumpForward={handleJumpForward}
            onJumpBackward={handleJumpBackward}
          />

          <div className="flex-1 min-h-0">
            <Timeline
              layers={layers}
              currentTime={currentTime}
              duration={duration}
              isPlaying={isPlaying}
            />
          </div>
        </div>

        {/* EFFECTS PANEL */}
        <EffectsPanel
          selectedLayer={selectedLayer}
          onUpdateLayer={(updates) => {
            if (!selectedLayer) return;
            updateLayer(selectedLayer.id, updates);
          }}
          reverbWet={reverbWet}
          delayWet={delayWet}
          delayTime={delayTime}
          onReverbChange={(v) => {
            setReverbWet(v);
            player?.engine?.setReverb?.(v);
          }}
          onDelayChange={(v) => {
            setDelayWet(v);
            player?.engine?.setDelayWet?.(v);
          }}
          onDelayTime={(v) => {
            setDelayTime(v);
            player?.engine?.setDelayTime?.(v);
          }}
        />
      </div>
    </div>
  );
}
