// src/editor/audio/engine/motion/MotionController.js
// -----------------------------------------------------------------------------
// AuraLab — Motion Controller (internal)
// - Parameter drift (volume + filter cutoff)
// - Sparse micro-accents (one-shots)
// -----------------------------------------------------------------------------
//
// This module is intentionally "engine-adapter" based. It does not import the
// AudioEngine directly. Instead, it consumes a minimal adapter interface so the
// AudioEngine remains the orchestrator.
//
// Adapter must provide:
// - getCtx(): AudioContext | null
// - getIsPlaying(): boolean
// - getLayers(): Map<id, group>
// - getMasterInput(): AudioNode | null
//
// Config is a reference to the engine's this._motion object.
// -----------------------------------------------------------------------------

import { clamp, randRange, pick } from "../utils/helpers";

export function createMotionController(adapter, motionConfigRef) {
  return new MotionController(adapter, motionConfigRef);
}

export default class MotionController {
  constructor(adapter, motionConfigRef) {
    this.adapter = adapter;
    this.cfg = motionConfigRef;
  }

  start() {
    this.stop();
    if (!this.cfg?.enabled) return;

    // Parameter drift tick
    this.cfg._driftTimer = setInterval(() => {
      const ctx = this.adapter.getCtx?.();
      if (!this.adapter.getIsPlaying?.() || !ctx) return;
      try {
        this.applyParameterDrift();
      } catch {
        // non-fatal
      }
    }, this.cfg.driftIntervalMs);

    // Accent scheduler
    this.scheduleNextAccent();
  }

  stop() {
    try {
      if (this.cfg?._driftTimer) clearInterval(this.cfg._driftTimer);
      if (this.cfg?._accentTimer) clearTimeout(this.cfg._accentTimer);
    } catch {
      // ignore
    }

    if (this.cfg) {
      this.cfg._driftTimer = null;
      this.cfg._accentTimer = null;
    }
  }

  applyParameterDrift() {
    const ctx = this.adapter.getCtx?.();
    if (!ctx) return;

    const layers = this.adapter.getLayers?.();
    if (!layers || typeof layers.entries !== "function") return;

    const t = ctx.currentTime;

    for (const [, group] of layers.entries()) {
      if (!group || !group.engineType) continue;

      // --- volume drift (multiplicative; independent of user volume automation)
      const type = group.engineType;
      const depth =
        type === "ambient" ? 0.06 :
        type === "noise" ? 0.05 :
        type === "synth" ? 0.04 :
        0.035;

      const mult = randRange(1 - depth, 1 + depth);

      try {
        group.driftGain?.gain?.setTargetAtTime(mult, t, this.cfg.driftTimeConstant);
      } catch {
        // ignore
      }

      // --- filter cutoff drift (derived from base)
      const baseEnabled = group._motionBase?.filterEnabled ?? true;
      if (!baseEnabled) continue;

      const baseFreq =
        Number(group._motionBase?.filterFreq ?? group.filter?.frequency?.value ?? 20000) || 20000;

      // Keep drift very gentle when filter is basically open
      const fDepth =
        baseFreq >= 18000 ? 0.02 :
        type === "ambient" ? 0.10 :
        0.07;

      const nextFreq = clamp(baseFreq * randRange(1 - fDepth, 1 + fDepth), 40, 20000);

      try {
        group.filter?.frequency?.setTargetAtTime(nextFreq, t, this.cfg.driftTimeConstant);
      } catch {
        // ignore
      }
    }
  }

  scheduleNextAccent() {
    if (!this.cfg?.enabled) return;
    if (!this.adapter.getIsPlaying?.()) return;

    const ms = Math.floor(randRange(this.cfg.accentMinMs, this.cfg.accentMaxMs));

    try {
      this.cfg._accentTimer = setTimeout(() => {
        if (!this.adapter.getIsPlaying?.()) return;

        try {
          this.playAccent();
        } catch {
          // non-fatal
        }

        this.scheduleNextAccent();
      }, ms);
    } catch {
      // ignore
    }
  }

  playAccent() {
    const ctx = this.adapter.getCtx?.();
    const input = this.adapter.getMasterInput?.();
    if (!ctx || !input) return;

    // Keep accents extremely subtle; they should feel like "weather", not melody.
    const t0 = ctx.currentTime + 0.02;
    const dur = randRange(0.9, 1.7);

    const base = pick([396, 432, 528, 639, 741, 852, 963]);
    const mul = pick([0.5, 1, 2]);
    const f = clamp(base * mul, 120, 3200);

    const o1 = ctx.createOscillator();
    o1.type = "sine";
    o1.frequency.value = f;
    o1.detune.value = randRange(-5, 5);

    const o2 = ctx.createOscillator();
    o2.type = "triangle";
    o2.frequency.value = clamp(f * 2, 120, 8000);
    o2.detune.value = randRange(-7, 7);

    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = clamp(f * 1.1, 120, 8000);
    bp.Q.value = 1.1;

    const g = ctx.createGain();
    g.gain.value = 0;

    // Stereo panner fallback (rare)
    const pan =
      typeof ctx.createStereoPanner === "function" ? ctx.createStereoPanner() : ctx.createGain();

    if (pan && pan.pan) {
      pan.pan.value = randRange(-0.35, 0.35);
    }

    o1.connect(bp);
    o2.connect(bp);
    bp.connect(g);
    g.connect(pan);
    pan.connect(input);

    // Envelope (quiet and smooth)
    const peak = 0.018;
    try {
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(peak, t0 + 0.06);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    } catch {
      // ignore
    }

    const stopAt = t0 + dur + 0.1;

    const cleanup = () => {
      try { o1.disconnect(); } catch {}
      try { o2.disconnect(); } catch {}
      try { bp.disconnect(); } catch {}
      try { g.disconnect(); } catch {}
      try { pan.disconnect(); } catch {}
    };

    try {
      o1.onended = cleanup;
      o2.onended = cleanup;
    } catch {
      // ignore
    }

    try { o1.start(t0); } catch {}
    try { o2.start(t0); } catch {}

    try { o1.stop(stopAt); } catch {}
    try { o2.stop(stopAt); } catch {}

    // Fallback cleanup in case onended doesn't fire as expected
    try { setTimeout(cleanup, Math.ceil((dur + 0.5) * 1000)); } catch {}
  }
}
