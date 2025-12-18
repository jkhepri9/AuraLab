// src/data/presets/index.js
import { initialPresets } from "./featuredPresets";
import { communityPresets } from "./communityPresets";
import { fanFavoritesPresets } from "./fanFavoritesPresets";
import { zodiacPresets } from "./zodiacPresets";

export { initialPresets, communityPresets, fanFavoritesPresets, zodiacPresets };

export const allPresets = [
  ...initialPresets,
  ...communityPresets,
  ...fanFavoritesPresets,
  ...zodiacPresets,
];
