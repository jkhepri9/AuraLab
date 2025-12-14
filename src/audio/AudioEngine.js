// src/editor/audio/AudioEngine.js
// -----------------------------------------------------------------------------
// AURA LAB — COMPLETE, STABLE AUDIO ENGINE
// Supports UI types: frequency, color, synth, ambient
// -----------------------------------------------------------------------------
//
// CHANGE: Adds a global ambient gain boost (ambientGainBoost) applied ONLY
// to ambient layers app-wide via this engine.
//
// Effective ambient layer gain = (layer.volume ?? 0.5) * ambientGainBoost
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

// -----------------------------------------------------------------------------
// ENGINE CLASS
// -----------------------------------------------------------------------------
class AudioEngineClass {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.reverb = null;
    this.delay = null;

    this.layers = new Map();
    this.ambientCache = new Map();

    this.initialized = false;

    this.startTime = 0;
    this.seekOffset = 0;
    this.isPlaying = false;

    this.onTick = null;
    this.tickRAF = null;

    // ✅ GLOBAL AMBIENT BOOST (tune this)
    this.ambientGainBoost = 1.8;
  }

  init() {
    if (this.initialized) return;

    const AC = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AC();

    // MASTER BUS
    const masterIn = this.ctx.createGain();
    masterIn.gain.value = 1.0;

    const shaper = this.ctx.createWaveShaper();
    shaper.curve = this._softClip(2.5);

    const masterOut = this.ctx.createGain();
    masterOut.gain.value = 1.0;

    masterIn.connect(shaper);
    shaper.connect(masterOut);
    masterOut.connect(this.ctx.destination);

    this.master = { input: masterIn, shaper, output: masterOut };

    // REVERB
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
  }

  async play(layers) {
    this.init();
    if (this.ctx.state === "suspended") await this.ctx.resume();

    this.isPlaying = true;
    this.startTime = this.ctx.currentTime - this.seekOffset;

    await this._buildGraph(layers);
    this._startTick();
  }

  pause() {
    if (!this.isPlaying) return;

    this.isPlaying = false;
    this.seekOffset = this.ctx.currentTime - this.startTime;

    this._stopAllLayers();
    this._stopTick();
  }

  stop() {
    this.isPlaying = false;
    this.seekOffset = 0;
    this.startTime = 0;

    this._stopAllLayers();
    this._stopTick();

    try {
      this.delay.feedback.gain.setValueAtTime(0, this.ctx.currentTime);
      this.delay.delay.delayTime.setValueAtTime(0.5, this.ctx.currentTime);
    } catch {}
  }

  seek(time) {
    this.seekOffset = time;
    if (this.isPlaying) {
      this.startTime = this.ctx.currentTime - this.seekOffset;
    }
  }

  async _buildGraph(layers) {
    for (const layer of layers) {
      const engineType = resolveType(layer.type);

      if (!layer.enabled) {
        const node = this.layers.get(layer.id);
        if (node) node.gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
        continue;
      }

      const existing = this.layers.get(layer.id);

      if (!existing) {
        const group = await this._createLayerNodes(layer, engineType);
        this.layers.set(layer.id, group);
      } else {
        await this._updateLayerNodes(layer, engineType, existing);
      }
    }

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

  async _createLayerNodes(layer, engineType) {
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

    pan.connect(this.reverb.dry);
    pan.connect(this.reverb.convolver);
    this.reverb.convolver.connect(this.reverb.wet);

    pan.connect(this.delay.dry);
    pan.connect(this.delay.delay);

    let source = null;
    let oscs = null;
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
      oscs = createSynthGraph(ctx, layer.waveform, layer.frequency, filter);
    } else if (engineType === "ambient") {
      // ✅ Uses SAME ctx; caches buffers in this.ambientCache
      const buffer = await loadAmbientBuffer(ctx, layer.waveform, this.ambientCache);
      if (buffer) {
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        src.loop = true;
        src.connect(filter);
        src.start();
        ambient = { sources: [src], currentName: layer.waveform };
      }
    }

    return { id: layer.id, gain, pan, filter, source, oscs, ambient };
  }

  async _updateLayerNodes(layer, engineType, group) {
    const now = this.ctx.currentTime;

    // ✅ Apply ambient gain boost ONLY for ambient layers
    group.gain.gain.setTargetAtTime(
      this._effectiveGainForLayer(layer, engineType),
      now,
      0.05
    );

    group.pan.pan.setTargetAtTime(layer.pan ?? 0, now, 0.05);

    // Correct: filter is on unless explicitly disabled
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

    if (engineType === "ambient") {
      if (group.ambient?.currentName !== layer.waveform) {
        const buf = await loadAmbientBuffer(this.ctx, layer.waveform, this.ambientCache);
        if (buf) {
          group.ambient.sources.forEach((s) => {
            try {
              s.stop();
            } catch {}
          });

          const src = this.ctx.createBufferSource();
          src.buffer = buf;
          src.loop = true;
          src.connect(group.filter);
          src.start();

          group.ambient = { sources: [src], currentName: layer.waveform };
        }
      }
    }
  }

  _stopAllLayers() {
    for (const group of this.layers.values()) this._stopNodeGroup(group);
    this.layers.clear();
  }

  _stopNodeGroup(group) {
    try {
      group.source?.stop();
    } catch {}
    try {
      group.oscs?.forEach((o) => o.stop());
    } catch {}
    try {
      group.ambient?.sources?.forEach((s) => s.stop());
    } catch {}
  }

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

const AudioEngine = new AudioEngineClass();

export function createAudioEngine(config = {}) {
  AudioEngine.init();

  if (config.onTick) AudioEngine.onTick = config.onTick;

  // ✅ Optional override at creation time:
  // createAudioEngine({ ambientGainBoost: 2.0 })
  if (typeof config.ambientGainBoost === "number" && !Number.isNaN(config.ambientGainBoost)) {
    AudioEngine.ambientGainBoost = config.ambientGainBoost;
  }

  return AudioEngine;
}

export default AudioEngine;
