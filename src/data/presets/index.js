// src/data/presets/index.js

import { initialPresets } from "./featuredPresets";
import { communityPresets } from "./communityPresets";
import { fanFavoritesPresets } from "./fanFavoritesPresets";
import { zodiacPresets } from "./zodiacPresets";
import { groundedAuraPresets } from "./groundedAuraPresets";

// ✅ Registry exports (single source of truth)
export {
  PRESET_COLLECTION_KEYS,
  PRESET_COLLECTIONS,

  // Newer helpers
  getCollectionMetaByKey,
  getCollectionMetaByLegacyLabel,
  getCollectionLabelByKey,
  getCollectionLabelByLegacyLabel,
  getPresetsByCollectionKey,
  getNormalizedCollections,
  getAllPresetsNormalized,

  // Back-compat helpers (expected by older imports)
  getCollectionMeta,
  getCollectionLabel,
} from "./registry";

// ✅ Backward-compatible exports (do not break existing imports)
export {
  initialPresets,
  communityPresets,
  fanFavoritesPresets,
  zodiacPresets,
  groundedAuraPresets,
};

export const allPresets = [
  ...initialPresets,
  ...communityPresets,
  ...fanFavoritesPresets,
  ...zodiacPresets,
  ...groundedAuraPresets,
];

// -----------------------------------------------------------------------------
// ✅ Built-in preset registry (DEV tooling)
// -----------------------------------------------------------------------------
export const BUILTIN_PRESET_REGISTRY = allPresets.reduce((acc, p) => {
  if (p && typeof p.id === "string" && p.id) acc[p.id] = p;
  return acc;
}, {});
