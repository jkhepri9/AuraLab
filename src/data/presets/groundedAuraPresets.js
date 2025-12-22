// src/data/presets/groundedAuraPresets.js
// Grounded Aura Mode — Low-End Foundation Presets
// Purpose: grounding, nervous-system regulation, sub-frequency stability

export const groundedAuraPresets = [
  {
    id: "ga_earth_anchor",
    name: "Earth Anchor",
    color: "linear-gradient(135deg, #071015, #0f2a2a)",
    imageUrl: "/modeimages/earthanchor.jpg",
    description: "Deep sub-frequency grounding for stability and safety.",

    // ✅ Discover metadata (added only)
    goals: ["sleep"],
    scenarios: ["night", "downshift", "insomnia", "recovery"],
    styles: ["binaural", "nature", "noise"],
    intensity: 2,
    headphonesRecommended: true,
    durationHint: "60m",
    tags: ["sleep", "grounding", "stability", "sub", "safety"],

    collection: "Grounded Aura Mode",
    layers: [
      { id: "ea_sub", type: "synth", waveform: "sub", frequency: 55, volume: 0.22, pan: 0, enabled: true },
      { id: "ea_l", type: "oscillator", waveform: "sine", frequency: 84, volume: 0.12, pan: -1, enabled: true },
      { id: "ea_r", type: "oscillator", waveform: "sine", frequency: 88, volume: 0.12, pan: 1, enabled: true },
      { id: "ea_brown", type: "noise", waveform: "brown", volume: 0.10, pan: 0, enabled: true },
      { id: "ea_air", type: "ambient", waveform: "wind_soft", volume: 0.08, pan: 0, enabled: true },
    ],
  },

  {
    id: "ga_sub_delta",
    name: "Sub Delta",
    color: "linear-gradient(135deg, #0b0f1a, #11253a)",
    imageUrl: "/modeimages/subdelta.jpg",
    description: "Heavy delta-range foundation for sleep and shutdown.",

    // ✅ Discover metadata (added only)
    goals: ["sleep"],
    scenarios: ["night", "deep-sleep", "shutdown", "insomnia"],
    styles: ["binaural", "nature", "noise"],
    intensity: 1,
    headphonesRecommended: true,
    durationHint: "60m",
    tags: ["sleep", "delta", "deep", "shutdown", "sub"],

    collection: "Grounded Aura Mode",
    layers: [
      { id: "sd_sub", type: "synth", waveform: "sub", frequency: 48, volume: 0.24, pan: 0, enabled: true },
      { id: "sd_l", type: "oscillator", waveform: "sine", frequency: 100, volume: 0.11, pan: -1, enabled: true },
      { id: "sd_r", type: "oscillator", waveform: "sine", frequency: 102, volume: 0.11, pan: 1, enabled: true },
      { id: "sd_pink", type: "noise", waveform: "pink", volume: 0.10, pan: 0, enabled: true },
      { id: "sd_ocean", type: "ambient", waveform: "ocean_deep", volume: 0.08, pan: 0, enabled: true },
    ],
  },

  {
    id: "ga_root_reset",
    name: "Root Reset",
    color: "linear-gradient(135deg, #130b12, #2a1732)",
    imageUrl: "/modeimages/rootreset.jpg",
    description: "Embodied low-frequency reset for emotional grounding.",

    // ✅ Discover metadata (added only)
    goals: ["sleep"],
    scenarios: ["night", "downshift", "stress", "regulation"],
    styles: ["binaural", "nature", "noise"],
    intensity: 2,
    headphonesRecommended: true,
    durationHint: "60m",
    tags: ["sleep", "root", "reset", "grounding", "regulation"],

    collection: "Grounded Aura Mode",
    layers: [
      { id: "rr_sub", type: "synth", waveform: "sub", frequency: 60, volume: 0.20, pan: 0, enabled: true },
      { id: "rr_l", type: "oscillator", waveform: "sine", frequency: 92, volume: 0.11, pan: -1, enabled: true },
      { id: "rr_r", type: "oscillator", waveform: "sine", frequency: 98, volume: 0.11, pan: 1, enabled: true },
      { id: "rr_174", type: "oscillator", waveform: "sine", frequency: 174, volume: 0.12, pan: 0, enabled: true },
      { id: "rr_rain", type: "ambient", waveform: "rain_light", volume: 0.10, pan: 0, enabled: true },
    ],
  },

  {
    id: "ga_gravity_bed",
    name: "Gravity Bed",
    color: "linear-gradient(135deg, #061018, #13202a)",
    imageUrl: "/modeimages/gravitybed.png",
    description: "Full-body low-end weight designed for deep relaxation.",

    // ✅ Discover metadata (added only)
    goals: ["sleep"],
    scenarios: ["night", "deep-sleep", "downshift", "relax"],
    styles: ["binaural", "nature", "noise"],
    intensity: 1,
    headphonesRecommended: true,
    durationHint: "60m",
    tags: ["sleep", "weight", "deep", "relaxation", "low-end"],

    collection: "Grounded Aura Mode",
    layers: [
      { id: "gb_sub", type: "synth", waveform: "sub", frequency: 50, volume: 0.24, pan: 0, enabled: true },
      { id: "gb_l", type: "oscillator", waveform: "sine", frequency: 110, volume: 0.11, pan: -1, enabled: true },
      { id: "gb_r", type: "oscillator", waveform: "sine", frequency: 113, volume: 0.11, pan: 1, enabled: true },
      { id: "gb_drone", type: "synth", waveform: "drone", frequency: 72, volume: 0.16, pan: 0, enabled: true },
      { id: "gb_thunder", type: "ambient", waveform: "thunder_rolling", volume: 0.08, pan: 0, enabled: true },
    ],
  },

  {
    id: "ga_stone_breath",
    name: "Stone Breath",
    color: "linear-gradient(135deg, #0a0f12, #1a2228)",
    imageUrl: "/modeimages/stonebreath.jpg",
    description: "Breath-like low-frequency field for slow release.",

    // ✅ Discover metadata (added only)
    goals: ["sleep"],
    scenarios: ["night", "downshift", "breath", "release"],
    styles: ["binaural", "nature", "noise"],
    intensity: 2,
    headphonesRecommended: true,
    durationHint: "60m",
    tags: ["sleep", "breath", "release", "low-frequency", "calm"],

    collection: "Grounded Aura Mode",
    layers: [
      { id: "sb_sub", type: "synth", waveform: "sub", frequency: 58, volume: 0.22, pan: 0, enabled: true },
      { id: "sb_l", type: "oscillator", waveform: "sine", frequency: 140, volume: 0.10, pan: -1, enabled: true },
      { id: "sb_r", type: "oscillator", waveform: "sine", frequency: 145, volume: 0.10, pan: 1, enabled: true },
      { id: "sb_brown", type: "noise", waveform: "brown", volume: 0.08, pan: 0, enabled: true },
      { id: "sb_river", type: "ambient", waveform: "river_rapids", volume: 0.10, pan: 0, enabled: true },
    ],
  },

  {
    id: "ga_cavern_resonance",
    name: "Cavern Resonance",
    color: "linear-gradient(135deg, #07070f, #15152a)",
    imageUrl: "/modeimages/cavernresonance.jpg",
    description: "Deep cavernous resonance with sub-harmonic fullness.",

    // ✅ Discover metadata (added only)
    goals: ["sleep"],
    scenarios: ["night", "deep-sleep", "stillness", "downshift"],
    styles: ["nature", "noise"],
    intensity: 2,
    headphonesRecommended: true,
    durationHint: "60m",
    tags: ["sleep", "cavern", "resonance", "sub-harmonic", "depth"],

    collection: "Grounded Aura Mode",
    layers: [
      { id: "cr_sub", type: "synth", waveform: "sub", frequency: 45, volume: 0.26, pan: 0, enabled: true },
      { id: "cr_90", type: "oscillator", waveform: "sine", frequency: 90, volume: 0.12, pan: 0, enabled: true },
      { id: "cr_135", type: "oscillator", waveform: "sine", frequency: 135, volume: 0.10, pan: 0, enabled: true },
      { id: "cr_pink", type: "noise", waveform: "pink", volume: 0.08, pan: 0, enabled: true },
      { id: "cr_wind", type: "ambient", waveform: "wind_forest", volume: 0.08, pan: 0, enabled: true },
    ],
  },

  {
    id: "ga_night_foundation",
    name: "Night Foundation",
    color: "linear-gradient(135deg, #070b12, #0d1b2a)",
    imageUrl: "/modeimages/nightfoundation.jpg",
    description: "Dark, quiet low-end base optimized for sleep onset.",

    // ✅ Discover metadata (added only)
    goals: ["sleep"],
    scenarios: ["night", "sleep-onset", "insomnia", "downshift"],
    styles: ["binaural", "nature", "noise"],
    intensity: 1,
    headphonesRecommended: true,
    durationHint: "60m",
    tags: ["sleep", "night", "sleep-onset", "quiet", "low-end"],

    collection: "Grounded Aura Mode",
    layers: [
      { id: "nf_sub", type: "synth", waveform: "sub", frequency: 52, volume: 0.22, pan: 0, enabled: true },
      { id: "nf_l", type: "oscillator", waveform: "sine", frequency: 96, volume: 0.10, pan: -1, enabled: true },
      { id: "nf_r", type: "oscillator", waveform: "sine", frequency: 98.5, volume: 0.10, pan: 1, enabled: true },
      { id: "nf_brown", type: "noise", waveform: "brown", volume: 0.09, pan: 0, enabled: true },
      { id: "nf_crickets", type: "ambient", waveform: "crickets_lake", volume: 0.10, pan: 0, enabled: true },
    ],
  },

  {
    id: "ga_black_sand",
    name: "Black Sand",
    color: "linear-gradient(135deg, #070808, #141516)",
    imageUrl: "/modeimages/blacksand.jpg",
    description: "Minimalist premium low-frequency foundation.",

    // ✅ Discover metadata (added only)
    goals: ["sleep"],
    scenarios: ["night", "deep-sleep", "minimal", "downshift"],
    styles: ["noise", "nature"],
    intensity: 1,
    headphonesRecommended: true,
    durationHint: "60m",
    tags: ["sleep", "minimal", "premium", "foundation", "low-frequency"],

    collection: "Grounded Aura Mode",
    layers: [
      { id: "bs_sub", type: "synth", waveform: "sub", frequency: 47, volume: 0.24, pan: 0, enabled: true },
      { id: "bs_drone", type: "synth", waveform: "drone", frequency: 64, volume: 0.14, pan: 0, enabled: true },
      { id: "bs_pink", type: "noise", waveform: "pink", volume: 0.07, pan: 0, enabled: true },
      { id: "bs_air", type: "ambient", waveform: "wind_soft", volume: 0.07, pan: 0, enabled: true },
    ],
  },
];

export default groundedAuraPresets;
