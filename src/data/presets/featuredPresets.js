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
      { id: "ds_amb", name: "Ambient: Ocean Deep", type: "ambient", waveform: "ocean_deep", volume: 0.18, pan: 0, enabled: true, filterEnabled: true, filter: { type: "lowpass", frequency: 15000, Q: 0.7 } },
      { id: "ds_l", name: "Binaural Carrier L (200 Hz)", type: "oscillator", frequency: 200, volume: 0.14, pan: -1, waveform: "sine", enabled: true },
      { id: "ds_r", name: "Binaural Carrier R (206 Hz)", type: "oscillator", frequency: 206, volume: 0.14, pan: 1, waveform: "sine", enabled: true },
      { id: "ds_pink", name: "Pink Noise (Soft Blanket)", type: "noise", frequency: 0, volume: 0.10, pan: 0, waveform: "pink", enabled: true },
      { id: "ds_110", name: "Low Drone (110 Hz)", type: "oscillator", frequency: 110, volume: 0.04, pan: 0, waveform: "sine", enabled: true },
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
      { id: "tg_amb", name: "Ambient: Wind Forest", type: "ambient", waveform: "wind_forest", volume: 0.14, pan: 0, enabled: true, filterEnabled: true, filter: { type: "lowpass", frequency: 16000, Q: 0.7 } },
      { id: "tg_l", name: "Binaural Carrier L (210 Hz)", type: "oscillator", frequency: 210, volume: 0.14, pan: -1, waveform: "sine", enabled: true },
      { id: "tg_r", name: "Binaural Carrier R (216 Hz)", type: "oscillator", frequency: 216, volume: 0.14, pan: 1, waveform: "sine", enabled: true },
      { id: "tg_white", name: "White Noise (Air)", type: "noise", frequency: 0, volume: 0.08, pan: 0, waveform: "white", enabled: true },
      { id: "tg_432", name: "Anchor Tone (432 Hz)", type: "oscillator", frequency: 432, volume: 0.03, pan: 0, waveform: "sine", enabled: true },
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
      { id: "ff_amb", name: "Ambient: Campfire", type: "ambient", waveform: "fire_camp", volume: 0.12, pan: 0, enabled: true, filterEnabled: true, filter: { type: "lowpass", frequency: 16000, Q: 0.7 } },
      { id: "ff_l", name: "Binaural Carrier L (210 Hz)", type: "oscillator", frequency: 210, volume: 0.12, pan: -1, waveform: "sine", enabled: true },
      { id: "ff_r", name: "Binaural Carrier R (224 Hz)", type: "oscillator", frequency: 224, volume: 0.12, pan: 1, waveform: "sine", enabled: true },
      { id: "ff_gray", name: "Gray Noise (Attention Bed)", type: "noise", frequency: 0, volume: 0.12, pan: 0, waveform: "gray", enabled: true },
      { id: "ff_528", name: "Anchor Tone (528 Hz)", type: "oscillator", frequency: 528, volume: 0.04, pan: 0, waveform: "sine", enabled: true },
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
      { id: "hc_amb", name: "Ambient: Park Birds", type: "ambient", waveform: "birds_park", volume: 0.14, pan: 0, enabled: true, filterEnabled: true, filter: { type: "lowpass", frequency: 17000, Q: 0.7 } },
      { id: "hc_l", name: "Binaural Carrier L (200 Hz)", type: "oscillator", frequency: 200, volume: 0.14, pan: -1, waveform: "sine", enabled: true },
      { id: "hc_r", name: "Binaural Carrier R (210 Hz)", type: "oscillator", frequency: 210, volume: 0.14, pan: 1, waveform: "sine", enabled: true },
      { id: "hc_pink", name: "Pink Noise (Warmth)", type: "noise", frequency: 0, volume: 0.14, pan: 0, waveform: "pink", enabled: true },
      { id: "hc_drone", name: "Low Drone (110 Hz)", type: "oscillator", frequency: 110, volume: 0.05, pan: 0, waveform: "sine", enabled: true },
    ],
    order: 3,
  },

  {
    id: "m_shielded_calm",
    name: "Shielded Calm",
    symbol: "⟡",
    color: "linear-gradient(135deg, #101a24, #1b2a3a)",
    imageUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=2400&auto=format&fit=crop",
    description: "Smooth the edges and stabilize your field. Built for emotional regulation and steady calm.",
    layers: [
      { id: "sc_amb", name: "Ambient: Rain Light", type: "ambient", waveform: "rain_light", volume: 0.18, pan: 0, enabled: true, filterEnabled: true, filter: { type: "lowpass", frequency: 15000, Q: 0.7 } },
      { id: "sc_l", name: "Binaural Carrier L (200 Hz)", type: "oscillator", frequency: 200, volume: 0.14, pan: -1, waveform: "sine", enabled: true },
      { id: "sc_r", name: "Binaural Carrier R (208 Hz)", type: "oscillator", frequency: 208, volume: 0.14, pan: 1, waveform: "sine", enabled: true },
      { id: "sc_brown", name: "Brown Noise (Ground)", type: "noise", frequency: 0, volume: 0.10, pan: 0, waveform: "brown", enabled: true },
      { id: "sc_55", name: "Sub Anchor (55 Hz)", type: "oscillator", frequency: 55, volume: 0.03, pan: 0, waveform: "sine", enabled: true },
    ],
    order: 4,
  },

  {
    id: "m_energy_ignition",
    name: "Energy Ignition",
    symbol: "⚡",
    color: "linear-gradient(135deg, #1a0f00, #5a1a00)",
    imageUrl: "/modeimages/energyignition.jpg",
    description: "Wake up the system without chaos. Built for clean energy, motivation, and morning activation.",
    layers: [
      { id: "ei_amb", name: "Ambient: Wind Soft", type: "ambient", waveform: "wind_soft", volume: 0.12, pan: 0, enabled: true, filterEnabled: true, filter: { type: "lowpass", frequency: 17000, Q: 0.7 } },
      { id: "ei_l", name: "Binaural Carrier L (200 Hz)", type: "oscillator", frequency: 200, volume: 0.12, pan: -1, waveform: "sine", enabled: true },
      { id: "ei_r", name: "Binaural Carrier R (222 Hz)", type: "oscillator", frequency: 222, volume: 0.12, pan: 1, waveform: "sine", enabled: true },
      { id: "ei_white", name: "White Noise (Spark)", type: "noise", frequency: 0, volume: 0.10, pan: 0, waveform: "white", enabled: true },
      { id: "ei_528", name: "Anchor Tone (528 Hz)", type: "oscillator", frequency: 528, volume: 0.03, pan: 0, waveform: "sine", enabled: true },
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
      { id: "p2_amb", name: "Ambient: Gentle River", type: "ambient", waveform: "river_soft", volume: 0.16, pan: 0, enabled: true, filterEnabled: true, filter: { type: "lowpass", frequency: 15000, Q: 0.7 } },
      { id: "l3", name: "Theta Tone (6 Hz)", type: "oscillator", frequency: 6.0, volume: 0.30, pan: 0, waveform: "sine", enabled: true },
      { id: "l4", name: "Pink Noise Bed", type: "noise", frequency: 0, volume: 0.16, pan: 0, waveform: "pink", enabled: true },
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
      { id: "p3_amb", name: "Ambient: Ocean Deep", type: "ambient", waveform: "ocean_deep", volume: 0.18, pan: 0, enabled: true, filterEnabled: true, filter: { type: "lowpass", frequency: 15000, Q: 0.7 } },
      { id: "l5", name: "Delta Tone (3 Hz)", type: "oscillator", frequency: 3.0, volume: 0.30, pan: 0, waveform: "sine", enabled: true },
      { id: "l6", name: "Brown Noise Bed", type: "noise", frequency: 0, volume: 0.16, pan: 0, waveform: "brown", enabled: true },
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
      { id: "p4_amb", name: "Ambient: Thunder Distant", type: "ambient", waveform: "thunder_distant", volume: 0.16, pan: 0, enabled: true, filterEnabled: true, filter: { type: "lowpass", frequency: 15000, Q: 0.7 } },
      { id: "l7", name: "Theta Tone (6 Hz)", type: "oscillator", frequency: 6.0, volume: 0.25, pan: 0, waveform: "sine", enabled: true },
      { id: "l8", name: "Pink Noise Bed", type: "noise", frequency: 0, volume: 0.14, pan: 0, waveform: "pink", enabled: true },
    ],
    order: 9,
  },
];

export const initialPresets = FEATURED_PRESETS;
export default FEATURED_PRESETS;
