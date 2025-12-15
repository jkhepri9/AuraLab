// src/audio/AudioEngine.js
// -----------------------------------------------------------------------------
// AURA LAB — RELIABLE WEB AUDIO ENGINE (WITH LIVE FX + LIVE PULSE)
// -----------------------------------------------------------------------------
// What this fixes:
// 1) Aura Studio Pulse (LFO) had no audible effect because it was never wired
//    into the per-layer gain path.
// 2) Volume/filter changes in Aura Studio were not being pushed to the engine
//    while playing (handled in AuraEditor.jsx in this patch).
//
// This build includes:
// - Always-audible output via ctx.destination.
// - Live FX chain (Delay + Reverb) wired into the graph.
// - Live Pulse (LFO) per layer, modulating amplitude.
// - Run token cancellation for async ambient loads.
// - Ambient decode failures are non-fatal (other layers still play).
// -----------------------------------------------------------------------------

import { createNoiseBuffer } from "./NoiseEngines";
import { createSynthGraph } from "./SynthEngines";
import { loadAmbientBuffer } from "./AmbientLoader";

// -----------------------------------------------------------------------------
// TYPE MAPPING
// -----------------------------------------------------------------------------
function resolveType(uiType) {
  switch (uiType) {
    case "frequency":
      return "oscillator";
    case "color":
      return "noise";
    case "synth":
      return "synth";
    case "ambient":
      return "ambient";
    default:
      return uiType;
  }
}

function clamp(v, min, max) {
  const n = typeof v === "number" ? v : Number(v);
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, n));
}

class AudioEngineClass {
  constructor() {
    this.ctx = null;

    // Master graph handles (created in init)
    this.master = null;
    this.analyser = null;
    this.delay = null;
    this.reverb = null;

    // Optional MediaElement output
    this.useMediaOutput = false;
    this.mediaDest = null;
    this.mediaEl = null;
    this.mediaSessionBound = false;
    this._visibilityBound = false;

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

    // -----------------------------------------------------------------------
    // PRE-FX SUM BUS (all layers feed here)
    // -----------------------------------------------------------------------
    const mixIn = this.ctx.createGain();
    mixIn.gain.value = 1.0;

    // -----------------------------------------------------------------------
    // DELAY (insert-style)
    // mixIn -> (dry) -> delaySum -> ...
    //      -> (wet) -> delayNode -> wetGain -> delaySum
    // -----------------------------------------------------------------------
    const delayNode = this.ctx.createDelay(5.0);
    delayNode.delayTime.value = clamp(this._fx.delayTime, 0.01, 5.0);

    const feedback = this.ctx.createGain();
    feedback.gain.value = clamp(this._fx.delayFeedback, 0.0, 0.95);

    const dlDry = this.ctx.createGain();
    const dlWet = this.ctx.createGain();
    const delaySum = this.ctx.createGain();

    // Apply current wet mix
    const delayWet = clamp(this._fx.delayWet, 0, 1);
    dlDry.gain.value = 1 - delayWet;
    dlWet.gain.value = delayWet;

    mixIn.connect(dlDry);
    mixIn.connect(delayNode);

    delayNode.connect(feedback);
    feedback.connect(delayNode);
    delayNode.connect(dlWet);

    dlDry.connect(delaySum);
    dlWet.connect(delaySum);

    this.delay = { delay: delayNode, feedback, dry: dlDry, wet: dlWet, sum: delaySum };

    // -----------------------------------------------------------------------
    // REVERB (insert-style using Convolver + impulse)
    // delaySum -> (dry) -> reverbSum -> ...
    //         -> conv -> wetGain -> reverbSum
    // -----------------------------------------------------------------------
    const conv = this.ctx.createConvolver();
    conv.buffer = this._impulse(2.0, 2.0);

    const rvDry = this.ctx.createGain();
    const rvWet = this.ctx.createGain();
    const reverbSum = this.ctx.createGain();

    const reverbWet = clamp(this._fx.reverbWet, 0, 1);
    // Keep your existing "bigger tail" wet feel; cap to prevent runaway
    const wetGain = Math.min(3, reverbWet * 2.5);
    rvDry.gain.value = 1 - reverbWet;
    rvWet.gain.value = wetGain;

    delaySum.connect(rvDry);
    delaySum.connect(conv);
    conv.connect(rvWet);

    rvDry.connect(reverbSum);
    rvWet.connect(reverbSum);

    this.reverb = { convolver: conv, dry: rvDry, wet: rvWet, sum: reverbSum };

    // -----------------------------------------------------------------------
    // ANALYSER + OUTPUT
    // -----------------------------------------------------------------------
    const analyser = this.ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.85;

    const out = this.ctx.createGain();
    out.gain.value = 1.0;

    reverbSum.connect(analyser);
    analyser.connect(out);

    // CRITICAL: always audible output
    out.connect(this.ctx.destination);

    // Optional: also feed a MediaStreamDestination (best-effort keep-alive)
    if (this.useMediaOutput) {
      this.mediaDest = this.ctx.createMediaStreamDestination();
      out.connect(this.mediaDest);
      this._ensureMediaElement();
    }

    this.analyser = analyser;
    this.master = { input: mixIn, analyser, output: out };

    this.initialized = true;
    this._bindVisibilityHandlers();
    this._bindMediaSession();
  }

  unlock() {
    this.init();
    if (!this.ctx) return;

    if (!this._unlockedOnce) {
      this._unlockedOnce = true;
      try {
        // Gesture-friendly: do not await.
        this.ctx.resume?.();
      } catch {}
    }

    this._kickMediaElement();
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
  // MEDIA ELEMENT (best-effort only)
  // ---------------------------------------------------------------------------
  _ensureMediaElement() {
    if (!this.mediaDest) return;

    // HMR-safe cleanup
    try {
      document.querySelectorAll("audio#aura_media_el").forEach((n) => {
        try { n.pause(); } catch {}
        try { n.srcObject = null; } catch {}
        try { n.remove(); } catch {}
      });
    } catch {}

    if (this.mediaEl) return;

    const el = document.createElement("audio");
    el.id = "aura_media_el";
    el.style.display = "none";
    el.autoplay = false;
    el.controls = false;

    el.setAttribute("playsinline", "");
    el.setAttribute("webkit-playsinline", "");

    el.srcObject = this.mediaDest.stream;

    // Keep silent to avoid doubling the audible path (ctx.destination).
    el.muted = false;
    el.volume = 0.0;

    document.body.appendChild(el);
    this.mediaEl = el;
  }

  _kickMediaElement() {
    if (!this.useMediaOutput) return;
    if (!this.mediaEl) return;
    try {
      if (this.mediaEl.paused) this.mediaEl.play();
    } catch {
      // Autoplay policies may block; ctx.destination still works.
    }
  }

  _bindVisibilityHandlers() {
    if (this._visibilityBound) return;
    this._visibilityBound = true;

    document.addEventListener("visibilitychange", async () => {
      if (!this.isPlaying) return;
      await this._resumeIfNeeded();
      this._kickMediaElement();
    });
  }

  _bindMediaSession() {
    if (this.mediaSessionBound) return;
    if (!("mediaSession" in navigator)) return;
    this.mediaSessionBound = true;

    try {
      navigator.mediaSession.setActionHandler("play", async () => {
        if (this.isPlaying) return;
        if (this.lastLayers) await this.play(this.lastLayers, { fromSystem: true });
      });
      navigator.mediaSession.setActionHandler("pause", () => this.pause());
      navigator.mediaSession.setActionHandler("stop", () => this.stop());
    } catch {}
  }

  setNowPlaying(meta = {}) {
    this.lastNowPlaying = meta;
    if (!("mediaSession" in navigator)) return;

    try {
      const artwork = meta.artworkUrl
        ? [{ src: meta.artworkUrl, sizes: "512x512", type: "image/png" }]
        : [];

      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: meta.title || "AuraLab",
        artist: meta.artist || "AuraLab",
        album: meta.album || "",
        artwork,
      });
    } catch {}
  }

  clearNowPlaying() {
    this.lastNowPlaying = null;
    if (!("mediaSession" in navigator)) return;
    try {
      navigator.mediaSession.metadata = null;
    } catch {}
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

    // Best-effort unlock + resume
    this._kickMediaElement();
    await this._resumeIfNeeded();
    this._kickMediaElement();

    // Ensure audible path is open
    try {
      this.master.input.gain.setValueAtTime(1.0, this.ctx.currentTime);
    } catch {}

    // Replace program cleanly
    this._stopAllLayers();

    this.isPlaying = true;
    this.lastLayers = layers;

    this.startTime = this.ctx.currentTime - this.seekOffset;

    await this._buildGraph(layers, runId);

    if (!this._isRunActive(runId) || !this.isPlaying) return;

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

    // Keep context alive; just silence input.
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

    try { this.reverb.dry.gain.setTargetAtTime(1 - v, t, 0.05); } catch {}
    try { this.reverb.wet.gain.setTargetAtTime(wetGain, t, 0.05); } catch {}
  }

  setDelayWet(value) {
    if (!this.delay || !this.ctx) {
      this._fx.delayWet = clamp(value, 0, 1);
      return;
    }
    const v = clamp(value, 0, 1);
    this._fx.delayWet = v;

    const t = this.ctx.currentTime;
    try { this.delay.dry.gain.setTargetAtTime(1 - v, t, 0.05); } catch {}
    try { this.delay.wet.gain.setTargetAtTime(v, t, 0.05); } catch {}
  }

  setDelayTime(value) {
    if (!this.delay || !this.ctx) {
      this._fx.delayTime = clamp(value, 0.01, 5.0);
      return;
    }
    const v = clamp(value, 0.01, 5.0);
    this._fx.delayTime = v;

    const t = this.ctx.currentTime;
    try { this.delay.delay.delayTime.linearRampToValueAtTime(v, t + 0.05); } catch {}
  }

  setDelayFeedback(value) {
    if (!this.delay || !this.ctx) {
      this._fx.delayFeedback = clamp(value, 0.0, 0.95);
      return;
    }
    const v = clamp(value, 0.0, 0.95);
    this._fx.delayFeedback = v;

    const t = this.ctx.currentTime;
    try { this.delay.feedback.gain.setTargetAtTime(v, t, 0.05); } catch {}
  }

  // ---------------------------------------------------------------------------
  // PULSE (LFO) — live tremolo/gating per layer
  // ---------------------------------------------------------------------------
  _syncPulse(group, layer) {
    if (!this.ctx) return;
    if (!group || !group.amp) return;

    const rate = clamp(layer?.pulseRate ?? 0, 0, 20);
    const depth = clamp(layer?.pulseDepth ?? 0, 0, 1);

    const t = this.ctx.currentTime;

    // Disabled: remove modulation and return to unity gain.
    if (rate <= 0 || depth <= 0) {
      this._removePulseNodes(group);
      try { group.amp.gain.setTargetAtTime(1.0, t, 0.02); } catch {}
      return;
    }

    // Enabled: create nodes if missing.
    if (!group.pulse || !group.pulse.osc || !group.pulse.lfoGain || !group.pulse.offset) {
      this._removePulseNodes(group);

      const osc = this.ctx.createOscillator();
      osc.type = "sine";

      const lfoGain = this.ctx.createGain();
      const offset = this.ctx.createConstantSource();

      // Multiple connections to AudioParam are summed:
      // amp.gain = offset + (osc * lfoGain)
      osc.connect(lfoGain);
      lfoGain.connect(group.amp.gain);
      offset.connect(group.amp.gain);

      try { osc.start(); } catch {}
      try { offset.start(); } catch {}

      group.pulse = { osc, lfoGain, offset };
    }

    const lfoAmp = depth / 2;      // amplitude for sine (-1..1) -> (-amp..amp)
    const dc = 1 - lfoAmp;         // centers modulation so output stays positive

    try { group.pulse.osc.frequency.setTargetAtTime(rate, t, 0.02); } catch {}
    try { group.pulse.lfoGain.gain.setTargetAtTime(lfoAmp, t, 0.02); } catch {}
    try { group.pulse.offset.offset.setTargetAtTime(dc, t, 0.02); } catch {}
  }

  _removePulseNodes(group) {
    if (!group || !group.pulse) return;

    const { osc, lfoGain, offset } = group.pulse;

    try { osc?.stop?.(); } catch {}
    try { osc?.disconnect?.(); } catch {}

    try { lfoGain?.disconnect?.(); } catch {}

    try { offset?.stop?.(); } catch {}
    try { offset?.disconnect?.(); } catch {}

    group.pulse = null;
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
          try { node.gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05); } catch {}
        }
        continue;
      }

      const existing = this.layers.get(layer.id);

      if (!existing) {
        try {
          const group = await this._createLayerNodes(layer, engineType, runId);
          if (!this._isRunActive(runId)) {
            try { this._stopNodeGroup(group); } catch {}
            return;
          }
          if (group) this.layers.set(layer.id, group);
        } catch (e) {
          console.warn(`[AudioEngine] Layer create failed (${layer.id}):`, e);
        }
      } else {
        try {
          await this._updateLayerNodes(layer, engineType, existing, runId);
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

  _effectiveGainForLayer(layer, engineType) {
    const base = layer.volume ?? 0.5;
    const mult = engineType === "ambient" ? this.ambientGainBoost : 1.0;
    return base * mult;
  }

  _createCommonNodes(layer, engineType) {
    const ctx = this.ctx;

    // Base per-layer volume gain (updated live)
    const gain = ctx.createGain();
    gain.gain.value = this._effectiveGainForLayer(layer, engineType);

    // Pulse (LFO) amplitude stage (modulated live)
    const amp = ctx.createGain();
    amp.gain.value = 1.0;

    const pan = ctx.createStereoPanner();
    pan.pan.value = layer.pan ?? 0;

    const filter = ctx.createBiquadFilter();
    filter.type = layer.filter?.type || "lowpass";
    filter.frequency.value = layer.filter?.frequency || 20000;
    filter.Q.value = layer.filter?.Q || 1;

    // Signal path:
    // source -> filter -> gain(volume) -> amp(pulse) -> pan -> master mix input
    filter.connect(gain);
    gain.connect(amp);
    amp.connect(pan);
    pan.connect(this.master.input);

    return { filter, gain, amp, pan };
  }

  async _createLayerNodes(layer, engineType, runId) {
    if (!this._isRunActive(runId)) return null;

    const ctx = this.ctx;
    const { filter, gain, amp, pan } = this._createCommonNodes(layer, engineType);

    // Apply filter bypass if disabled
    if (layer.filterEnabled === false) {
      try {
        filter.frequency.setValueAtTime(20000, ctx.currentTime);
        filter.Q.setValueAtTime(0.0001, ctx.currentTime);
      } catch {}
    }

    let source = null;
    let synth = null;
    let oscs = [];
    let ambient = null;

    if (engineType === "oscillator") {
      source = ctx.createOscillator();
      source.type = layer.waveform ?? "sine";
      source.frequency.value = layer.frequency ?? 432;
      source.connect(filter);
      source.start();
    } else if (engineType === "noise") {
      const buf = createNoiseBuffer(ctx, layer.waveform);
      source = ctx.createBufferSource();
      source.buffer = buf;
      source.loop = true;
      source.connect(filter);
      source.start();
    } else if (engineType === "synth") {
      const synthType = layer.waveform ?? "analog";
      const freq = layer.frequency ?? 432;
      synth = createSynthGraph(ctx, synthType, freq, filter);
      oscs = synth?.oscs || [];
    } else if (engineType === "ambient") {
      let buffer = null;
      try {
        buffer = await loadAmbientBuffer(ctx, layer.waveform, this.ambientCache);
      } catch (e) {
        console.warn("[AudioEngine] Ambient load failed:", e);
        buffer = null;
      }

      if (!this._isRunActive(runId)) return null;

      if (buffer) {
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        src.loop = true;
        src.connect(filter);
        src.start();
        ambient = { sources: [src], currentName: layer.waveform };
      } else {
        // Keep placeholder so other layers continue.
        ambient = { sources: [], currentName: layer.waveform };
      }
    }

    const group = {
      source,
      synth,
      oscs,
      ambient,
      gain,
      amp,
      pan,
      filter,
      engineType,
      _noiseWaveform: engineType === "noise" ? (layer.waveform || "white") : undefined,
      _synthType: engineType === "synth" ? (layer.waveform || "analog") : undefined,
      _synthFreq: engineType === "synth" ? (layer.frequency ?? 432) : undefined,
    };

    // Pulse (LFO) — apply immediately (rate/depth can be updated live)
    this._syncPulse(group, layer);

    return group;
  }

  async _updateLayerNodes(layer, engineType, group, runId) {
    if (!this._isRunActive(runId)) return;

    const t = this.ctx.currentTime;

    // volume / pan
    const eff = this._effectiveGainForLayer(layer, engineType);
    try { group.gain.gain.setTargetAtTime(eff, t, 0.05); } catch {}
    try { group.pan.pan.setTargetAtTime(layer.pan ?? 0, t, 0.05); } catch {}

    // filter
    if (layer.filterEnabled === false) {
      try {
        group.filter.frequency.setTargetAtTime(20000, t, 0.05);
        group.filter.Q.setTargetAtTime(0.0001, t, 0.05);
      } catch {}
    } else {
      try { group.filter.type = layer.filter?.type || "lowpass"; } catch {}
      try { group.filter.frequency.setTargetAtTime(layer.filter?.frequency || 20000, t, 0.05); } catch {}
      try { group.filter.Q.setTargetAtTime(layer.filter?.Q || 1, t, 0.05); } catch {}
    }

    // pulse (LFO)
    this._syncPulse(group, layer);

    // oscillator
    if (engineType === "oscillator" && group.source) {
      try { group.source.type = layer.waveform ?? "sine"; } catch {}
      try { group.source.frequency.setTargetAtTime(layer.frequency ?? 432, t, 0.02); } catch {}
    }

    // synth (rebuild if waveform or frequency changed)
    if (engineType === "synth") {
      const nextType = layer.waveform ?? "analog";
      const nextFreq = layer.frequency ?? 432;

      const changed = nextType !== group._synthType || nextFreq !== group._synthFreq;

      if (changed) {
        // stop old
        try {
          (group.oscs || []).forEach((o) => { try { o.stop(); } catch {} try { o.disconnect(); } catch {} });
        } catch {}
        try { group.synth?.masterGain?.disconnect?.(); } catch {}

        // create new
        group._synthType = nextType;
        group._synthFreq = nextFreq;
        group.synth = createSynthGraph(this.ctx, nextType, nextFreq, group.filter);
        group.oscs = group.synth?.oscs || [];
      }
    }

    // noise waveform swap
    if (engineType === "noise" && group.source) {
      const desired = layer.waveform || "white";
      if (group._noiseWaveform !== desired) {
        group._noiseWaveform = desired;
        try { group.source.buffer = createNoiseBuffer(this.ctx, desired); } catch {}
      }
    }

    // ambient swap
    if (engineType === "ambient") {
      const desired = layer.waveform;
      const current = group.ambient?.currentName;

      if (desired && desired !== current) {
        // stop old
        try {
          group.ambient?.sources?.forEach((s) => {
            try { s.stop(); } catch {}
            try { s.disconnect(); } catch {}
          });
        } catch {}

        let buffer = null;
        try {
          buffer = await loadAmbientBuffer(this.ctx, desired, this.ambientCache);
        } catch (e) {
          console.warn("[AudioEngine] Ambient load failed:", e);
          buffer = null;
        }

        if (!this._isRunActive(runId)) return;

        if (buffer) {
          const src = this.ctx.createBufferSource();
          src.buffer = buffer;
          src.loop = true;
          src.connect(group.filter);
          try { src.start(); } catch {}

          group.ambient = { sources: [src], currentName: desired };
        } else {
          group.ambient = { sources: [], currentName: desired };
        }
      }
    }
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
      try { group.source.stop(); } catch {}
      try { group.source.disconnect(); } catch {}
    }

    if (group.oscs?.length) {
      group.oscs.forEach((o) => {
        try { o.stop(); } catch {}
        try { o.disconnect(); } catch {}
      });
    }

    try { group.synth?.masterGain?.disconnect?.(); } catch {}

    if (group.ambient?.sources?.length) {
      group.ambient.sources.forEach((s) => {
        try { s.stop(); } catch {}
        try { s.disconnect(); } catch {}
      });
    }

    // Pulse (LFO)
    try { this._removePulseNodes(group); } catch {}

    try { group.pan?.disconnect?.(); } catch {}
    try { group.amp?.disconnect?.(); } catch {}
    try { group.gain?.disconnect?.(); } catch {}
    try { group.filter?.disconnect?.(); } catch {}
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
  if (
    typeof config.ambientGainBoost === "number" &&
    !Number.isNaN(config.ambientGainBoost)
  ) {
    AudioEngine.ambientGainBoost = config.ambientGainBoost;
  }
  return AudioEngine;
}

export default AudioEngine;
