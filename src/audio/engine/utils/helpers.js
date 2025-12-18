// src/editor/audio/engine/utils/helpers.js

// -----------------------------------------------------------------------------
// Pure helpers used by the AudioEngine.
// No engine state, no side effects (except random helpers), safe to import anywhere.
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// TYPE MAPPING
// -----------------------------------------------------------------------------
export function resolveType(uiType) {
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

export function clamp(v, min, max) {
  const n = typeof v === "number" ? v : Number(v);
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, n));
}

// Map 0..1 -> 0..MAX_DB (neutral at 0)
export function toneDb01(v01, maxDb = 8) {
  const v = clamp(v01, 0, 1);
  return v * maxDb;
}

export function randRange(min, max) {
  return min + Math.random() * (max - min);
}

export function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// -----------------------------------------------------------------------------
// OFFLINE RENDER HELPERS (WAV EXPORT)
// -----------------------------------------------------------------------------
export function impulseForContext(ctx, durationSec = 2.0, decay = 2.0) {
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

export function audioBufferToWavBlob(audioBuffer) {
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
