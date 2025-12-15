// src/lib/db.js
// -----------------------------------------------------------------------------
// AuraLab local "DB" (async facade)
// - Ships with built-in presets (featured/community/fan favorites)
// - Persists user edits to localStorage so modes survive refresh/reload
// -----------------------------------------------------------------------------

import { allPresets, initialPresets } from "@/data/presets";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// -----------------------------------------------------------------------------
// PERSISTENCE
// -----------------------------------------------------------------------------
const STORAGE_KEY = "auralab.presets.v1";

function safeJsonParse(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

function readStoredPresets() {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  const data = safeJsonParse(raw);
  if (!data) return null;

  // Back-compat: allow direct array
  if (Array.isArray(data)) return data;

  if (data && typeof data === "object" && Array.isArray(data.presets)) {
    return data.presets;
  }

  return null;
}

function writeStoredPresets(nextPresets) {
  if (typeof window === "undefined") return;

  try {
    const payload = {
      schema: 1,
      updatedAt: Date.now(),
      presets: nextPresets,
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // localStorage may be full or blocked; app should still function.
  }
}

function ensureLayerDefaults(layer, i, seed) {
  const id = layer?.id || `${seed}_${i}`;

  return {
    id,
    name: layer?.name || `Layer ${i + 1}`,
    type: layer?.type || "oscillator",

    // Oscillator / synth
    frequency:
      layer?.frequency ??
      (layer?.type === "noise" || layer?.type === "color" ? 0 : 432),

    // Shared
    volume: layer?.volume ?? 0.2,
    pan: layer?.pan ?? 0,
    waveform: layer?.waveform || "sine",
    enabled: layer?.enabled ?? true,

    // Pulse (if you use it in UI)
    pulseRate: layer?.pulseRate ?? 0,
    pulseDepth: layer?.pulseDepth ?? 0,

    // Filter
    filterEnabled: layer?.filterEnabled ?? true,
    filter: layer?.filter || { type: "lowpass", frequency: 20000, Q: 1 },
  };
}

function normalizePreset(preset, index = 0) {
  const seed = Date.now();

  return {
    ...preset,
    id: preset?.id || `p${seed}_${index}`,
    name: preset?.name || `Aura Mode ${index + 1}`,
    color:
      preset?.color ||
      initialPresets?.[0]?.color ||
      "linear-gradient(135deg, #111, #000)",
    imageUrl:
      preset?.imageUrl ||
      "https://images.unsplash.com/photo-1534000305147-380290196881?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    description: preset?.description || "",
    layers: Array.isArray(preset?.layers)
      ? preset.layers.map((l, i) => ensureLayerDefaults(l, i, seed))
      : [],
    order: typeof preset?.order === "number" ? preset.order : index,
  };
}

function mergeBaseWithStored(base, stored) {
  // Strategy:
  // - If stored exists: use stored as the source of truth for those IDs
  // - Keep any built-in presets that are missing from stored
  // - Keep any user-created presets that are not in base

  const baseById = new Map(base.map((p) => [p.id, p]));
  const storedById = new Map((stored || []).map((p) => [p.id, p]));

  const merged = [];

  // 1) Start with stored, but normalize to ensure app safety
  for (const p of stored || []) {
    merged.push(normalizePreset(p));
  }

  // 2) Append any base presets not present in stored
  for (const p of base) {
    if (!storedById.has(p.id)) {
      merged.push(normalizePreset(p));
    }
  }

  // 3) Guarantee stable ordering
  merged.forEach((p, i) => {
    if (typeof p.order !== "number") p.order = i;
  });

  merged.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  // 4) If base preset exists and stored preset is missing new fields in future,
  // we can shallow-merge base behind stored for those same IDs.
  // (Stored wins; base fills in missing keys.)
  const final = merged.map((p) => {
    const basePreset = baseById.get(p.id);
    if (!basePreset) return p;
    return normalizePreset({ ...basePreset, ...p });
  });

  return final;
}

// -----------------------------------------------------------------------------
// IN-MEMORY STATE (backed by localStorage)
// -----------------------------------------------------------------------------
const basePresets = (allPresets || []).map((p, i) => normalizePreset(p, i));
const storedPresets = readStoredPresets();

let presets = storedPresets
  ? mergeBaseWithStored(basePresets, storedPresets)
  : [...basePresets];

// Ensure the stored payload remains compatible with any new defaults
if (storedPresets) {
  writeStoredPresets(presets);
}

function persist() {
  writeStoredPresets(presets);
}

function getNextId() {
  return `p${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

// -----------------------------------------------------------------------------
// DB API
// -----------------------------------------------------------------------------
export const db = {
  presets: {
    list: async () => {
      await sleep(50);
      return [...presets].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    },

    get: async (id) => {
      await sleep(25);
      return presets.find((p) => p.id === id);
    },

    create: async (data) => {
      await sleep(50);

      const now = Date.now();

      const newPreset = normalizePreset(
        {
          ...data,
          id: data?.id || getNextId(),
          order: typeof data?.order === "number" ? data.order : presets.length,
          // Ensure layers exist with defaults
          layers: (data?.layers || []).map((l, i) =>
            ensureLayerDefaults(l, i, now)
          ),
        },
        presets.length
      );

      presets.push(newPreset);
      persist();
      return newPreset;
    },

    update: async (id, data) => {
      await sleep(50);
      const index = presets.findIndex((p) => p.id === id);
      if (index === -1) return null;

      const current = presets[index];

      // If layers provided, normalize them (ensure IDs + safety defaults)
      const next = {
        ...current,
        ...data,
        layers: Array.isArray(data?.layers)
          ? data.layers.map((l, i) => ensureLayerDefaults(l, i, Date.now()))
          : current.layers,
      };

      presets[index] = normalizePreset(next, index);
      persist();
      return presets[index];
    },

    delete: async (id) => {
      await sleep(50);
      presets = presets.filter((p) => p.id !== id);

      // Re-compact orders
      presets = presets
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((p, i) => ({ ...p, order: i }));

      persist();
      return true;
    },

    reorder: async (id, direction) => {
      await sleep(25);

      const sorted = [...presets].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      const index = sorted.findIndex((p) => p.id === id);
      if (index === -1) return false;

      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= sorted.length) return false;

      const a = sorted[index];
      const b = sorted[targetIndex];

      const tmp = a.order;
      a.order = b.order;
      b.order = tmp;

      presets = sorted
        .sort((x, y) => (x.order ?? 0) - (y.order ?? 0))
        .map((p, i) => ({ ...p, order: i }));

      persist();
      return true;
    },

    rename: async (id, newName) => {
      await sleep(50);
      const index = presets.findIndex((p) => p.id === id);
      if (index === -1) return null;
      presets[index] = { ...presets[index], name: newName };
      persist();
      return presets[index];
    },

    // Optional utility for you during testing/debugging
    resetToDefaults: async () => {
      await sleep(25);
      presets = [...basePresets];
      persist();
      return true;
    },
  },
};
