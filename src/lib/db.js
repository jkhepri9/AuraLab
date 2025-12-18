// src/lib/db.js
// -----------------------------------------------------------------------------
// AuraLab local "DB" (async facade)
// - Ships with built-in presets (featured/community/fan favorites)
// - Persists user edits to localStorage so modes survive refresh/reload
// - ✅ Adds Discover metadata defaults for user-created / legacy stored presets
// - ✅ Option A: Versionless migration that guarantees Atmospheric Drone on ALL presets
// - ✅ Adds migration: Strip "Ground State Aura —" prefix from stored presets + rename collection
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

// -----------------------------------------------------------------------------
// DISCOVER METADATA DEFAULTS (metadata-first; heuristics only when missing)
// -----------------------------------------------------------------------------
const CANONICAL_GOALS = new Set([
  "sleep",
  "focus",
  "calm",
  "energy",
  "meditate",
  "recovery",
]);

function uniq(arr) {
  const out = [];
  const seen = new Set();
  for (const v of arr || []) {
    const s = String(v || "").trim();
    if (!s) continue;
    if (seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

function toLowerUniq(arr) {
  return uniq((arr || []).map((x) => String(x || "").trim().toLowerCase()));
}

function normalizeGoals(goals, fallbackText = "") {
  // If caller gave goals, trust it (but normalize/canonicalize).
  if (Array.isArray(goals) && goals.length) {
    const normalized = toLowerUniq(goals).filter((g) => CANONICAL_GOALS.has(g));
    if (normalized.length) return normalized;
  }

  // If caller gave a legacy single "goal" field
  if (typeof goals === "string") {
    const g = goals.trim().toLowerCase();
    if (CANONICAL_GOALS.has(g)) return [g];
  }

  // Minimal heuristic ONLY when no explicit goal(s) exist:
  const t = String(fallbackText || "").toLowerCase();

  const hits = [];
  if (/\bsleep|insomnia|nap|dream|delta\b/.test(t)) hits.push("sleep");
  if (/\bfocus|study|work|flow|productiv|adhd\b/.test(t)) hits.push("focus");
  if (/\bcalm|relax|anxiety|stress|soothe|downshift\b/.test(t)) hits.push("calm");
  if (/\benergy|ignite|morning|motivation|boost\b/.test(t)) hits.push("energy");
  if (/\bmeditat|theta|breath|mindful|stillness\b/.test(t)) hits.push("meditate");
  if (/\brecover|restor|healing|reset|recovery\b/.test(t)) hits.push("recovery");

  const canonicalHits = uniq(hits.filter((g) => CANONICAL_GOALS.has(g)));
  if (canonicalHits.length) return canonicalHits.slice(0, 2);

  // Safe default: focus (neutral, non-controversial).
  return ["focus"];
}

function detectBinaural(layers) {
  const oscs = (layers || [])
    .filter((l) => (l?.type === "oscillator" || l?.type === "frequency") && (l?.enabled ?? true))
    .map((l) => ({
      pan: Number(l?.pan ?? 0),
      frequency: Number(l?.frequency ?? 0),
    }))
    .filter((x) => Number.isFinite(x.frequency));

  for (let i = 0; i < oscs.length; i++) {
    for (let j = i + 1; j < oscs.length; j++) {
      const a = oscs[i];
      const b = oscs[j];

      if (!((a.pan < -0.25 && b.pan > 0.25) || (b.pan < -0.25 && a.pan > 0.25))) continue;

      const diff = Math.abs(a.frequency - b.frequency);
      if (diff >= 0.5 && diff <= 40) return true;
    }
  }
  return false;
}

function inferStyles(layers) {
  const styles = [];
  const hasAmbient = (layers || []).some((l) => l?.type === "ambient");
  const hasNoise = (layers || []).some((l) => l?.type === "noise" || l?.type === "color");
  const hasSynth = (layers || []).some((l) => l?.type === "synth");

  if (detectBinaural(layers)) styles.push("binaural");
  if (hasAmbient) styles.push("nature");
  if (hasNoise) styles.push("noise");
  if (hasSynth) styles.push("synth");

  return uniq(styles);
}

function ensureDiscoverDefaults(preset) {
  const name = String(preset?.name || "");
  const description = String(preset?.description || "");
  const fallbackText = `${name} ${description}`;

  const layers = Array.isArray(preset?.layers) ? preset.layers : [];

  const collection = preset?.collection || "Custom";

  const goals = normalizeGoals(preset?.goals ?? preset?.goal, fallbackText);

  const styles =
    Array.isArray(preset?.styles) && preset.styles.length
      ? uniq(preset.styles.map((s) => String(s || "").trim()))
      : inferStyles(layers);

  const headphonesRecommended =
    typeof preset?.headphonesRecommended === "boolean"
      ? preset.headphonesRecommended
      : detectBinaural(layers);

  const intensity =
    typeof preset?.intensity === "number" && Number.isFinite(preset.intensity)
      ? Math.max(1, Math.min(5, Math.round(preset.intensity)))
      : 3;

  const durationHint =
    typeof preset?.durationHint === "string" && preset.durationHint.trim()
      ? preset.durationHint.trim()
      : goals.includes("sleep") || goals.includes("recovery")
        ? "60m"
        : goals.includes("energy")
          ? "15m"
          : "30m";

  const scenarios = Array.isArray(preset?.scenarios) ? uniq(preset.scenarios) : [];
  const tags = Array.isArray(preset?.tags) ? uniq(preset.tags) : [];

  return {
    ...preset,
    collection,
    goals,
    scenarios,
    styles,
    intensity,
    headphonesRecommended,
    durationHint,
    tags,
  };
}

// -----------------------------------------------------------------------------
// LAYER SAFETY
// -----------------------------------------------------------------------------
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

// -----------------------------------------------------------------------------
// GROUNDED AURA NAME/COLLECTION MIGRATION (idempotent)
// - Fixes persisted (localStorage) presets still showing old "Ground State Aura — X" names
// - Standardizes collection to "Grounded Aura Mode"
// -----------------------------------------------------------------------------
function migrateGroundedAuraNaming(preset) {
  const id = String(preset?.id || "");
  const name = String(preset?.name || "");
  const collection = String(preset?.collection || "");

  const isGroundedSet =
    id.startsWith("ga_") ||                // new ids
    id.startsWith("gs_aura_") ||           // earlier ids
    /ground\s*state\s*aura/i.test(name) || // legacy prefix in name
    /grounded\s*aura/i.test(name) ||       // variants
    /grounded\s*aura/i.test(collection);   // old collection naming

  if (!isGroundedSet) return preset;

  const stripped = name
    .replace(
      /^\s*(ground\s*state\s*aura|grounded\s*aura\s*presets|grounded\s*aura)\s*[—-]\s*/i,
      ""
    )
    .trim();

  const nextName = stripped || name;

  const nextCollection = "Grounded Aura Mode";

  return {
    ...preset,
    name: nextName,
    collection: nextCollection,
  };
}

// -----------------------------------------------------------------------------
// OPTION A — ATMOSPHERIC DRONE MIGRATION (idempotent)
// -----------------------------------------------------------------------------
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function findSubFoundationFrequency(layers) {
  const ls = Array.isArray(layers) ? layers : [];

  const subByIdOrName = ls.find((l) => {
    const id = String(l?.id || "").toLowerCase();
    const name = String(l?.name || "").toLowerCase();
    const type = String(l?.type || "").toLowerCase();
    const f = Number(l?.frequency ?? NaN);

    if (!Number.isFinite(f)) return false;
    if (!(type === "oscillator" || type === "frequency")) return false;

    return id.includes("sub") || name.includes("sub foundation") || name.startsWith("sub");
  });

  if (subByIdOrName && Number.isFinite(Number(subByIdOrName.frequency))) {
    return Number(subByIdOrName.frequency);
  }

  const candidates = ls
    .filter((l) => {
      const type = String(l?.type || "").toLowerCase();
      if (!(type === "oscillator" || type === "frequency")) return false;
      const f = Number(l?.frequency ?? NaN);
      return Number.isFinite(f) && f > 0 && f <= 140;
    })
    .map((l) => Number(l.frequency))
    .sort((a, b) => a - b);

  return candidates.length ? candidates[0] : null;
}

function pickDroneFrequency(preset) {
  const goals = Array.isArray(preset?.goals) ? preset.goals : [];
  const intensity = typeof preset?.intensity === "number" ? preset.intensity : 3;

  const primary = String(goals[0] || "").toLowerCase();

  let base;
  switch (primary) {
    case "sleep":
      base = 88;
      break;
    case "recovery":
      base = 92;
      break;
    case "calm":
      base = 96;
      break;
    case "meditate":
      base = 100;
      break;
    case "energy":
      base = 132;
      break;
    case "focus":
    default:
      base = 110;
      break;
  }

  const iAdj = Math.max(-2, Math.min(2, Math.round((Number(intensity) - 3) * 1)));
  let f = base + iAdj * 2;

  if (f < 70) f = 70;
  if (f > 160) f = 160;

  const subF = findSubFoundationFrequency(preset?.layers);
  if (Number.isFinite(subF)) {
    if (Math.abs(f - subF) < 1) {
      const up = f + 7;
      const down = f - 7;
      if (up <= 160) f = up;
      else if (down >= 70) f = down;
      else f = Math.min(160, Math.max(70, f + 3));
    }
  }

  return f;
}

function pickDroneVolume(preset) {
  const goals = Array.isArray(preset?.goals) ? preset.goals : [];
  const primary = String(goals[0] || "").toLowerCase();

  switch (primary) {
    case "energy":
      return 0.20;
    case "focus":
      return 0.17;
    case "meditate":
      return 0.15;
    case "calm":
      return 0.14;
    case "sleep":
      return 0.12;
    case "recovery":
      return 0.13;
    default:
      return 0.16;
  }
}

function ensureAtmosphericDrone(preset, seedForDefaults) {
  const layers = Array.isArray(preset?.layers) ? [...preset.layers] : [];

  const hasDrone = layers.some((l) => {
    const type = String(l?.type || "").toLowerCase();
    const wf = String(l?.waveform || "").toLowerCase();
    const id = String(l?.id || "").toLowerCase();
    return (type === "synth" && wf === "drone") || id.includes("atm_drone") || id.includes("_drone");
  });

  if (hasDrone) {
    const next = layers.map((l) => {
      const type = String(l?.type || "").toLowerCase();
      const wf = String(l?.waveform || "").toLowerCase();
      const id = String(l?.id || "").toLowerCase();
      const isDrone =
        (type === "synth" && wf === "drone") ||
        id.includes("atm_drone") ||
        id.includes("_drone");

      if (!isDrone) return l;

      const f0 = Number(l?.frequency ?? NaN);
      const safeF = Number.isFinite(f0) && f0 >= 70
        ? f0
        : pickDroneFrequency({ ...preset, layers });

      const v0 = Number(l?.volume ?? NaN);
      const safeV = Number.isFinite(v0)
        ? clamp(v0, 0.1, 0.3)
        : pickDroneVolume(preset);

      return {
        ...l,
        frequency: safeF,
        volume: safeV,
        name: `Atmospheric Drone (${safeF} Hz)`,
      };
    });

    return { ...preset, layers: next };
  }

  const f = pickDroneFrequency({ ...preset, layers });
  const v = clamp(pickDroneVolume(preset), 0.1, 0.3);

  const droneLayerRaw = {
    id: `${preset?.id || "preset"}_atm_drone`,
    name: `Atmospheric Drone (${f} Hz)`,
    type: "synth",
    frequency: f,
    volume: v,
    pan: 0,
    waveform: "drone",
    enabled: true,

    filterEnabled: true,
    filter: { type: "lowpass", frequency: 1400, Q: 0.7 },
  };

  const droneLayer = ensureLayerDefaults(droneLayerRaw, layers.length, seedForDefaults);

  let insertAt = 0;
  const subIndex = layers.findIndex((l) => {
    const id = String(l?.id || "").toLowerCase();
    const name = String(l?.name || "").toLowerCase();
    return id.includes("sub") || name.includes("sub foundation") || name.startsWith("sub");
  });

  if (subIndex >= 0) insertAt = subIndex + 1;

  const nextLayers = [...layers.slice(0, insertAt), droneLayer, ...layers.slice(insertAt)];

  return { ...preset, layers: nextLayers };
}

function normalizePreset(preset, index = 0) {
  const seed = Date.now();

  const base = {
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

  const withNamingFix = migrateGroundedAuraNaming(base);
  const withDrone = ensureAtmosphericDrone(withNamingFix, seed);
  return ensureDiscoverDefaults(withDrone);
}

function mergeBaseWithStored(base, stored) {
  const baseById = new Map(base.map((p) => [p.id, p]));
  const storedById = new Map((stored || []).map((p) => [p.id, p]));

  const merged = [];

  for (const p of stored || []) {
    merged.push(normalizePreset(p));
  }

  for (const p of base) {
    if (!storedById.has(p.id)) {
      merged.push(normalizePreset(p));
    }
  }

  merged.forEach((p, i) => {
    if (typeof p.order !== "number") p.order = i;
  });

  merged.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  // 4) Shallow-merge base behind stored for missing keys (stored wins; base fills gaps)
  // ✅ Patch: For Grounded Aura Mode presets, force base imageUrl to win (so repo updates show)
  const final = merged.map((p) => {
    const basePreset = baseById.get(p.id);
    if (!basePreset) return p;

    const mergedPreset = { ...basePreset, ...p };

    const isGrounded =
      String(mergedPreset?.collection || "") === "Grounded Aura Mode" ||
      String(basePreset?.collection || "") === "Grounded Aura Mode" ||
      String(mergedPreset?.id || "").startsWith("ga_") ||
      String(basePreset?.id || "").startsWith("ga_") ||
      String(mergedPreset?.id || "").startsWith("gs_aura_") ||
      String(basePreset?.id || "").startsWith("gs_aura_");

    if (isGrounded && basePreset?.imageUrl) {
      mergedPreset.imageUrl = basePreset.imageUrl;
    }

    return normalizePreset(mergedPreset);
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
          layers: (data?.layers || []).map((l, i) => ensureLayerDefaults(l, i, now)),
          collection: data?.collection || "Custom",
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

      presets[index] = normalizePreset({ ...presets[index], name: newName }, index);

      persist();
      return presets[index];
    },

    resetToDefaults: async () => {
      await sleep(25);
      presets = [...basePresets];
      persist();
      return true;
    },
  },
};
