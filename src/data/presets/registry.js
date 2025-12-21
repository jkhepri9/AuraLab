// src/data/presets/registry.js
// -----------------------------------------------------------------------------
// AuraLab — Preset Collections Registry (Single Source of Truth)
// Goal: one-click label edits without renaming files or breaking imports.
//
// Key principles:
// - Stable internal keys (do not change): catalog, community, fan_favorites, zodiac, grounded, master_sequence
// - legacyLabel matches preset.collection values currently stored in presets (back-compat)
// - displayedLabel is what the UI shows (safe to change anytime)
// -----------------------------------------------------------------------------

import { initialPresets } from "./featuredPresets";
import { communityPresets } from "./communityPresets";
import { fanFavoritesPresets } from "./fanFavoritesPresets";
import { zodiacPresets } from "./zodiacPresets";
import { groundedAuraPresets } from "./groundedAuraPresets";
import { masterSequencePresets } from "./masterSequencePresets";

// ✅ Stable collection keys (internal API). Treat these as permanent.
export const PRESET_COLLECTION_KEYS = Object.freeze({
  CATALOG: "catalog",
  COMMUNITY: "community",
  FAN_FAVORITES: "fan_favorites",
  ZODIAC: "zodiac",
  GROUNDED: "grounded",
  MASTER_SEQUENCE: "master_sequence",
});

// ✅ One-click edits live here (displayedLabel).
// legacyLabel must match what presets currently store in `preset.collection`.
export const PRESET_COLLECTIONS = Object.freeze([
  {
    key: PRESET_COLLECTION_KEYS.CATALOG,
    legacyLabel: "Featured",
    displayedLabel: "Sacred Modes", // <-- one-click rename target (e.g. "Recommended")
    source: "initialPresets",
    getPresets: () => initialPresets,
  },
  {
    key: PRESET_COLLECTION_KEYS.MASTER_SEQUENCE,
    legacyLabel: "Master Sequence Modes",
    displayedLabel: "Master Sequence",
    source: "masterSequencePresets",
    getPresets: () => masterSequencePresets,
  },
  {
    key: PRESET_COLLECTION_KEYS.ZODIAC,
    legacyLabel: "Zodiac",
    displayedLabel: "Zodiac",
    source: "zodiacPresets",
    getPresets: () => zodiacPresets,
  },
  {
    key: PRESET_COLLECTION_KEYS.GROUNDED,
    legacyLabel: "Grounded Aura Mode",
    displayedLabel: "Grounded Aura Mode",
    source: "groundedAuraPresets",
    getPresets: () => groundedAuraPresets,
  },
  {
    key: PRESET_COLLECTION_KEYS.COMMUNITY,
    legacyLabel: "Community",
    displayedLabel: "Community",
    source: "communityPresets",
    getPresets: () => communityPresets,
  },
  {
    key: PRESET_COLLECTION_KEYS.FAN_FAVORITES,
    legacyLabel: "Fan Favorites",
    displayedLabel: "Fan Favorite Modes",
    source: "fanFavoritesPresets",
    getPresets: () => fanFavoritesPresets,
  },
]);

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

// Normalized view for UIs that want explicit collection info.
// Returns shallow copies; does not mutate original objects.
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
// These prevent breakage where other files import legacy function names.
// -----------------------------------------------------------------------------

// Old name expected by other parts of the app:
export function getCollectionMeta(keyOrLegacyLabel) {
  // Heuristic: if it matches a stable key, treat as key; else treat as legacy label.
  const s = String(keyOrLegacyLabel || "");
  return getCollectionMetaByKey(s) || getCollectionMetaByLegacyLabel(s) || null;
}

export function getCollectionLabel(keyOrLegacyLabel) {
  const s = String(keyOrLegacyLabel || "");
  return getCollectionLabelByKey(s) || getCollectionLabelByLegacyLabel(s) || "";
}
