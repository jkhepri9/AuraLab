// src/data/presets/index.js
import { initialPresets } from "./featuredPresets";
import { communityPresets } from "./communityPresets";

export { initialPresets, communityPresets };

export const allPresets = [...initialPresets, ...communityPresets];
