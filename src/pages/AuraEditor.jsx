// src/pages/AuraEditor.jsx
// -----------------------------------------------------------------------------
// AURA LAB — AURA STUDIO (AuraEditor)
// -----------------------------------------------------------------------------
// FIXES IN THIS PATCH (SESSION WORK + STICKY NAV IN Layout.jsx):
// 1) Studio work persists across page navigation within the same app session.
//    - Stored in sessionStorage (clears automatically when the tab/app is closed).
//    - Restored when user returns to Aura Studio.
// 2) Live layer updates remain enabled (volume/filter/pulse update instantly).
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

const STUDIO_SESSION_KEY = "auralab_studio_session_v1";

export default function AuraEditor() {
  const player = useGlobalPlayer();

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
  useEffect(() => {
    if (!player?.engine) return;
    player.engine.onTick = (time) => setCurrentTime(time);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player?.engine]);

  // Keep FX applied live to the running engine.
  useEffect(() => {
    if (!player?.engine) return;
    player.engine.setReverb?.(reverbWet);
    player.engine.setDelayWet?.(delayWet);
    player.engine.setDelayTime?.(delayTime);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player?.engine, reverbWet, delayWet, delayTime]);

  // ---------------------------------------------------------------------------
  // SESSION RESTORE / SAVE (persists until tab/app is closed)
  // ---------------------------------------------------------------------------
  const hydratedRef = useRef(false);

  // Restore once on mount
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;

    try {
      const raw = sessionStorage.getItem(STUDIO_SESSION_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return;

      if (typeof parsed.projectName === "string") setProjectName(parsed.projectName);

      if (Array.isArray(parsed.layers)) setLayers(parsed.layers);

      if (parsed.fx && typeof parsed.fx === "object") {
        if (typeof parsed.fx.reverbWet === "number") setReverbWet(parsed.fx.reverbWet);
        if (typeof parsed.fx.delayWet === "number") setDelayWet(parsed.fx.delayWet);
        if (typeof parsed.fx.delayTime === "number") setDelayTime(parsed.fx.delayTime);
      }

      if (typeof parsed.selectedLayerId === "string") setSelectedLayerId(parsed.selectedLayerId);

      toast.success("Aura Studio session restored.");
    } catch (e) {
      console.warn("[AuraEditor] Failed to restore session:", e);
    }
  }, []);

  // Save continuously (coalesced) while user edits; survives route changes.
  const saveTimerRef = useRef(null);
  useEffect(() => {
    if (!hydratedRef.current) return;

    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);

    saveTimerRef.current = window.setTimeout(() => {
      try {
        const payload = {
          projectName,
          layers,
          selectedLayerId,
          fx: { reverbWet, delayWet, delayTime },
          savedAt: Date.now(),
        };
        sessionStorage.setItem(STUDIO_SESSION_KEY, JSON.stringify(payload));
      } catch (e) {
        console.warn("[AuraEditor] Failed to persist session:", e);
      }
    }, 120); // short debounce for sliders/typing

    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, [projectName, layers, selectedLayerId, reverbWet, delayWet, delayTime]);

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
  // UNSAVED CHANGES (baseline snapshot)
  // NOTE: This is for "leave without saving to DB" prompt; session persists either way.
  // ----------------------------
  const baselineRef = useRef("");
  const readyForDirtyRef = useRef(false);

  const snapshot = useMemo(() => {
    return JSON.stringify({
      projectName,
      layers,
      fx: { reverbWet, delayWet, delayTime },
    });
  }, [projectName, layers, reverbWet, delayWet, delayTime]);

  // Establish baseline after first stable render (including session restore)
  useEffect(() => {
    if (readyForDirtyRef.current) return;
    const id = window.setTimeout(() => {
      baselineRef.current = snapshot;
      readyForDirtyRef.current = true;
    }, 0);

    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isDirty = readyForDirtyRef.current && baselineRef.current !== snapshot;

  useUnsavedChangesGuard(isDirty);

  // Also protect browser BACK when dirty (BrowserRouter-safe)
  useEffect(() => {
    window.history.pushState({ __aura_guard: true }, "", window.location.href);

    const onPopState = () => {
      if (!isDirty) return;

      const ok = window.confirm("You have unsaved changes. Leave without saving?");
      if (!ok) {
        window.history.pushState({ __aura_guard: true }, "", window.location.href);
      }
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [isDirty]);

  // ----------------------------
  // SAVE PROJECT (to DB library)
  // ----------------------------
  const handleSaveProject = async () => {
    try {
      await db.presets.create({
        name: projectName,
        description: "Created in AuraEditor",
        color: "linear-gradient(135deg, #0f172a, #10b981)",
        layers,
      });

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

    // Claim playback so sticky (outside studio) routes back into studio.
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
  // LAYER OPS
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
        <LayerList
          layers={layers}
          selectedLayerId={selectedLayerId}
          onSelectLayer={setSelectedLayerId}
          onAddLayer={addLayer}
          onUpdateLayer={updateLayer}
          onDeleteLayer={deleteLayer}
        />

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
