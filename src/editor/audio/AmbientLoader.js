// src/audio/AmbientLoader.js
// -------------------------------------------------------------
// Loads ambient WAV files for AuraLab.
// Ambient files must exist at:
//   /public/audio/ambient/<category>/<variant>.wav
//
// Example waveform: "ocean_soft"
// category = ocean
// variant = soft
// -------------------------------------------------------------

const LOCAL_BASE = "/audio/ambient"; // Netlify + Vite final path

export async function loadAmbientBuffer(waveform, cacheMap) {
  if (!waveform) return null;

  const raw = waveform.toLowerCase();
  const [category, variant = "soft"] = raw.split("_");

  const key = `${category}_${variant}`;
  if (cacheMap.has(key)) return cacheMap.get(key);

  const url = `${LOCAL_BASE}/${category}/${variant}.wav`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Ambient fetch failed");

    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const arrayBuffer = await res.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

    cacheMap.set(key, audioBuffer);
    return audioBuffer;
  } catch (err) {
    console.warn("AmbientLoader: failed to load", url, err);
    return null;
  }
}
