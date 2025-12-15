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
  // EXPORT (WAV)
  // ----------------------------
  const [exportOpen, setExportOpen] = useState(false);
  const [exportMinutes, setExportMinutes] = useState(10);
  const [exporting, setExporting] = useState(false);

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
    // After mount + any restore state updates have applied, set the baseline once.
    // We allow a microtask to avoid capturing intermediate state.
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

  const duplicateLayer = (layerId) => {
    if (!layerId) return;

    setLayers((prev) => {
      const idx = prev.findIndex((l) => l?.id === layerId);
      if (idx === -1) return prev;

      const original = prev[idx];

      // Deep clone: structuredClone if available, otherwise JSON fallback.
      let copy;
      try {
        copy = typeof structuredClone === "function"
          ? structuredClone(original)
          : JSON.parse(JSON.stringify(original));
      } catch {
        copy = { ...original };
      }

      copy.id = crypto.randomUUID();

      const baseName =
        (original?.name && String(original.name).trim()) ||
        (original?.type === "ambient"
          ? "Ambient"
          : original?.type === "noise"
          ? "Noise"
          : original?.type === "synth"
          ? "Synth"
          : "Frequency");

      copy.name = `${baseName} Copy`;

      const next = [...prev];
      next.splice(idx + 1, 0, copy);

      // Select the duplicated layer immediately.
      setSelectedLayerId(copy.id);

      // If currently playing, apply live update so audio reflects the new layer set.
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
  const openExport = () => setExportOpen(true);

  const doExport = async (minutes) => {
    if (!player?.engine) return;

    const secs = Math.max(60, Math.min(20 * 60, Number(minutes) * 60 || 10 * 60));

    if (typeof player.engine.renderWav !== "function") {
      toast.error("Export engine is missing (renderWav). Apply patch v9 AudioEngine.js.");
      return;
    }

    try {
      setExporting(true);
      toast("Rendering WAV… (this can take a bit)");

      const blob = await player.engine.renderWav(layers, secs, {
        reverbWet,
        delayWet,
        delayTime,
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safe = (projectName || "Aura_Studio").replace(/\s+/g, "_");
      a.download = `${safe}_${Math.round(secs / 60)}min.wav`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast.success("Exported WAV successfully!");
    } catch (e) {
      console.error(e);
      toast.error("Export failed.");
    } finally {
      setExporting(false);
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
            onClick={openExport}
            variant="outline"
            size="sm"
            className="gap-2 border-white/10 text-gray-400 hover:text-white"
            disabled={exporting}
          >
            <Download className="w-4 h-4" />
            {exporting ? "Exporting…" : "Export WAV"}
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
          onDuplicateLayer={duplicateLayer}
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

      {/* EXPORT MODAL */}
      {exportOpen ? (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          onMouseDown={() => {
            if (!exporting) setExportOpen(false);
          }}
        >
          <div
            className="w-[92vw] max-w-md rounded-xl border border-white/10 bg-[#0a0a0a] shadow-xl p-4"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-white">Export WAV</div>
                <div className="text-xs text-white/55 mt-1">
                  Choose a length to render. This exports the current Studio mix (layers + FX).
                </div>
              </div>
              <button
                type="button"
                className="text-white/50 hover:text-white/80"
                onClick={() => {
                  if (!exporting) setExportOpen(false);
                }}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              {[5, 10, 15, 20].map((m) => (
                <button
                  key={m}
                  type="button"
                  disabled={exporting}
                  onClick={() => setExportMinutes(m)}
                  className={
                    "h-10 rounded-lg border text-sm transition " +
                    (exportMinutes === m
                      ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-200"
                      : "border-white/10 bg-white/5 text-white/75 hover:bg-white/10")
                  }
                >
                  {m} minutes
                </button>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                className="border-white/10 text-white/70 hover:text-white"
                disabled={exporting}
                onClick={() => setExportOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="bg-emerald-500 hover:bg-emerald-600 text-black"
                disabled={exporting}
                onClick={async () => {
                  setExportOpen(false);
                  await doExport(exportMinutes);
                }}
              >
                Export {exportMinutes} min
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
