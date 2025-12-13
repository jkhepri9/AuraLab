// src/editor/audio/AmbientLoader.js
// -------------------------------------------------------------
// Loads ambient WAV files for AuraLab.
// Files must exist at:
//   /public/audio/ambient/<category>/<variant>.wav
//
// Example waveform: "ocean_soft"
// category = ocean
// variant = soft
// -------------------------------------------------------------

const LOCAL_BASE = "/audio/ambient"; // Vite/Vercel path from /public

export async function loadAmbientBuffer(ctx, waveform, cacheMap) {
  if (!ctx || !waveform) return null;

  const raw = String(waveform).toLowerCase().trim();
  const [category, variant = "soft"] = raw.split("_");

  const key = `${category}_${variant}`;
  if (cacheMap?.has(key)) return cacheMap.get(key);

  const url = `${LOCAL_BASE}/${category}/${variant}.wav`;

  try {
    const res = await fetch(url, { cache: "force-cache" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const arrayBuffer = await res.arrayBuffer();

    // Decode using the SAME AudioContext as the engine
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

    cacheMap?.set(key, audioBuffer);
    return audioBuffer;
  } catch (err) {
    console.warn("AmbientLoader: failed to load", url, err);
    return null;
  }
}
