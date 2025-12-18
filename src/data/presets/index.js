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
