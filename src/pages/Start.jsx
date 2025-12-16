// src/pages/Start.jsx
// AuraLab — First 60 Seconds (Instant Mode)
// Goal: user reaches "audio playing" quickly with zero jargon.

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Brain,
  Flame,
  Headphones,
  HeartPulse,
  Moon,
  Pause,
  Play,
  Settings2,
  Shield,
  Square,
  Timer,
  Volume2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

import { useGlobalPlayer } from "@/audio/GlobalPlayerContext";
import { db } from "@/lib/db";
import { FIRST60_COPY, INTENT_PRESET_MAP } from "../data/copy/first60Copy";

const FIRST_RUN_KEY = "auralab_first_run_v1";
const OUTPUT_GAIN_KEY = "auralab_output_gain_v1"; // persisted effective gain
const TONE_KEY = "auralab_tone_v1"; // persisted {warmth,clarity}

function clamp(n, min, max) {
  const v = typeof n === "number" ? n : Number(n);
  if (Number.isNaN(v)) return min;
  return Math.min(max, Math.max(min, v));
}

function readNum(key, fallback) {
  try {
    const v = Number(localStorage.getItem(key));
    return Number.isNaN(v) ? fallback : v;
  } catch {
    return fallback;
  }
}

function writeNum(key, value) {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // ignore
  }
}

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

// Intensity (0..100) -> output gain (0.15..1.0)
function gainFromIntensity(intensityPct) {
  const x = clamp(intensityPct, 0, 100) / 100;
  return 0.15 + 0.85 * x;
}

function isBinauralPreset(preset) {
  const layers = preset?.layers || [];
  if (!Array.isArray(layers) || layers.length === 0) return false;

  const hasLeft = layers.some((l) => l?.type === "oscillator" && l?.pan === -1);
  const hasRight = layers.some((l) => l?.type === "oscillator" && l?.pan === 1);
  const hasBinauralName = layers.some(
    (l) => typeof l?.name === "string" && l.name.toLowerCase().includes("binaural")
  );

  return (hasLeft && hasRight) || hasBinauralName;
}

export default function Start() {
  const navigate = useNavigate();
  const player = useGlobalPlayer();

  // splash | intent | headphones | volume | session
  const [step, setStep] = useState("splash");

  const [intentKey, setIntentKey] = useState(null);
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [loadingPreset, setLoadingPreset] = useState(false);

  const [speakerMode, setSpeakerMode] = useState(false);

  // Persisted “feel” controls
  const [intensity, setIntensity] = useState(() => {
    const g = clamp(readNum(OUTPUT_GAIN_KEY, 0.85), 0.0, 1.25);
    const pct = clamp(((g - 0.15) / 0.85) * 100, 0, 100);
    return Math.round(pct);
  });

  const [tone, setTone] = useState(() => {
    const t = readJSON(TONE_KEY, { warmth: 0, clarity: 0 });
    return { warmth: clamp(t?.warmth ?? 0, 0, 1), clarity: clamp(t?.clarity ?? 0, 0, 1) };
  });

  const [tuneOpen, setTuneOpen] = useState(false);
  const [timerMin, setTimerMin] = useState(null); // number | null
  const timerRef = useRef(null);

  const cards = useMemo(() => {
    const iconByKey = {
      sleep: Moon,
      focus: Brain,
      calm: Shield,
      energy: Flame,
      reset: HeartPulse,
    };

    return (FIRST60_COPY.intent.options || []).map((o) => ({
      ...o,
      Icon: iconByKey[o.key] || Brain,
    }));
  }, []);

  // Immersive: prevent body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Splash auto-advance
  useEffect(() => {
    if (step !== "splash") return;
    const t = setTimeout(() => setStep("intent"), 900);
    return () => clearTimeout(t);
  }, [step]);

  // Apply + persist output/tone (safe even before audio unlock)
  useEffect(() => {
    const g = gainFromIntensity(intensity);
    writeNum(OUTPUT_GAIN_KEY, g);
    writeJSON(TONE_KEY, tone);

    // Prefer the context wrappers if present, otherwise fall back to engine.
    try {
      if (typeof player.setOutputGain === "function") player.setOutputGain(g);
      else player.engine?.setOutputGain?.(g);

      if (typeof player.setTone === "function") player.setTone(tone);
      else player.engine?.setTone?.(tone);
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intensity, tone]);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const setTimer = (minutes) => {
    clearTimer();
    if (!minutes) {
      setTimerMin(null);
      return;
    }

    setTimerMin(minutes);
    timerRef.current = setTimeout(() => {
      player.stop();
      toast.success(FIRST60_COPY.messages.sessionEnded);
      setStep("intent");
    }, minutes * 60 * 1000);
  };

  useEffect(() => () => clearTimer(), []);

  const pickIntent = async (key) => {
    setIntentKey(key);
    setLoadingPreset(true);
    setSelectedPreset(null);
    setSpeakerMode(false);

    const presetId = INTENT_PRESET_MAP[key];
    if (!presetId) {
      setLoadingPreset(false);
      toast.error("Missing preset mapping for this intent.");
      return;
    }

    try {
      const preset = await db.presets.get(presetId);
      if (!preset) throw new Error("Preset not found");
      setSelectedPreset(preset);

      setStep(isBinauralPreset(preset) ? "headphones" : "volume");
    } catch (e) {
      console.warn("[Start] load preset failed:", e);
      toast.error("Could not load this session. Try again.");
      setStep("intent");
    } finally {
      setLoadingPreset(false);
    }
  };

  const startSession = async () => {
    if (!selectedPreset) return;

    // Gesture unlock (best-effort)
    try {
      player.engine?.unlock?.();
    } catch {
      // ignore
    }

    // Apply current feel settings right before playback.
    try {
      const g = gainFromIntensity(intensity);

      if (typeof player.setOutputGain === "function") player.setOutputGain(g);
      else player.engine?.setOutputGain?.(g);

      if (typeof player.setTone === "function") player.setTone(tone);
      else player.engine?.setTone?.(tone);
    } catch {
      // ignore
    }

    const ok = await player.playPreset(selectedPreset);
    if (!ok) {
      toast.error(FIRST60_COPY.messages.startFail);
      setStep("intent");
      return;
    }

    // ✅ Only mark onboarding complete after audio is confirmed playing.
    try {
      localStorage.setItem(FIRST_RUN_KEY, "1");
    } catch {
      // ignore
    }

    setStep("session");
  };

  const goHome = () => navigate("/", { replace: true });

  const fade = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.22 } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.18 } },
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white w-screen overflow-hidden">
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{ background: "radial-gradient(circle at top, #ffffff33, transparent 70%)" }}
      />

      <div className="relative z-10 max-w-xl mx-auto px-5 pt-6 pb-10">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-white/60 tracking-widest">AURALAB</div>
          {step === "session" ? (
            <Button
              variant="ghost"
              size="icon"
              className="text-white/80 hover:text-white"
              onClick={goHome}
              aria-label="Close"
              title="Close"
            >
              <X className="w-5 h-5" />
            </Button>
          ) : (
            <div className="w-10 h-10" />
          )}
        </div>

        <AnimatePresence mode="wait">
          {step === "splash" && (
            <motion.div key="splash" {...fade} className="text-center pt-12">
              <div className="text-4xl font-extrabold tracking-tight">{FIRST60_COPY.splash.brand}</div>
              <div className="mt-3 text-sm text-white/70">{FIRST60_COPY.splash.tagline}</div>
              <div className="mt-2 text-xs text-white/50">{FIRST60_COPY.splash.subtagline}</div>
            </motion.div>
          )}

          {step === "intent" && (
            <motion.div key="intent" {...fade} className="pt-6">
              <div className="text-2xl font-extrabold">{FIRST60_COPY.intent.title}</div>
              <div className="mt-1 text-sm text-white/70">{FIRST60_COPY.intent.subtitle}</div>

              <div className="mt-6 grid grid-cols-1 gap-3">
                {cards.map(({ key, label, hint, Icon }) => (
                  <button
                    key={key}
                    type="button"
                    disabled={loadingPreset}
                    onClick={() => pickIntent(key)}
                    className="rounded-3xl border border-white/10 bg-white/5 hover:bg-white/10 transition p-5 text-left"
                    aria-label={`${label}: ${hint}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-white/80" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-lg font-extrabold">{label}</div>
                        <div className="text-xs text-white/60">{hint}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-5 text-xs text-white/50">{FIRST60_COPY.intent.footerNote}</div>
            </motion.div>
          )}

          {step === "headphones" && (
            <motion.div key="headphones" {...fade} className="pt-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                  <Headphones className="w-5 h-5 text-white/80" />
                </div>
                <div className="min-w-0">
                  <div className="text-2xl font-extrabold">{FIRST60_COPY.headphones.title}</div>
                  <div className="mt-1 text-sm text-white/70">{FIRST60_COPY.headphones.subtitle}</div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-2">
                <Button
                  className="h-12 rounded-2xl font-extrabold"
                  onClick={() => {
                    setSpeakerMode(false);
                    setStep("volume");
                  }}
                >
                  {FIRST60_COPY.headphones.primaryCta}
                </Button>
                <Button
                  variant="outline"
                  className="h-12 rounded-2xl font-bold"
                  onClick={() => {
                    setSpeakerMode(true);
                    setStep("volume");
                  }}
                >
                  {FIRST60_COPY.headphones.secondaryCta}
                </Button>
              </div>

              <div className="mt-4 text-xs text-white/50">{FIRST60_COPY.headphones.note}</div>
            </motion.div>
          )}

          {step === "volume" && (
            <motion.div key="volume" {...fade} className="pt-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                  <Volume2 className="w-5 h-5 text-white/80" />
                </div>
                <div className="min-w-0">
                  <div className="text-2xl font-extrabold">{FIRST60_COPY.volume.title}</div>
                  <div className="mt-1 text-sm text-white/70">{FIRST60_COPY.volume.subtitle}</div>
                </div>
              </div>

              {selectedPreset && (
                <div className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs text-white/60">{FIRST60_COPY.player.nowPlaying}</div>
                  <div className="mt-1 text-lg font-extrabold">{selectedPreset.name}</div>
                  {speakerMode && (
                    <div className="mt-1 text-xs text-white/50">Speaker mode enabled (headphones off).</div>
                  )}
                </div>
              )}

              {/* ✅ Make the "volume" step real: use Intensity here */}
              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-extrabold">{FIRST60_COPY.player.intensity.label}</div>
                  <div className="text-xs text-white/60">{intensity}%</div>
                </div>
                <div className="mt-3">
                  <Slider
                    value={[intensity]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={(v) => setIntensity(v?.[0] ?? 0)}
                    aria-label={FIRST60_COPY.aria.setIntensity}
                  />
                  <div className="mt-2 flex items-center justify-between text-xs text-white/50">
                    <span>{FIRST60_COPY.player.intensity.low}</span>
                    <span>{FIRST60_COPY.player.intensity.high}</span>
                  </div>
                  <div className="mt-1 text-[11px] text-white/40">{FIRST60_COPY.player.intensity.helper}</div>
                </div>
              </div>

              <div className="mt-6">
                <Button
                  className="h-12 w-full rounded-2xl font-extrabold"
                  onClick={startSession}
                  disabled={!selectedPreset || loadingPreset}
                >
                  {loadingPreset ? "Loading..." : FIRST60_COPY.volume.primaryCta}
                </Button>
              </div>

              <div className="mt-4 text-xs text-white/50">{FIRST60_COPY.volume.note}</div>
            </motion.div>
          )}

          {step === "session" && (
            <motion.div key="session" {...fade} className="pt-4">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs text-white/60">{FIRST60_COPY.player.nowPlaying}</div>
                    <div className="mt-1 text-xl font-extrabold truncate">
                      {player.currentPlayingPreset?.name || selectedPreset?.name || "Session"}
                    </div>
                    <div className="mt-2 inline-flex items-center gap-2 text-xs font-bold text-white/60">
                      <span className="px-2 py-1 rounded-full bg-white/5 border border-white/10">
                        {FIRST60_COPY.player.modeChip}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => player.togglePlayPause()}
                      aria-label={FIRST60_COPY.aria.playPause}
                      title={player.isPlaying ? FIRST60_COPY.player.controls.pause : FIRST60_COPY.player.controls.play}
                      className="text-white/80 hover:text-white hover:bg-white/10"
                    >
                      {player.isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        clearTimer();
                        setTimerMin(null);
                        player.stop();
                        toast.success("Stopped.");
                        setStep("intent");
                      }}
                      aria-label={FIRST60_COPY.aria.stop}
                      title={FIRST60_COPY.player.controls.stop}
                      className="text-white/80 hover:text-white hover:bg-white/10"
                    >
                      <Square className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                <div className="mt-5">
                  <div className="flex items-center gap-2 text-xs font-bold text-white/70">
                    <Timer className="w-4 h-4" />
                    <span>{FIRST60_COPY.player.timer.label}</span>
                    {timerMin ? <span className="text-white/50">({timerMin}m)</span> : <span className="text-white/50">(Off)</span>}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {(FIRST60_COPY.player.timer.options || []).map((o) => (
                      <Button
                        key={o.minutes}
                        variant={timerMin === o.minutes ? "default" : "outline"}
                        className="h-10 rounded-2xl px-4 font-bold"
                        onClick={() => setTimer(o.minutes)}
                      >
                        {o.label}m
                      </Button>
                    ))}
                    <Button
                      variant={!timerMin ? "default" : "outline"}
                      className="h-10 rounded-2xl px-4 font-bold"
                      onClick={() => setTimer(null)}
                    >
                      {FIRST60_COPY.player.timer.offLabel}
                    </Button>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-extrabold">{FIRST60_COPY.player.intensity.label}</div>
                    <div className="text-xs text-white/60">{intensity}%</div>
                  </div>

                  <div className="mt-3">
                    <Slider
                      value={[intensity]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={(v) => setIntensity(v?.[0] ?? 0)}
                      aria-label={FIRST60_COPY.aria.setIntensity}
                    />
                    <div className="mt-2 flex items-center justify-between text-xs text-white/50">
                      <span>{FIRST60_COPY.player.intensity.low}</span>
                      <span>{FIRST60_COPY.player.intensity.high}</span>
                    </div>
                    <div className="mt-1 text-[11px] text-white/40">{FIRST60_COPY.player.intensity.helper}</div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="h-12 rounded-2xl font-bold"
                    onClick={() => setTuneOpen(true)}
                    aria-label={FIRST60_COPY.aria.openTune}
                  >
                    <Settings2 className="w-4 h-4 mr-2" />
                    {FIRST60_COPY.player.tuneButton}
                  </Button>

                  <Button
                    className="h-12 rounded-2xl font-extrabold"
                    onClick={goHome}
                    title={FIRST60_COPY.player.minimizeHint}
                  >
                    {FIRST60_COPY.player.browseCta}
                  </Button>
                </div>
              </div>

              <AnimatePresence>
                {tuneOpen && (
                  <motion.div
                    key="tune"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50"
                  >
                    <button
                      type="button"
                      className="absolute inset-0 bg-black/60"
                      onClick={() => setTuneOpen(false)}
                      aria-label={FIRST60_COPY.aria.closeTune}
                    />

                    <motion.div
                      initial={{ y: 30, opacity: 0 }}
                      animate={{ y: 0, opacity: 1, transition: { duration: 0.2 } }}
                      exit={{ y: 30, opacity: 0, transition: { duration: 0.18 } }}
                      className="absolute left-0 right-0 bottom-0 p-5"
                    >
                      <div className="max-w-xl mx-auto rounded-t-3xl border border-white/10 bg-zinc-900/95 backdrop-blur-md p-5">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-lg font-extrabold">{FIRST60_COPY.tune.title}</div>
                            <div className="text-xs text-white/60">{FIRST60_COPY.tune.subtitle}</div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-white/80 hover:text-white"
                            onClick={() => setTuneOpen(false)}
                            aria-label={FIRST60_COPY.aria.closeTune}
                          >
                            <X className="w-5 h-5" />
                          </Button>
                        </div>

                        <div className="mt-5 space-y-5">
                          <div>
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-extrabold">Warmth</div>
                              <div className="text-xs text-white/60">{Math.round(tone.warmth * 100)}%</div>
                            </div>
                            <div className="mt-3">
                              <Slider
                                value={[Math.round(tone.warmth * 100)]}
                                min={0}
                                max={100}
                                step={1}
                                onValueChange={(v) =>
                                  setTone((t) => ({ ...t, warmth: clamp((v?.[0] ?? 0) / 100, 0, 1) }))
                                }
                              />
                            </div>
                            <div className="mt-1 text-xs text-white/50">Softer, rounder tone.</div>
                          </div>

                          <div>
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-extrabold">Clarity</div>
                              <div className="text-xs text-white/60">{Math.round(tone.clarity * 100)}%</div>
                            </div>
                            <div className="mt-3">
                              <Slider
                                value={[Math.round(tone.clarity * 100)]}
                                min={0}
                                max={100}
                                step={1}
                                onValueChange={(v) =>
                                  setTone((t) => ({ ...t, clarity: clamp((v?.[0] ?? 0) / 100, 0, 1) }))
                                }
                              />
                            </div>
                            <div className="mt-1 text-xs text-white/50">Sharper, cleaner definition.</div>
                          </div>
                        </div>

                        <div className="mt-6">
                          <Button
                            className="h-12 w-full rounded-2xl font-extrabold"
                            onClick={() => setTuneOpen(false)}
                          >
                            {FIRST60_COPY.tune.doneCta}
                          </Button>
                          <div className="mt-2 text-[11px] text-white/40">{FIRST60_COPY.tune.advancedTeaser.hint}</div>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
