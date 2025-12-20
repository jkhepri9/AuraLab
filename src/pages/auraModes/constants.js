// src/pages/auraModes/constants.js

import { PRESET_COLLECTIONS } from "@/data/presets";

export const GOALS = [
  { key: "sleep", label: "Sleep" },
  { key: "focus", label: "Focus" },
  { key: "calm", label: "Calm" },
  { key: "energy", label: "Energy" },
  { key: "meditate", label: "Meditate" },
  { key: "recovery", label: "Recovery" },
];

// -----------------------------------------------------------------------------
// COLLECTIONS (Back-compatible)
// - key: MUST match what `getCollection(preset)` returns today (preset.collection)
// - label: what the UI shows (registry-driven, one-click change)
// -----------------------------------------------------------------------------
//
// This lets you rename "Featured" -> "Recommended" safely by changing only:
// src/data/presets/registry.js : displayedLabel
//
// Filtering/grouping remains stable because the internal key stays legacy.
// -----------------------------------------------------------------------------

export const COLLECTIONS = [
  { key: "all", label: "All" },

  ...PRESET_COLLECTIONS.map((c) => ({
    key: c.legacyLabel,       // e.g. "Featured" (matches preset.collection)
    label: c.displayedLabel,  // e.g. "Recommended" (what user sees)
    stableKey: c.key,         // e.g. "catalog" (future migration)
  })),

  { key: "Custom", label: "Custom" },
];
