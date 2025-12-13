// src/audio/AmbientLoader.js
// Loads & caches ambient WAV files from /public/audio/ambient/**

// Map waveform keys -> public URL paths
const AMBIENT_WAV_PATHS = {
  birds_jungle: "/audio/ambient/birds/jungle.wav",
  birds_park: "/audio/ambient/birds/park.wav",
  birds_sea: "/audio/ambient/birds/sea.wav",

  crickets_forest: "/audio/ambient/crickets/forest.wav",
  crickets_lake: "/audio/ambient/crickets/lake.wav",
  crickets_swamp: "/audio/ambient/crickets/swamp.wav",

  fire_camp: "/audio/ambient/fire/camp.wav",

  ocean_crash: "/audio/ambient/ocean/crash.wav",
  ocean_deep: "/audio/ambient/ocean/deep.wav",
  ocean_soft: "/audio/ambient/ocean/soft.wav",

  rain_heavy: "/audio/ambient/rain/heavy.wav",
  rain_light: "/audio/ambient/rain/light.wav",
  rain_medium: "/audio/ambient/rain/medium.wav",

  river_rapids: "/audio/ambient/river/rapids.wav",
  river_soft: "/audio/ambient/river/soft.wav",

  thunder_crack: "/audio/ambient/thunder/crack.wav",
  thunder_distant: "/audio/ambient/thunder/distant.wav",
  thunder_rolling: "/audio/ambient/thunder/rolling.wav",

  wind_forest: "/audio/ambient/wind/forest.wav",
  wind_soft: "/audio/ambient/wind/soft.wav",
};

function resolveAmbientUrl(waveform) {
  if (!waveform) return null;

  // Allow direct .wav paths if ever passed
  if (typeof waveform === "string" && waveform.endsWith(".wav")) {
    return waveform.startsWith("/") ? waveform : `/${waveform}`;
  }

  return AMBIENT_WAV_PATHS[waveform] || null;
}

async function decodeArrayBuffer(ctx, arrayBuffer) {
  // Safari-safe: copy the buffer
  const ab = arrayBuffer.slice(0);

  // decodeAudioData can be promise-based OR callback-based depending on browser
  if (ctx.decodeAudioData.length === 1) {
    return await ctx.decodeAudioData(ab);
  }

  return await new Promise((resolve, reject) => {
    ctx.decodeAudioData(ab, resolve, reject);
  });
}

/**
 * Load an ambient AudioBuffer by waveform key (e.g. "ocean_soft").
 * IMPORTANT: decode using the SAME AudioContext that will play it.
 *
 * @param {string} waveform
 * @param {Map<string, AudioBuffer|Promise<AudioBuffer|null>>} cache
 * @param {AudioContext} ctx
 * @returns {Promise<AudioBuffer|null>}
 */
export async function loadAmbientBuffer(waveform, cache = new Map(), ctx) {
  const url = resolveAmbientUrl(waveform);
  if (!url || !ctx) return null;

  // Cache hit (buffer or in-flight promise)
  if (cache.has(waveform)) {
    return await cache.get(waveform);
  }

  const p = (async () => {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`[AmbientLoader] Missing WAV: ${url} (${res.status})`);
      return null;
    }

    const ab = await res.arrayBuffer();
    const buffer = await decodeArrayBuffer(ctx, ab);
    return buffer || null;
  })();

  cache.set(waveform, p);

  const out = await p;

  // If decode failed, remove so it can retry later
  if (!out) cache.delete(waveform);
  else cache.set(waveform, out);

  return out;
}
