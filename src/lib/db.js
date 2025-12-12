// Mock database with default data and async simulation
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const initialPresets = [
  // -------------------------------------------------------
  // HOME FEATURED MODES (MATCHES HOME PAGE CARDS)
  // -------------------------------------------------------

  {
    id: "m_deep_sleep",
    name: "Deep Sleep",
    symbol: "☾",
    color: "linear-gradient(135deg, #0b1220, #1b2a4a)",
    imageUrl:
      "https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?q=80&w=2400&auto=format&fit=crop",
    description:
      "Binaural Delta (2 Hz): L=200 Hz, R=202 Hz + Brown noise grounding bed. Headphones recommended.",
    layers: [
      {
        id: "ds_l",
        name: "Binaural Carrier L (200 Hz)",
        type: "oscillator",
        frequency: 200,
        volume: 0.18,
        pan: -1,
        waveform: "sine",
        enabled: true,
      },
      {
        id: "ds_r",
        name: "Binaural Carrier R (202 Hz)",
        type: "oscillator",
        frequency: 202,
        volume: 0.18,
        pan: 1,
        waveform: "sine",
        enabled: true,
      },
      {
        id: "ds_brown",
        name: "Brown Noise (Grounding)",
        type: "noise",
        frequency: 0,
        volume: 0.22,
        pan: 0,
        waveform: "brown",
        enabled: true,
      },
      {
        id: "ds_sub",
        name: "Sub Drone (55 Hz)",
        type: "oscillator",
        frequency: 55,
        volume: 0.06,
        pan: 0,
        waveform: "sine",
        enabled: true,
      },
    ],
    order: 0,
  },

  {
    id: "m_theta_gate",
    name: "Theta Gate",
    symbol: "✶",
    color: "linear-gradient(135deg, #120a2a, #0b3b3a)",
    imageUrl:
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=2400&auto=format&fit=crop",
    description:
      "Binaural Theta (6 Hz): L=180 Hz, R=186 Hz + Pink noise softness. Headphones recommended.",
    layers: [
      {
        id: "tg_l",
        name: "Binaural Carrier L (180 Hz)",
        type: "oscillator",
        frequency: 180,
        volume: 0.16,
        pan: -1,
        waveform: "sine",
        enabled: true,
      },
      {
        id: "tg_r",
        name: "Binaural Carrier R (186 Hz)",
        type: "oscillator",
        frequency: 186,
        volume: 0.16,
        pan: 1,
        waveform: "sine",
        enabled: true,
      },
      {
        id: "tg_pink",
        name: "Pink Noise (Soft Field)",
        type: "noise",
        frequency: 0,
        volume: 0.20,
        pan: 0,
        waveform: "pink",
        enabled: true,
      },
      {
        id: "tg_432",
        name: "Harmonic Tone (432 Hz)",
        type: "oscillator",
        frequency: 432,
        volume: 0.05,
        pan: 0,
        waveform: "sine",
        enabled: true,
      },
    ],
    order: 1,
  },

  {
    id: "m_focus_forge",
    name: "Focus Forge",
    symbol: "⚡",
    color: "linear-gradient(135deg, #041329, #0a3a5a)",
    imageUrl:
      "https://images.unsplash.com/photo-1526378722484-bd91ca387e72?q=80&w=2400&auto=format&fit=crop",
    description:
      "Binaural Beta (14 Hz): L=210 Hz, R=224 Hz + Gray noise clarity bed. Headphones recommended.",
    layers: [
      {
        id: "ff_l",
        name: "Binaural Carrier L (210 Hz)",
        type: "oscillator",
        frequency: 210,
        volume: 0.12,
        pan: -1,
        waveform: "sine",
        enabled: true,
      },
      {
        id: "ff_r",
        name: "Binaural Carrier R (224 Hz)",
        type: "oscillator",
        frequency: 224,
        volume: 0.12,
        pan: 1,
        waveform: "sine",
        enabled: true,
      },
      {
        id: "ff_gray",
        name: "Gray Noise (Attention Bed)",
        type: "noise",
        frequency: 0,
        volume: 0.14,
        pan: 0,
        waveform: "gray",
        enabled: true,
      },
      {
        id: "ff_528",
        name: "Anchor Tone (528 Hz)",
        type: "oscillator",
        frequency: 528,
        volume: 0.04,
        pan: 0,
        waveform: "sine",
        enabled: true,
      },
    ],
    order: 2,
  },

  {
    id: "m_heart_coherence",
    name: "Heart Coherence",
    symbol: "❤",
    color: "linear-gradient(135deg, #2a0b12, #3a1b4a)",
    imageUrl:
      "https://images.unsplash.com/photo-1516627145497-ae6968895b74?q=80&w=2400&auto=format&fit=crop",
    description:
      "Binaural Alpha (10 Hz): L=200 Hz, R=210 Hz + Pink noise warmth. Headphones recommended.",
    layers: [
      {
        id: "hc_l",
        name: "Binaural Carrier L (200 Hz)",
        type: "oscillator",
        frequency: 200,
        volume: 0.14,
        pan: -1,
        waveform: "sine",
        enabled: true,
      },
      {
        id: "hc_r",
        name: "Binaural Carrier R (210 Hz)",
        type: "oscillator",
        frequency: 210,
        volume: 0.14,
        pan: 1,
        waveform: "sine",
        enabled: true,
      },
      {
        id: "hc_pink",
        name: "Pink Noise (Warmth)",
        type: "noise",
        frequency: 0,
        volume: 0.18,
        pan: 0,
        waveform: "pink",
        enabled: true,
      },
      {
        id: "hc_drone",
        name: "Low Drone (110 Hz)",
        type: "oscillator",
        frequency: 110,
        volume: 0.05,
        pan: 0,
        waveform: "sine",
        enabled: true,
      },
    ],
    order: 3,
  },

  {
    id: "m_shielded_calm",
    name: "Shielded Calm",
    symbol: "⛨",
    color: "linear-gradient(135deg, #0a1f1a, #0a2a20)",
    imageUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=2400&auto=format&fit=crop",
    description:
      "Binaural Alpha (10 Hz): L=220 Hz, R=230 Hz + Brown noise grounding. Headphones recommended.",
    layers: [
      {
        id: "sc_l",
        name: "Binaural Carrier L (220 Hz)",
        type: "oscillator",
        frequency: 220,
        volume: 0.14,
        pan: -1,
        waveform: "sine",
        enabled: true,
      },
      {
        id: "sc_r",
        name: "Binaural Carrier R (230 Hz)",
        type: "oscillator",
        frequency: 230,
        volume: 0.14,
        pan: 1,
        waveform: "sine",
        enabled: true,
      },
      {
        id: "sc_brown",
        name: "Brown Noise (Shield Bed)",
        type: "noise",
        frequency: 0,
        volume: 0.16,
        pan: 0,
        waveform: "brown",
        enabled: true,
      },
      {
        id: "sc_sub",
        name: "Sub Drone (60 Hz)",
        type: "oscillator",
        frequency: 60,
        volume: 0.05,
        pan: 0,
        waveform: "sine",
        enabled: true,
      },
    ],
    order: 4,
  },

  {
    id: "m_energy_ignition",
    name: "Energy Ignition",
    symbol: "✹",
    color: "linear-gradient(135deg, #1a0a00, #5a1a00)",
    imageUrl:
      "https://images.unsplash.com/photo-1519682577862-22b62b24e493?q=80&w=2400&auto=format&fit=crop",
    description:
      "Binaural (12 Hz): L=180 Hz, R=192 Hz + Silver noise sparkle. Headphones recommended.",
    layers: [
      {
        id: "ei_l",
        name: "Binaural Carrier L (180 Hz)",
        type: "oscillator",
        frequency: 180,
        volume: 0.12,
        pan: -1,
        waveform: "sine",
        enabled: true,
      },
      {
        id: "ei_r",
        name: "Binaural Carrier R (192 Hz)",
        type: "oscillator",
        frequency: 192,
        volume: 0.12,
        pan: 1,
        waveform: "sine",
        enabled: true,
      },
      {
        id: "ei_silver",
        name: "Silver Noise (Spark)",
        type: "noise",
        frequency: 0,
        volume: 0.10,
        pan: 0,
        waveform: "silver",
        enabled: true,
      },
      {
        id: "ei_528",
        name: "Topline Tone (528 Hz)",
        type: "oscillator",
        frequency: 528,
        volume: 0.04,
        pan: 0,
        waveform: "sine",
        enabled: true,
      },
    ],
    order: 5,
  },

  // -------------------------------------------------------
  // ORIGINAL DEFAULTS (FIXED: type + enabled + noise waveforms)
  // -------------------------------------------------------

  {
    id: "p1",
    name: "Deep Focus",
    color: "linear-gradient(135deg, #1e3a8a, #0c4a6e)",
    imageUrl:
      "https://images.unsplash.com/photo-1546410531-d8527a051d95?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    layers: [
      {
        id: "l1",
        name: "Alpha Tone (8 Hz)",
        type: "oscillator",
        frequency: 8.0,
        volume: 0.35,
        pan: 0,
        waveform: "sine",
        enabled: true,
      },
      {
        id: "l2",
        name: "White Noise Bed",
        type: "noise",
        frequency: 0,
        volume: 0.18,
        pan: 0,
        waveform: "white",
        enabled: true,
      },
    ],
    order: 6,
  },

  {
    id: "p2",
    name: "Zen Garden",
    color: "linear-gradient(135deg, #059669, #065f46)",
    imageUrl:
      "https://images.unsplash.com/photo-1547926179-883a93c78096?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    layers: [
      {
        id: "l3",
        name: "Theta Tone (6 Hz)",
        type: "oscillator",
        frequency: 6.0,
        volume: 0.30,
        pan: 0,
        waveform: "sine",
        enabled: true,
      },
      {
        id: "l4",
        name: "Pink Noise Bed",
        type: "noise",
        frequency: 0,
        volume: 0.18,
        pan: 0,
        waveform: "pink",
        enabled: true,
      },
    ],
    order: 7,
  },

  {
    id: "p3",
    name: "Oceanic Flow",
    color: "linear-gradient(135deg, #0ea5e9, #0f766e)",
    imageUrl:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    layers: [
      {
        id: "l5",
        name: "Delta Tone (2 Hz)",
        type: "oscillator",
        frequency: 2.0,
        volume: 0.30,
        pan: 0,
        waveform: "sine",
        enabled: true,
      },
      {
        id: "l6",
        name: "Ocean Bed (Filtered Noise)",
        type: "noise",
        frequency: 0,
        volume: 0.16,
        pan: 0,
        waveform: "ocean",
        enabled: true,
      },
    ],
    order: 8,
  },
];

let presets = [...initialPresets];

export const db = {
  presets: {
    list: async () => {
      await sleep(100);
      // Sort by the 'order' property for display consistency
      return presets.sort((a, b) => a.order - b.order);
    },
    get: async (id) => {
      await sleep(100);
      return presets.find((p) => p.id === id);
    },
    create: async (data) => {
      await sleep(100);
      const newPreset = {
        ...data,
        id: `p${Date.now()}`,
        color: data.color || initialPresets[0].color,
        imageUrl:
          data.imageUrl ||
          "https://images.unsplash.com/photo-1534000305147-380290196881?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        layers: (data.layers || []).map((l, i) => ({
          id: l.id || `${Date.now()}_${i}`,
          name: l.name || `Layer ${i + 1}`,
          type: l.type || "oscillator",
          frequency: l.frequency ?? (l.type === "noise" ? 0 : 432),
          volume: l.volume ?? 0.2,
          pan: l.pan ?? 0,
          waveform: l.waveform || "sine",
          enabled: l.enabled ?? true,
          pulseRate: l.pulseRate ?? 0,
          pulseDepth: l.pulseDepth ?? 0,
          filter: l.filter || { frequency: 20000, Q: 1 },
        })),
        order: presets.length,
      };
      presets.push(newPreset);
      return newPreset;
    },
    update: async (id, data) => {
      await sleep(100);
      const index = presets.findIndex((p) => p.id === id);
      if (index !== -1) {
        presets[index] = { ...presets[index], ...data };
        return presets[index];
      }
      return null;
    },
    delete: async (id) => {
      await sleep(100);
      presets = presets.filter((p) => p.id !== id);
      return true;
    },
    reorder: async (id, direction) => {
      await sleep(50);
      const index = presets.findIndex((p) => p.id === id);
      if (index === -1) return false;

      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= presets.length) return false;

      // Swap the order value
      const currentOrder = presets[index].order;
      presets[index].order = presets[targetIndex].order;
      presets[targetIndex].order = currentOrder;

      // Sort the array by the new order values to ensure the next list call is correct
      presets.sort((a, b) => a.order - b.order);

      return true;
    },
    rename: async (id, newName) => {
      await sleep(100);
      const index = presets.findIndex((p) => p.id === id);
      if (index !== -1) {
        presets[index].name = newName;
        return presets[index];
      }
      return null;
    },
  },
};
