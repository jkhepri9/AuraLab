// src/editor/audio/engine/layers/PulseController.js
// -----------------------------------------------------------------------------
// AuraLab — Pulse (LFO) Controller
// Extracts:
// - Per-layer pulse modulation (tremolo/gating) using Oscillator + ConstantSource
// - Safe attach/detach to a group's amp.gain AudioParam
// -----------------------------------------------------------------------------
//
// Expected group shape:
// - group.amp: GainNode
// - group.pulse: { osc, lfoGain, offset } | null
//

import { clamp } from "../utils/helpers";

export function createPulseController(adapter = {}) {
  const { getCtx } = adapter;

  const _ctx = () => (typeof getCtx === "function" ? getCtx() : null);

  function remove(group) {
    if (!group || !group.pulse) return;

    const { osc, lfoGain, offset } = group.pulse;

    try {
      osc?.stop?.();
    } catch {}
    try {
      osc?.disconnect?.();
    } catch {}

    try {
      lfoGain?.disconnect?.();
    } catch {}

    try {
      offset?.stop?.();
    } catch {}
    try {
      offset?.disconnect?.();
    } catch {}

    group.pulse = null;
  }

  function sync(group, layer) {
    const ctx = _ctx();
    if (!ctx) return;
    if (!group || !group.amp) return;

    const rate = clamp(layer?.pulseRate ?? 0, 0, 20);
    const depth = clamp(layer?.pulseDepth ?? 0, 0, 1);

    const t = ctx.currentTime;

    // Disabled: remove modulation and return to unity gain.
    if (rate <= 0 || depth <= 0) {
      remove(group);
      try {
        group.amp.gain.setTargetAtTime(1.0, t, 0.02);
      } catch {}
      return;
    }

    // Enabled: create nodes if missing.
    if (!group.pulse || !group.pulse.osc || !group.pulse.lfoGain || !group.pulse.offset) {
      remove(group);

      const osc = ctx.createOscillator();
      osc.type = "sine";

      const lfoGain = ctx.createGain();
      const offset = ctx.createConstantSource();

      // amp.gain = offset + (osc * lfoGain)
      osc.connect(lfoGain);
      lfoGain.connect(group.amp.gain);
      offset.connect(group.amp.gain);

      try {
        osc.start();
      } catch {}
      try {
        offset.start();
      } catch {}

      group.pulse = { osc, lfoGain, offset };
    }

    const lfoAmp = depth / 2;
    const dc = 1 - lfoAmp;

    try {
      group.pulse.osc.frequency.setTargetAtTime(rate, t, 0.02);
    } catch {}
    try {
      group.pulse.lfoGain.gain.setTargetAtTime(lfoAmp, t, 0.02);
    } catch {}
    try {
      group.pulse.offset.offset.setTargetAtTime(dc, t, 0.02);
    } catch {}
  }

  return { sync, remove };
}
