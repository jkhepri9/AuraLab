// src/audio/offline/renderWav.js
// -----------------------------------------------------------------------------
// Offline WAV renderer (OfflineAudioContext) — extracted from AudioEngine.
// Behavior is identical to the inline renderWav() implementation.
// -----------------------------------------------------------------------------

import { createNoiseBuffer } from "../NoiseEngines";
import { createSynthGraph } from "../SynthEngines";
import { loadAmbientBuffer } from "../AmbientLoader";

import {
  resolveType,
  clamp,
  toneDb01,
  impulseForContext,
  audioBufferToWavBlob,
} from "../engine/utils/helpers";

/**
 * Render a layer stack to a downloadable WAV (16-bit PCM) using OfflineAudioContext.
 *
 * @param {object} params
 * @param {Array}  params.layers
 * @param {number} params.seconds
 * @param {object} params.options
 * @param {object} params.state
 * @param {object} params.state.fx
 * @param {object} params.state.tone
 * @param {number} params.state.outputGain
 * @param {number} params.state.ambientGainBoost
 * @returns {Promise<Blob>}
 */
export async function renderWavOffline({
  layers,
  seconds,
  options = {},
  state = {},
}) {
  const OfflineAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  if (!OfflineAC) {
    throw new Error("OfflineAudioContext is not supported in this browser.");
  }

  const fx = state.fx || {};
  const tone = state.tone || { warmth: 0, clarity: 0 };
  const outputGain = typeof state.outputGain === "number" ? state.outputGain : 1.0;
  const ambientGainBoost =
    typeof state.ambientGainBoost === "number" ? state.ambientGainBoost : 1.8;

  const secs = clamp(Number(seconds) || 0, 1, 60 * 60); // hard cap 60 minutes
  const sampleRate = state.sampleRate || 44100;
  const length = Math.ceil(secs * sampleRate);
  const ctx = new OfflineAC(2, length, sampleRate);

  // -------------------------------------------------------------------------
  // PRE-FX SUM BUS (all layers feed here)
  // -------------------------------------------------------------------------
  const mixIn = ctx.createGain();
  mixIn.gain.value = 1.0;

  // -------------------------------------------------------------------------
  // DELAY (insert-style)
  // -------------------------------------------------------------------------
  const delayNode = ctx.createDelay(5.0);
  delayNode.delayTime.value = clamp(options.delayTime ?? fx.delayTime, 0.01, 5.0);

  const feedback = ctx.createGain();
  feedback.gain.value = clamp(options.delayFeedback ?? fx.delayFeedback, 0.0, 0.95);

  const dlDry = ctx.createGain();
  const dlWet = ctx.createGain();
  const delaySum = ctx.createGain();

  const delayWet = clamp(options.delayWet ?? fx.delayWet, 0, 1);
  dlDry.gain.value = 1 - delayWet;
  dlWet.gain.value = delayWet;

  mixIn.connect(dlDry);
  mixIn.connect(delayNode);

  delayNode.connect(feedback);
  feedback.connect(delayNode);
  delayNode.connect(dlWet);

  dlDry.connect(delaySum);
  dlWet.connect(delaySum);

  // -------------------------------------------------------------------------
  // REVERB (insert-style)
  // -------------------------------------------------------------------------
  const conv = ctx.createConvolver();
  conv.buffer = impulseForContext(ctx, 2.0, 2.0);

  const rvDry = ctx.createGain();
  const rvWet = ctx.createGain();
  const reverbSum = ctx.createGain();

  const reverbWet = clamp(options.reverbWet ?? fx.reverbWet, 0, 1);
  const wetGain = Math.min(3, reverbWet * 2.5);
  rvDry.gain.value = 1 - reverbWet;
  rvWet.gain.value = wetGain;

  delaySum.connect(rvDry);
  delaySum.connect(conv);
  conv.connect(rvWet);

  rvDry.connect(reverbSum);
  rvWet.connect(reverbSum);

  // -------------------------------------------------------------------------
  // TONE (offline, matches realtime)
  // -------------------------------------------------------------------------
  const lowShelf = ctx.createBiquadFilter();
  lowShelf.type = "lowshelf";
  lowShelf.frequency.value = 220;
  lowShelf.Q.value = 0.7;

  const highShelf = ctx.createBiquadFilter();
  highShelf.type = "highshelf";
  highShelf.frequency.value = 5500;
  highShelf.Q.value = 0.7;

  const warmth01 = clamp(options.warmth ?? options.tone?.warmth ?? tone.warmth, 0, 1);
  const clarity01 = clamp(options.clarity ?? options.tone?.clarity ?? tone.clarity, 0, 1);
  lowShelf.gain.value = toneDb01(warmth01, 8);
  highShelf.gain.value = toneDb01(clarity01, 8);

  reverbSum.connect(lowShelf);
  lowShelf.connect(highShelf);

  // Output
  const out = ctx.createGain();
  out.gain.value = clamp(options.outputGain ?? outputGain, 0.0, 2.0);

  highShelf.connect(out);
  out.connect(ctx.destination);

  // -------------------------------------------------------------------------
  // LAYERS (sources -> filter -> amp/pulse -> pan -> layerGain -> mixIn)
  // -------------------------------------------------------------------------
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
    layerGain.gain.value = engineType === "ambient" ? ambientGainBoost : 1.0;

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

        const rate = i === 0 ? 1.0 : 0.997 + Math.random() * 0.006; // 0.997..1.003
        try {
          src.playbackRate.value = rate;
        } catch {}

        const dur = buffer.duration || 0;
        const offset = dur > 0.25 ? Math.random() * Math.max(0, dur - 0.05) : 0;

        src.connect(pre);
        pre.connect(filter);

        try {
          src.start(0, offset);
        } catch {
          src.start(0);
        }
      }
    }
  }

  const rendered = await ctx.startRendering();
  return audioBufferToWavBlob(rendered);
}
