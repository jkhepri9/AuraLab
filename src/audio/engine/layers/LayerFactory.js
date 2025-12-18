// src/editor/audio/engine/layers/LayerFactory.js
// -----------------------------------------------------------------------------
// AuraLab — Layer Factory (internal)
// Extracts:
// - effective per-layer gain (incl. ambient boost)
// - common node chain (filter -> gain -> amp -> drift -> pan -> master input)
// - ambient multi-loop desync helpers
// - create/update per-layer node groups (oscillator/noise/synth/ambient)
//
// The AudioEngine remains the orchestrator (run tokens, stop/tick/media/etc).
// -----------------------------------------------------------------------------

import { clamp, randRange } from "../utils/helpers";

export function createLayerFactory(deps) {
  return new LayerFactory(deps);
}

class LayerFactory {
  constructor(deps) {
    this.deps = deps || {};
  }

  _ctx() {
    return this.deps.getCtx?.() || null;
  }

  _masterInput() {
    return this.deps.getMasterInput?.() || null;
  }

  _ambientCache() {
    return this.deps.getAmbientCache?.() || null;
  }

  _ambientGainBoost() {
    const v = this.deps.getAmbientGainBoost?.();
    return typeof v === "number" && !Number.isNaN(v) ? v : 1.0;
  }

  _isRunActive(runId) {
    return Boolean(this.deps.isRunActive?.(runId));
  }

  _effectiveGainForLayer(layer, engineType) {
    const base = layer?.volume ?? 0.5;
    const mult = engineType === "ambient" ? this._ambientGainBoost() : 1.0;
    return base * mult;
  }

  _createCommonNodes(layer, engineType) {
    const ctx = this._ctx();
    const masterInput = this._masterInput();
    if (!ctx || !masterInput) return null;

    // Base per-layer volume gain (updated live)
    const gain = ctx.createGain();
    gain.gain.value = this._effectiveGainForLayer(layer, engineType);

    // Pulse (LFO) amplitude stage (modulated live)
    const amp = ctx.createGain();
    amp.gain.value = 1.0;

    // Drift stage (subtle, internal evolution)
    const driftGain = ctx.createGain();
    driftGain.gain.value = 1.0;

    const pan = ctx.createStereoPanner();
    pan.pan.value = layer?.pan ?? 0;

    const filter = ctx.createBiquadFilter();
    filter.type = layer?.filter?.type || "lowpass";
    filter.frequency.value = layer?.filter?.frequency || 20000;
    filter.Q.value = layer?.filter?.Q || 1;

    // Signal path:
    // source -> filter -> gain(volume) -> amp(pulse) -> driftGain(motion) -> pan -> master mix input
    filter.connect(gain);
    gain.connect(amp);
    amp.connect(driftGain);
    driftGain.connect(pan);
    pan.connect(masterInput);

    return { filter, gain, amp, driftGain, pan };
  }

  // ---------------------------------------------------------------------------
  // AMBIENT: MULTI-LOOP DESYNCHRONIZATION (internal)
  // ---------------------------------------------------------------------------
  createAmbientDesyncSources(buffer, filter) {
    const ctx = this._ctx();
    if (!ctx || !buffer || !filter) return [];

    const count = 2;
    const sources = [];

    for (let i = 0; i < count; i++) {
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.loop = true;

      const preGain = ctx.createGain();
      preGain.gain.value = 1 / count;

      // Slight divergence (one stays at 1.0, the other slightly off)
      const rate = i === 0 ? 1.0 : randRange(0.997, 1.003);
      try {
        src.playbackRate.value = rate;
      } catch {}

      // Random phase offset into the buffer (safe for loops)
      const dur = buffer.duration || 0;
      const offset = dur > 0.25 ? randRange(0, Math.max(0, dur - 0.05)) : 0;

      src.connect(preGain);
      preGain.connect(filter);

      try {
        src.start(0, offset);
      } catch {
        try {
          src.start();
        } catch {}
      }

      sources.push({ src, preGain });
    }

    return sources;
  }

  stopAmbientSources(sources = []) {
    try {
      (sources || []).forEach((s) => {
        const src = s?.src ?? s;
        const preGain = s?.preGain ?? s?.gain ?? null;

        try {
          src?.stop?.();
        } catch {}
        try {
          src?.disconnect?.();
        } catch {}

        try {
          preGain?.disconnect?.();
        } catch {}
      });
    } catch {}
  }

  // ---------------------------------------------------------------------------
  // CREATE / UPDATE LAYER GROUPS
  // ---------------------------------------------------------------------------
  async createLayerNodes(layer, engineType, runId) {
    if (!this._isRunActive(runId)) return null;

    const ctx = this._ctx();
    if (!ctx) return null;

    const common = this._createCommonNodes(layer, engineType);
    if (!common) return null;

    const { filter, gain, amp, driftGain, pan } = common;

    // Apply filter bypass if disabled
    if (layer?.filterEnabled === false) {
      try {
        filter.frequency.setValueAtTime(20000, ctx.currentTime);
        filter.Q.setValueAtTime(0.0001, ctx.currentTime);
      } catch {}
    }

    const createNoiseBuffer = this.deps.createNoiseBuffer;
    const createSynthGraph = this.deps.createSynthGraph;
    const loadAmbientBuffer = this.deps.loadAmbientBuffer;
    const ambientCache = this._ambientCache();

    let source = null;
    let synth = null;
    let oscs = [];
    let ambient = null;

    if (engineType === "oscillator") {
      source = ctx.createOscillator();
      source.type = layer?.waveform ?? "sine";
      source.frequency.value = layer?.frequency ?? 432;
      source.connect(filter);
      source.start();
    } else if (engineType === "noise") {
      const buf = createNoiseBuffer?.(ctx, layer?.waveform);
      source = ctx.createBufferSource();
      source.buffer = buf || null;
      source.loop = true;
      source.connect(filter);
      source.start();
    } else if (engineType === "synth") {
      const synthType = layer?.waveform ?? "analog";
      const freq = layer?.frequency ?? 432;
      synth = createSynthGraph?.(ctx, synthType, freq, filter) || null;
      oscs = synth?.oscs || [];
    } else if (engineType === "ambient") {
      let buffer = null;
      try {
        buffer = await loadAmbientBuffer?.(ctx, layer?.waveform, ambientCache);
      } catch (e) {
        console.warn("[AudioEngine] Ambient load failed:", e);
        buffer = null;
      }

      if (!this._isRunActive(runId)) return null;

      if (buffer) {
        const sources = this.createAmbientDesyncSources(buffer, filter);
        ambient = { sources, currentName: layer?.waveform };
      } else {
        ambient = { sources: [], currentName: layer?.waveform };
      }
    }

    const group = {
      source,
      synth,
      oscs,
      ambient,
      gain,
      amp,
      driftGain,
      pan,
      filter,
      engineType,
      _noiseWaveform: engineType === "noise" ? (layer?.waveform || "white") : undefined,
      _synthType: engineType === "synth" ? (layer?.waveform || "analog") : undefined,
      _synthFreq: engineType === "synth" ? (layer?.frequency ?? 432) : undefined,

      // Motion base values (used by parameter drift; updated in updateLayerNodes)
      _motionBase: {
        filterEnabled: layer?.filterEnabled !== false,
        filterFreq: layer?.filter?.frequency || 20000,
      },
    };

    // Pulse (LFO) — apply immediately (rate/depth can be updated live)
    try {
      this.deps.syncPulse?.(group, layer);
    } catch {}

    return group;
  }

  async updateLayerNodes(layer, engineType, group, runId) {
    if (!this._isRunActive(runId)) return;

    const ctx = this._ctx();
    if (!ctx) return;

    const t = ctx.currentTime;

    // volume / pan
    const eff = this._effectiveGainForLayer(layer, engineType);
    try {
      group.gain.gain.setTargetAtTime(eff, t, 0.05);
    } catch {}
    try {
      group.pan.pan.setTargetAtTime(layer?.pan ?? 0, t, 0.05);
    } catch {}

    // filter
    if (layer?.filterEnabled === false) {
      try {
        group.filter.frequency.setTargetAtTime(20000, t, 0.05);
        group.filter.Q.setTargetAtTime(0.0001, t, 0.05);
      } catch {}
    } else {
      try {
        group.filter.type = layer?.filter?.type || "lowpass";
      } catch {}
      try {
        group.filter.frequency.setTargetAtTime(layer?.filter?.frequency || 20000, t, 0.05);
      } catch {}
      try {
        group.filter.Q.setTargetAtTime(layer?.filter?.Q || 1, t, 0.05);
      } catch {}
    }

    // Keep base values for internal motion (parameter drift).
    try {
      if (!group._motionBase) group._motionBase = {};
      group._motionBase.filterEnabled = layer?.filterEnabled !== false;
      group._motionBase.filterFreq =
        layer?.filterEnabled === false ? 20000 : layer?.filter?.frequency || 20000;
    } catch {}

    // pulse (LFO)
    try {
      this.deps.syncPulse?.(group, layer);
    } catch {}

    // oscillator
    if (engineType === "oscillator" && group.source) {
      try {
        group.source.type = layer?.waveform ?? "sine";
      } catch {}
      try {
        group.source.frequency.setTargetAtTime(layer?.frequency ?? 432, t, 0.02);
      } catch {}
    }

    // synth (rebuild if waveform or frequency changed)
    if (engineType === "synth") {
      const nextType = layer?.waveform ?? "analog";
      const nextFreq = layer?.frequency ?? 432;

      const changed = nextType !== group._synthType || nextFreq !== group._synthFreq;

      if (changed) {
        try {
          (group.oscs || []).forEach((o) => {
            try {
              o.stop();
            } catch {}
            try {
              o.disconnect();
            } catch {}
          });
        } catch {}
        try {
          group.synth?.masterGain?.disconnect?.();
        } catch {}

        const createSynthGraph = this.deps.createSynthGraph;

        group._synthType = nextType;
        group._synthFreq = nextFreq;
        group.synth = createSynthGraph?.(ctx, nextType, nextFreq, group.filter) || null;
        group.oscs = group.synth?.oscs || [];
      }
    }

    // noise waveform swap
    if (engineType === "noise" && group.source) {
      const desired = layer?.waveform || "white";
      if (group._noiseWaveform !== desired) {
        group._noiseWaveform = desired;
        try {
          const createNoiseBuffer = this.deps.createNoiseBuffer;
          group.source.buffer = createNoiseBuffer?.(ctx, desired) || null;
        } catch {}
      }
    }

    // ambient swap
    if (engineType === "ambient") {
      const desired = layer?.waveform;
      const current = group.ambient?.currentName;

      if (desired && desired !== current) {
        // stop old
        this.stopAmbientSources(group.ambient?.sources);

        const loadAmbientBuffer = this.deps.loadAmbientBuffer;
        const ambientCache = this._ambientCache();

        let buffer = null;
        try {
          buffer = await loadAmbientBuffer?.(ctx, desired, ambientCache);
        } catch (e) {
          console.warn("[AudioEngine] Ambient load failed:", e);
          buffer = null;
        }

        if (!this._isRunActive(runId)) return;

        if (buffer) {
          const sources = this.createAmbientDesyncSources(buffer, group.filter);
          group.ambient = { sources, currentName: desired };
        } else {
          group.ambient = { sources: [], currentName: desired };
        }
      }
    }
  }
}
