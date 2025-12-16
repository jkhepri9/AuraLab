// src/data/presets/fanFavoritesPresets.js
// Fan Favorites presets — AuraLab AudioEngine (oscillator/noise/synth/ambient)

// Notes
// - These are culture-forward stacks (Solfeggio + 432/144/7.83 themes) tuned for *focus*.
// - Headphones recommended for binaural layers.

export const fanFavoritesPresets = [
  {
    id: "c_flowstate",
    name: "FlowState",
    color: "linear-gradient(135deg, #0b1026, #1c2e5c)",
    imageUrl:
      "/modeimages/flowstate.jpg",
    description: "Smooth flow focus: relaxed clarity (alpha-to-low-beta) to stay locked-in without tension.",
    layers: [
      { id: "fs_amb", name: "Ambient: River (Soft)", type: "ambient", frequency: 0, volume: 0.40, pan: 0, waveform: "river_soft", enabled: true },

      // ~10 Hz (alpha) on a 432 base
      { id: "fs_l", name: "Binaural L (432 Hz)", type: "oscillator", frequency: 432, volume: 0.11, pan: -1, waveform: "sine", enabled: true },
      { id: "fs_r", name: "Binaural R (442 Hz)", type: "oscillator", frequency: 442, volume: 0.11, pan: 1, waveform: "sine", enabled: true },

      { id: "fs_pink", name: "Pink Noise (Soft Bed)", type: "noise", frequency: 0, volume: 0.05, pan: 0, waveform: "pink", enabled: true },

      { id: "fs_432", name: "Anchor (432 Hz)", type: "oscillator", frequency: 432, volume: 0.015, pan: 0, waveform: "sine", enabled: true },
      { id: "fs_528", name: "Anchor (528 Hz)", type: "oscillator", frequency: 528, volume: 0.012, pan: 0, waveform: "sine", enabled: true },
    ],
    order: 111,
  },

  // NOTE: id is suffixed to avoid colliding with the existing featured Stress Relief preset.
  {
    id: "c_stress_relief_ff",
    name: "StressRelief",
    color: "linear-gradient(135deg, #101a24, #1b2a3a)",
    imageUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=2400&auto=format&fit=crop",
    description: "Calm focus: downshift stress while staying productive and steady.",
    layers: [
      { id: "sr_amb", name: "Ambient: Ocean (Deep)", type: "ambient", frequency: 0, volume: 0.33, pan: 0, waveform: "ocean_deep", enabled: true },

      // ~8 Hz on a 432 base (alpha calm)
      { id: "sr_l", name: "Binaural L (432 Hz)", type: "oscillator", frequency: 432, volume: 0.11, pan: -1, waveform: "sine", enabled: true },
      { id: "sr_r", name: "Binaural R (440 Hz)", type: "oscillator", frequency: 440, volume: 0.11, pan: 1, waveform: "sine", enabled: true },

      { id: "sr_brown", name: "Brown Noise (Ground)", type: "noise", frequency: 0, volume: 0.06, pan: 0, waveform: "brown", enabled: true },

      { id: "sr_396", name: "Release Anchor (396 Hz)", type: "oscillator", frequency: 396, volume: 0.015, pan: 0, waveform: "sine", enabled: true },
      { id: "sr_417", name: "Reset Anchor (417 Hz)", type: "oscillator", frequency: 417, volume: 0.012, pan: 0, waveform: "sine", enabled: true },
    ],
    order: 113,
  },

  {
    id: "c_creative_flow",
    name: "CreativeFlow",
    color: "linear-gradient(135deg, #1a0a00, #5a1a00)",
    imageUrl: "/modeimages/mastermusician.jpg",
    description: "Creative ignition with coherent rhythm—built for ideation, writing, and design flow.",
    layers: [
      { id: "cf_amb", name: "Ambient: Fire (Camp)", type: "ambient", frequency: 0, volume: 0.95, pan: 0, waveform: "fire_camp", enabled: true },

      // ~12 Hz (creative alpha) on 432
      { id: "cf_l", name: "Binaural L (432 Hz)", type: "oscillator", frequency: 432, volume: 0.11, pan: -1, waveform: "sine", enabled: true },
      { id: "cf_r", name: "Binaural R (444 Hz)", type: "oscillator", frequency: 444, volume: 0.11, pan: 1, waveform: "sine", enabled: true },

      { id: "cf_gold", name: "Gold Noise (Warm Bed)", type: "noise", frequency: 0, volume: 0.05, pan: 0, waveform: "gold", enabled: true },

      { id: "cf_528", name: "Anchor (528 Hz)", type: "oscillator", frequency: 528, volume: 0.015, pan: 0, waveform: "sine", enabled: true },
      { id: "cf_639", name: "Harmony Anchor (639 Hz)", type: "oscillator", frequency: 639, volume: 0.012, pan: 0, waveform: "sine", enabled: true },
    ],
    order: 114,
  },

  {
    id: "c_shuman_resonance",
    name: "ShumanResonance",
    color: "linear-gradient(135deg, #07130a, #1f3a20)",
    imageUrl:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Earth_from_Space.jpg?width=2400",
    description: "Grounded focus and steady calm using a Schumann-style 7.83 Hz binaural profile.",
    layers: [
      { id: "sh_amb", name: "Ambient: Wind (Forest)", type: "ambient", frequency: 0, volume: 0.33, pan: 0, waveform: "wind_forest", enabled: true },

      // ~7.83 Hz (Schumann) on a 432 base
      { id: "sh_l", name: "Binaural L (432 Hz)", type: "oscillator", frequency: 432, volume: 0.12, pan: -1, waveform: "sine", enabled: true },
      { id: "sh_r", name: "Binaural R (439.83 Hz)", type: "oscillator", frequency: 439.83, volume: 0.12, pan: 1, waveform: "sine", enabled: true },

      { id: "sh_brown", name: "Brown Noise (Ground Bed)", type: "noise", frequency: 0, volume: 0.06, pan: 0, waveform: "brown", enabled: true },

      // “144 configuration” inclusion
      { id: "sh_144", name: "Anchor (144 Hz)", type: "oscillator", frequency: 144, volume: 0.02, pan: 0, waveform: "sine", enabled: true },
      { id: "sh_432", name: "Stabilizer (432 Hz)", type: "oscillator", frequency: 432, volume: 0.015, pan: 0, waveform: "sine", enabled: true },
    ],
    order: 115,
  },

  {
    id: "c_golden_ratio_focus",
    name: "Golden Ratio Focus",
    color: "linear-gradient(135deg, #0b1a12, #2a5a3a)",
    imageUrl: "/modeimages/goldenratio.png",
    description: "Phi/Fibonacci harmonic stack optimized for focused coherence and steady cognition.",
    layers: [
      { id: "grf_amb", name: "Ambient: River (Soft)", type: "ambient", frequency: 0, volume: 0.44, pan: 0, waveform: "river_soft", enabled: true },

      // ~13 Hz on 432 (focused, coherent)
      { id: "grf_l", name: "Binaural L (432 Hz)", type: "oscillator", frequency: 432, volume: 0.10, pan: -1, waveform: "sine", enabled: true },
      { id: "grf_r", name: "Binaural R (445 Hz)", type: "oscillator", frequency: 445, volume: 0.10, pan: 1, waveform: "sine", enabled: true },

      // Phi/Fibonacci stack
      { id: "grf_161", name: "Phi Center (161.8 Hz)", type: "oscillator", frequency: 161.8, volume: 0.04, pan: 0, waveform: "sine", enabled: true },
      { id: "grf_89", name: "Fibonacci (89 Hz)", type: "oscillator", frequency: 89, volume: 0.03, pan: -0.12, waveform: "sine", enabled: true },
      { id: "grf_144", name: "Fibonacci (144 Hz)", type: "oscillator", frequency: 144, volume: 0.03, pan: 0.12, waveform: "sine", enabled: true },
      { id: "grf_233", name: "Fibonacci (233 Hz)", type: "oscillator", frequency: 233, volume: 0.025, pan: 0, waveform: "sine", enabled: true },

      { id: "grf_432", name: "Stabilizer (432 Hz)", type: "oscillator", frequency: 432, volume: 0.012, pan: 0, waveform: "sine", enabled: true },
    ],
    order: 116,
  },

  {
    id: "c_stargate_aura",
    name: "StargateAura",
    color: "linear-gradient(135deg, #06071a, #2b0b3a)",
    imageUrl:
      "/modeimages/stargateaura.jpg",
    description: "High-energy portal focus. Bright upper harmonics with a sharp attention entrainment bed.",
    layers: [
      { id: "sga_amb", name: "Ambient: Crickets (Lake)", type: "ambient", frequency: 0, volume: 0.27, pan: 0, waveform: "crickets_lake", enabled: true },

      // Bright bed on 963 (culture), small offset for focus edge
      { id: "sga_l", name: "Binaural L (963 Hz)", type: "oscillator", frequency: 963, volume: 0.08, pan: -1, waveform: "sine", enabled: true },
      { id: "sga_r", name: "Binaural R (971 Hz)", type: "oscillator", frequency: 971, volume: 0.08, pan: 1, waveform: "sine", enabled: true },

      { id: "sga_cosmic", name: "Cosmic Noise (Gate Bed)", type: "noise", frequency: 0, volume: 0.08, pan: 0, waveform: "cosmic", enabled: true },

      // “144 configuration” inclusion
      { id: "sga_synth", name: "Wavetable Layer (144 Hz)", type: "synth", frequency: 144, volume: 0.05, pan: 0, waveform: "wavetable", enabled: true },
      { id: "sga_432", name: "Stabilizer (432 Hz)", type: "oscillator", frequency: 432, volume: 0.012, pan: 0, waveform: "sine", enabled: true },
    ],
    order: 117,
  },

  {
    id: "c_heart",
    name: "Heart",
    color: "linear-gradient(135deg, #1a0b12, #5a1b3a)",
    imageUrl:
      "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=2400&auto=format&fit=crop",
    description: "Heart-led coherence for calm focus and social intelligence using 528/639 culture anchors.",
    layers: [
      { id: "ht_amb", name: "Ambient: Birds (Park)", type: "ambient", frequency: 0, volume: 0.23, pan: 0, waveform: "birds_park", enabled: true },

      // ~10 Hz on 528
      { id: "ht_l", name: "Binaural L (528 Hz)", type: "oscillator", frequency: 528, volume: 0.10, pan: -1, waveform: "sine", enabled: true },
      { id: "ht_r", name: "Binaural R (538 Hz)", type: "oscillator", frequency: 538, volume: 0.10, pan: 1, waveform: "sine", enabled: true },

      { id: "ht_pink", name: "Pink Noise (Soft Bed)", type: "noise", frequency: 0, volume: 0.04, pan: 0, waveform: "pink", enabled: true },

      { id: "ht_639", name: "Anchor (639 Hz)", type: "oscillator", frequency: 639, volume: 0.02, pan: 0, waveform: "sine", enabled: true },
      { id: "ht_432", name: "Stabilizer (432 Hz)", type: "oscillator", frequency: 432, volume: 0.012, pan: 0, waveform: "sine", enabled: true },
    ],
    order: 118,
  },

  {
    id: "c_rest_and_restoration",
    name: "Rest and Restoration",
    color: "linear-gradient(135deg, #0b1220, #1b2a4a)",
    imageUrl:
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=2400&auto=format&fit=crop",
    description: "Deep recovery stack with a delta-style binaural bed and gentle Solfeggio anchors for reset.",
    layers: [
      { id: "rr_amb", name: "Ambient: Thunder (Distant)", type: "ambient", frequency: 0, volume: 0.45, pan: 0, waveform: "thunder_distant", enabled: true },

      // Delta ~2.5 Hz on 432
      { id: "rr_l", name: "Binaural L (432 Hz)", type: "oscillator", frequency: 432, volume: 0.12, pan: -1, waveform: "sine", enabled: true },
      { id: "rr_r", name: "Binaural R (434.5 Hz)", type: "oscillator", frequency: 434.5, volume: 0.12, pan: 1, waveform: "sine", enabled: true },

      { id: "rr_brown", name: "Brown Noise (Sleep Bed)", type: "noise", frequency: 0, volume: 0.06, pan: 0, waveform: "brown", enabled: true },

      { id: "rr_396", name: "Release Anchor (396 Hz)", type: "oscillator", frequency: 396, volume: 0.015, pan: 0, waveform: "sine", enabled: true },
      { id: "rr_528", name: "Repair Anchor (528 Hz)", type: "oscillator", frequency: 528, volume: 0.012, pan: 0, waveform: "sine", enabled: true },
    ],
    order: 119,
  },
];

export default fanFavoritesPresets;
