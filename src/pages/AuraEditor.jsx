// src/pages/AuraEditor.jsx
// -----------------------------------------------------------------------------
// AURA LAB — AURA STUDIO (AuraEditor)
// - Stable AudioEngine wiring
// - Layer types aligned with LayerList + SourceControls (oscillator/noise/synth/ambient)
// - Unsaved Changes guard WITHOUT react-router useBlocker (BrowserRouter-safe)
//   • refresh/close prompt (beforeunload)
//   • browser back prompt (popstate)
// -----------------------------------------------------------------------------

import React, { useEffect, useMemo, useRef, useState } from "react";

import { createAudioEngine } from "../audio/AudioEngine";
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
  // AUDIO ENGINE
  // ----------------------------
  const audioRef = useRef(null);

  useEffect(() => {
    audioRef.current = createAudioEngine({
      onTick: (time) => setCurrentTime(time),
    });
  }, []);

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
    if (!audioRef.current) return;
    await audioRef.current.play(layers);
    setIsPlaying(true);
  };

  const handlePause = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    setIsPlaying(false);
  };

  const handleStop = () => {
    if (!audioRef.current) return;
    audioRef.current.stop();
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleJumpForward = () => {
    const next = Math.min(duration, currentTime + 10);
    setCurrentTime(next);
    audioRef.current?.seek(next);
  };

  const handleJumpBackward = () => {
    const next = Math.max(0, currentTime - 10);
    setCurrentTime(next);
    audioRef.current?.seek(next);
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

    setLayers((prev) => [...prev, newLayer]);
    setSelectedLayerId(newLayer.id);
  };

  const updateLayer = (id, updates) => {
    setLayers((prev) =>
      prev.map((layer) => (layer.id === id ? { ...layer, ...updates } : layer))
    );
  };

  const deleteLayer = (id) => {
    setLayers((prev) => prev.filter((l) => l.id !== id));
    if (selectedLayerId === id) setSelectedLayerId(null);
  };

  const selectedLayer = layers.find((l) => l.id === selectedLayerId) || null;

  // ----------------------------
  // EXPORT WAV
  // ----------------------------
  const handleExportWAV = async () => {
    if (!audioRef.current) return;

    try {
      toast("Rendering audio…");
      const blob = await audioRef.current.render(layers, duration);
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
            audioRef.current?.setReverb(v);
          }}
          onDelayChange={(v) => {
            setDelayWet(v);
            audioRef.current?.setDelayWet(v);
          }}
          onDelayTime={(v) => {
            setDelayTime(v);
            audioRef.current?.setDelayTime(v);
          }}
        />
      </div>
    </div>
  );
}
