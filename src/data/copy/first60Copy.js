// src/data/copy/first60Copy.js
// AuraLab — First 60 Seconds UX Copy (Instant → Explore → Studio)
// Keep onboarding + minimal-player copy centralized here.

export const AURALAB_MODES = {
  instant: {
    id: "instant",
    name: "Instant",
    short: "One tap. No setup.",
    description:
      "Start a session instantly. No layers, no jargon—just a clean, guided experience.",
  },
  explore: {
    id: "explore",
    name: "Explore",
    short: "Guided control.",
    description:
      "Inspect what’s playing and shape the feel with safe controls (Depth, Warmth, Clarity, Motion).",
  },
  studio: {
    id: "studio",
    name: "Studio",
    short: "Full engine.",
    description:
      "Full layer control: oscillator/noise/ambient/synth, exact Hz, routing, saving, and presets.",
  },
};

// Intent → preset mapping (must match IDs in your presets library)
export const INTENT_PRESET_MAP = {
  sleep: "m_deep_sleep",
  focus: "m_focus_forge",
  calm: "c_stress_relief",
  energy: "m_energy_ignition",
  reset: "m_heart_coherence",
};

export const FIRST60_COPY = {
  splash: {
    brand: "AuraLab",
    tagline: "Sound therapy. No talking. Just results.",
    subtagline: "One tap to align your state.",
  },

  intent: {
    title: "What do you want right now?",
    subtitle: "Choose a state. Audio starts immediately.",
    options: [
      { key: "sleep", label: "Sleep", hint: "Downshift and shut off mental noise." },
      { key: "focus", label: "Focus", hint: "Clean attention for work and creation." },
      { key: "calm", label: "Calm", hint: "Ease tension and steady the nervous system." },
      { key: "energy", label: "Energy", hint: "Wake up the system without chaos." },
      { key: "reset", label: "Reset", hint: "Recenter and return to coherence." },
    ],
    footerNote: "Tip: Headphones can deepen certain sessions.",
  },

  headphones: {
    title: "Headphones recommended",
    subtitle: "For full separation and depth. Speaker mode still works.",
    primaryCta: "Continue",
    secondaryCta: "Use speaker mode",
    note: "You can change this anytime in session settings.",
  },

  volume: {
    title: "Set a comfortable volume",
    subtitle: "Start low. Raise slowly.",
    primaryCta: "Start session",
    note:
      "AuraLab is a wellness sound-experience tool. It is not a medical device. If you have a health concern, consult a qualified professional.",
  },

  player: {
    nowPlaying: "Now Playing",
    modeChip: "Instant",
    controls: {
      play: "Play",
      pause: "Pause",
      stop: "Stop",
    },
    timer: {
      label: "Timer",
      options: [
        { minutes: 5, label: "5" },
        { minutes: 15, label: "15" },
        { minutes: 30, label: "30" },
        { minutes: 60, label: "60" },
      ],
      customLabel: "Custom",
      offLabel: "Off",
    },
    intensity: {
      label: "Intensity",
      helper: "Safe power control (no clipping).",
      low: "Low",
      high: "High",
    },
    tuneButton: "Tune",
    minimizeHint: "Keep this playing while you move around the app.",
    browseCta: "Browse the app",
  },

  tune: {
    title: "Tune the feel",
    subtitle: "Simple shaping. No technical terms.",
    controls: [
      { key: "warmth", label: "Warmth", hint: "Softer, rounder tone." },
      { key: "clarity", label: "Clarity", hint: "Sharper, cleaner definition." },
    ],
    advancedTeaser: {
      label: "More control",
      hint: "Unlock Explore to shape Depth and Motion, and save sessions.",
    },
    doneCta: "Done",
  },

  proGate: {
    badge: "Pro",
    title: "Unlock Explore + Studio",
    subtitle: "Fine-tune, save, and build your own sound rituals.",
    bullets: [
      "Explore controls: Depth, Warmth, Clarity, Motion",
      "Save favorites + custom sessions",
      "Studio: full layers, exact Hz, routing, and presets",
      "Unlimited session length",
    ],
    priceLine: "$8/month • Cancel anytime",
    primaryCta: "Go Pro",
    secondaryCta: "Not now",
    smallPrint: "Instant mode stays available without Pro.",
  },

  ui: {
    back: "Back",
    continue: "Continue",
    close: "Close",
    skip: "Skip",
    gotIt: "Got it",
    learnMore: "Learn more",
    headphonesOn: "Headphones",
    speakerMode: "Speaker mode",
  },

  messages: {
    startFail: "Session couldn’t start. Try again.",
    audioContextBlocked: "Tap once to enable audio playback.",
    checkoutFail: "Checkout failed. Please try again.",
    signInNeeded: "Sign in is required to attach Pro to your account.",
    sessionEnded: "Session ended.",
  },

  aria: {
    openTune: "Open Tune controls",
    closeTune: "Close Tune controls",
    playPause: "Toggle play and pause",
    stop: "Stop playback",
    setTimer: "Set session timer",
    setIntensity: "Adjust intensity",
    chooseIntent: "Choose a session intent",
  },
};
