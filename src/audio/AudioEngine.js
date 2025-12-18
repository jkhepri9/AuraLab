// src/editor/audio/AudioEngine.js
// -----------------------------------------------------------------------------
// AURA LAB — COMPLETE, STABLE AUDIO ENGINE
// Supports UI types: frequency, color, synth, ambient
// Adds: setOutputGain(), setTone({warmth, clarity})
//
// MOTION ADD-ONS (internal; no preset/UI changes required):
// - Parameter drift (subtle volume + filter cutoff evolution)
// - Ambient multi-loop desynchronization (2 layered loops per ambient layer)
// - Event-based micro-accents (very sparse one-shots)
// -----------------------------------------------------------------------------
//
// NOTE:
// - Output Gain is applied at master.output (post-FX).
// - Tone EQ is inserted post-reverb and pre-analyser:
//   reverbSum -> lowShelf (warmth) -> highShelf (clarity) -> analyser -> out
//

import { createNoiseBuffer } from "./NoiseEngines";
import { createSynthGraph } from "./SynthEngines";
import { loadAmbientBuffer } from "./AmbientLoader";

// ✅ extracted offline WAV renderer (keeps AudioEngine.renderWav() API stable)
import { renderWavOffline } from "./offline/renderWav";

// ✅ extracted motion controller (keeps method names stable)
import { createMotionController } from "./engine/motion/MotionController";

// ✅ extracted layer factory (create/update layer node groups + ambient desync)
import { createLayerFactory } from "./engine/layers/LayerFactory";

// ✅ extracted pulse/LFO controller
import { createPulseController } from "./engine/layers/PulseController";

// ✅ extracted system keep-alive (media element + visibility + media session)
import { createKeepAliveController } from "./engine/system/KeepAliveController";

// ✅ extracted master FX graph builder
import { createMasterGraph } from "./engine/graph/MasterGraph";

// ✅ extracted helpers (pure)
import { resolveType, clamp, toneDb01 } from "./engine/utils/helpers";

class AudioEngineClass {
  constructor() {
    this.ctx = null;

    // Master graph handles (created in init)
    this.master = null;
    this.analyser = null;
    this.delay = null;
    this.reverb = null;
    this.tone = null;

    // Optional MediaElement keep-alive (owned by KeepAliveController)
    this.useMediaOutput = false;
    this.mediaDest = null;
    this.mediaEl = null;

    // Program state
    this.layers = new Map();
    this.ambientCache = new Map();

    this.initialized = false;
    this.isPlaying = false;

    this.startTime = 0;
    this.seekOffset = 0;

    this.onTick = null;
    this.tickRAF = null;

    this.ambientGainBoost = 1.8;

    this.lastLayers = null;
    this.lastNowPlaying = null;

    // Run token cancels stale async continuations
    this._runId = 0;

    // Track desired FX values even if graph re-inits
    this._fx = {
      reverbWet: 0,
      delayWet: 0,
      delayTime: 0.5,
      delayFeedback: 0.3,
    };

    // Track desired master output gain even if graph re-inits
    this._outputGain = 1.0;

    // Track desired tone even if graph re-inits (0..1, neutral at 0)
    this._tone = {
      warmth: 0,
      clarity: 0,
    };

    // -----------------------------------------------------------------------
    // MOTION (subtle evolution)
    // -----------------------------------------------------------------------
    this._motion = {
      enabled: true,

      driftIntervalMs: 12000,
      driftTimeConstant: 2.2,

      accentMinMs: 5 * 60 * 1000,
      accentMaxMs: 15 * 60 * 1000,

      _driftTimer: null,
      _accentTimer: null,
    };

    // Motion controller (adapter-based)
    this._motionController = createMotionController(
      {
        getCtx: () => this.ctx,
        getIsPlaying: () => this.isPlaying,
        getLayers: () => this.layers,
        getMasterInput: () => this.master?.input || null,
      },
      this._motion
    );

    // Pulse controller (adapter-based)
    this._pulse = createPulseController({
      getCtx: () => this.ctx,
    });

    // Layer factory (adapter-based)
    this._layerFactory = createLayerFactory({
      getCtx: () => this.ctx,
      getMasterInput: () => this.master?.input || null,
      getAmbientCache: () => this.ambientCache,
      getAmbientGainBoost: () => this.ambientGainBoost,
      isRunActive: (runId) => this._isRunActive(runId),

      // injected engines
      createNoiseBuffer,
      createSynthGraph,
      loadAmbientBuffer,

      // injected engine-owned behavior
      syncPulse: (group, layer) => this._pulse.sync(group, layer),
    });

    // Keep-alive controller (adapter-based)
    this._keepAlive = createKeepAliveController({
      getDocument: () => (typeof document !== "undefined" ? document : null),
      getNavigator: () => (typeof navigator !== "undefined" ? navigator : null),
      getWindow: () => (typeof window !== "undefined" ? window : null),

      getUseMediaOutput: () => this.useMediaOutput,
      getMediaDest: () => this.mediaDest,

      getIsPlaying: () => this.isPlaying,
      getLastLayers: () => this.lastLayers,

      resumeIfNeeded: () => this._resumeIfNeeded(),

      onPlayRequest: async () => {
        if (this.isPlaying) return;
        if (this.lastLayers) await this.play(this.lastLayers, { fromSystem: true });
      },
      onPauseRequest: () => this.pause(),
      onStopRequest: () => this.stop(),

      setMediaEl: (el) => {
        this.mediaEl = el || null;
      },
      getMediaEl: () => this.mediaEl,
    });

    this._unlockedOnce = false;
  }

  // ---------------------------------------------------------------------------
  // INIT / UNLOCK
  // ---------------------------------------------------------------------------
  init() {
    // If context was closed (HMR or rare errors), rebuild cleanly.
    if (this.ctx && this.ctx.state === "closed") {
      this.initialized = false;
      this.ctx = null;

      this.master = null;
      this.analyser = null;
      this.delay = null;
      this.reverb = null;
      this.tone = null;

      this.mediaDest = null;
      this.mediaEl = null;

      this.layers.clear();
      this.ambientCache.clear();
    }

    if (this.initialized) return;

    const AC = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AC();

    this.useMediaOutput = Boolean(
      this.ctx.createMediaStreamDestination && typeof document !== "undefined"
    );

    // Build master FX graph via extracted builder (preserves node shapes)
    const built = createMasterGraph(
      this.ctx,
      {
        fx: this._fx,
        tone: this._tone,
        outputGain: this._outputGain,
      },
      {
        enableMediaDest: this.useMediaOutput,
        impulse: (duration, decay) => this._impulse(duration, decay),
      }
    );

    this.master = built.master;
    this.analyser = built.analyser;
    this.delay = built.delay;
    this.reverb = built.reverb;
    this.tone = built.tone;

    this.mediaDest = built.mediaDest || null;

    // System keep-alive bindings (extracted)
    if (this.mediaDest) this._keepAlive?.ensureMediaElement?.();
    this._keepAlive?.bindVisibility?.();
    this._keepAlive?.bindMediaSession?.();

    this.initialized = true;
  }

  unlock() {
    this.init();
    if (!this.ctx) return;

    if (!this._unlockedOnce) {
      this._unlockedOnce = true;
      try {
        this.ctx.resume?.();
      } catch {}
    }

    this._keepAlive?.kickMediaElement?.();
  }

  async _resumeIfNeeded() {
    if (!this.ctx) return;
    if (this.ctx.state !== "suspended") return;
    try {
      await this.ctx.resume();
    } catch (e) {
      console.warn("[AudioEngine] ctx.resume() failed:", e);
    }
  }

  getAnalyser() {
    return this.analyser || null;
  }

  // ---------------------------------------------------------------------------
  // MASTER OUTPUT + TONE API
  // ---------------------------------------------------------------------------
  setOutputGain(value) {
    const v = clamp(value, 0.0, 2.0);
    this._outputGain = v;

    if (!this.ctx || !this.master?.output) return;
    const t = this.ctx.currentTime;
    try {
      this.master.output.gain.setTargetAtTime(v, t, 0.03);
    } catch {
      try {
        this.master.output.gain.value = v;
      } catch {}
    }
  }

  setTone(next = {}) {
    const warmth = clamp(next?.warmth ?? this._tone.warmth, 0, 1);
    const clarity = clamp(next?.clarity ?? this._tone.clarity, 0, 1);

    this._tone = { warmth, clarity };

    if (!this.ctx || !this.tone) return;
    const t = this.ctx.currentTime;

    const wDb = toneDb01(warmth, 8);
    const cDb = toneDb01(clarity, 8);

    try {
      this.tone.lowShelf.gain.setTargetAtTime(wDb, t, 0.05);
    } catch {}
    try {
      this.tone.highShelf.gain.setTargetAtTime(cDb, t, 0.05);
    } catch {}
  }

  // ---------------------------------------------------------------------------
  // NOW PLAYING (delegated)
  // ---------------------------------------------------------------------------
  setNowPlaying(meta = {}) {
    this.lastNowPlaying = meta;
    this._keepAlive?.setNowPlaying?.(meta);
  }

  clearNowPlaying() {
    this.lastNowPlaying = null;
    this._keepAlive?.clearNowPlaying?.();
  }

  // ---------------------------------------------------------------------------
  // RUN TOKEN
  // ---------------------------------------------------------------------------
  _bumpRun() {
    this._runId += 1;
    return this._runId;
  }

  _isRunActive(runId) {
    return runId === this._runId;
  }

  // ---------------------------------------------------------------------------
  // PLAYBACK
  // ---------------------------------------------------------------------------
  async play(layers, opts = {}) {
    this.init();

    const runId = this._bumpRun();

    this._keepAlive?.kickMediaElement?.();
    await this._resumeIfNeeded();
    this._keepAlive?.kickMediaElement?.();

    try {
      this.master.input.gain.setValueAtTime(1.0, this.ctx.currentTime);
    } catch {}

    this.setOutputGain(this._outputGain);
    this.setTone(this._tone);

    this._stopAllLayers();

    this.isPlaying = true;
    this.lastLayers = layers;

    this.startTime = this.ctx.currentTime - this.seekOffset;

    await this._buildGraph(layers, runId);

    if (!this._isRunActive(runId) || !this.isPlaying) return;

    this._startMotion();
    this._startTick();
  }

  async updateLayers(layers) {
    if (!this.isPlaying) return;
    const runId = this._runId;
    this.lastLayers = layers;
    await this._buildGraph(layers, runId);
  }

  pause() {
    if (!this.isPlaying) return;

    this._bumpRun();

    this.isPlaying = false;
    this.seekOffset = this.ctx.currentTime - this.startTime;

    this._stopAllLayers();
    this._stopTick();
    this._stopMotion();

    try {
      this.master.input.gain.setValueAtTime(0.0, this.ctx.currentTime);
    } catch {}
  }

  stop() {
    this._bumpRun();

    this.isPlaying = false;
    this.seekOffset = 0;
    this.startTime = 0;

    this._stopAllLayers();
    this._stopTick();
    this._stopMotion();

    try {
      this.master.input.gain.setValueAtTime(0.0, this.ctx.currentTime);
    } catch {}

    this.clearNowPlaying();
  }

  seek(time) {
    this.seekOffset = time;
    if (this.isPlaying) this.startTime = this.ctx.currentTime - this.seekOffset;
  }

  // ---------------------------------------------------------------------------
  // FX API (LIVE)
  // ---------------------------------------------------------------------------
  setReverb(value) {
    if (!this.reverb || !this.ctx) {
      this._fx.reverbWet = clamp(value, 0, 1);
      return;
    }
    const v = clamp(value, 0, 1);
    this._fx.reverbWet = v;

    const t = this.ctx.currentTime;
    const wetGain = Math.min(3, v * 2.5);

    try {
      this.reverb.dry.gain.setTargetAtTime(1 - v, t, 0.05);
    } catch {}
    try {
      this.reverb.wet.gain.setTargetAtTime(wetGain, t, 0.05);
    } catch {}
  }

  setDelayWet(value) {
    if (!this.delay || !this.ctx) {
      this._fx.delayWet = clamp(value, 0, 1);
      return;
    }
    const v = clamp(value, 0, 1);
    this._fx.delayWet = v;

    const t = this.ctx.currentTime;
    try {
      this.delay.dry.gain.setTargetAtTime(1 - v, t, 0.05);
    } catch {}
    try {
      this.delay.wet.gain.setTargetAtTime(v, t, 0.05);
    } catch {}
  }

  setDelayTime(value) {
    if (!this.delay || !this.ctx) {
      this._fx.delayTime = clamp(value, 0.01, 5.0);
      return;
    }
    const v = clamp(value, 0.01, 5.0);
    this._fx.delayTime = v;

    const t = this.ctx.currentTime;
    try {
      this.delay.delay.delayTime.linearRampToValueAtTime(v, t + 0.05);
    } catch {}
  }

  setDelayFeedback(value) {
    if (!this.delay || !this.ctx) {
      this._fx.delayFeedback = clamp(value, 0.0, 0.95);
      return;
    }
    const v = clamp(value, 0.0, 0.95);
    this._fx.delayFeedback = v;

    const t = this.ctx.currentTime;
    try {
      this.delay.feedback.gain.setTargetAtTime(v, t, 0.05);
    } catch {}
  }

  // ---------------------------------------------------------------------------
  // MOTION — subtle evolution (internal)
  // ---------------------------------------------------------------------------
  _startMotion() {
    this._motionController?.start?.();
  }

  _stopMotion() {
    this._motionController?.stop?.();
  }

  // Compatibility/internal callers
  _applyParameterDrift() {
    this._motionController?.applyParameterDrift?.();
  }
  _scheduleNextAccent() {
    this._motionController?.scheduleNextAccent?.();
  }
  _playAccent() {
    this._motionController?.playAccent?.();
  }

  // ---------------------------------------------------------------------------
  // GRAPH BUILD (run-safe, non-fatal per layer)
  // ---------------------------------------------------------------------------
  async _buildGraph(layers, runId) {
    if (!this._isRunActive(runId)) return;

    for (const layer of layers) {
      if (!this._isRunActive(runId)) return;

      const engineType = resolveType(layer.type);

      if (!layer.enabled) {
        const node = this.layers.get(layer.id);
        if (node) {
          try {
            node.gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
          } catch {}
        }
        continue;
      }

      const existing = this.layers.get(layer.id);

      if (!existing) {
        try {
          const group = await this._layerFactory.createLayerNodes(layer, engineType, runId);
          if (!this._isRunActive(runId)) {
            try {
              this._stopNodeGroup(group);
            } catch {}
            return;
          }
          if (group) this.layers.set(layer.id, group);
        } catch (e) {
          console.warn(`[AudioEngine] Layer create failed (${layer.id}):`, e);
        }
      } else {
        try {
          await this._layerFactory.updateLayerNodes(layer, engineType, existing, runId);
        } catch (e) {
          console.warn(`[AudioEngine] Layer update failed (${layer.id}):`, e);
        }
      }
    }

    if (!this._isRunActive(runId)) return;

    for (const [id, group] of this.layers.entries()) {
      if (!layers.find((l) => l.id === id)) {
        this._stopNodeGroup(group);
        this.layers.delete(id);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // OFFLINE EXPORT (WAV)
  // ---------------------------------------------------------------------------
  async renderWav(layers, seconds, options = {}) {
    return renderWavOffline({
      layers,
      seconds,
      options,
      state: {
        fx: this._fx,
        tone: this._tone,
        outputGain: this._outputGain,
        ambientGainBoost: this.ambientGainBoost,
        sampleRate: this.ctx?.sampleRate || 44100,
      },
    });
  }

  // ---------------------------------------------------------------------------
  // STOP HELPERS
  // ---------------------------------------------------------------------------
  _stopAllLayers() {
    for (const [, group] of this.layers.entries()) this._stopNodeGroup(group);
    this.layers.clear();
  }

  _stopNodeGroup(group) {
    if (!group) return;

    if (group.source) {
      try {
        group.source.stop();
      } catch {}
      try {
        group.source.disconnect();
      } catch {}
    }

    if (group.oscs?.length) {
      group.oscs.forEach((o) => {
        try {
          o.stop();
        } catch {}
        try {
          o.disconnect();
        } catch {}
      });
    }

    try {
      group.synth?.masterGain?.disconnect?.();
    } catch {}

    if (group.ambient?.sources?.length) {
      this._layerFactory.stopAmbientSources(group.ambient.sources);
    }

    // Pulse (LFO) cleanup (extracted)
    try {
      this._pulse?.remove?.(group);
    } catch {}

    try {
      group.pan?.disconnect?.();
    } catch {}
    try {
      group.driftGain?.disconnect?.();
    } catch {}
    try {
      group.amp?.disconnect?.();
    } catch {}
    try {
      group.gain?.disconnect?.();
    } catch {}
    try {
      group.filter?.disconnect?.();
    } catch {}
  }

  // ---------------------------------------------------------------------------
  // TICK
  // ---------------------------------------------------------------------------
  _startTick() {
    if (this.tickRAF) cancelAnimationFrame(this.tickRAF);

    const tick = () => {
      if (!this.isPlaying) return;
      const time = this.ctx.currentTime - this.startTime;
      if (this.onTick) this.onTick(time);
      this.tickRAF = requestAnimationFrame(tick);
    };

    this.tickRAF = requestAnimationFrame(tick);
  }

  _stopTick() {
    if (this.tickRAF) cancelAnimationFrame(this.tickRAF);
    this.tickRAF = null;
  }

  // ---------------------------------------------------------------------------
  // UTIL
  // ---------------------------------------------------------------------------
  _impulse(duration, decay) {
    const rate = this.ctx.sampleRate;
    const len = Math.max(1, Math.floor(rate * duration));
    const buf = this.ctx.createBuffer(2, len, rate);

    for (let c = 0; c < 2; c++) {
      const ch = buf.getChannelData(c);
      for (let i = 0; i < len; i++) {
        ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
    }
    return buf;
  }
}

// HMR-safe singleton
const ENGINE_KEY = "__AURA_AUDIO_ENGINE__";
const AudioEngine =
  typeof window !== "undefined" && window[ENGINE_KEY]
    ? window[ENGINE_KEY]
    : new AudioEngineClass();

if (typeof window !== "undefined" && !window[ENGINE_KEY]) {
  window[ENGINE_KEY] = AudioEngine;
}

export function createAudioEngine(config = {}) {
  AudioEngine.init();
  if (config.onTick) AudioEngine.onTick = config.onTick;
  if (typeof config.ambientGainBoost === "number" && !Number.isNaN(config.ambientGainBoost)) {
    AudioEngine.ambientGainBoost = config.ambientGainBoost;
  }
  return AudioEngine;
}

export default AudioEngine;
