// src/pages/AuraEditor.jsx
// -----------------------------------------------------------------------------
// FINAL ORCHESTRATOR FOR THE AURA EDITOR (FULLY PATCHED VERSION)
// -----------------------------------------------------------------------------

import React, { useEffect, useRef, useState } from "react";

import { createAudioEngine } from "../editor/audio/AudioEngine";
import Timeline from "../editor/timeline/Timeline";
import TransportBar from "../editor/transport/TransportBar";
import LayerList from "../editor/layers/LayerList";
import EffectsPanel from "../editor/effects/EffectsPanel";

import { db } from "../lib/db";

import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Download, Save } from "lucide-react";
import { toast } from "sonner";

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
  const [duration, setDuration] = useState(1200);

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
  // TRANSPORT HANDLERS
  // ----------------------------
  const handlePlay = () => {
    if (!audioRef.current) return;
    audioRef.current.play(layers);
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
  // LAYER OPS
  // ----------------------------
  const addLayer = (type) => {
    const newLayer = {
      id: crypto.randomUUID(),
      type, // raw UI type (frequency / color / synth / ambient)
      name:
        type === "frequency"
          ? "Frequency"
          : type === "color"
          ? "Color Noise"
          : type === "synth"
          ? "Synth"
          : "Ambient",

      frequency: type === "color" ? 0 : 432,
      waveform:
        type === "synth"
          ? "analog"
          : type === "ambient"
          ? "ocean_soft"
          : type === "color"
          ? "white"
          : "sine",

      volume: 0.5,
      pan: 0,
      enabled: true,
      pulseRate: 0,
      pulseDepth: 0,
      phaseShift: 0,
      filterEnabled: type !== "frequency",
      filter: { type: "lowpass", frequency: 20000, Q: 1 },
    };

    setLayers((prev) => [...prev, newLayer]);
    setSelectedLayerId(newLayer.id);
  };

  const updateLayer = (id, updates) => {
    setLayers((prev) =>
      prev.map((layer) =>
        layer.id === id ? { ...layer, ...updates } : layer
      )
    );
  };

  const deleteLayer = (id) => {
    setLayers((prev) => prev.filter((l) => l.id !== id));
    if (selectedLayerId === id) setSelectedLayerId(null);
  };

  const selectedLayer = layers.find((l) => l.id === selectedLayerId);

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
      toast.success("Project saved!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to save project.");
    }
  };

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
          onUpdateLayer={(updates) =>
            selectedLayer && updateLayer(selectedLayer.id, updates)
          }

          /* FX VALUES FROM REACT STATE */
          reverbWet={reverbWet}
          delayWet={delayWet}
          delayTime={delayTime}

          /* FX CALLBACKS (UI → React state → Engine) */
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
