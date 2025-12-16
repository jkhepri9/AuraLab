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
      // Theta-style binaural using a 432 Hz anchor (popular sound healing)
      { id: "ld_l", name: "Binaural L (432 Hz)", type: "oscillator", frequency: 432, volume: 0.14, pan: -1, waveform: "sine", enabled: true },
      { id: "ld_r", name: "Binaural R (436 Hz)", type: "oscillator", frequency: 436, volume: 0.14, pan: 1, waveform: "sine", enabled: true },

      { id: "ld_pink", name: "Pink Noise", type: "noise", frequency: 0, volume: 0.12, pan: 0, waveform: "pink", enabled: true },
      { id: "ld_crickets", name: "Crickets (Lake)", type: "ambient", frequency: 0, volume: 0.33, pan: 0, waveform: "crickets_lake", enabled: true },

      // Keep a gentle 432 harmonic + add a subtle 963 overtone (popular “higher” tone)
      { id: "ld_432", name: "Harmonic (432 Hz)", type: "oscillator", frequency: 432, volume: 0.03, pan: 0, waveform: "sine", enabled: true },
      { id: "ld_963", name: "Overtone (963 Hz)", type: "oscillator", frequency: 963, volume: 0.02, pan: 0, waveform: "sine", enabled: true },
    ],
    order: 100,
  },

  {
    id: "m_shielded_calm",
    name: "Shielded Calm",
    symbol: "⟡",
    color: "linear-gradient(135deg, #101a24, #1b2a3a)",
    imageUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=2400&auto=format&fit=crop",
    description: "Smooth the edges and stabilize your field. Built for emotional regulation and steady calm.",
    layers: [
      { id: "sc_amb", name: "Ambient: Rain Light", type: "ambient", waveform: "rain_light", volume: 0.40, pan: 0, enabled: true, filterEnabled: true, filter: { type: "lowpass", frequency: 15000, Q: 0.7 } },

      // Calm/alpha feel using 432 as base with an 8 Hz offset (popular approach)
      { id: "sc_l", name: "Binaural Carrier L (432 Hz)", type: "oscillator", frequency: 432, volume: 0.14, pan: -1, waveform: "sine", enabled: true },
      { id: "sc_r", name: "Binaural Carrier R (440 Hz)", type: "oscillator", frequency: 440, volume: 0.14, pan: 1, waveform: "sine", enabled: true },

      { id: "sc_brown", name: "Brown Noise (Ground)", type: "noise", frequency: 0, volume: 0.10, pan: 0, waveform: "brown", enabled: true },

      // Protection/grounding anchors (popular): 396 (release/fear) + 417 (clearing)
      { id: "sc_396", name: "Shield Anchor (396 Hz)", type: "oscillator", frequency: 396, volume: 0.02, pan: 0, waveform: "sine", enabled: true },
      { id: "sc_417", name: "Clear Anchor (417 Hz)", type: "oscillator", frequency: 417, volume: 0.02, pan: 0, waveform: "sine", enabled: true },
    ],
    order: 4,
  },

  {
    id: "c_pain_relief",
    name: "Pain Relief",
    color: "linear-gradient(135deg, #120b18, #2a1b3a)",
    imageUrl:
      "/modeimages/painrelief.jpg",
    description: "Promotes deep relaxation to help reduce tension and discomfort perception.",
    layers: [
      // Popular “pain relief” tone: 174 Hz, with a gentle low-offset beat
      { id: "pr_l", name: "Binaural L (174 Hz)", type: "oscillator", frequency: 174, volume: 0.12, pan: -1, waveform: "sine", enabled: true },
      { id: "pr_r", name: "Binaural R (177 Hz)", type: "oscillator", frequency: 177, volume: 0.12, pan: 1, waveform: "sine", enabled: true },

      { id: "pr_pink", name: "Pink Noise", type: "noise", frequency: 0, volume: 0.10, pan: 0, waveform: "pink", enabled: true },
      { id: "pr_ocean", name: "Ocean (Deep)", type: "ambient", frequency: 0, volume: 0.44, pan: 0, waveform: "ocean_deep", enabled: true },

      // Add a healing-support anchor commonly used in sound healing culture
      { id: "pr_528", name: "Repair Anchor (528 Hz)", type: "oscillator", frequency: 528, volume: 0.02, pan: 0, waveform: "sine", enabled: true },
    ],
    order: 102,
  },

  {
    id: "c_stargate",
    name: "Stargate",
    color: "linear-gradient(135deg, #06071a, #2b0b3a)",
    imageUrl:
      "/modeimages/stargate.jpg",
    description: "Energizes attention and clarity with a bright, high-focus entrainment profile.",
    layers: [
      // Bright “portal” bed: 963 anchor with a subtle offset, plus an audible 432 stabilizer
      { id: "sg_l", name: "Binaural L (963 Hz)", type: "oscillator", frequency: 963, volume: 0.08, pan: -1, waveform: "sine", enabled: true },
      { id: "sg_r", name: "Binaural R (971 Hz)", type: "oscillator", frequency: 971, volume: 0.08, pan: 1, waveform: "sine", enabled: true },

      { id: "sg_cosmic", name: "Cosmic Noise", type: "noise", frequency: 0, volume: 0.10, pan: 0, waveform: "cosmic", enabled: true },
      { id: "sg_wind", name: "Wind (Forest)", type: "ambient", frequency: 0, volume: 0.40, pan: 0, waveform: "wind_forest", enabled: true },

      // “144 configuration” inclusion: keep the synth layer but shift it to 144 Hz
      { id: "sg_synth", name: "Wavetable Layer (144 Hz)", type: "synth", frequency: 144, volume: 0.06, pan: 0, waveform: "wavetable", enabled: true },

      // Gentle stabilizer
      { id: "sg_432", name: "Anchor (432 Hz)", type: "oscillator", frequency: 432, volume: 0.02, pan: 0, waveform: "sine", enabled: true },
    ],
    order: 103,
  },

  {
    id: "c_golden_ratio",
    name: "Golden Ratio",
    color: "linear-gradient(135deg, #0b1a12, #2a5a3a)",
    imageUrl: "/modeimages/goldenratio.png",
    description: "Supports calm coherence and creative flow using phi/Fibonacci-inspired harmonics.",
    layers: [
      // Already aligned with popular “sacred math” patterns; keep core structure and add a subtle 432 stabilizer
      { id: "gr_161", name: "Phi Center (161.8 Hz)", type: "oscillator", frequency: 161.8, volume: 0.08, pan: 0, waveform: "sine", enabled: true },
      { id: "gr_89", name: "Fibonacci (89 Hz)", type: "oscillator", frequency: 89, volume: 0.05, pan: -0.15, waveform: "sine", enabled: true },
      { id: "gr_144", name: "Fibonacci (144 Hz)", type: "oscillator", frequency: 144, volume: 0.05, pan: 0.15, waveform: "sine", enabled: true },
      { id: "gr_233", name: "Fibonacci (233 Hz)", type: "oscillator", frequency: 233, volume: 0.04, pan: 0, waveform: "sine", enabled: true },

      { id: "gr_river", name: "River (Soft)", type: "ambient", frequency: 0, volume: 0.44, pan: 0, waveform: "river_soft", enabled: true },

      { id: "gr_synth", name: "Analog Layer", type: "synth", frequency: 161.8, volume: 0.06, pan: 0, waveform: "analog", enabled: true },

      { id: "gr_432", name: "Stabilizer (432 Hz)", type: "oscillator", frequency: 432, volume: 0.02, pan: 0, waveform: "sine", enabled: true },
    ],
    order: 104,
  },

  // ✅ YOU SAID DO NOT CHANGE THIS ONE
  {
    id: "c_third_eye",
    name: "Third Eye",
    color: "linear-gradient(135deg, #120a2a, #183a6a)",
    imageUrl:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Ajna_chakra.svg?width=2400",
    description: "Supports meditative focus and inner visualization with theta-style entrainment.",
    layers: [
      { id: "te_l", name: "Binaural L (210 Hz)", type: "oscillator", frequency: 210, volume: 0.12, pan: -1, waveform: "sine", enabled: true },
      { id: "te_r", name: "Binaural R (217 Hz)", type: "oscillator", frequency: 217, volume: 0.12, pan: 1, waveform: "sine", enabled: true },
      { id: "te_violet", name: "Violet Noise", type: "noise", frequency: 0, volume: 0.06, pan: 0, waveform: "violet", enabled: true },
      { id: "te_852", name: "Overtone (852 Hz)", type: "oscillator", frequency: 852, volume: 0.02, pan: 0, waveform: "sine", enabled: true },
      { id: "te_thunder", name: "Thunder (Distant)", type: "ambient", frequency: 0, volume: 0.33, pan: 0, waveform: "thunder_distant", enabled: true },
    ],
    order: 105,
  },

  {
    id: "c_genius_mode",
    name: "Genius Mode",
    color: "linear-gradient(135deg, #041329, #0a3a5a)",
    imageUrl: "/modeimages/geniusmode.jpg",
    description: "Boosts concentration and task-drive using a crisp beta-style entrainment bed.",
    layers: [
      // Popular “activation” anchors: 528 + 963
      { id: "gm_l", name: "Binaural L (528 Hz)", type: "oscillator", frequency: 528, volume: 0.10, pan: -1, waveform: "sine", enabled: true },
      { id: "gm_r", name: "Binaural R (544 Hz)", type: "oscillator", frequency: 544, volume: 0.10, pan: 1, waveform: "sine", enabled: true },

      { id: "gm_gray", name: "Gray Noise", type: "noise", frequency: 0, volume: 0.09, pan: 0, waveform: "gray", enabled: true },

      { id: "gm_synth", name: "FM Detail Layer (963 Hz)", type: "synth", frequency: 963, volume: 0.04, pan: 0, waveform: "fm", enabled: true },
      { id: "gm_wind", name: "Wind (Soft)", type: "ambient", frequency: 0, volume: 0.30, pan: 0, waveform: "wind_soft", enabled: true },
    ],
    order: 106,
  },

  {
    id: "c_master_musician",
    name: "Master Musician",
    color: "linear-gradient(135deg, #1a0a00, #5a1a00)",
    imageUrl: "/modeimages/mastermusician.jpg",
    description: "Supports musical flow-state, timing, and relaxed precision for practice sessions.",
    layers: [
      // Flow-state bed on 432 with alpha-ish offset
      { id: "mm_l", name: "Binaural L (432 Hz)", type: "oscillator", frequency: 432, volume: 0.10, pan: -1, waveform: "sine", enabled: true },
      { id: "mm_r", name: "Binaural R (440 Hz)", type: "oscillator", frequency: 440, volume: 0.10, pan: 1, waveform: "sine", enabled: true },

      { id: "mm_432", name: "Anchor (432 Hz)", type: "oscillator", frequency: 432, volume: 0.04, pan: -0.1, waveform: "sine", enabled: true },
      { id: "mm_528", name: "Anchor (528 Hz)", type: "oscillator", frequency: 528, volume: 0.03, pan: 0.1, waveform: "sine", enabled: true },

      { id: "mm_birds", name: "Birds (Park)", type: "ambient", frequency: 0, volume: 0.24, pan: 0, waveform: "birds_park", enabled: true },
    ],
    order: 107,
  },

  {
    id: "c_wealth_abundance",
    name: "Wealth & Abundance",
    color: "linear-gradient(135deg, #1a1200, #5a4a00)",
    imageUrl: "/modeimages/wealthabundance.jpg",
    description: "Supports calm confidence and long-horizon thinking for disciplined abundance.",
    layers: [
      // Popular abundance stack: 528 + 639, with a calm offset on the main layer
      { id: "wa_l", name: "Binaural L (528 Hz)", type: "oscillator", frequency: 528, volume: 0.11, pan: -1, waveform: "sine", enabled: true },
      { id: "wa_r", name: "Binaural R (536 Hz)", type: "oscillator", frequency: 536, volume: 0.11, pan: 1, waveform: "sine", enabled: true },

      { id: "wa_gold", name: "Gold Noise", type: "noise", frequency: 0, volume: 0.08, pan: 0, waveform: "gold", enabled: true },
      { id: "wa_fire", name: "Fire (Camp)", type: "ambient", frequency: 0, volume: 0.99, pan: 0, waveform: "fire_camp", enabled: true },

      { id: "wa_639", name: "Anchor (639 Hz)", type: "oscillator", frequency: 639, volume: 0.02, pan: 0, waveform: "sine", enabled: true },
      { id: "wa_432", name: "Stabilizer (432 Hz)", type: "oscillator", frequency: 432, volume: 0.02, pan: 0, waveform: "sine", enabled: true },
    ],
    order: 108,
  },

  // ✅ YOU SAID DO NOT CHANGE THIS ONE
  {
    id: "c_earth_frequency",
    name: "Earth Frequency",
    color: "linear-gradient(135deg, #07130a, #1f3a20)",
    imageUrl:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Earth_from_Space.jpg?width=2400",
    description: "Promotes grounding and steady calm using a Schumann-style binaural profile.",
    layers: [
      { id: "ef_l", name: "Binaural L (200 Hz)", type: "oscillator", frequency: 200, volume: 0.12, pan: -1, waveform: "sine", enabled: true },
      { id: "ef_r", name: "Binaural R (207.83 Hz)", type: "oscillator", frequency: 207.83, volume: 0.12, pan: 1, waveform: "sine", enabled: true },
      { id: "ef_brown", name: "Brown Noise", type: "noise", frequency: 0, volume: 0.10, pan: 0, waveform: "brown", enabled: true },
      { id: "ef_river", name: "River (Rapids)", type: "ambient", frequency: 0, volume: 0.43, pan: 0, waveform: "river_rapids", enabled: true },
      { id: "ef_55", name: "Sub (55 Hz)", type: "oscillator", frequency: 55, volume: 0.03, pan: 0, waveform: "sine", enabled: true },
    ],
    order: 109,
  }
]
  
export default communityPresets;
