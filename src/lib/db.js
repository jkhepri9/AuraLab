// src/lib/db.js
import { allPresets, initialPresets } from "@/data/presets";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let presets = [...allPresets];

export const db = {
  presets: {
    list: async () => {
      await sleep(100);
      return [...presets].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    },

    get: async (id) => {
      await sleep(100);
      return presets.find((p) => p.id === id);
    },

    create: async (data) => {
      await sleep(100);

      const now = Date.now();
      const newPreset = {
        ...data,
        id: `p${now}`,
        color:
          data.color ||
          initialPresets?.[0]?.color ||
          "linear-gradient(135deg, #111, #000)",
        imageUrl:
          data.imageUrl ||
          "https://images.unsplash.com/photo-1534000305147-380290196881?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        layers: (data.layers || []).map((l, i) => ({
          id: l.id || `${now}_${i}`,
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
        order: typeof data.order === "number" ? data.order : presets.length,
      };

      presets.push(newPreset);
      return newPreset;
    },

    update: async (id, data) => {
      await sleep(100);
      const index = presets.findIndex((p) => p.id === id);
      if (index === -1) return null;
      presets[index] = { ...presets[index], ...data };
      return presets[index];
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

      presets[index].order = presets[index].order ?? index;
      presets[targetIndex].order = presets[targetIndex].order ?? targetIndex;

      const tmp = presets[index].order;
      presets[index].order = presets[targetIndex].order;
      presets[targetIndex].order = tmp;

      presets.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      return true;
    },

    rename: async (id, newName) => {
      await sleep(100);
      const index = presets.findIndex((p) => p.id === id);
      if (index === -1) return null;
      presets[index].name = newName;
      return presets[index];
    },
  },
};
