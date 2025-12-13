// src/audio/SynthEngines.js
// ---------------------------------------------------------
// Synth graph creator for AuraLab
// Supports:
//  - analog
//  - fm
//  - wavetable
//  - granular
//  - drone
//  - sub
// ---------------------------------------------------------

export function createSynthGraph(ctx, type, frequency = 432, destination) {
  const master = ctx.createGain();
  master.gain.value = 0.7;
  master.connect(destination);

  const nodes = { masterGain: master, oscs: [] };

  const createOsc = (wave, freqMult, gainVal, detune = 0) => {
    const osc = ctx.createOscillator();
    osc.type = wave;
    osc.frequency.value = frequency * freqMult;
    osc.detune.value = detune;

    const g = ctx.createGain();
    g.gain.value = gainVal;

    osc.connect(g);
    g.connect(master);
    osc.start();

    nodes.oscs.push(osc);
  };

  const t = type.toLowerCase();

  // ANALOG
  if (t === "analog") {
    createOsc("sawtooth", 1, 0.4, -6);
    createOsc("sawtooth", 1, 0.4, +6);
    createOsc("triangle", 0.5, 0.25);
  }

  // FM
  else if (t === "fm") {
    const carrier = ctx.createOscillator();
    carrier.type = "sine";
    carrier.frequency.value = frequency;

    const mod = ctx.createOscillator();
    mod.type = "sine";
    mod.frequency.value = frequency * 2;

    const modGain = ctx.createGain();
    modGain.gain.value = frequency * 0.4;

    mod.connect(modGain);
    modGain.connect(carrier.frequency);

    const outGain = ctx.createGain();
    outGain.gain.value = 0.7;

    carrier.connect(outGain);
    outGain.connect(master);

    carrier.start();
    mod.start();
    nodes.oscs.push(carrier, mod);
  }

  // WAVETABLE (simulated via multi-wave mix)
  else if (t === "wavetable") {
    createOsc("sawtooth", 1, 0.45);
    createOsc("square", 1, 0.3);
    createOsc("triangle", 0.5, 0.3);
  }

  // GRANULAR (many slight detunes)
  else if (t === "granular") {
    for (let i = 0; i < 4; i++) {
      const detune = Math.random() * 30 - 15;
      createOsc("sine", 1 + i * 0.01, 0.2, detune);
    }
  }

  // DRONE
  else if (t === "drone") {
    createOsc("sine", 0.5, 0.35, -3);
    createOsc("sine", 0.5, 0.35, +3);
    createOsc("triangle", 1, 0.2);
  }

  // SUB BASS
  else if (t === "sub") {
    createOsc("sine", 1, 0.6);
    createOsc("sine", 0.5, 0.4);
  }

  // DEFAULT
  else {
    createOsc("triangle", 1, 0.7);
  }

  return nodes;
}
