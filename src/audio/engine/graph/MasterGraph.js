// src/editor/audio/engine/graph/MasterGraph.js
// -----------------------------------------------------------------------------
// AuraLab — Master FX Graph Builder (realtime)
//
// Builds the stable master chain:
//
// mixIn -> Delay(insert) -> Reverb(insert) -> Tone(shelves) -> Analyser -> Out -> destination
//                                                     \-> (optional) MediaStreamDestination
//
// Returns handles used by AudioEngine:
// - master: { input, analyser, output }
// - delay:  { delay, feedback, dry, wet, sum }
// - reverb: { convolver, dry, wet, sum }
// - tone:   { lowShelf, highShelf }
// - analyser, mediaDest
// -----------------------------------------------------------------------------

import { clamp, toneDb01 } from "../utils/helpers";

/**
 * @param {AudioContext} ctx
 * @param {object} state
 * @param {object} state.fx
 * @param {object} state.tone
 * @param {number} state.outputGain
 * @param {object} opts
 * @param {boolean} opts.enableMediaDest
 * @param {(duration:number, decay:number)=>AudioBuffer} opts.impulse
 */
export function createMasterGraph(ctx, state = {}, opts = {}) {
  if (!ctx) throw new Error("createMasterGraph: ctx is required");

  const fx = state.fx || {};
  const tone = state.tone || { warmth: 0, clarity: 0 };
  const outputGain = typeof state.outputGain === "number" ? state.outputGain : 1.0;

  // -------------------------------------------------------------------------
  // PRE-FX SUM BUS (all layers feed here)
  // -------------------------------------------------------------------------
  const mixIn = ctx.createGain();
  mixIn.gain.value = 1.0;

  // -------------------------------------------------------------------------
  // DELAY (insert-style)
  // mixIn -> (dry) -> delaySum -> ...
  //      -> (wet) -> delayNode -> wetGain -> delaySum
  // -------------------------------------------------------------------------
  const delayNode = ctx.createDelay(5.0);
  delayNode.delayTime.value = clamp(fx.delayTime ?? 0.5, 0.01, 5.0);

  const feedback = ctx.createGain();
  feedback.gain.value = clamp(fx.delayFeedback ?? 0.3, 0.0, 0.95);

  const dlDry = ctx.createGain();
  const dlWet = ctx.createGain();
  const delaySum = ctx.createGain();

  const delayWet = clamp(fx.delayWet ?? 0, 0, 1);
  dlDry.gain.value = 1 - delayWet;
  dlWet.gain.value = delayWet;

  mixIn.connect(dlDry);
  mixIn.connect(delayNode);

  delayNode.connect(feedback);
  feedback.connect(delayNode);
  delayNode.connect(dlWet);

  dlDry.connect(delaySum);
  dlWet.connect(delaySum);

  const delay = { delay: delayNode, feedback, dry: dlDry, wet: dlWet, sum: delaySum };

  // -------------------------------------------------------------------------
  // REVERB (insert-style using Convolver + impulse)
  // delaySum -> (dry) -> reverbSum -> ...
  //         -> conv -> wetGain -> reverbSum
  // -------------------------------------------------------------------------
  const conv = ctx.createConvolver();
  conv.buffer =
    typeof opts.impulse === "function" ? opts.impulse(2.0, 2.0) : defaultImpulse(ctx, 2.0, 2.0);

  const rvDry = ctx.createGain();
  const rvWet = ctx.createGain();
  const reverbSum = ctx.createGain();

  const reverbWet = clamp(fx.reverbWet ?? 0, 0, 1);
  const wetGain = Math.min(3, reverbWet * 2.5);
  rvDry.gain.value = 1 - reverbWet;
  rvWet.gain.value = wetGain;

  delaySum.connect(rvDry);
  delaySum.connect(conv);
  conv.connect(rvWet);

  rvDry.connect(reverbSum);
  rvWet.connect(reverbSum);

  const reverb = { convolver: conv, dry: rvDry, wet: rvWet, sum: reverbSum };

  // -------------------------------------------------------------------------
  // MASTER TONE — two shelves
  // reverbSum -> lowShelf(warmth) -> highShelf(clarity) -> analyser -> out
  // -------------------------------------------------------------------------
  const lowShelf = ctx.createBiquadFilter();
  lowShelf.type = "lowshelf";
  lowShelf.frequency.value = 220;
  lowShelf.Q.value = 0.7;
  lowShelf.gain.value = toneDb01(clamp(tone.warmth ?? 0, 0, 1), 8);

  const highShelf = ctx.createBiquadFilter();
  highShelf.type = "highshelf";
  highShelf.frequency.value = 5500;
  highShelf.Q.value = 0.7;
  highShelf.gain.value = toneDb01(clamp(tone.clarity ?? 0, 0, 1), 8);

  reverbSum.connect(lowShelf);
  lowShelf.connect(highShelf);

  const toneNodes = { lowShelf, highShelf };

  // -------------------------------------------------------------------------
  // ANALYSER + OUTPUT
  // -------------------------------------------------------------------------
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 2048;
  analyser.smoothingTimeConstant = 0.85;

  const out = ctx.createGain();
  out.gain.value = clamp(outputGain, 0.0, 2.0);

  highShelf.connect(analyser);
  analyser.connect(out);

  // Always audible output
  out.connect(ctx.destination);

  // Optional: also feed a MediaStreamDestination
  let mediaDest = null;
  if (opts.enableMediaDest && typeof ctx.createMediaStreamDestination === "function") {
    try {
      mediaDest = ctx.createMediaStreamDestination();
      out.connect(mediaDest);
    } catch {
      mediaDest = null;
    }
  }

  return {
    master: { input: mixIn, analyser, output: out },
    analyser,
    delay,
    reverb,
    tone: toneNodes,
    mediaDest,
  };
}

function defaultImpulse(ctx, duration, decay) {
  const rate = ctx.sampleRate;
  const len = Math.max(1, Math.floor(rate * duration));
  const buf = ctx.createBuffer(2, len, rate);

  for (let c = 0; c < 2; c++) {
    const ch = buf.getChannelData(c);
    for (let i = 0; i < len; i++) {
      ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
  }
  return buf;
}
