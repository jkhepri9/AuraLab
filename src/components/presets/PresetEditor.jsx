// src/components/presets/PresetEditor.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Play,
  Square,
  ArrowLeft,
  Monitor,
  Save,
  Clock,
  EyeOff,
} from "lucide-react";
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

// Session timer (free editor)
const SESSION_TIMER_KEY = "auralab_session_timer_minutes_v1";
const SESSION_TIMER_OPTIONS = [0, 2, 5, 10, 15, 30, 45, 60, 90]; // 0 = Off

function readSessionTimerMinutes() {
  try {
    const raw = localStorage.getItem(SESSION_TIMER_KEY);
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

function writeSessionTimerMinutes(n) {
  try {
    localStorage.setItem(SESSION_TIMER_KEY, String(n));
  } catch {}
}

function formatMMSS(totalSeconds) {
  const s = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  const pad = (x) => String(x).padStart(2, "0");
  return `${pad(mm)}:${pad(ss)}`;
}

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
    .filter(
      (l) =>
        (l?.type === "oscillator" || l?.type === "frequency") &&
        (l?.enabled ?? true)
    )
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

  const [intensity, setIntensity] = useState(() => {
    const v = Number(initialPreset?.intensity);
    return Number.isFinite(v) ? Math.max(1, Math.min(5, Math.round(v))) : 3;
  });

  // Image-only view: hide all editor controls so the user can just see the artwork.
  // Tap/click anywhere to restore controls.
  const [uiHidden, setUiHidden] = useState(false);

  const binauralAuto = useMemo(() => detectBinaural(layers), [layers]);

  // Keep existing metadata values (UI sections removed, but we preserve data on save)
  const collection = useMemo(
    () => initialPreset?.collection || "Custom",
    [initialPreset]
  );

  const headphonesRecommended = useMemo(() => {
    if (typeof initialPreset?.headphonesRecommended === "boolean") {
      return initialPreset.headphonesRecommended;
    }
    return binauralAuto;
  }, [initialPreset, binauralAuto]);

  const durationHint = useMemo(() => {
    const d = String(initialPreset?.durationHint || "").trim();
    return d || defaultDurationForGoals(goals);
  }, [initialPreset, goals]);

  // -----------------------------
  // SESSION TIMER (stops audio)
  // -----------------------------
  const [sessionTimerMinutes, setSessionTimerMinutes] = useState(() => {
    const saved = readSessionTimerMinutes();
    if (saved != null) return saved;
    return 0; // default Off
  });

  const [timerEndsAt, setTimerEndsAt] = useState(null); // ms timestamp
  const [timeLeftSec, setTimeLeftSec] = useState(null);

  const timerTimeoutRef = useRef(null);
  const timerIntervalRef = useRef(null);

  const clearSessionTimer = () => {
    if (timerTimeoutRef.current) {
      clearTimeout(timerTimeoutRef.current);
      timerTimeoutRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setTimerEndsAt(null);
    setTimeLeftSec(null);
  };

  const startSessionTimer = (minutes) => {
    const mins = Number(minutes || 0);
    if (!Number.isFinite(mins) || mins <= 0) {
      clearSessionTimer();
      return;
    }

    clearSessionTimer();

    const endTs = Date.now() + mins * 60 * 1000;
    setTimerEndsAt(endTs);

    const tick = () => {
      const left = Math.max(0, Math.ceil((endTs - Date.now()) / 1000));
      setTimeLeftSec(left);
      if (left <= 0) setTimeLeftSec(0);
    };

    tick();
    timerIntervalRef.current = setInterval(tick, 1000);

    timerTimeoutRef.current = setTimeout(() => {
      try {
        player.stop();
      } catch {
        // ignore
      } finally {
        clearSessionTimer();
      }
    }, mins * 60 * 1000);
  };

  // Persist timer choice
  useEffect(() => {
    if (!SESSION_TIMER_OPTIONS.includes(sessionTimerMinutes)) return;
    writeSessionTimerMinutes(sessionTimerMinutes);
  }, [sessionTimerMinutes]);

  // Reset state when preset changes
  useEffect(() => {
    const hydrated = hydrateLayersFromPreset(initialPreset);
    setLayers(hydrated);
    setUiHidden(false);

    setGoals(Array.isArray(initialPreset?.goals) ? uniq(initialPreset.goals) : []);

    const v = Number(initialPreset?.intensity);
    setIntensity(Number.isFinite(v) ? Math.max(1, Math.min(5, Math.round(v))) : 3);

    // Clear any timer when switching presets (prevents “carryover” across different preview sessions)
    clearSessionTimer();

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

  // Start/stop the session timer based on playback state + user setting.
  useEffect(() => {
    if (!isPlaying) {
      clearSessionTimer();
      return;
    }
    if (sessionTimerMinutes > 0) {
      startSessionTimer(sessionTimerMinutes);
    } else {
      clearSessionTimer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, sessionTimerMinutes]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearSessionTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // ---------------------------------------------------------------------------
  // ✅ CONSISTENT LAYER TITLES (display only)
  // ---------------------------------------------------------------------------
  const formatHzText = (hz) => {
    const n = Number(hz);
    if (!Number.isFinite(n)) return "";
    const rounded = Math.round(n);
    const display = Math.abs(n - rounded) < 0.01 ? rounded : n;
    return `${display} Hz`;
  };

  const stripHzFromName = (s) => {
    const raw = String(s || "").trim();
    if (!raw) return "";
    // Remove trailing " (123 Hz)" or " - 123 Hz" or " — 123 Hz"
    return raw
      .replace(/\s*[\(\[\{]?\s*\d+(?:\.\d+)?\s*hz\s*[\)\]\}]?\s*$/i, "")
      .replace(/\s*[-—,:]\s*$/i, "")
      .trim();
  };

  const layerTitleLabel = (layer) => {
    if (!layer) return "Layer";

    const type = String(layer?.type || "").toLowerCase();
    const wf = String(layer?.waveform || "").toLowerCase();

    const baseFromName = stripHzFromName(layer?.name);

    const pan = typeof layer.pan === "number" && !Number.isNaN(layer.pan) ? layer.pan : 0;
    const isHardLeft = pan <= -0.75;
    const isHardRight = pan >= 0.75;

    const hzText = (() => {
      const hz =
        typeof layer.frequency === "number" && !Number.isNaN(layer.frequency)
          ? layer.frequency
          : null;
      if (hz == null) return "";
      if (hz <= 0) return "";
      return formatHzText(hz);
    })();

    if (type === "ambient") {
      const base = baseFromName || getAmbientLabel(layer.waveform) || "Ambient";
      return base;
    }

    if (type === "noise" || type === "color") {
      const base =
        baseFromName ||
        (wf === "brown"
          ? "Brown Noise"
          : wf === "pink"
          ? "Pink Noise"
          : wf === "white"
          ? "White Noise"
          : wf
          ? `${wf.charAt(0).toUpperCase() + wf.slice(1)} Noise`
          : "Noise");
      return base;
    }

    if (type === "synth") {
  // If the name is just the old generic synth labels, prefer showing the actual type: "Synth".
  // If the user gave a truly custom name, keep it.
  const normalized = String(baseFromName || "").trim().toLowerCase();
  const isGeneric =
    !normalized ||
    normalized === "atmospheric drone" ||
    normalized === "sub foundation" ||
    normalized === "synth" ||
    normalized.startsWith("synth:");

  // ✅ Pan labeling: if hard-left / hard-right, show Synth L / Synth R (only for generic synth labels)
  const pan = typeof layer?.pan === "number" ? layer.pan : 0;
  const synthBase =
    isGeneric && pan <= -0.98 ? "Synth L" : isGeneric && pan >= 0.98 ? "Synth R" : "Synth";

  const base = isGeneric ? synthBase : baseFromName;

  return hzText ? `${base} — ${hzText}` : base;
}

    if (type === "oscillator" || type === "frequency") {
      const base =
        baseFromName ||
        (isHardLeft
          ? "Binaural Left"
          : isHardRight
          ? "Binaural Right"
          : (() => {
              const wave = wf ? wf.charAt(0).toUpperCase() + wf.slice(1) : "Sine";
              return `${wave} Tone`;
            })());

      return hzText ? `${base} — ${hzText}` : base;
    }

    return baseFromName || layerRightLabel(layer) || "Layer";
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
      ...(initialPreset || {}),
      name,
      color,
      layers,
      collection: collection || "Custom",
      goals: uniq(goals),
      intensity: Math.max(1, Math.min(5, Math.round(Number(intensity) || 3))),
      durationHint: String(durationHint || "").trim() || defaultDurationForGoals(goals),
      headphonesRecommended: Boolean(headphonesRecommended),
    };

    onSave(data);
  };

  // ------------------------------------------------------------
  // FIX: Push the entire editor down so it clears the global nav.
  // ------------------------------------------------------------
  const TOP_NAV_OFFSET_PX = 72; // adjust if needed

  // ------------------------------------------------------------
  // ✅ NEW: Bottom nav clearance so floating controls are not blocked on mobile.
  // If your bottom nav is taller/shorter, adjust this number only.
  // ------------------------------------------------------------
  const BOTTOM_NAV_OFFSET_PX = 84;

  // ------------------------------------------------------------
  // UX POLISH:
  // - At top: only the header back button is visible.
  // - After scroll: show the sticky back button.
  // ------------------------------------------------------------
  const [showStickyBack, setShowStickyBack] = useState(false);
  const showStickyBackRef = useRef(false);

  const handleScroll = (e) => {
    const y = e?.currentTarget?.scrollTop ?? 0;
    const next = y > 8;
    if (next !== showStickyBackRef.current) {
      showStickyBackRef.current = next;
      setShowStickyBack(next);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] w-screen h-screen overflow-hidden bg-black">
      {!uiHidden ? (
        <RotatePrompt
          title="Rotate your device"
          message="For the best experience in Preset Editor on mobile, rotate to landscape."
        />
      ) : null}

      {backgroundUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${backgroundUrl})` }}
        />
      )}

      {/* IMAGE-ONLY VIEW OVERLAY (tap anywhere to restore controls) */}
      {uiHidden ? (
        <div
          className="absolute inset-0 z-[190]"
          role="button"
          tabIndex={0}
          aria-label="Show controls"
          onClick={() => setUiHidden(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setUiHidden(false);
            }
          }}
        />
      ) : null}

      {/* FLOATING VIEW BUTTON (BOTTOM-RIGHT, clears bottom nav, safe-area aware) */}
      {!uiHidden ? (
        <div
          className="fixed right-4 z-[210]"
          style={{
            bottom: `calc(1rem + env(safe-area-inset-bottom) + ${BOTTOM_NAV_OFFSET_PX}px)`,
          }}
        >
          <Button
            onClick={() => setUiHidden(true)}
            className="bg-black/70 hover:bg-black/80 text-white border border-white/15 whitespace-nowrap backdrop-blur-md shadow-lg"
            title="View image only"
          >
            <EyeOff className="w-4 h-4 mr-2" /> View
          </Button>
        </div>
      ) : null}

      {!uiHidden ? (
        <>
          {/* STICKY BACK BUTTON (appears only after user scrolls down) */}
          <AnimatePresence>
            {showStickyBack ? (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="fixed left-4 z-[200]"
                style={{
                  top: `calc(${TOP_NAV_OFFSET_PX}px + 1rem + env(safe-area-inset-top))`,
                }}
              >
                <Button
                  onClick={() => onCancel?.()}
                  className="bg-black/70 hover:bg-black/80 text-white border border-white/15 whitespace-nowrap backdrop-blur-md shadow-lg"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" /> Back
                </Button>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {/* CONTENT (entire page pushed down; header is NOT sticky) */}
          <div
            onScroll={handleScroll}
            className="relative z-10 h-full overflow-y-auto space-y-6 pb-[calc(12rem+env(safe-area-inset-bottom))]"
            style={{
              paddingTop: `calc(${TOP_NAV_OFFSET_PX}px + env(safe-area-inset-top))`,
            }}
          >
            {/* NORMAL HEADER (not sticky) */}
            <div className="px-4">
              <div className="rounded-2xl border border-white/10 bg-black/25 backdrop-blur-md shadow-xl">
                <div className="p-3 md:p-4 flex flex-col md:flex-row items-start md:items-center gap-4">
                  {/* HEADER BACK BUTTON (works at top of page) */}
                  <div className="shrink-0 w-full md:w-[110px] flex items-center">
                    <Button
                      onClick={() => onCancel?.()}
                      className="bg-black/70 hover:bg-black/80 text-white border border-white/15 whitespace-nowrap backdrop-blur-md shadow-lg"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                  </div>

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
                            state: {
                              preset: {
                                ...(initialPreset || {}),
                                name,
                                color,
                                layers,
                                id: initialPreset?.id,
                              },
                            },
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

            {/* DISCOVER SETTINGS */}
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

                {/* Controls */}
                <div className="mt-4 grid grid-cols-1 gap-3">
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
                </div>
              </div>
            </div>

            {/* Session Timer */}
            <div className="px-4">
              <div className="rounded-2xl border border-white/10 bg-black/35 backdrop-blur-md shadow-xl p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-sm font-extrabold text-white tracking-wide flex items-center gap-2">
                      <Clock className="w-4 h-4 text-white/80" />
                      Session Timer
                    </div>
                    <div className="text-xs text-white/70">
                      Stops playback automatically when the timer ends.
                    </div>
                  </div>

                  {isPlaying && timerEndsAt && typeof timeLeftSec === "number" ? (
                    <div className="shrink-0 text-right">
                      <div className="text-[11px] text-white/60">Ends in</div>
                      <div className="text-sm font-extrabold text-white font-mono tabular-nums">
                        {formatMMSS(timeLeftSec)}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {SESSION_TIMER_OPTIONS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setSessionTimerMinutes(m)}
                      className={pill(sessionTimerMinutes === m)}
                      title={m === 0 ? "No auto-stop" : `Stop after ${m} minutes`}
                    >
                      {m === 0 ? "Off" : `${m}m`}
                    </button>
                  ))}
                </div>

                <div className="mt-2 text-[11px] text-white/60">
                  Your choice is remembered on this device.
                </div>
              </div>
            </div>

            {/* LAYERS */}
            <div className="px-4 grid gap-4">
              <AnimatePresence>
                {layers.map((layer) => (
                  <motion.div
                    key={layer.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-transparent border border-white/10 p-4 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.25)]"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        <span className="text-sm md:text-base font-extrabold text-white truncate drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)]">
                          {layerTitleLabel(layer)}
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
        </>
      ) : null}
    </div>
  );
}
