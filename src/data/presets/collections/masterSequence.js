// src/data/presets/collections/masterSequence.js
import { masterSequencePresets } from "../masterSequencePresets";

// Convention: each module exports { collectionMeta, presets }
export const collectionMeta = {
  key: "master_sequence",
  legacyLabel: "Master Sequence",   // MUST match preset.collection grouping
  displayedLabel: "Master Sequence",
  order: 3.5, // ✅ Above Sacred Modes (order 4), below Grounded (order 3)
};

export const presets = masterSequencePresets;
