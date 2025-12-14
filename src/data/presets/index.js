// src/data/presets/index.js
import { initialPresets } from "./featuredPresets";
import { communityPresets } from "./communityPresets";
import { fanFavoritesPresets } from "./fanFavoritesPresets";

export { initialPresets, communityPresets, fanFavoritesPresets };

export const allPresets = [...initialPresets, ...communityPresets, ...fanFavoritesPresets];
