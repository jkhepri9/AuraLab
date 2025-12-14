// src/audio/AudioEngine.js
// -----------------------------------------------------------------------------
// AURA LAB — STABLE AUDIO ENGINE (overlap-safe)
// -----------------------------------------------------------------------------
//
// CRITICAL FIX:
// Prevent overlapping presets by invalidating any in-flight async play/build
// when a new preset starts (or stop/pause is pressed).
//
// Root cause of overlay: async awaits (ambient buffer loads) returning after
// stop(), then starting sources anyway.
//
// Fix: run token (this._runId). Every play/stop/pause increments it.
// Any async continuation checks token and aborts if stale.
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

class AudioEngineClass {
  constructor() {
    this.ctx = null;

    this.master = null;
    this.reverb = null;
    this.delay = null;

    // MediaElement output (improves background/lockscreen behavior on mobile)
    this.useMediaOutput = false;
    this.mediaDest = null;
    this.mediaEl = null;
    this.mediaSessionBound = false;

    this.layers = new Map();
    this.ambientCache = new Map();

    this.initialized = false;

    this.startTime = 0;
    this.seekOffset = 0;
    this.isPlaying = false;

    this.onTick = null;
    this.tickRAF = null;

    // Global ambient boost (keep your existing behavior)
    this.ambientGainBoost = 1.8;

    // Last-known program for system actions
    this.lastLayers = null;
    this.lastNowPlaying = null;

    // Run token to cancel stale async work
    this._runId = 0;
  }

  // Invalidate any in-flight async work immediately
  _bumpRun() {
    this._runId += 1;
    return this._runId;
  }

  _isRunActive(runId) {
    return runId === this._runId;
  }

  init() {
    if (this.initialized) return;

    const AC = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AC();

    this.useMediaOutput = Boolean(
      this.ctx.createMediaStreamDestination && typeof document !== "undefined"
    );

    // MASTER BUS
    const masterIn = this.ctx.createGain();
    masterIn.gain.value = 1.0;

    const shaper = this.ctx.createWaveShaper();
    shaper.curve = this._softClip(2.5);

    const masterOut = this.ctx.createGain();
    masterOut.gain.value = 1.0;

    masterIn.connect(shaper);
    shaper.connect(masterOut);

    // IMPORTANT: only ONE output path.
    if (this.useMediaOutput) {
      this.mediaDest = this.ctx.createMediaStreamDestination();
      masterOut.connect(this.mediaDest);
      this._ensureMediaElement();
    } else {
      masterOut.connect(this.ctx.destination);
    }

    this.master = { input: masterIn, shaper, output: masterOut };

    // REVERB (kept for API compatibility)
    const conv = this.ctx.createConvolver();
    conv.buffer = this._impulse(2, 2);
    const rvDry = this.ctx.createGain();
    rvDry.gain.value = 1;
    const rvWet = this.ctx.createGain();
    rvWet.gain.value = 0;
    this.reverb = { convolver: conv, dry: rvDry, wet: rvWet };

    // DELAY
    const delayNode = this.ctx.createDelay(5.0);
    delayNode.delayTime.value = 0.5;

    const feedback = this.ctx.createGain();
    feedback.gain.value = 0.3;

    const dlDry = this.ctx.createGain();
    dlDry.gain.value = 1;

    const dlWet = this.ctx.createGain();
    dlWet.gain.value = 0;

    delayNode.connect(feedback);
    feedback.connect(delayNode);
    delayNode.connect(dlWet);
    dlDry.connect(masterIn);
    dlWet.connect(masterIn);

    this.delay = { delay: delayNode, feedback, dry: dlDry, wet: dlWet };

    this.initialized = true;

    this._bindVisibilityHandlers();
    this._bindMediaSession();
  }

  // ---------------------------------------------------------------------------
  // MEDIA ELEMENT
  // ---------------------------------------------------------------------------
  _ensureMediaElement() {
    if (!this.mediaDest) return;

    // Defensive cleanup (dev/HMR)
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
    el.muted = false;
    el.volume = 1.0;

    el.addEventListener("pause", () => {
      if (this.isPlaying) this.pause();
    });

    document.body.appendChild(el);
    this.mediaEl = el;
  }

  async _ensureMediaElementPlaying() {
    if (!this.useMediaOutput) return;
    if (!this.mediaEl) return;
    try {
      if (this.mediaEl.paused) await this.mediaEl.play();
    } catch {
      // Autoplay policies may block without gesture; fine.
    }
  }

  _bindVisibilityHandlers() {
    if (this._visibilityBound) return;
    this._visibilityBound = true;

    document.addEventListener("visibilitychange", async () => {
      if (!this.isPlaying) return;
      if (!this.ctx) return;

      try {
        if (this.ctx.state === "suspended") await this.ctx.resume();
      } catch {}

      try {
        await this._ensureMediaElementPlaying();
      } catch {}
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
  // PLAYBACK
  // ---------------------------------------------------------------------------
  async play(layers, opts = {}) {
    this.init();

    // Invalidate any in-flight prior run immediately
    const runId = this._bumpRun();

    // Ensure context is running
    try {
      if (this.ctx.state === "suspended") await this.ctx.resume();
    } catch {}

    // Ensure media output element exists
    if (this.useMediaOutput && (!this.mediaEl || !this.mediaDest)) {
      if (!this.mediaDest) {
        this.mediaDest = this.ctx.createMediaStreamDestination();
        this.master.output.connect(this.mediaDest);
      }
      this._ensureMediaElement();
    }

    // Unmute
    try {
      this.master?.input?.gain?.setValueAtTime(1.0, this.ctx.currentTime);
    } catch {}

    if (!opts.fromSystem) await this._ensureMediaElementPlaying();

    // If another run started during awaits, abort
    if (!this._isRunActive(runId)) return;

    // Hard-stop any currently built graph before building new (prevents layering)
    this._stopAllLayers();

    this.isPlaying = true;
    this.startTime = this.ctx.currentTime - this.seekOffset;
    this.lastLayers = layers;

    await this._buildGraph(layers, runId);

    // If run got invalidated mid-build, do not tick
    if (!this._isRunActive(runId) || !this.isPlaying) return;

    this._startTick();
  }

  async updateLayers(layers) {
    if (!this.isPlaying) return;

    const runId = this._runId; // current active run only
    this.lastLayers = layers;

    await this._buildGraph(layers, runId);
  }

  // HARD PAUSE: silence guaranteed
  pause() {
    if (!this.isPlaying) return;

    // Invalidate async continuations immediately
    this._bumpRun();

    this.isPlaying = false;
    this.seekOffset = this.ctx.currentTime - this.startTime;

    this._stopAllLayers();
    this._stopTick();

    try {
      this.master?.input?.gain?.setValueAtTime(0.0, this.ctx.currentTime);
    } catch {}

    try {
      this.mediaEl?.pause?.();
    } catch {}

    try {
      this.ctx?.suspend?.();
    } catch {}
  }

  // HARD STOP: silence + reset time
  stop() {
    // Invalidate async continuations immediately
    this._bumpRun();

    this.isPlaying = false;
    this.seekOffset = 0;
    this.startTime = 0;

    this._stopAllLayers();
    this._stopTick();

    try {
      this.master?.input?.gain?.setValueAtTime(0.0, this.ctx.currentTime);
    } catch {}

    try {
      this.mediaEl?.pause?.();
      if (this.mediaEl) this.mediaEl.currentTime = 0;
    } catch {}

    this.clearNowPlaying();

    try {
      this.delay.feedback.gain.setValueAtTime(0, this.ctx.currentTime);
      this.delay.delay.delayTime.setValueAtTime(0.5, this.ctx.currentTime);
    } catch {}

    try {
      this.ctx?.suspend?.();
    } catch {}
  }

  seek(time) {
    this.seekOffset = time;
    if (this.isPlaying) {
      this.startTime = this.ctx.currentTime - this.seekOffset;
    }
  }

  // ---------------------------------------------------------------------------
  // GRAPH BUILD (run-safe)
  // ---------------------------------------------------------------------------
  async _buildGraph(layers, runId) {
    if (!this._isRunActive(runId)) return;

    for (const layer of layers) {
      if (!this._isRunActive(runId)) return;

      const engineType = resolveType(layer.type);

      if (!layer.enabled) {
        const node = this.layers.get(layer.id);
        if (node) node.gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
        continue;
      }

      const existing = this.layers.get(layer.id);

      if (!existing) {
        const group = await this._createLayerNodes(layer, engineType, runId);
        if (!this._isRunActive(runId)) {
          // Ensure no stray nodes if we got invalidated right after creation
          try { this._stopNodeGroup(group); } catch {}
          return;
        }
        if (group) this.layers.set(layer.id, group);
      } else {
        await this._updateLayerNodes(layer, engineType, existing, runId);
      }
    }

    if (!this._isRunActive(runId)) return;

    // Remove stale nodes
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

  async _createLayerNodes(layer, engineType, runId) {
    if (!this._isRunActive(runId)) return null;

    const ctx = this.ctx;

    const gain = ctx.createGain();
    gain.gain.value = this._effectiveGainForLayer(layer, engineType);

    const pan = ctx.createStereoPanner();
    pan.pan.value = layer.pan ?? 0;

    const filter = ctx.createBiquadFilter();
    filter.type = layer.filter?.type || "lowpass";
    filter.frequency.value = layer.filter?.frequency || 20000;
    filter.Q.value = layer.filter?.Q || 1;

    filter.connect(gain);
    gain.connect(pan);

    // Send to master path (via delay dry/wet nodes)
    pan.connect(this.delay.dry);
    pan.connect(this.delay.delay);

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
      synth = createSynthGraph(ctx, layer.waveform, layer.frequency, filter);
      oscs = synth?.oscs || [];
    } else if (engineType === "ambient") {
      const buffer = await loadAmbientBuffer(ctx, layer.waveform, this.ambientCache);

      // If a new preset started while we were loading, abort safely.
      if (!this._isRunActive(runId)) {
        try { pan.disconnect(); } catch {}
        try { gain.disconnect(); } catch {}
        try { filter.disconnect(); } catch {}
        return null;
      }

      if (buffer) {
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        src.loop = true;
        src.connect(filter);
        src.start();

        // If invalidated immediately after starting, kill it.
        if (!this._isRunActive(runId)) {
          try { src.stop(); } catch {}
          try { pan.disconnect(); } catch {}
          try { gain.disconnect(); } catch {}
          try { filter.disconnect(); } catch {}
          return null;
        }

        ambient = { sources: [src], currentName: layer.waveform };
      }
    }

    return {
      id: layer.id,
      gain,
      pan,
      filter,
      source,
      synth,
      oscs, // always array for synth
      ambient,
      _synthType: engineType === "synth" ? (layer.waveform || "analog").toLowerCase() : null,
      _synthFreq: engineType === "synth" ? (layer.frequency ?? 432) : null,
    };
  }

  async _updateLayerNodes(layer, engineType, group, runId) {
    if (!this._isRunActive(runId)) return;

    const now = this.ctx.currentTime;

    group.gain.gain.setTargetAtTime(
      this._effectiveGainForLayer(layer, engineType),
      now,
      0.05
    );

    group.pan.pan.setTargetAtTime(layer.pan ?? 0, now, 0.05);

    const filterOn = layer.filterEnabled !== false;

    if (filterOn) {
      group.filter.type = layer.filter?.type || "lowpass";
      group.filter.frequency.setTargetAtTime(layer.filter?.frequency ?? 20000, now, 0.05);
      group.filter.Q.setTargetAtTime(layer.filter?.Q ?? 1, now, 0.05);
    } else {
      group.filter.type = "lowpass";
      group.filter.frequency.setTargetAtTime(20000, now, 0.05);
      group.filter.Q.setTargetAtTime(0.0001, now, 0.05);
    }

    if (engineType === "oscillator" && group.source) {
      group.source.frequency.setTargetAtTime(layer.frequency ?? 432, now, 0.05);
      group.source.type = layer.waveform;
    }

    if (engineType === "synth") {
      const nextType = (layer.waveform || "analog").toLowerCase();
      const nextFreq = layer.frequency ?? 432;

      if (group._synthType !== nextType || group._synthFreq !== nextFreq) {
        try {
          (group.oscs || []).forEach((o) => {
            try { o.stop(); } catch {}
          });
        } catch {}

        try {
          group.synth?.masterGain?.disconnect?.();
        } catch {}

        const newSynth = createSynthGraph(this.ctx, layer.waveform, nextFreq, group.filter);

        // If invalidated during rebuild, stop immediately
        if (!this._isRunActive(runId)) {
          try {
            (newSynth?.oscs || []).forEach((o) => {
              try { o.stop(); } catch {}
            });
          } catch {}
          try { newSynth?.masterGain?.disconnect?.(); } catch {}
          return;
        }

        group.synth = newSynth;
        group.oscs = newSynth?.oscs || [];
        group._synthType = nextType;
        group._synthFreq = nextFreq;
      }
    }

    if (engineType === "ambient") {
      if (group.ambient?.currentName !== layer.waveform) {
        const buf = await loadAmbientBuffer(this.ctx, layer.waveform, this.ambientCache);

        if (!this._isRunActive(runId)) return;

        if (buf) {
          group.ambient?.sources?.forEach((s) => {
            try { s.stop(); } catch {}
          });

          const src = this.ctx.createBufferSource();
          src.buffer = buf;
          src.loop = true;
          src.connect(group.filter);
          src.start();

          if (!this._isRunActive(runId)) {
            try { src.stop(); } catch {}
            return;
          }

          group.ambient = { sources: [src], currentName: layer.waveform };
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // STOP HELPERS
  // ---------------------------------------------------------------------------
  _stopAllLayers() {
    for (const group of this.layers.values()) this._stopNodeGroup(group);
    this.layers.clear();
  }

  _stopNodeGroup(group) {
    if (!group) return;
    try { group.source?.stop(); } catch {}
    try {
      (group.oscs || []).forEach((o) => {
        try { o.stop(); } catch {}
      });
    } catch {}
    try { group.synth?.masterGain?.disconnect?.(); } catch {}
    try {
      group.ambient?.sources?.forEach((s) => {
        try { s.stop(); } catch {}
      });
    } catch {}
    try { group.pan?.disconnect?.(); } catch {}
    try { group.gain?.disconnect?.(); } catch {}
    try { group.filter?.disconnect?.(); } catch {}
  }

  // ---------------------------------------------------------------------------
  // TICK
  // ---------------------------------------------------------------------------
  _startTick() {
    if (!this.onTick) return;

    const tick = () => {
      if (this.isPlaying) {
        const t = this.ctx.currentTime - this.startTime;
        this.onTick(t);
      }
      this.tickRAF = requestAnimationFrame(tick);
    };

    tick();
  }

  _stopTick() {
    cancelAnimationFrame(this.tickRAF);
    this.tickRAF = null;
  }

  // ---------------------------------------------------------------------------
  // FX API
  // ---------------------------------------------------------------------------
  setReverb(value) {
    const t = this.ctx.currentTime;
    const wet = Math.min(3, value * 2.5);
    this.reverb.dry.gain.setTargetAtTime(1 - value, t, 0.05);
    this.reverb.wet.gain.setTargetAtTime(wet, t, 0.05);
  }

  setDelayWet(value) {
    const t = this.ctx.currentTime;
    this.delay.dry.gain.setTargetAtTime(1 - value, t, 0.05);
    this.delay.wet.gain.setTargetAtTime(value, t, 0.05);
  }

  setDelayTime(value) {
    const t = this.ctx.currentTime;
    this.delay.delay.delayTime.linearRampToValueAtTime(value, t + 0.05);
  }

  // ---------------------------------------------------------------------------
  // UTIL
  // ---------------------------------------------------------------------------
  _softClip(amount, samples = 2048) {
    const c = new Float32Array(samples);
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      c[i] = Math.tanh(amount * x) / Math.tanh(amount);
    }
    return c;
  }

  _impulse(duration, decay) {
    const rate = this.ctx.sampleRate;
    const len = rate * duration;
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
  (typeof window !== "undefined" && window[ENGINE_KEY])
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
