// src/data/presets/featuredPresets.js

export const FEATURED_PRESETS = [
  {
    id: "m_deep_sleep",
    name: "Deep Sleep",
    symbol: "☾",
    color: "linear-gradient(135deg, #0b1220, #1b2a4a)",
    imageUrl: "/modeimages/deepsleep.jpg",
    description: "Slow the mind and soften the body into deep sleep. Built for calm, darkness, and stillness.",
    layers: [
      { id: "ds_amb", name: "Ambient: Ocean Deep", type: "ambient", waveform: "ocean_deep", volume: 0.33, pan: 0, enabled: true, filterEnabled: true, filter: { type: "lowpass", frequency: 15000, Q: 0.7 } },

      // Deep sleep bed anchored to 432 with a gentle low-offset (popular approach)
      { id: "ds_l", name: "Binaural Carrier L (98 Hz)", type: "oscillator", frequency: 98, volume: 0.14, pan: -1, waveform: "sine", enabled: true },
      { id: "ds_r", name: "Binaural Carrier R (102 Hz)", type: "oscillator", frequency: 102, volume: 0.14, pan: 1, waveform: "sine", enabled: true },

      { id: "ds_pink", name: "Pink Noise (Soft Blanket)", type: "noise", frequency: 0, volume: 0.10, pan: 0, waveform: "pink", enabled: true },

      // Popular sleep / grounding tone often used: 174
      { id: "ds_174", name: "Low Drone (174 Hz)", type: "oscillator", frequency: 174, volume: 0.03, pan: 0, waveform: "sine", enabled: true },
    ],
    order: 0,
  },

  {
    id: "m_theta_gate",
    name: "Theta Gate",
    symbol: "✧",
    color: "linear-gradient(135deg, #1a0b2a, #2a1b4a)",
    imageUrl: "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=2400&auto=format&fit=crop",
    description: "Enter meditative depth and inner stillness. Designed for theta entrainment and quiet awareness.",
    layers: [
      { id: "tg_amb", name: "Ambient: Wind Forest", type: "ambient", waveform: "wind_forest", volume: 0.30, pan: 0, enabled: true, filterEnabled: true, filter: { type: "lowpass", frequency: 16000, Q: 0.7 } },

      // Theta-ish offset on a 432 anchor
      { id: "tg_l", name: "Binaural Carrier L (138 Hz)", type: "oscillator", frequency: 138, volume: 0.14, pan: -1, waveform: "sine", enabled: true },
      { id: "tg_r", name: "Binaural Carrier R (150 Hz)", type: "oscillator", frequency: 150, volume: 0.14, pan: 1, waveform: "sine", enabled: true },

      { id: "tg_white", name: "White Noise (Air)", type: "noise", frequency: 0, volume: 0.08, pan: 0, waveform: "white", enabled: true },

      { id: "tg_432", name: "Anchor Tone (432 Hz)", type: "oscillator", frequency: 432, volume: 0.03, pan: 0, waveform: "sine", enabled: true },
      { id: "tg_963", name: "Overtone (963 Hz)", type: "oscillator", frequency: 963, volume: 0.02, pan: 0, waveform: "sine", enabled: true },
    ],
    order: 1,
  },

  {
    id: "m_focus_forge",
    name: "Focus Forge",
    symbol: "⟁",
    color: "linear-gradient(135deg, #052225, #0b3b3a)",
    imageUrl: "/modeimages/focusforge.jpg",
    description: "Clean, stable focus for work and creation. Built for alertness without chaos and consistent attention.",
    layers: [
      { id: "ff_amb", name: "Ambient: Campfire", type: "ambient", waveform: "fire_camp", volume: 0.90, pan: 0, enabled: true, filterEnabled: true, filter: { type: "lowpass", frequency: 16000, Q: 0.7 } },

      // Popular focus/clarity anchors: 528 + 741 (use 528 as main bed)
      { id: "ff_l", name: "Binaural Carrier L (278 Hz)", type: "oscillator", frequency: 278, volume: 0.12, pan: -1, waveform: "sine", enabled: true },
      { id: "ff_r", name: "Binaural Carrier R (298 Hz)", type: "oscillator", frequency: 298, volume: 0.12, pan: 1, waveform: "sine", enabled: true },

      { id: "ff_gray", name: "Gray Noise (Attention Bed)", type: "noise", frequency: 0, volume: 0.12, pan: 0, waveform: "gray", enabled: true },

      { id: "ff_741", name: "Clarity Anchor (741 Hz)", type: "oscillator", frequency: 741, volume: 0.03, pan: 0, waveform: "sine", enabled: true },
    ],
    order: 2,
  },

  {
    id: "m_heart_coherence",
    name: "Heart Coherence",
    symbol: "❤",
    color: "linear-gradient(135deg, #2a0b12, #3a1b4a)",
    imageUrl: "/modeimages/heartcoherence.jpg",
    description: "Calm your nervous system and settle into steady coherence. Ideal for stress relief and emotional reset.",
    layers: [
      { id: "hc_amb", name: "Ambient: Park Birds", type: "ambient", waveform: "birds_park", volume: 0.23, pan: 0, enabled: true, filterEnabled: true, filter: { type: "lowpass", frequency: 17000, Q: 0.7 } },

      // Popular “heart” association in sound-healing culture: 639
      { id: "hc_l", name: "Binaural Carrier L (520 Hz)", type: "oscillator", frequency: 520, volume: 0.14, pan: -1, waveform: "sine", enabled: true },
      { id: "hc_r", name: "Binaural Carrier R (536 Hz)", type: "oscillator", frequency: 536, volume: 0.14, pan: 1, waveform: "sine", enabled: true },

      { id: "hc_pink", name: "Pink Noise (Warmth)", type: "noise", frequency: 0, volume: 0.14, pan: 0, waveform: "pink", enabled: true },

      // Bring in the “144 configuration” as a gentle stabilizing harmonic
      { id: "hc_144", name: "Harmonic (144 Hz)", type: "oscillator", frequency: 144, volume: 0.03, pan: 0, waveform: "sine", enabled: true },
      { id: "hc_333", name: "Harmonic (333 Hz)", type: "oscillator", frequency: 333, volume: 0.03, pan: 0, waveform: "sine", enabled: true },
    ],
    order: 3,
  },

  {
    id: "m_energy_ignition",
    name: "Energy Ignition",
    symbol: "⚡",
    color: "linear-gradient(135deg, #1a0f00, #5a1a00)",
    imageUrl: "/modeimages/energyignition.jpg",
    description: "Wake up the system without chaos. Built for clean energy, motivation, and morning activation.",
    layers: [
      { id: "ei_amb", name: "Ambient: Wind Soft", type: "ambient", waveform: "wind_soft", volume: 0.40, pan: 0, enabled: true, filterEnabled: true, filter: { type: "lowpass", frequency: 17000, Q: 0.7 } },

      // Popular “activation” anchor: 741 / 852 / 963
      // Use 741 as main bed with a stronger offset for “ignite”
      { id: "ei_l", name: "Binaural Carrier L (731 Hz)", type: "oscillator", frequency: 731, volume: 0.12, pan: -1, waveform: "sine", enabled: true },
      { id: "ei_r", name: "Binaural Carrier R (751 Hz)", type: "oscillator", frequency: 751, volume: 0.12, pan: 1, waveform: "sine", enabled: true },

      { id: "ei_white", name: "White Noise (Spark)", type: "noise", frequency: 0, volume: 0.10, pan: 0, waveform: "white", enabled: true },

      { id: "ei_852", name: "Ignition Anchor (852 Hz)", type: "oscillator", frequency: 852, volume: 0.02, pan: 0, waveform: "sine", enabled: true },
      { id: "ei_963", name: "Crown Anchor (963 Hz)", type: "oscillator", frequency: 963, volume: 0.02, pan: 0, waveform: "sine", enabled: true },
    ],
    order: 5,
  },

  {
    id: "p2",
    name: "Zen Garden",
    color: "linear-gradient(135deg, #059669, #065f46)",
    imageUrl: "/modeimages/zengarden.jpg",
    description: "Quiet the mind and soften stress. Best for relaxation, breathwork, and gentle meditation.",
    layers: [
      { id: "p2_amb", name: "Ambient: Gentle River", type: "ambient", waveform: "river_soft", volume: 0.33, pan: 0, enabled: true, filterEnabled: true, filter: { type: "lowpass", frequency: 15000, Q: 0.7 } },

      // Replace sub-audible “6 Hz oscillator” with a 432-based binaural theta pattern
      { id: "zg_l", name: "Binaural L (220 Hz)", type: "oscillator", frequency: 220, volume: 0.12, pan: -1, waveform: "sine", enabled: true },
      { id: "zg_r", name: "Binaural R (224 Hz)", type: "oscillator", frequency: 224, volume: 0.12, pan: 1, waveform: "sine", enabled: true },

      { id: "l4", name: "Pink Noise Bed", type: "noise", frequency: 0, volume: 0.16, pan: 0, waveform: "pink", enabled: true },

      { id: "zg_528", name: "Harmony Anchor (528 Hz)", type: "oscillator", frequency: 528, volume: 0.02, pan: 0, waveform: "sine", enabled: true },
    ],
    order: 7,
  },

  {
    id: "p3",
    name: "Oceanic Flow",
    color: "linear-gradient(135deg, #0ea5e9, #0f766e)",
    imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2940&auto=format&fit=crop",
    description: "Ease the body into calm, steady relaxation. Ideal for unwinding, reading, and sleep preparation.",
    layers: [
      { id: "p3_amb", name: "Ambient: Ocean Deep", type: "ambient", waveform: "ocean_deep", volume: 0.30, pan: 0, enabled: true, filterEnabled: true, filter: { type: "lowpass", frequency: 15000, Q: 0.7 } },

      // Replace sub-audible “3 Hz oscillator” with a 432-based low-offset drift
      { id: "of_l", name: "Binaural L (256 Hz)", type: "oscillator", frequency: 256, volume: 0.12, pan: -1, waveform: "sine", enabled: true },
      { id: "of_r", name: "Binaural R (260 Hz)", type: "oscillator", frequency: 260, volume: 0.12, pan: 1, waveform: "sine", enabled: true },

      { id: "l6", name: "Brown Noise Bed", type: "noise", frequency: 0, volume: 0.16, pan: 0, waveform: "brown", enabled: true },

      // Popular “369” inclusion (light, supportive)
      { id: "of_369", name: "Flow Anchor (369 Hz)", type: "oscillator", frequency: 369, volume: 0.02, pan: 0, waveform: "sine", enabled: true },
    ],
    order: 8,
  },

  {
    id: "p4",
    name: "Night Shield",
    color: "linear-gradient(135deg, #111827, #0b1220)",
    imageUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=2940&auto=format&fit=crop",
    description: "A smooth protective layer for the mind. Ideal for winding down and restoring internal balance.",
    layers: [
      { id: "p4_amb", name: "Ambient: Thunder Distant", type: "ambient", waveform: "thunder_distant", volume: 0.50, pan: 0, enabled: true, filterEnabled: true, filter: { type: "lowpass", frequency: 15000, Q: 0.7 } },

      // Protective calm bed: 396 + low offset
      { id: "ns_l", name: "Binaural L (394 Hz)", type: "oscillator", frequency: 394, volume: 0.12, pan: -1, waveform: "sine", enabled: true },
      { id: "ns_r", name: "Binaural R (398 Hz)", type: "oscillator", frequency: 398, volume: 0.12, pan: 1, waveform: "sine", enabled: true },

      { id: "l8", name: "Pink Noise Bed", type: "noise", frequency: 0, volume: 0.14, pan: 0, waveform: "pink", enabled: true },

      // Shield overtone
      { id: "ns_852", name: "Shield Anchor (852 Hz)", type: "oscillator", frequency: 852, volume: 0.02, pan: 0, waveform: "sine", enabled: true },
    ],
    order: 9,
  },
];

export const initialPresets = FEATURED_PRESETS;
export default FEATURED_PRESETS;
