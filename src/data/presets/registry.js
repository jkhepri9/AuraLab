// src/data/presets/registry.js
// -----------------------------------------------------------------------------
// AuraLab — Preset Collections Registry (Single Source of Truth)
// Now supports auto-loaded collections from ./collections/*
//
// Fix included:
// ✅ FINAL merged ordering across built-ins + extras (by `order`, then label)
// This allows new collections with `collectionMeta.order: 1` to appear above Featured, etc.
// -----------------------------------------------------------------------------

import { initialPresets } from "./featuredPresets";
import { communityPresets } from "./communityPresets";
import { fanFavoritesPresets } from "./fanFavoritesPresets";
import { zodiacPresets } from "./zodiacPresets";
import { groundedAuraPresets } from "./groundedAuraPresets";

// ✅ Stable collection keys for core built-ins (treat as permanent).
export const PRESET_COLLECTION_KEYS = Object.freeze({
  CATALOG: "catalog",
  COMMUNITY: "community",
  FAN_FAVORITES: "fan_favorites",
  ZODIAC: "zodiac",
  GROUNDED: "grounded",
});

// -----------------------------------------------------------------------------
// ✅ Auto-load additional collections
// Convention: each module exports { collectionMeta, presets }
// -----------------------------------------------------------------------------
function loadExtraCollections() {
  // Vite/Rollup feature. If you ever move off Vite, we’d replace this.
  const modules = import.meta.glob("./collections/*.js", { eager: true });

  const extras = [];

  for (const [path, mod] of Object.entries(modules)) {
    const meta = mod?.collectionMeta;
    const presets = mod?.presets || mod?.default;

    if (!meta || typeof meta !== "object") {
      console.warn(
        `[AuraLab] Skipping collection module (missing collectionMeta):`,
        path
      );
      continue;
    }
    if (!Array.isArray(presets)) {
      console.warn(
        `[AuraLab] Skipping collection module (missing presets array):`,
        path
      );
      continue;
    }

    const legacyLabel = String(meta.legacyLabel || "").trim();
    const displayedLabel = String(meta.displayedLabel || legacyLabel || "").trim();
    const key = String(meta.key || "").trim();
    const source = String(meta.source || path).trim();
    const order = Number.isFinite(Number(meta.order)) ? Number(meta.order) : 999;

    if (!legacyLabel || !displayedLabel || !key) {
      console.warn(`[AuraLab] Skipping collection module (bad meta):`, path, meta);
      continue;
    }

    extras.push({
      key,
      legacyLabel,
      displayedLabel,
      source,
      order,
      getPresets: () => presets,
    });
  }

  // Stable ordering: by meta.order then label (for extras-only)
  extras.sort((a, b) => {
    const ao = Number.isFinite(Number(a?.order)) ? Number(a.order) : 999;
    const bo = Number.isFinite(Number(b?.order)) ? Number(b.order) : 999;
    if (ao !== bo) return ao - bo;
    return String(a.displayedLabel || "").localeCompare(String(b.displayedLabel || ""));
  });

  return extras;
}

// -----------------------------------------------------------------------------
// ✅ Built-in collections (manual, stable)
// -----------------------------------------------------------------------------
const BUILTIN_COLLECTIONS = [
  {
    key: PRESET_COLLECTION_KEYS.CATALOG,
    legacyLabel: "Featured",
    displayedLabel: "Sacred Modes",
    source: "initialPresets",
    order: 4,
    getPresets: () => initialPresets,
  },
  {
    key: PRESET_COLLECTION_KEYS.ZODIAC,
    legacyLabel: "Zodiac",
    displayedLabel: "Zodiac",
    source: "zodiacPresets",
    order: 2,
    getPresets: () => zodiacPresets,
  },
  {
    key: PRESET_COLLECTION_KEYS.GROUNDED,
    legacyLabel: "Grounded Aura Mode",
    displayedLabel: "Grounded Aura Mode",
    source: "groundedAuraPresets",
    order: 3,
    getPresets: () => groundedAuraPresets,
  },
  {
    key: PRESET_COLLECTION_KEYS.COMMUNITY,
    legacyLabel: "Community",
    displayedLabel: "Community",
    source: "communityPresets",
    order: 5,
    getPresets: () => communityPresets,
  },
  {
    key: PRESET_COLLECTION_KEYS.FAN_FAVORITES,
    legacyLabel: "Fan Favorites",
    displayedLabel: "Fan Favorite Modes",
    source: "fanFavoritesPresets",
    order: 1,
    getPresets: () => fanFavoritesPresets,
  },
];

const EXTRA_COLLECTIONS = loadExtraCollections();

// -----------------------------------------------------------------------------
// Merge + de-dupe by legacyLabel (legacyLabel is what grouping uses in your UI)
// -----------------------------------------------------------------------------
const merged = [];
const seenLegacy = new Set();

for (const c of [...BUILTIN_COLLECTIONS, ...EXTRA_COLLECTIONS]) {
  const legacy = String(c?.legacyLabel || "").trim();
  if (!legacy) continue;
  if (seenLegacy.has(legacy)) continue;
  seenLegacy.add(legacy);
  merged.push(c);
}

// ✅ FINAL ordering across built-ins + extras (by order, then label)
merged.sort((a, b) => {
  const ao = Number.isFinite(Number(a?.order)) ? Number(a.order) : 999;
  const bo = Number.isFinite(Number(b?.order)) ? Number(b.order) : 999;
  if (ao !== bo) return ao - bo;

  const al = String(a?.displayedLabel || a?.legacyLabel || "");
  const bl = String(b?.displayedLabel || b?.legacyLabel || "");
  return al.localeCompare(bl);
});

// ✅ One-click edits live on displayedLabel (for built-ins and extras).
export const PRESET_COLLECTIONS = Object.freeze(
  merged.map((c) => Object.freeze(c))
);

// -----------------------------------------------------------------------------
// Primary helpers (newer API)
// -----------------------------------------------------------------------------
export function getCollectionMetaByKey(key) {
  return PRESET_COLLECTIONS.find((c) => c.key === key) || null;
}

export function getCollectionMetaByLegacyLabel(legacyLabel) {
  const s = String(legacyLabel || "");
  return PRESET_COLLECTIONS.find((c) => c.legacyLabel === s) || null;
}

export function getCollectionLabelByKey(key) {
  const meta = getCollectionMetaByKey(key);
  return meta ? meta.displayedLabel : "";
}

export function getCollectionLabelByLegacyLabel(legacyLabel) {
  const meta = getCollectionMetaByLegacyLabel(legacyLabel);
  return meta ? meta.displayedLabel : String(legacyLabel || "");
}

export function getPresetsByCollectionKey(key) {
  const meta = getCollectionMetaByKey(key);
  return meta ? meta.getPresets() : [];
}

export function getNormalizedCollections() {
  return PRESET_COLLECTIONS.map((c) => ({
    key: c.key,
    legacyLabel: c.legacyLabel,
    label: c.displayedLabel,
    source: c.source,
    presets: (c.getPresets() || []).map((p) => ({
      ...p,
      collectionKey: c.key,
      collectionLabel: c.displayedLabel,
      collectionLegacyLabel: c.legacyLabel,
    })),
  }));
}

export function getAllPresetsNormalized() {
  const collections = getNormalizedCollections();
  const out = [];
  for (const col of collections) {
    for (const p of col.presets) out.push(p);
  }
  return out;
}

// -----------------------------------------------------------------------------
// Backward-compatible aliases (old API)
// -----------------------------------------------------------------------------
export function getCollectionMeta(keyOrLegacyLabel) {
  const s = String(keyOrLegacyLabel || "");
  return getCollectionMetaByKey(s) || getCollectionMetaByLegacyLabel(s) || null;
}

export function getCollectionLabel(keyOrLegacyLabel) {
  const s = String(keyOrLegacyLabel || "");
  return getCollectionLabelByKey(s) || getCollectionLabelByLegacyLabel(s) || "";
}
