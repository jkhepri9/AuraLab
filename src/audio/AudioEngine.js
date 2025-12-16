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

// Map 0..1 -> 0..MAX_DB (neutral at 0)
function toneDb01(v01, maxDb = 8) {
  const v = clamp(v01, 0, 1);
  return v * maxDb;
}

function randRange(min, max) {
  return min + Math.random() * (max - min);
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// -----------------------------------------------------------------------------
// OFFLINE RENDER HELPERS (WAV EXPORT)
// -----------------------------------------------------------------------------
function impulseForContext(ctx, durationSec = 2.0, decay = 2.0) {
  const rate = ctx.sampleRate || 44100;
  const len = Math.max(1, Math.floor(rate * durationSec));
  const buf = ctx.createBuffer(2, len, rate);

  for (let c = 0; c < 2; c++) {
    const ch = buf.getChannelData(c);
    for (let i = 0; i < len; i++) {
      ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
  }

  return buf;
}

function audioBufferToWavBlob(audioBuffer) {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const numFrames = audioBuffer.length;

  const bytesPerSample = 2; // 16-bit PCM
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numFrames * blockAlign;

  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset, str) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  // RIFF header
  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");

  // fmt chunk
  writeString(12, "fmt ");
  view.setUint32(16, 16, true); // PCM
  view.setUint16(20, 1, true);  // format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // bits

  // data chunk
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  // Interleave channels
  const channels = [];
  for (let c = 0; c < numChannels; c++) channels.push(audioBuffer.getChannelData(c));

  let offset = 44;
  for (let i = 0; i < numFrames; i++) {
    for (let c = 0; c < numChannels; c++) {
      let sample = channels[c][i];
      sample = Math.max(-1, Math.min(1, sample));
      // Convert float [-1..1] to int16
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([buffer], { type: "audio/wav" });
}

class AudioEngineClass {
  constructor() {
    this.ctx = null;

    // Master graph handles (created in init)
    this.master = null;
    this.analyser = null;
    this.delay = null;
    this.reverb = null;

    // NEW: master tone (shelf EQ)
    this.tone = null;

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

    // NEW: track desired master output gain even if graph re-inits
    this._outputGain = 1.0;

    // NEW: track desired tone even if graph re-inits (0..1, neutral at 0)
    this._tone = {
      warmth: 0,  // 0..1
      clarity: 0, // 0..1
    };

    // -----------------------------------------------------------------------
    // MOTION (subtle evolution)
    // - Parameter drift (volume + filter cutoff)
    // - Ambient multi-loop desynchronization (handled per ambient layer)
    // - Event-based micro-accents (very sparse one-shots)
    //
    // NOTE: This is fully internal—no preset/UI changes required.
    // -----------------------------------------------------------------------
    this._motion = {
      enabled: true,

      // Drift: runs periodically and eases toward new targets (no jumps)
      driftIntervalMs: 12000,
      driftTimeConstant: 2.2,

      // Accent events: extremely sparse, never rhythmic
      accentMinMs: 5 * 60 * 1000,
      accentMaxMs: 15 * 60 * 1000,

      _driftTimer: null,
      _accentTimer: null,
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
    // MASTER TONE (NEW) — two shelves
    // reverbSum -> lowShelf(warmth) -> highShelf(clarity) -> analyser -> out
    // -----------------------------------------------------------------------
    const lowShelf = this.ctx.createBiquadFilter();
    lowShelf.type = "lowshelf";
    lowShelf.frequency.value = 220; // warmth center
    lowShelf.Q.value = 0.7;
    lowShelf.gain.value = toneDb01(this._tone.warmth, 8);

    const highShelf = this.ctx.createBiquadFilter();
    highShelf.type = "highshelf";
    highShelf.frequency.value = 5500; // clarity center
    highShelf.Q.value = 0.7;
    highShelf.gain.value = toneDb01(this._tone.clarity, 8);

    reverbSum.connect(lowShelf);
    lowShelf.connect(highShelf);

    this.tone = { lowShelf, highShelf };

    // -----------------------------------------------------------------------
    // ANALYSER + OUTPUT
    // -----------------------------------------------------------------------
    const analyser = this.ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.85;

    const out = this.ctx.createGain();
    out.gain.value = clamp(this._outputGain, 0.0, 2.0);

    // analyser sees post-tone
    highShelf.connect(analyser);
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
  // NEW: MASTER OUTPUT + TONE API
  // ---------------------------------------------------------------------------
  setOutputGain(value) {
    const v = clamp(value, 0.0, 2.0); // allow mild boost; UI can cap lower
    this._outputGain = v;

    if (!this.ctx || !this.master?.output) return;
    const t = this.ctx.currentTime;
    try {
      // smooth, avoids clicks
      this.master.output.gain.setTargetAtTime(v, t, 0.03);
    } catch {
      try { this.master.output.gain.value = v; } catch {}
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

    try { this.tone.lowShelf.gain.setTargetAtTime(wDb, t, 0.05); } catch {}
    try { this.tone.highShelf.gain.setTargetAtTime(cDb, t, 0.05); } catch {}
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

    // Ensure master output/tone apply (in case init happened mid-session)
    this.setOutputGain(this._outputGain);
    this.setTone(this._tone);

    // Replace program cleanly
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
  // MOTION — subtle evolution (internal)
  // ---------------------------------------------------------------------------
  _startMotion() {
    this._stopMotion();
    if (!this._motion?.enabled) return;

    // Parameter drift tick
    this._motion._driftTimer = setInterval(() => {
      if (!this.isPlaying || !this.ctx) return;
      try { this._applyParameterDrift(); } catch {}
    }, this._motion.driftIntervalMs);

    // Accent scheduler
    this._scheduleNextAccent();
  }

  _stopMotion() {
    try {
      if (this._motion?._driftTimer) clearInterval(this._motion._driftTimer);
      if (this._motion?._accentTimer) clearTimeout(this._motion._accentTimer);
    } catch {}
    if (this._motion) {
      this._motion._driftTimer = null;
      this._motion._accentTimer = null;
    }
  }

  _applyParameterDrift() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    for (const [, group] of this.layers.entries()) {
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
        group.driftGain?.gain?.setTargetAtTime(mult, t, this._motion.driftTimeConstant);
      } catch {}

      // --- filter cutoff drift (derived from base)
      const baseEnabled = group._motionBase?.filterEnabled ?? true;
      if (!baseEnabled) continue;

      const baseFreq = Number(group._motionBase?.filterFreq ?? group.filter?.frequency?.value ?? 20000) || 20000;

      // Keep drift very gentle when filter is basically open
      const fDepth =
        baseFreq >= 18000 ? 0.02 :
        type === "ambient" ? 0.10 :
        0.07;

      const nextFreq = clamp(baseFreq * randRange(1 - fDepth, 1 + fDepth), 40, 20000);

      try {
        group.filter?.frequency?.setTargetAtTime(nextFreq, t, this._motion.driftTimeConstant);
      } catch {}
    }
  }

  _scheduleNextAccent() {
    if (!this._motion?.enabled) return;
    if (!this.isPlaying) return;

    const ms = Math.floor(randRange(this._motion.accentMinMs, this._motion.accentMaxMs));

    try {
      this._motion._accentTimer = setTimeout(() => {
        if (!this.isPlaying) return;
        try { this._playAccent(); } catch {}
        this._scheduleNextAccent();
      }, ms);
    } catch {}
  }

  _playAccent() {
    if (!this.ctx || !this.master?.input) return;

    const ctx = this.ctx;

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

    const pan = ctx.createStereoPanner();
    pan.pan.value = randRange(-0.35, 0.35);

    o1.connect(bp);
    o2.connect(bp);
    bp.connect(g);
    g.connect(pan);
    pan.connect(this.master.input);

    // Envelope (quiet and smooth)
    const peak = 0.018;
    try {
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(peak, t0 + 0.06);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    } catch {}

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
    } catch {}

    try { o1.start(t0); } catch {}
    try { o2.start(t0); } catch {}

    try { o1.stop(stopAt); } catch {}
    try { o2.stop(stopAt); } catch {}

    // Fallback cleanup in case onended doesn't fire as expected
    try { setTimeout(cleanup, Math.ceil((dur + 0.5) * 1000)); } catch {}
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

    // Drift stage (subtle, internal evolution)
    const driftGain = ctx.createGain();
    driftGain.gain.value = 1.0;

    const pan = ctx.createStereoPanner();
    pan.pan.value = layer.pan ?? 0;

    const filter = ctx.createBiquadFilter();
    filter.type = layer.filter?.type || "lowpass";
    filter.frequency.value = layer.filter?.frequency || 20000;
    filter.Q.value = layer.filter?.Q || 1;

    // Signal path:
    // source -> filter -> gain(volume) -> amp(pulse) -> driftGain(motion) -> pan -> master mix input
    filter.connect(gain);
    gain.connect(amp);
    amp.connect(driftGain);
    driftGain.connect(pan);
    pan.connect(this.master.input);

    return { filter, gain, amp, driftGain, pan };
  }

  // ---------------------------------------------------------------------------
  // AMBIENT: MULTI-LOOP DESYNCHRONIZATION (internal)
  // ---------------------------------------------------------------------------
  _createAmbientDesyncSources(buffer, filter) {
    const ctx = this.ctx;
    if (!ctx || !buffer || !filter) return [];

    // Keep it lightweight: 2 layers is enough to break obvious repetition.
    const count = 2;
    const sources = [];

    // Use gentle rate offsets to avoid audible pitch shift; combined with random
    // start offsets, the composite texture avoids obvious looping.
    for (let i = 0; i < count; i++) {
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.loop = true;

      const preGain = ctx.createGain();
      preGain.gain.value = 1 / count;

      // Slight divergence (one stays at 1.0, the other slightly off)
      const rate = i === 0 ? 1.0 : randRange(0.997, 1.003);
      try { src.playbackRate.value = rate; } catch {}

      // Random phase offset into the buffer (safe for loops)
      const dur = buffer.duration || 0;
      const offset = dur > 0.25 ? randRange(0, Math.max(0, dur - 0.05)) : 0;

      src.connect(preGain);
      preGain.connect(filter);

      try { src.start(0, offset); } catch { try { src.start(); } catch {} }

      sources.push({ src, preGain });
    }

    return sources;
  }

  _stopAmbientSources(sources = []) {
    try {
      (sources || []).forEach((s) => {
        const src = s?.src ?? s;
        const preGain = s?.preGain ?? s?.gain ?? null;

        try { src?.stop?.(); } catch {}
        try { src?.disconnect?.(); } catch {}

        try { preGain?.disconnect?.(); } catch {}
      });
    } catch {}
  }

  async _createLayerNodes(layer, engineType, runId) {
    if (!this._isRunActive(runId)) return null;

    const ctx = this.ctx;
    const { filter, gain, amp, driftGain, pan } = this._createCommonNodes(layer, engineType);

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
        const sources = this._createAmbientDesyncSources(buffer, filter);
        ambient = { sources, currentName: layer.waveform };
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
      driftGain,
      pan,
      filter,
      engineType,
      _noiseWaveform: engineType === "noise" ? (layer.waveform || "white") : undefined,
      _synthType: engineType === "synth" ? (layer.waveform || "analog") : undefined,
      _synthFreq: engineType === "synth" ? (layer.frequency ?? 432) : undefined,

      // Motion base values (used by parameter drift; updated in _updateLayerNodes)
      _motionBase: {
        filterEnabled: layer.filterEnabled !== false,
        filterFreq: layer.filter?.frequency || 20000,
      },
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

    // Keep base values for internal motion (parameter drift). Drift should never
    // overwrite the user’s intended setting; instead we re-derive from this base.
    try {
      if (!group._motionBase) group._motionBase = {};
      group._motionBase.filterEnabled = layer.filterEnabled !== false;
      group._motionBase.filterFreq = (layer.filterEnabled === false)
        ? 20000
        : (layer.filter?.frequency || 20000);
    } catch {}

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
        this._stopAmbientSources(group.ambient?.sources);

        let buffer = null;
        try {
          buffer = await loadAmbientBuffer(this.ctx, desired, this.ambientCache);
        } catch (e) {
          console.warn("[AudioEngine] Ambient load failed:", e);
          buffer = null;
        }

        if (!this._isRunActive(runId)) return;

        if (buffer) {
          const sources = this._createAmbientDesyncSources(buffer, group.filter);
          group.ambient = { sources, currentName: desired };
        } else {
          group.ambient = { sources: [], currentName: desired };
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // OFFLINE EXPORT (WAV)
  // ---------------------------------------------------------------------------
  /**
   * Render a layer stack to a downloadable WAV (16-bit PCM) using OfflineAudioContext.
   * The render uses the same source engines (oscillator/noise/synth/ambient) and
   * applies current Studio FX (delay/reverb) + optional tone/output gain.
   *
   * @param {Array} layers
   * @param {number} seconds
   * @param {object} options
   * @returns {Promise<Blob>}
   */
  async renderWav(layers, seconds, options = {}) {
    const OfflineAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!OfflineAC) {
      throw new Error("OfflineAudioContext is not supported in this browser.");
    }

    const secs = clamp(Number(seconds) || 0, 1, 60 * 60); // hard cap 60 minutes
    const sampleRate = this.ctx?.sampleRate || 44100;
    const length = Math.ceil(secs * sampleRate);
    const ctx = new OfflineAC(2, length, sampleRate);

    // -----------------------------------------------------------------------
    // PRE-FX SUM BUS (all layers feed here)
    // -----------------------------------------------------------------------
    const mixIn = ctx.createGain();
    mixIn.gain.value = 1.0;

    // -----------------------------------------------------------------------
    // DELAY (insert-style)
    // -----------------------------------------------------------------------
    const delayNode = ctx.createDelay(5.0);
    delayNode.delayTime.value = clamp(
      options.delayTime ?? this._fx.delayTime,
      0.01,
      5.0
    );

    const feedback = ctx.createGain();
    feedback.gain.value = clamp(
      options.delayFeedback ?? this._fx.delayFeedback,
      0.0,
      0.95
    );

    const dlDry = ctx.createGain();
    const dlWet = ctx.createGain();
    const delaySum = ctx.createGain();

    const delayWet = clamp(options.delayWet ?? this._fx.delayWet, 0, 1);
    dlDry.gain.value = 1 - delayWet;
    dlWet.gain.value = delayWet;

    mixIn.connect(dlDry);
    mixIn.connect(delayNode);

    delayNode.connect(feedback);
    feedback.connect(delayNode);
    delayNode.connect(dlWet);

    dlDry.connect(delaySum);
    dlWet.connect(delaySum);

    // -----------------------------------------------------------------------
    // REVERB (insert-style)
    // -----------------------------------------------------------------------
    const conv = ctx.createConvolver();
    conv.buffer = impulseForContext(ctx, 2.0, 2.0);

    const rvDry = ctx.createGain();
    const rvWet = ctx.createGain();
    const reverbSum = ctx.createGain();

    const reverbWet = clamp(options.reverbWet ?? this._fx.reverbWet, 0, 1);
    const wetGain = Math.min(3, reverbWet * 2.5);
    rvDry.gain.value = 1 - reverbWet;
    rvWet.gain.value = wetGain;

    delaySum.connect(rvDry);
    delaySum.connect(conv);
    conv.connect(rvWet);

    rvDry.connect(reverbSum);
    rvWet.connect(reverbSum);

    // -----------------------------------------------------------------------
    // TONE (offline, matches realtime)
    // -----------------------------------------------------------------------
    const lowShelf = ctx.createBiquadFilter();
    lowShelf.type = "lowshelf";
    lowShelf.frequency.value = 220;
    lowShelf.Q.value = 0.7;

    const highShelf = ctx.createBiquadFilter();
    highShelf.type = "highshelf";
    highShelf.frequency.value = 5500;
    highShelf.Q.value = 0.7;

    const warmth01 = clamp(options.warmth ?? options.tone?.warmth ?? this._tone.warmth, 0, 1);
    const clarity01 = clamp(options.clarity ?? options.tone?.clarity ?? this._tone.clarity, 0, 1);
    lowShelf.gain.value = toneDb01(warmth01, 8);
    highShelf.gain.value = toneDb01(clarity01, 8);

    reverbSum.connect(lowShelf);
    lowShelf.connect(highShelf);

    // Output
    const out = ctx.createGain();
    out.gain.value = clamp(options.outputGain ?? this._outputGain, 0.0, 2.0);

    highShelf.connect(out);
    out.connect(ctx.destination);

    // -----------------------------------------------------------------------
    // LAYERS (sources -> filter -> amp/pulse -> pan -> layerGain -> mixIn)
    // -----------------------------------------------------------------------
    const ambientCache = new Map();
    const list = Array.isArray(layers) ? layers : [];

    for (const layer of list) {
      if (!layer || layer.enabled === false) continue;

      const engineType = resolveType(layer.type);
      const baseVol = clamp(layer.volume ?? 0.5, 0, 1);
      const panVal = clamp(layer.pan ?? 0, -1, 1);

      // Filter
      const filter = ctx.createBiquadFilter();
      const fEnabled = Boolean(layer.filterEnabled);
      const fType = layer.filter?.type || "lowpass";
      const fFreq = clamp(layer.filter?.frequency ?? 20000, 20, 20000);
      const fQ = clamp(layer.filter?.Q ?? 1, 0.1, 18);
      filter.type = fType;
      filter.frequency.value = fEnabled ? fFreq : 20000;
      filter.Q.value = fEnabled ? fQ : 0.7;

      // Amp (volume + pulse)
      const amp = ctx.createGain();
      amp.gain.value = baseVol;

      const pulseRate = clamp(layer.pulseRate ?? 0, 0, 40);
      const pulseDepth = clamp(layer.pulseDepth ?? 0, 0, 1);
      if (pulseRate > 0 && pulseDepth > 0) {
        // Range: baseVol*(1-depth) -> baseVol*(1)
        amp.gain.value = baseVol * (1 - pulseDepth / 2);
        const lfo = ctx.createOscillator();
        lfo.type = "sine";
        lfo.frequency.value = pulseRate;

        const lfoGain = ctx.createGain();
        lfoGain.gain.value = baseVol * (pulseDepth / 2);

        lfo.connect(lfoGain);
        lfoGain.connect(amp.gain);
        lfo.start(0);
      }

      // Pan
      let panNode;
      if (typeof ctx.createStereoPanner === "function") {
        panNode = ctx.createStereoPanner();
        panNode.pan.value = panVal;
      } else {
        // Fallback: no pan support
        panNode = ctx.createGain();
      }

      // Layer gain (ambient boost)
      const layerGain = ctx.createGain();
      layerGain.gain.value = engineType === "ambient" ? this.ambientGainBoost : 1.0;

      // Wire chain
      filter.connect(amp);
      amp.connect(panNode);
      panNode.connect(layerGain);
      layerGain.connect(mixIn);

      // Create source
      if (engineType === "oscillator") {
        const osc = ctx.createOscillator();
        osc.type = layer.waveform || "sine";
        osc.frequency.value = clamp(layer.frequency ?? 432, 0, 24000);
        osc.connect(filter);
        osc.start(0);
      }

      if (engineType === "noise") {
        const src = ctx.createBufferSource();
        src.buffer = createNoiseBuffer(ctx, layer.waveform || "white");
        src.loop = true;
        src.connect(filter);
        src.start(0);
      }

      if (engineType === "synth") {
        // Synth graph starts its internal oscillators immediately.
        createSynthGraph(ctx, layer.waveform ?? "analog", layer.frequency ?? 432, filter);
      }

      if (engineType === "ambient") {
        const waveform = layer.waveform;
        if (!waveform) continue;
        let buffer = null;
        try {
          buffer = await loadAmbientBuffer(ctx, waveform, ambientCache);
        } catch (e) {
          console.warn("[AudioEngine] Offline ambient load failed:", e);
          buffer = null;
        }
        if (!buffer) continue;

        // Multi-loop desync (offline): 2 layered loops with subtle rate divergence
        const count = 2;
        for (let i = 0; i < count; i++) {
          const src = ctx.createBufferSource();
          src.buffer = buffer;
          src.loop = true;

          const pre = ctx.createGain();
          pre.gain.value = 1 / count;

          const rate = i === 0 ? 1.0 : (0.997 + Math.random() * 0.006); // 0.997..1.003
          try { src.playbackRate.value = rate; } catch {}

          const dur = buffer.duration || 0;
          const offset = dur > 0.25 ? Math.random() * Math.max(0, dur - 0.05) : 0;

          src.connect(pre);
          pre.connect(filter);

          try { src.start(0, offset); } catch { src.start(0); }
        }
      }
    }

    const rendered = await ctx.startRendering();
    return audioBufferToWavBlob(rendered);
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
      this._stopAmbientSources(group.ambient.sources);
    }

    // Pulse (LFO)
    try { this._removePulseNodes(group); } catch {}

    try { group.pan?.disconnect?.(); } catch {}
    try { group.driftGain?.disconnect?.(); } catch {}
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
