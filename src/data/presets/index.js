// src/data/presets/index.js

import { initialPresets } from "./featuredPresets";
import { communityPresets } from "./communityPresets";
import { fanFavoritesPresets } from "./fanFavoritesPresets";
import { zodiacPresets } from "./zodiacPresets";
import { groundedAuraPresets } from "./groundedAuraPresets";

// ✅ Import the registry value so allPresets includes auto-loaded collections
import { PRESET_COLLECTIONS } from "./registry";

// ✅ Registry exports (single source of truth)
export {
  PRESET_COLLECTION_KEYS,
  PRESET_COLLECTIONS,
  getCollectionMetaByKey,
  getCollectionMetaByLegacyLabel,
  getCollectionLabelByKey,
  getCollectionLabelByLegacyLabel,
  getPresetsByCollectionKey,
  getNormalizedCollections,
  getAllPresetsNormalized,
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

// ✅ Auto-built: includes built-ins + anything in ./collections/
export const allPresets = PRESET_COLLECTIONS.reduce((acc, c) => {
  const list = c?.getPresets?.() || [];
  if (Array.isArray(list)) acc.push(...list);
  return acc;
}, []);

// -----------------------------------------------------------------------------
// ✅ Built-in preset registry (DEV tooling)
// -----------------------------------------------------------------------------
export const BUILTIN_PRESET_REGISTRY = allPresets.reduce((acc, p) => {
  if (p && typeof p.id === "string" && p.id) acc[p.id] = p;
  return acc;
}, {});
