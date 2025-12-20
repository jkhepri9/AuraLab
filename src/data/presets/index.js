// src/data/presets/index.js
import { initialPresets } from "./featuredPresets";
import { communityPresets } from "./communityPresets";
import { fanFavoritesPresets } from "./fanFavoritesPresets";
import { zodiacPresets } from "./zodiacPresets";
import { groundedAuraPresets } from "./groundedAuraPresets";

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
// - Fast lookup by id for Creator Mode imports
// - No behavior change for production
// -----------------------------------------------------------------------------
export const BUILTIN_PRESET_REGISTRY = allPresets.reduce((acc, p) => {
  if (p && typeof p.id === "string" && p.id) acc[p.id] = p;
  return acc;
}, {});
