// src/audio/AudioEngine.js
// -----------------------------------------------------------------------------
// AURA LAB — RELIABLE WEB AUDIO ENGINE
// -----------------------------------------------------------------------------
// Reliability requirements:
// 1) ALWAYS connect to ctx.destination for audible output.
//    (Using only a MediaStreamDestination + <audio> can fail silently due to
//     autoplay/gesture rules, resulting in "UI says playing, but silence".)
// 2) MediaElement path is OPTIONAL (best-effort lockscreen/background help).
// 3) Never let a single layer failure (e.g., ambient decode) prevent the whole
//    preset from starting.
// 4) Cancel stale async work (ambient loads) when a new run starts.
// -----------------------------------------------------------------------------

import { createNoiseBuffer } from "./NoiseEngines";
import { createSynthGraph } from "./SynthEngines";
import { loadAmbientBuffer } from "./AmbientLoader";

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
    this.delay = null;

    // Optional media output (best-effort only)
    this.useMediaOutput = false;
    this.mediaDest = null;
    this.mediaEl = null;
    this.mediaSessionBound = false;

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

    // One-time unlock hint
    this._unlockedOnce = false;
  }

  // ---------------------------------------------------------------------------
  // INIT / UNLOCK
  // ---------------------------------------------------------------------------
  init() {
    // If something closed our context (rare but possible), rebuild cleanly.
    if (this.ctx && this.ctx.state === "closed") {
      this.initialized = false;
      this.ctx = null;
      this.master = null;
      this.delay = null;
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

    // MASTER BUS
    const masterIn = this.ctx.createGain();
    masterIn.gain.value = 1.0;

    const analyser = this.ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.85;

    const masterOut = this.ctx.createGain();
    masterOut.gain.value = 1.0;

    // Route: input -> analyser -> out
    masterIn.connect(analyser);
    analyser.connect(masterOut);

    // CRITICAL: always audible output
    masterOut.connect(this.ctx.destination);

    // Optional: also feed a MediaStreamDestination
    if (this.useMediaOutput) {
      this.mediaDest = this.ctx.createMediaStreamDestination();
      masterOut.connect(this.mediaDest);
      this._ensureMediaElement();
    }

    this.master = { input: masterIn, analyser, output: masterOut };
    this.analyser = analyser;

    // DELAY (dry/wet buses)
    const delayNode = this.ctx.createDelay(5.0);
    delayNode.delayTime.value = 0.5;

    const feedback = this.ctx.createGain();
    feedback.gain.value = 0.3;

    const dry = this.ctx.createGain();
    dry.gain.value = 1;

    const wet = this.ctx.createGain();
    wet.gain.value = 0;

    delayNode.connect(feedback);
    feedback.connect(delayNode);
    delayNode.connect(wet);

    dry.connect(masterIn);
    wet.connect(masterIn);

    this.delay = { delay: delayNode, feedback, dry, wet };

    this.initialized = true;
    this._bindVisibilityHandlers();
    this._bindMediaSession();
  }

  unlock() {
    this.init();
    if (this._unlockedOnce) {
      this._kickMediaElement();
      return;
    }
    this._unlockedOnce = true;

    // Gesture-friendly: do not await
    try {
      this.ctx?.resume?.();
    } catch {}

    this._kickMediaElement();
  }

  async _resumeIfNeeded() {
    if (!this.ctx) return;
    if (this.ctx.state !== "suspended") return;

    // If we are inside a user gesture, resume should succeed.
    try {
      await this.ctx.resume();
    } catch (e) {
      // If resume fails, do not throw; the UI will still update,
      // but we preserve a console trace for diagnosis.
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
        try {
          n.pause();
        } catch {}
        try {
          n.srcObject = null;
        } catch {}
        try {
          n.remove();
        } catch {}
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

    // Keep silent to avoid double audio (audible path is ctx.destination).
    el.muted = false;
    el.volume = 0.0;

    document.body.appendChild(el);
    this.mediaEl = el;
  }

  _kickMediaElement() {
    if (!this.useMediaOutput) return;
    if (!this.mediaEl) return;

    try {
      if (this.mediaEl.paused) {
        // Do not await — keep gesture attribution when possible
        this.mediaEl.play();
      }
    } catch {
      // If autoplay blocks, that's fine. We still have ctx.destination.
    }
  }

  _bindVisibilityHandlers() {
    if (this._visibilityBound) return;
    this._visibilityBound = true;

    document.addEventListener("visibilitychange", async () => {
      if (!this.isPlaying) return;

      // Try to keep the context alive
      await this._resumeIfNeeded();

      // Optional keep-alive path
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
  // RUN TOKEN (cancels stale async work)
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

    // Invalidate any stale async continuation immediately
    const runId = this._bumpRun();

    // Gesture-friendly unlock + resume attempt
    this._kickMediaElement();
    await this._resumeIfNeeded();
    this._kickMediaElement();

    // Ensure we can hear output
    try {
      this.master.input.gain.setValueAtTime(1.0, this.ctx.currentTime);
    } catch {}

    // Replace program cleanly
    this._stopAllLayers();

    this.isPlaying = true;
    this.lastLayers = layers;

    this.startTime = this.ctx.currentTime - this.seekOffset;

    // Build graph (non-fatal per layer)
    await this._buildGraph(layers, runId);

    if (!this._isRunActive(runId) || !this.isPlaying) return;

    this._startTick();
  }

  async updateLayers(layers) {
    if (!this.isPlaying) return;
    const runId = this._runId; // current run only
    this.lastLayers = layers;
    await this._buildGraph(layers, runId);
  }

  pause() {
    if (!this.isPlaying) return;

    this._bumpRun(); // cancel stale awaits

    this.isPlaying = false;
    this.seekOffset = this.ctx.currentTime - this.startTime;

    this._stopAllLayers();
    this._stopTick();

    // Do NOT suspend here (suspend/resume can be flaky across browsers)
    try {
      this.master.input.gain.setValueAtTime(0.0, this.ctx.currentTime);
    } catch {}
  }

  stop() {
    this._bumpRun(); // cancel stale awaits

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
          const group = await this._createLayerNodes(layer, engineType, runId);
          if (!this._isRunActive(runId)) {
            // kill stray nodes if invalidated post-create
            try {
              this._stopNodeGroup(group);
            } catch {}
            return;
          }
          if (group) this.layers.set(layer.id, group);
        } catch (e) {
          // NON-FATAL: keep building other layers
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

  _createCommonNodes(layer, engineType) {
    const ctx = this.ctx;

    const gain = ctx.createGain();
    gain.gain.value = this._effectiveGainForLayer(layer, engineType);

    const pan = ctx.createStereoPanner();
    pan.pan.value = layer.pan ?? 0;

    const filter = ctx.createBiquadFilter();
    filter.type = layer.filter?.type || "lowpass";
    filter.frequency.value = layer.filter?.frequency || 20000;
    filter.Q.value = layer.filter?.Q || 1;

    // filter -> gain -> pan -> (dry + delay)
    filter.connect(gain);
    gain.connect(pan);

    pan.connect(this.delay.dry);
    pan.connect(this.delay.delay);

    return { filter, gain, pan };
  }

  async _createLayerNodes(layer, engineType, runId) {
    if (!this._isRunActive(runId)) return null;

    const ctx = this.ctx;
    const { filter, gain, pan } = this._createCommonNodes(layer, engineType);

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
      // Ambient decode failures should not block the whole preset.
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
        // If missing/corrupt, keep a placeholder so other layers still play.
        ambient = { sources: [], currentName: layer.waveform };
      }
    }

    // Filter enabled/bypass handling
    if (layer.filterEnabled === false) {
      try {
        filter.frequency.setValueAtTime(20000, ctx.currentTime);
        filter.Q.setValueAtTime(0.0001, ctx.currentTime);
      } catch {}
    }

    return { source, synth, oscs, ambient, gain, pan, filter, engineType };
  }

  async _updateLayerNodes(layer, engineType, group, runId) {
    if (!this._isRunActive(runId)) return;

    const t = this.ctx.currentTime;

    // volume / pan
    const eff = this._effectiveGainForLayer(layer, engineType);
    try {
      group.gain.gain.setTargetAtTime(eff, t, 0.05);
    } catch {}
    try {
      group.pan.pan.setTargetAtTime(layer.pan ?? 0, t, 0.05);
    } catch {}

    // filter
    if (layer.filterEnabled === false) {
      try {
        group.filter.frequency.setTargetAtTime(20000, t, 0.05);
        group.filter.Q.setTargetAtTime(0.0001, t, 0.05);
      } catch {}
    } else {
      try {
        group.filter.type = layer.filter?.type || "lowpass";
      } catch {}
      try {
        group.filter.frequency.setTargetAtTime(layer.filter?.frequency || 20000, t, 0.05);
      } catch {}
      try {
        group.filter.Q.setTargetAtTime(layer.filter?.Q || 1, t, 0.05);
      } catch {}
    }

    // oscillator
    if (engineType === "oscillator" && group.source) {
      try {
        group.source.type = layer.waveform ?? "sine";
      } catch {}
      try {
        group.source.frequency.setTargetAtTime(layer.frequency ?? 432, t, 0.02);
      } catch {}
    }

    // synth
    if (engineType === "synth" && group.synth) {
      try {
        group.synth.setWaveform?.(layer.waveform);
      } catch {}
      try {
        group.synth.setFrequency?.(layer.frequency);
      } catch {}
    }

    // noise waveform swap
    if (engineType === "noise" && group.source) {
      const desired = layer.waveform || "white";
      if (group._noiseWaveform !== desired) {
        group._noiseWaveform = desired;
        try {
          group.source.buffer = createNoiseBuffer(this.ctx, desired);
        } catch {}
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
            try {
              s.stop();
            } catch {}
            try {
              s.disconnect();
            } catch {}
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
          try {
            src.start();
          } catch {}

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

    if (group.ambient?.sources?.length) {
      group.ambient.sources.forEach((s) => {
        try {
          s.stop();
        } catch {}
        try {
          s.disconnect();
        } catch {}
      });
    }

    try {
      group.filter?.disconnect();
    } catch {}
    try {
      group.gain?.disconnect();
    } catch {}
    try {
      group.pan?.disconnect();
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
