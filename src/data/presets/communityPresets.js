// src/data/presets/communityPresets.js
// Community presets — AuraLab AudioEngine (oscillator/noise/synth/ambient)

export const communityPresets = [
  {
    id: "c_lucid_dreaming",
    name: "Lucid Dreaming",
    color: "linear-gradient(135deg, #0b1026, #1c2e5c)",
    imageUrl:
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=2400&auto=format&fit=crop",
    description: "Supports vivid dreams and lucidity using gentle theta-style entrainment.",
    layers: [
      { id: "ld_l", name: "Binaural L (200 Hz)", type: "oscillator", frequency: 200, volume: 0.14, pan: -1, waveform: "sine", enabled: true },
      { id: "ld_r", name: "Binaural R (206 Hz)", type: "oscillator", frequency: 206, volume: 0.14, pan: 1, waveform: "sine", enabled: true },
      { id: "ld_pink", name: "Pink Noise", type: "noise", frequency: 0, volume: 0.12, pan: 0, waveform: "pink", enabled: true },
      { id: "ld_crickets", name: "Crickets (Lake)", type: "ambient", frequency: 0, volume: 0.18, pan: 0, waveform: "crickets_lake", enabled: true },
      { id: "ld_432", name: "Harmonic (432 Hz)", type: "oscillator", frequency: 432, volume: 0.03, pan: 0, waveform: "sine", enabled: true },
    ],
    order: 100,
  },

  {
    id: "c_stress_relief",
    name: "Stress Relief",
    color: "linear-gradient(135deg, #071a14, #0b3a2a)",
    imageUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=2400&auto=format&fit=crop",
    description: "Helps calm the nervous system and reduce stress for relaxed focus.",
    layers: [
      { id: "sr_l", name: "Binaural L (200 Hz)", type: "oscillator", frequency: 200, volume: 0.13, pan: -1, waveform: "sine", enabled: true },
      { id: "sr_r", name: "Binaural R (210 Hz)", type: "oscillator", frequency: 210, volume: 0.13, pan: 1, waveform: "sine", enabled: true },
      { id: "sr_brown", name: "Brown Noise", type: "noise", frequency: 0, volume: 0.10, pan: 0, waveform: "brown", enabled: true },
      { id: "sr_rain", name: "Rain (Light)", type: "ambient", frequency: 0, volume: 0.20, pan: 0, waveform: "rain_light", enabled: true },
      { id: "sr_110", name: "Anchor (110 Hz)", type: "oscillator", frequency: 110, volume: 0.03, pan: 0, waveform: "sine", enabled: true },
    ],
    order: 101,
  },

  {
    id: "c_pain_relief",
    name: "Pain Relief",
    color: "linear-gradient(135deg, #120b18, #2a1b3a)",
    imageUrl:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2400&auto=format&fit=crop",
    description: "Promotes deep relaxation to help reduce tension and discomfort perception.",
    layers: [
      { id: "pr_l", name: "Binaural L (200 Hz)", type: "oscillator", frequency: 200, volume: 0.12, pan: -1, waveform: "sine", enabled: true },
      { id: "pr_r", name: "Binaural R (204 Hz)", type: "oscillator", frequency: 204, volume: 0.12, pan: 1, waveform: "sine", enabled: true },
      { id: "pr_pink", name: "Pink Noise", type: "noise", frequency: 0, volume: 0.10, pan: 0, waveform: "pink", enabled: true },
      { id: "pr_ocean", name: "Ocean (Deep)", type: "ambient", frequency: 0, volume: 0.18, pan: 0, waveform: "ocean_deep", enabled: true },
      { id: "pr_55", name: "Sub (55 Hz)", type: "oscillator", frequency: 55, volume: 0.03, pan: 0, waveform: "sine", enabled: true },
    ],
    order: 102,
  },

  {
    id: "c_stargate",
    name: "Stargate",
    color: "linear-gradient(135deg, #06071a, #2b0b3a)",
    imageUrl:
      "https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?q=80&w=2400&auto=format&fit=crop",
    description: "Energizes attention and clarity with a bright, high-focus entrainment profile.",
    layers: [
      { id: "sg_l", name: "Binaural L (400 Hz)", type: "oscillator", frequency: 400, volume: 0.10, pan: -1, waveform: "sine", enabled: true },
      { id: "sg_r", name: "Binaural R (440 Hz)", type: "oscillator", frequency: 440, volume: 0.10, pan: 1, waveform: "sine", enabled: true },
      { id: "sg_cosmic", name: "Cosmic Noise", type: "noise", frequency: 0, volume: 0.10, pan: 0, waveform: "cosmic", enabled: true },
      { id: "sg_wind", name: "Wind (Forest)", type: "ambient", frequency: 0, volume: 0.12, pan: 0, waveform: "wind_forest", enabled: true },
      { id: "sg_synth", name: "Wavetable Layer", type: "synth", frequency: 111, volume: 0.06, pan: 0, waveform: "wavetable", enabled: true },
    ],
    order: 103,
  },

  {
    id: "c_golden_ratio",
    name: "Golden Ratio",
    color: "linear-gradient(135deg, #0b1a12, #2a5a3a)",
    imageUrl:
      "https://images.unsplash.com/photo-1547926179-883a93c78096?q=80&w=2400&auto=format&fit=crop",
    description: "Supports calm coherence and creative flow using phi/Fibonacci-inspired harmonics.",
    layers: [
      { id: "gr_161", name: "Phi Center (161.8 Hz)", type: "oscillator", frequency: 161.8, volume: 0.08, pan: 0, waveform: "sine", enabled: true },
      { id: "gr_89", name: "Fibonacci (89 Hz)", type: "oscillator", frequency: 89, volume: 0.05, pan: -0.15, waveform: "sine", enabled: true },
      { id: "gr_144", name: "Fibonacci (144 Hz)", type: "oscillator", frequency: 144, volume: 0.05, pan: 0.15, waveform: "sine", enabled: true },
      { id: "gr_233", name: "Fibonacci (233 Hz)", type: "oscillator", frequency: 233, volume: 0.04, pan: 0, waveform: "sine", enabled: true },
      { id: "gr_river", name: "River (Soft)", type: "ambient", frequency: 0, volume: 0.16, pan: 0, waveform: "river_soft", enabled: true },
      { id: "gr_synth", name: "Analog Layer", type: "synth", frequency: 161.8, volume: 0.06, pan: 0, waveform: "analog", enabled: true },
    ],
    order: 104,
  },

  {
    id: "c_third_eye",
    name: "Third Eye",
    color: "linear-gradient(135deg, #120a2a, #183a6a)",
    imageUrl:
      "https://images.unsplash.com/photo-1519682577862-22b62b24e493?q=80&w=2400&auto=format&fit=crop",
    description: "Supports meditative focus and inner visualization with theta-style entrainment.",
    layers: [
      { id: "te_l", name: "Binaural L (210 Hz)", type: "oscillator", frequency: 210, volume: 0.12, pan: -1, waveform: "sine", enabled: true },
      { id: "te_r", name: "Binaural R (217 Hz)", type: "oscillator", frequency: 217, volume: 0.12, pan: 1, waveform: "sine", enabled: true },
      { id: "te_violet", name: "Violet Noise", type: "noise", frequency: 0, volume: 0.06, pan: 0, waveform: "violet", enabled: true },
      { id: "te_852", name: "Overtone (852 Hz)", type: "oscillator", frequency: 852, volume: 0.02, pan: 0, waveform: "sine", enabled: true },
      { id: "te_thunder", name: "Thunder (Distant)", type: "ambient", frequency: 0, volume: 0.14, pan: 0, waveform: "thunder_distant", enabled: true },
    ],
    order: 105,
  },

  {
    id: "c_genius_mode",
    name: "Genius Mode",
    color: "linear-gradient(135deg, #041329, #0a3a5a)",
    imageUrl:
      "https://images.unsplash.com/photo-1526378722484-bd91ca387e72?q=80&w=2400&auto=format&fit=crop",
    description: "Boosts concentration and task-drive using a crisp beta-style entrainment bed.",
    layers: [
      { id: "gm_l", name: "Binaural L (200 Hz)", type: "oscillator", frequency: 200, volume: 0.10, pan: -1, waveform: "sine", enabled: true },
      { id: "gm_r", name: "Binaural R (218 Hz)", type: "oscillator", frequency: 218, volume: 0.10, pan: 1, waveform: "sine", enabled: true },
      { id: "gm_gray", name: "Gray Noise", type: "noise", frequency: 0, volume: 0.09, pan: 0, waveform: "gray", enabled: true },
      { id: "gm_synth", name: "FM Detail Layer", type: "synth", frequency: 528, volume: 0.04, pan: 0, waveform: "fm", enabled: true },
      { id: "gm_wind", name: "Wind (Soft)", type: "ambient", frequency: 0, volume: 0.10, pan: 0, waveform: "wind_soft", enabled: true },
    ],
    order: 106,
  },

  {
    id: "c_master_musician",
    name: "Master Musician",
    color: "linear-gradient(135deg, #1a0a00, #5a1a00)",
    imageUrl:
      "https://images.unsplash.com/photo-1546410531-d8527a051d95?q=80&w=2400&auto=format&fit=crop",
    description: "Supports musical flow-state, timing, and relaxed precision for practice sessions.",
    layers: [
      { id: "mm_l", name: "Binaural L (220 Hz)", type: "oscillator", frequency: 220, volume: 0.10, pan: -1, waveform: "sine", enabled: true },
      { id: "mm_r", name: "Binaural R (232 Hz)", type: "oscillator", frequency: 232, volume: 0.10, pan: 1, waveform: "sine", enabled: true },
      { id: "mm_432", name: "Anchor (432 Hz)", type: "oscillator", frequency: 432, volume: 0.04, pan: -0.1, waveform: "sine", enabled: true },
      { id: "mm_528", name: "Anchor (528 Hz)", type: "oscillator", frequency: 528, volume: 0.03, pan: 0.1, waveform: "sine", enabled: true },
      { id: "mm_birds", name: "Birds (Park)", type: "ambient", frequency: 0, volume: 0.14, pan: 0, waveform: "birds_park", enabled: true },
    ],
    order: 107,
  },

  {
    id: "c_wealth_abundance",
    name: "Wealth & Abundance",
    color: "linear-gradient(135deg, #1a1200, #5a4a00)",
    imageUrl:
      "https://images.unsplash.com/photo-1516627145497-ae6968895b74?q=80&w=2400&auto=format&fit=crop",
    description: "Supports calm confidence and long-horizon thinking for disciplined abundance.",
    layers: [
      { id: "wa_l", name: "Binaural L (200 Hz)", type: "oscillator", frequency: 200, volume: 0.11, pan: -1, waveform: "sine", enabled: true },
      { id: "wa_r", name: "Binaural R (208 Hz)", type: "oscillator", frequency: 208, volume: 0.11, pan: 1, waveform: "sine", enabled: true },
      { id: "wa_gold", name: "Gold Noise", type: "noise", frequency: 0, volume: 0.08, pan: 0, waveform: "gold", enabled: true },
      { id: "wa_fire", name: "Fire (Camp)", type: "ambient", frequency: 0, volume: 0.14, pan: 0, waveform: "fire_camp", enabled: true },
      { id: "wa_639", name: "Anchor (639 Hz)", type: "oscillator", frequency: 639, volume: 0.02, pan: 0, waveform: "sine", enabled: true },
    ],
    order: 108,
  },

  {
    id: "c_earth_frequency",
    name: "Earth Frequency",
    color: "linear-gradient(135deg, #07130a, #1f3a20)",
    imageUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=2400&auto=format&fit=crop",
    description: "Promotes grounding and steady calm using a Schumann-style binaural profile.",
    layers: [
      { id: "ef_l", name: "Binaural L (200 Hz)", type: "oscillator", frequency: 200, volume: 0.12, pan: -1, waveform: "sine", enabled: true },
      { id: "ef_r", name: "Binaural R (207.83 Hz)", type: "oscillator", frequency: 207.83, volume: 0.12, pan: 1, waveform: "sine", enabled: true },
      { id: "ef_brown", name: "Brown Noise", type: "noise", frequency: 0, volume: 0.10, pan: 0, waveform: "brown", enabled: true },
      { id: "ef_river", name: "River (Rapids)", type: "ambient", frequency: 0, volume: 0.14, pan: 0, waveform: "river_rapids", enabled: true },
      { id: "ef_55", name: "Sub (55 Hz)", type: "oscillator", frequency: 55, volume: 0.03, pan: 0, waveform: "sine", enabled: true },
    ],
    order: 109,
  },
];

export default communityPresets;
