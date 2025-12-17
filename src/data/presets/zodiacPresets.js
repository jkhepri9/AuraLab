// src/data/presets/zodiacPresets.js
// Zodiac presets — AuraLab AudioEngine (oscillator/noise/synth/ambient)
//
// Design rules (per your spec):
// - Every preset includes:
//   1) Sub-foundation (30–120 Hz) oscillator
//   2) Binaural beat oscillator pair (L/R with a chosen beat offset)
//   3) Two noise layers: one low-pitched (brown/pink) + one high-pitched (white/violet)
//   4) Shield overtone / anchor oscillator (e.g., 852/963/741/396 family)
//   5) Multiple ambient sounds (2+), plus a Motion Drift ambient layer
//
// Notes:
// - Headphones recommended for binaural layers.
// - Volumes are conservative to avoid clipping on stacked presets.

export const zodiacPresets = [
  // ------------------------------------------------------------
  // ARIES — Fire / Mars (drive, ignition, action)
  // ------------------------------------------------------------
  {
    id: "z_aries",
    name: "Aries",
    symbol: "♈",
    color: "linear-gradient(135deg, #2a0f00, #7a1b00)",
    imageUrl: "/modeimages/aries.png",
    description: "Ignition and forward motion. Built to feel bold, sharp, and action-ready.",

    goals: ["energy", "focus"],
    scenarios: ["morning", "execution", "confidence"],
    styles: ["binaural", "noise", "nature"],
    intensity: 5,
    headphonesRecommended: true,
    durationHint: "15m",
    collection: "Zodiac",
    tags: ["aries", "fire", "drive", "mars", "ignite"],

    layers: [
      { id: "ar_sub", name: "Sub Foundation (80 Hz)", type: "oscillator", frequency: 80, volume: 0.2, pan: 0, waveform: "sine", enabled: true },

      // Binaural: 16 Hz (low-beta / action edge)
      { id: "ar_l", name: "Binaural L (220 Hz)", type: "oscillator", frequency: 205, volume: 0.11, pan: -1, waveform: "sine", enabled: true },
      { id: "ar_r", name: "Binaural R (236 Hz)", type: "oscillator", frequency: 235, volume: 0.11, pan: 1, waveform: "sine", enabled: true },

      // Low + high noise
      { id: "ar_brown", name: "Brown Noise (Ground Bed)", type: "noise", frequency: 0, volume: 0.05, pan: 0, waveform: "brown", enabled: true },
      { id: "ar_white", name: "White Noise (Spark)", type: "noise", frequency: 0, volume: 0.05, pan: 0, waveform: "white", enabled: true },

      // Shield / anchor
      { id: "ar_852", name: "Shield Anchor (852 Hz)", type: "oscillator", frequency: 852, volume: 0.02, pan: 0, waveform: "sine", enabled: true },

      // Multiple ambients
      { id: "ar_fire", name: "Ambient: Fire (Camp)", type: "ambient", frequency: 0, volume: 0.60, pan: 0, waveform: "fire_camp", enabled: true },
      { id: "ar_wind", name: "Ambient: Wind (Soft)", type: "ambient", frequency: 0, volume: 0.22, pan: 0, waveform: "wind_soft", enabled: true },
      { id: "z_aries_motion_amb", name: "Motion Drift: Wind (Forest)", type: "ambient", frequency: 0, volume: 0.08, pan: 0, waveform: "wind_forest", enabled: true, filterEnabled: true, filter: { type: "lowpass", frequency: 16000, Q: 0.7 } },
    ],
    order: 200,
  },

  // ------------------------------------------------------------
  // TAURUS — Earth / Venus (comfort, sensuality, stability)
  // ------------------------------------------------------------
  {
    id: "z_taurus",
    name: "Taurus",
    symbol: "♉",
    color: "linear-gradient(135deg, #0b1a12, #2a5a3a)",
    imageUrl: "/modeimages/taurus.png",
    description: "Warm stability and grounded comfort. Built to feel slow, safe, and steady.",

    goals: ["calm", "recovery"],
    scenarios: ["wind-down", "grounding", "body-relax"],
    styles: ["binaural", "noise", "nature"],
    intensity: 2,
    headphonesRecommended: true,
    durationHint: "30m",
    collection: "Zodiac",
    tags: ["taurus", "earth", "venus", "comfort", "ground"],

    layers: [
      { id: "ta_sub", name: "Sub Foundation (65 Hz)", type: "oscillator", frequency: 65, volume: 0.15, pan: 0, waveform: "sine", enabled: true },

      // Binaural: 6 Hz (theta calm / body release)
      { id: "ta_l", name: "Binaural L (174 Hz)", type: "oscillator", frequency: 170, volume: 0.11, pan: -1, waveform: "sine", enabled: true },
      { id: "ta_r", name: "Binaural R (180 Hz)", type: "oscillator", frequency: 180, volume: 0.11, pan: 1, waveform: "sine", enabled: true },

      { id: "ta_pink", name: "Pink Noise (Warm Blanket)", type: "noise", frequency: 0, volume: 0.06, pan: 0, waveform: "pink", enabled: true },
      { id: "ta_violet", name: "Violet Noise (Soft Air)", type: "noise", frequency: 0, volume: 0.03, pan: 0, waveform: "violet", enabled: true },

      { id: "ta_396", name: "Shield Anchor (396 Hz)", type: "oscillator", frequency: 396, volume: 0.02, pan: 0, waveform: "sine", enabled: true },

      { id: "ta_river", name: "Ambient: River (Soft)", type: "ambient", frequency: 0, volume: 0.40, pan: 0, waveform: "river_soft", enabled: true },
      { id: "ta_birds", name: "Ambient: Birds (Park)", type: "ambient", frequency: 0, volume: 0.22, pan: 0, waveform: "birds_park", enabled: true },
      { id: "z_taurus_motion_amb", name: "Motion Drift: Wind (Soft)", type: "ambient", frequency: 0, volume: 0.08, pan: 0, waveform: "wind_soft", enabled: true, filterEnabled: true, filter: { type: "lowpass", frequency: 16000, Q: 0.7 } },
    ],
    order: 201,
  },

  // ------------------------------------------------------------
  // GEMINI — Air / Mercury (agility, curiosity, mental speed)
  // ------------------------------------------------------------
  {
    id: "z_gemini",
    name: "Gemini",
    symbol: "♊",
    color: "linear-gradient(135deg, #041329, #0a3a5a)",
    imageUrl: "/modeimages/gemini.png",
    description: "Fast clarity and adaptive cognition. Built for learning, agility, and ideas.",

    goals: ["focus"],
    scenarios: ["study", "learning", "brainstorm"],
    styles: ["binaural", "noise", "nature"],
    intensity: 4,
    headphonesRecommended: true,
    durationHint: "30m",
    collection: "Zodiac",
    tags: ["gemini", "air", "mercury", "clarity", "ideas"],

    layers: [
      { id: "ge_sub", name: "Sub Foundation (70 Hz)", type: "oscillator", frequency: 70, volume: 0.15, pan: 0, waveform: "sine", enabled: true },

      // Binaural: 12 Hz (focused alpha / learning-ready)
      { id: "ge_l", name: "Binaural L (240 Hz)", type: "oscillator", frequency: 238, volume: 0.10, pan: -1, waveform: "sine", enabled: true },
      { id: "ge_r", name: "Binaural R (252 Hz)", type: "oscillator", frequency: 252, volume: 0.10, pan: 1, waveform: "sine", enabled: true },

      { id: "ge_brown", name: "Brown Noise (Low Bed)", type: "noise", frequency: 0, volume: 0.04, pan: 0, waveform: "brown", enabled: true },
      { id: "ge_white", name: "White Noise (Bright Air)", type: "noise", frequency: 0, volume: 0.05, pan: 0, waveform: "white", enabled: true },

      { id: "ge_741", name: "Shield Anchor (741 Hz)", type: "oscillator", frequency: 741, volume: 0.02, pan: 0, waveform: "sine", enabled: true },

      { id: "ge_wind", name: "Ambient: Wind (Forest)", type: "ambient", frequency: 0, volume: 0.18, pan: 0, waveform: "wind_forest", enabled: true },
      { id: "ge_crickets", name: "Ambient: Crickets (Lake)", type: "ambient", frequency: 0, volume: 0.18, pan: 0, waveform: "crickets_lake", enabled: true },
      { id: "z_gemini_motion_amb", name: "Motion Drift: Wind (Soft)", type: "ambient", frequency: 0, volume: 0.09, pan: 0, waveform: "wind_soft", enabled: true, filterEnabled: true, filter: { type: "lowpass", frequency: 16000, Q: 0.7 } },
    ],
    order: 202,
  },

  // ------------------------------------------------------------
  // CANCER — Water / Moon (nurture, safety, emotional settling)
  // ------------------------------------------------------------
  {
    id: "z_cancer",
    name: "Cancer",
    symbol: "♋",
    color: "linear-gradient(135deg, #0b1220, #1b2a4a)",
    imageUrl: "/modeimages/cancer.png",
    description: "Soft nervous-system settling and emotional safety. Built for nurture and restoration.",

    goals: ["calm", "sleep"],
    scenarios: ["night", "wind-down", "comfort"],
    styles: ["binaural", "noise", "nature"],
    intensity: 1,
    headphonesRecommended: true,
    durationHint: "60m",
    collection: "Zodiac",
    tags: ["cancer", "water", "moon", "comfort", "sleep"],

    layers: [
      { id: "ca_sub", name: "Sub Foundation (65 Hz)", type: "oscillator", frequency: 65, volume: 0.15, pan: 0, waveform: "sine", enabled: true },

      // Binaural: 4 Hz (theta / emotional settling)
      { id: "ca_l", name: "Binaural L (220 Hz)", type: "oscillator", frequency: 220, volume: 0.11, pan: -1, waveform: "sine", enabled: true },
      { id: "ca_r", name: "Binaural R (224 Hz)", type: "oscillator", frequency: 224, volume: 0.11, pan: 1, waveform: "sine", enabled: true },

      { id: "ca_pink", name: "Pink Noise (Warm Bed)", type: "noise", frequency: 0, volume: 0.06, pan: 0, waveform: "pink", enabled: true },
      { id: "ca_violet", name: "Violet Noise (Soft Mist)", type: "noise", frequency: 0, volume: 0.025, pan: 0, waveform: "violet", enabled: true },

      { id: "ca_852", name: "Shield Anchor (852 Hz)", type: "oscillator", frequency: 852, volume: 0.015, pan: 0, waveform: "sine", enabled: true },

      { id: "ca_ocean", name: "Ambient: Ocean (Deep)", type: "ambient", frequency: 0, volume: 0.28, pan: 0, waveform: "ocean_deep", enabled: true },
      { id: "ca_rain", name: "Ambient: Rain (Light)", type: "ambient", frequency: 0, volume: 0.24, pan: 0, waveform: "rain_light", enabled: true },
      { id: "z_cancer_motion_amb", name: "Motion Drift: Wind (Soft)", type: "ambient", frequency: 0, volume: 0.08, pan: 0, waveform: "wind_soft", enabled: true, filterEnabled: true, filter: { type: "lowpass", frequency: 16000, Q: 0.7 } },
    ],
    order: 203,
  },

  // ------------------------------------------------------------
  // LEO — Fire / Sun (radiance, confidence, heart-forward power)
  // ------------------------------------------------------------
  {
    id: "z_leo",
    name: "Leo",
    symbol: "♌",
    color: "linear-gradient(135deg, #1a1200, #7a4a00)",
    imageUrl: "/modeimages/leo.png",
    description: "Radiant confidence and heart-forward power. Built to feel bright, warm, and commanding.",

    goals: ["energy", "confidence"],
    scenarios: ["performance", "confidence", "execution"],
    styles: ["binaural", "noise", "nature"],
    intensity: 5,
    headphonesRecommended: true,
    durationHint: "15m",
    collection: "Zodiac",
    tags: ["leo", "fire", "sun", "confidence", "radiance"],

    layers: [
      { id: "le_sub", name: "Sub Foundation (85 Hz)", type: "oscillator", frequency: 85, volume: 0.15, pan: 0, waveform: "sine", enabled: true },

      // Binaural: 18 Hz (high beta / “spotlight” energy)
      { id: "le_l", name: "Binaural L (260 Hz)", type: "oscillator", frequency: 180, volume: 0.11, pan: -1, waveform: "sine", enabled: true },
      { id: "le_r", name: "Binaural R (278 Hz)", type: "oscillator", frequency: 220, volume: 0.11, pan: 1, waveform: "sine", enabled: true },

      { id: "le_brown", name: "Brown Noise (Warm Low Bed)", type: "noise", frequency: 0, volume: 0.04, pan: 0, waveform: "brown", enabled: true },
      { id: "le_white", name: "White Noise (Radiance)", type: "noise", frequency: 0, volume: 0.05, pan: 0, waveform: "white", enabled: true },

      { id: "le_963", name: "Crown Shield (963 Hz)", type: "oscillator", frequency: 963, volume: 0.02, pan: 0, waveform: "sine", enabled: true },

      { id: "le_fire", name: "Ambient: Fire (Camp)", type: "ambient", frequency: 0, volume: 0.45, pan: 0, waveform: "fire_camp", enabled: true },
      { id: "le_birds", name: "Ambient: Birds (Park)", type: "ambient", frequency: 0, volume: 0.20, pan: 0, waveform: "birds_park", enabled: true },
      { id: "z_leo_motion_amb", name: "Motion Drift: Wind (Forest)", type: "ambient", frequency: 0, volume: 0.09, pan: 0, waveform: "wind_forest", enabled: true, filterEnabled: true, filter: { type: "lowpass", frequency: 16000, Q: 0.7 } },
    ],
    order: 204,
  },

  // ------------------------------------------------------------
  // VIRGO — Earth / Mercury (precision, hygiene, refinement)
  // ------------------------------------------------------------
  {
    id: "z_virgo",
    name: "Virgo",
    symbol: "♍",
    color: "linear-gradient(135deg, #052225, #0b3b3a)",
    imageUrl: "/modeimages/virgo.png",
    description: "Refined focus and clean cognitive hygiene. Built for detail, discipline, and precision.",

    goals: ["focus"],
    scenarios: ["deep-work", "study", "clean-up"],
    styles: ["binaural", "noise", "nature"],
    intensity: 4,
    headphonesRecommended: true,
    durationHint: "30m",
    collection: "Zodiac",
    tags: ["virgo", "earth", "mercury", "precision", "clarity"],

    layers: [
      { id: "vi_sub", name: "Sub Foundation (60 Hz)", type: "oscillator", frequency: 60, volume: 0.12, pan: 0, waveform: "sine", enabled: true },

      // Binaural: 14 Hz (focused beta, not too aggressive)
      { id: "vi_l", name: "Binaural L (240 Hz)", type: "oscillator", frequency: 240, volume: 0.10, pan: -1, waveform: "sine", enabled: true },
      { id: "vi_r", name: "Binaural R (254 Hz)", type: "oscillator", frequency: 255, volume: 0.10, pan: 1, waveform: "sine", enabled: true },

      { id: "vi_pink", name: "Pink Noise (Soft Bed)", type: "noise", frequency: 0, volume: 0.04, pan: 0, waveform: "pink", enabled: true },
      { id: "vi_violet", name: "Violet Noise (Detail Air)", type: "noise", frequency: 0, volume: 0.04, pan: 0, waveform: "violet", enabled: true },

      { id: "vi_741", name: "Clarity Shield (741 Hz)", type: "oscillator", frequency: 741, volume: 0.02, pan: 0, waveform: "sine", enabled: true },

      { id: "vi_river", name: "Ambient: River (Rapids)", type: "ambient", frequency: 0, volume: 0.20, pan: 0, waveform: "river_rapids", enabled: true },
      { id: "vi_wind", name: "Ambient: Wind (Forest)", type: "ambient", frequency: 0, volume: 0.18, pan: 0, waveform: "wind_forest", enabled: true },
      { id: "z_virgo_motion_amb", name: "Motion Drift: Wind (Soft)", type: "ambient", frequency: 0, volume: 0.08, pan: 0, waveform: "wind_soft", enabled: true, filterEnabled: true, filter: { type: "lowpass", frequency: 16000, Q: 0.7 } },
    ],
    order: 205,
  },

  // ------------------------------------------------------------
  // LIBRA — Air / Venus (balance, harmony, social smoothness)
  // ------------------------------------------------------------
  {
    id: "z_libra",
    name: "Libra",
    symbol: "♎",
    color: "linear-gradient(135deg, #1a0b12, #5a1b3a)",
    imageUrl: "/modeimages/libra.png",
    description: "Balance and graceful coherence. Built for harmony, social ease, and emotional poise.",

    goals: ["calm", "meditate"],
    scenarios: ["reset", "social", "coherence"],
    styles: ["binaural", "noise", "nature"],
    intensity: 3,
    headphonesRecommended: true,
    durationHint: "30m",
    collection: "Zodiac",
    tags: ["libra", "air", "venus", "balance", "harmony"],

    layers: [
      { id: "li_sub", name: "Sub Foundation (80 Hz)", type: "oscillator", frequency: 80, volume: 0.20, pan: 0, waveform: "sine", enabled: true },

      // Binaural: 10 Hz (alpha harmony / coherence)
      { id: "li_l", name: "Binaural L (518 Hz)", type: "oscillator", frequency: 524, volume: 0.11, pan: -1, waveform: "sine", enabled: true },
      { id: "li_r", name: "Binaural R (538 Hz)", type: "oscillator", frequency: 532, volume: 0.11, pan: 1, waveform: "sine", enabled: true },

      { id: "li_pink", name: "Pink Noise (Soft Warmth)", type: "noise", frequency: 0, volume: 0.08, pan: 0, waveform: "pink", enabled: true },
      { id: "li_white", name: "White Noise (Light Air)", type: "noise", frequency: 0, volume: 0.04, pan: 0, waveform: "white", enabled: true },

      { id: "li_639", name: "Harmony Shield (639 Hz)", type: "oscillator", frequency: 639, volume: 0.03, pan: 0, waveform: "sine", enabled: true },

      { id: "li_birds", name: "Ambient: Birds (Park)", type: "ambient", frequency: 0, volume: 0.22, pan: 0, waveform: "birds_park", enabled: true },
      { id: "li_river", name: "Ambient: River (Soft)", type: "ambient", frequency: 0, volume: 0.40, pan: 0, waveform: "river_soft", enabled: true },
      { id: "z_libra_motion_amb", name: "Motion Drift: Wind (Soft)", type: "ambient", frequency: 0, volume: 0.08, pan: 0, waveform: "wind_soft", enabled: true, filterEnabled: true, filter: { type: "lowpass", frequency: 16000, Q: 0.7 } },
    ],
    order: 206,
  },

  // ------------------------------------------------------------
  // SCORPIO — Water / Mars+Pluto (depth, intensity, transformation)
  // ------------------------------------------------------------
  {
    id: "z_scorpio",
    name: "Scorpio",
    symbol: "♏",
    color: "linear-gradient(135deg, #120b18, #2a1b3a)",
    imageUrl: "/modeimages/scorpio.png",
    description: "Deep focus and transformational intensity. Built to feel magnetic, inward, and powerful.",

    goals: ["focus", "recovery"],
    scenarios: ["deep-work", "shadow-work", "reset"],
    styles: ["binaural", "noise", "nature"],
    intensity: 4,
    headphonesRecommended: true,
    durationHint: "30m",
    collection: "Zodiac",
    tags: ["scorpio", "water", "pluto", "depth", "transform"],

    layers: [
      { id: "sc_sub", name: "Sub Foundation (60 Hz)", type: "oscillator", frequency: 60, volume: 0.11, pan: 0, waveform: "sine", enabled: true },

      // Binaural: 7 Hz (theta depth / inward attention)
      { id: "scor_l", name: "Binaural L (396 Hz)", type: "oscillator", frequency: 185, volume: 0.10, pan: -1, waveform: "sine", enabled: true },
      { id: "scor_r", name: "Binaural R (403 Hz)", type: "oscillator", frequency: 200, volume: 0.10, pan: 1, waveform: "sine", enabled: true },

      { id: "scor_brown", name: "Brown Noise (Depth Bed)", type: "noise", frequency: 0, volume: 0.06, pan: 0, waveform: "brown", enabled: true },
      { id: "scor_violet", name: "Violet Noise (Edge Detail)", type: "noise", frequency: 0, volume: 0.03, pan: 0, waveform: "violet", enabled: true },

      { id: "scor_963", name: "Crown Shield (963 Hz)", type: "oscillator", frequency: 963, volume: 0.018, pan: 0, waveform: "sine", enabled: true },

      { id: "scor_thunder", name: "Ambient: Thunder (Rolling)", type: "ambient", frequency: 0, volume: 0.22, pan: 0, waveform: "thunder_rolling", enabled: true },
      { id: "scor_ocean", name: "Ambient: Ocean (Deep)", type: "ambient", frequency: 0, volume: 0.18, pan: 0, waveform: "ocean_deep", enabled: true },
      { id: "z_scorpio_motion_amb", name: "Motion Drift: Wind (Forest)", type: "ambient", frequency: 0, volume: 0.08, pan: 0, waveform: "wind_forest", enabled: true, filterEnabled: true, filter: { type: "lowpass", frequency: 16000, Q: 0.7 } },
    ],
    order: 207,
  },

  // ------------------------------------------------------------
  // SAGITTARIUS — Fire / Jupiter (expansion, optimism, questing)
  // ------------------------------------------------------------
  {
    id: "z_sagittarius",
    name: "Sagittarius",
    symbol: "♐",
    color: "linear-gradient(135deg, #06071a, #2b0b3a)",
    imageUrl: "/modeimages/sagittarius.png",
    description: "Expansive momentum and optimistic clarity. Built for big vision and forward exploration.",

    goals: ["energy", "focus"],
    scenarios: ["planning", "creative", "execution"],
    styles: ["binaural", "noise", "nature"],
    intensity: 5,
    headphonesRecommended: true,
    durationHint: "15m",
    collection: "Zodiac",
    tags: ["sagittarius", "fire", "jupiter", "expansion", "vision"],

    layers: [
      { id: "sa_sub", name: "Sub Foundation (75 Hz)", type: "oscillator", frequency: 75, volume: 0.12, pan: 0, waveform: "sine", enabled: true },

      // Binaural: 15 Hz (motivated focus / expedition)
      { id: "sa_l", name: "Binaural L (432 Hz)", type: "oscillator", frequency: 422, volume: 0.10, pan: -1, waveform: "sine", enabled: true },
      { id: "sa_r", name: "Binaural R (447 Hz)", type: "oscillator", frequency: 442, volume: 0.10, pan: 1, waveform: "sine", enabled: true },

      { id: "sa_brown", name: "Brown Noise (Warm Low Bed)", type: "noise", frequency: 0, volume: 0.04, pan: 0, waveform: "brown", enabled: true },
      { id: "sa_white", name: "White Noise (Bright Horizon)", type: "noise", frequency: 0, volume: 0.05, pan: 0, waveform: "white", enabled: true },

      { id: "sa_852", name: "Shield Anchor (852 Hz)", type: "oscillator", frequency: 852, volume: 0.018, pan: 0, waveform: "sine", enabled: true },

      { id: "sa_wind", name: "Ambient: Wind (Forest)", type: "ambient", frequency: 0, volume: 0.18, pan: 0, waveform: "wind_forest", enabled: true },
      { id: "sa_river", name: "Ambient: River (Rapids)", type: "ambient", frequency: 0, volume: 0.20, pan: 0, waveform: "river_rapids", enabled: true },
      { id: "z_sagittarius_motion_amb", name: "Motion Drift: Wind (Soft)", type: "ambient", frequency: 0, volume: 0.09, pan: 0, waveform: "wind_soft", enabled: true, filterEnabled: true, filter: { type: "lowpass", frequency: 16000, Q: 0.7 } },
    ],
    order: 208,
  },

  // ------------------------------------------------------------
  // CAPRICORN — Earth / Saturn (discipline, structure, endurance)
  // ------------------------------------------------------------
  {
    id: "z_capricorn",
    name: "Capricorn",
    symbol: "♑",
    color: "linear-gradient(135deg, #101a24, #1b2a3a)",
    imageUrl: "/modeimages/capricorn.png",
    description: "Structured endurance and disciplined execution. Built for consistency and long-horizon work.",

    goals: ["focus"],
    scenarios: ["deep-work", "execution", "discipline"],
    styles: ["binaural", "noise", "nature"],
    intensity: 4,
    headphonesRecommended: true,
    durationHint: "30m",
    collection: "Zodiac",
    tags: ["capricorn", "earth", "saturn", "discipline", "structure"],

    layers: [
      { id: "cp_sub", name: "Sub Foundation (80 Hz)", type: "oscillator", frequency: 80, volume: 0.11, pan: 0, waveform: "sine", enabled: true },

      // Binaural: 13 Hz (steady beta / sustained work)
      { id: "cp_l", name: "Binaural L (233 Hz)", type: "oscillator", frequency: 200, volume: 0.10, pan: -1, waveform: "sine", enabled: true },
      { id: "cp_r", name: "Binaural R (246 Hz)", type: "oscillator", frequency: 220, volume: 0.10, pan: 1, waveform: "sine", enabled: true },

      { id: "cp_brown", name: "Brown Noise (Stone Bed)", type: "noise", frequency: 0, volume: 0.05, pan: 0, waveform: "brown", enabled: true },
      { id: "cp_violet", name: "Violet Noise (Fine Detail)", type: "noise", frequency: 0, volume: 0.03, pan: 0, waveform: "violet", enabled: true },

      { id: "cp_741", name: "Shield Anchor (741 Hz)", type: "oscillator", frequency: 741, volume: 0.018, pan: 0, waveform: "sine", enabled: true },

      { id: "cp_rain", name: "Ambient: Rain (Light)", type: "ambient", frequency: 0, volume: 0.18, pan: 0, waveform: "rain_light", enabled: true },
      { id: "cp_fire", name: "Ambient: Fire (Camp)", type: "ambient", frequency: 0, volume: 0.18, pan: 0, waveform: "fire_camp", enabled: true },
      { id: "z_capricorn_motion_amb", name: "Motion Drift: Wind (Forest)", type: "ambient", frequency: 0, volume: 0.08, pan: 0, waveform: "wind_forest", enabled: true, filterEnabled: true, filter: { type: "lowpass", frequency: 16000, Q: 0.7 } },
    ],
    order: 209,
  },

  // ------------------------------------------------------------
  // AQUARIUS — Air / Uranus+Saturn (innovation, futurism, detachment)
  // ------------------------------------------------------------
  {
    id: "z_aquarius",
    name: "Aquarius",
    symbol: "♒",
    color: "linear-gradient(135deg, #0b1026, #1c2e5c)",
    imageUrl: "/modeimages/aquarius.png",
    description: "Futurist clarity and clean innovation. Built for insight, invention, and systems thinking.",

    goals: ["focus", "creative"],
    scenarios: ["brainstorm", "innovation", "systems"],
    styles: ["binaural", "noise", "cosmic", "nature"],
    intensity: 4,
    headphonesRecommended: true,
    durationHint: "30m",
    collection: "Zodiac",
    tags: ["aquarius", "air", "innovation", "future", "insight"],

    layers: [
      { id: "aq_sub", name: "Sub Foundation (65 Hz)", type: "oscillator", frequency: 65, volume: 0.11, pan: 0, waveform: "sine", enabled: true },

      // Binaural: 11 Hz (alpha-to-low-beta insight)
      { id: "aq_l", name: "Binaural L (288 Hz)", type: "oscillator", frequency: 222, volume: 0.10, pan: -1, waveform: "sine", enabled: true },
      { id: "aq_r", name: "Binaural R (299 Hz)", type: "oscillator", frequency: 244, volume: 0.10, pan: 1, waveform: "sine", enabled: true },

      { id: "aq_brown", name: "Brown Noise (Low Stability)", type: "noise", frequency: 0, volume: 0.035, pan: 0, waveform: "brown", enabled: true },
      { id: "aq_violet", name: "Violet Noise (Electric Air)", type: "noise", frequency: 0, volume: 0.05, pan: 0, waveform: "violet", enabled: true },

      { id: "aq_963", name: "Crown Shield (963 Hz)", type: "oscillator", frequency: 963, volume: 0.02, pan: 0, waveform: "sine", enabled: true },

      { id: "aq_wind", name: "Ambient: Wind (Soft)", type: "ambient", frequency: 0, volume: 0.18, pan: 0, waveform: "wind_soft", enabled: true },
      { id: "aq_crickets", name: "Ambient: Crickets (Lake)", type: "ambient", frequency: 0, volume: 0.16, pan: 0, waveform: "crickets_lake", enabled: true },
      { id: "z_aquarius_motion_amb", name: "Motion Drift: Wind (Forest)", type: "ambient", frequency: 0, volume: 0.09, pan: 0, waveform: "wind_forest", enabled: true, filterEnabled: true, filter: { type: "lowpass", frequency: 16000, Q: 0.7 } },
    ],
    order: 210,
  },

  // ------------------------------------------------------------
  // PISCES — Water / Neptune (dream, intuition, dissolve, transcend)
  // ------------------------------------------------------------
  {
    id: "z_pisces",
    name: "Pisces",
    symbol: "♓",
    color: "linear-gradient(135deg, #1a0b2a, #2a1b4a)",
    imageUrl: "/modeimages/pisces.png",
    description: "Dreamy dissolve and intuitive flow. Built for trance, meditation, and gentle transcendence.",

    goals: ["sleep", "meditate"],
    scenarios: ["dreaming", "night", "stillness"],
    styles: ["binaural", "noise", "nature"],
    intensity: 1,
    headphonesRecommended: true,
    durationHint: "60m",
    collection: "Zodiac",
    tags: ["pisces", "water", "neptune", "dream", "intuition"],

    layers: [
      { id: "pi_sub", name: "Sub Foundation (80 Hz)", type: "oscillator", frequency: 80, volume: 0.15, pan: 0, waveform: "sine", enabled: true },

      // Binaural: 3 Hz (delta edge / drifting into sleep)
      { id: "pi_l", name: "Binaural L (200 Hz)", type: "oscillator", frequency: 220, volume: 0.11, pan: -1, waveform: "sine", enabled: true },
      { id: "pi_r", name: "Binaural R (203 Hz)", type: "oscillator", frequency: 228, volume: 0.11, pan: 1, waveform: "sine", enabled: true },

      { id: "pi_pink", name: "Pink Noise (Soft Dream Bed)", type: "noise", frequency: 0, volume: 0.06, pan: 0, waveform: "pink", enabled: true },
      { id: "pi_white", name: "White Noise (Mist)", type: "noise", frequency: 0, volume: 0.02, pan: 0, waveform: "white", enabled: true },

      { id: "pi_852", name: "Shield Anchor (852 Hz)", type: "oscillator", frequency: 852, volume: 0.015, pan: 0, waveform: "sine", enabled: true },

      { id: "pi_ocean", name: "Ambient: Ocean (Deep)", type: "ambient", frequency: 0, volume: 0.22, pan: 0, waveform: "ocean_deep", enabled: true },
      { id: "pi_wind", name: "Ambient: Wind (Soft)", type: "ambient", frequency: 0, volume: 0.20, pan: 0, waveform: "wind_soft", enabled: true },
      { id: "z_pisces_motion_amb", name: "Motion Drift: Wind (Forest)", type: "ambient", frequency: 0, volume: 0.08, pan: 0, waveform: "wind_forest", enabled: true, filterEnabled: true, filter: { type: "lowpass", frequency: 16000, Q: 0.7 } },
    ],
    order: 211,
  },
];

export default zodiacPresets;
