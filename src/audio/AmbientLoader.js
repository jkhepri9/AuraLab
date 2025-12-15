// src/audio/AmbientLoader.js
// -----------------------------------------------------------------------------
// Loads & caches ambient audio files from /public/audio/ambient/**
//
// CRITICAL FIX:
// Some dev/proxy environments (Codespaces / SPA fallbacks) can return HTML (200)
// for missing audio files, or return text (Git LFS pointers) instead of binary.
// decodeAudioData will throw: EncodingError: Unable to decode audio data
//
// This loader now:
// - Skips obvious non-audio responses (content-type text/html, etc.)
// - Validates magic bytes (RIFF/WAVE, OggS, ID3) before decoding
// - Catches decode errors and returns null instead of rejecting
// - Logs a precise warning telling you where the audio files must live
// -----------------------------------------------------------------------------

const AMBIENT_AUDIO_PATHS = {
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
  // Optional (if you add it):
  wind_strong: "/audio/ambient/wind/strong.wav",
};

function resolveAmbientUrl(waveform) {
  if (!waveform) return null;

  // Allow direct paths if ever passed
  if (typeof waveform === "string" && waveform.includes(".")) {
    return waveform.startsWith("/") ? waveform : `/${waveform}`;
  }

  return AMBIENT_AUDIO_PATHS[waveform] || null;
}

function candidateUrls(url) {
  if (!url) return [];
  if (!url.toLowerCase().endsWith(".wav")) return [url];

  const base = url.slice(0, -4);
  // Prefer opus/ogg for size; mp3 is broad fallback; wav final fallback.
  return [`${base}.opus`, `${base}.ogg`, `${base}.mp3`, `${base}.wav`];
}

function isProbablyHtml(contentType) {
  const ct = (contentType || "").toLowerCase();
  return ct.includes("text/html") || ct.includes("application/xhtml+xml");
}

function isProbablyText(contentType) {
  const ct = (contentType || "").toLowerCase();
  return ct.startsWith("text/") || ct.includes("application/json");
}

function magicBytes(u8, start, str) {
  for (let i = 0; i < str.length; i++) {
    if (u8[start + i] !== str.charCodeAt(i)) return false;
  }
  return true;
}

function looksLikeAudioBinary(arrayBuffer) {
  if (!arrayBuffer || arrayBuffer.byteLength < 12) return false;
  const u8 = new Uint8Array(arrayBuffer);

  // WAV: "RIFF....WAVE"
  if (magicBytes(u8, 0, "RIFF") && magicBytes(u8, 8, "WAVE")) return true;

  // OGG: "OggS"
  if (magicBytes(u8, 0, "OggS")) return true;

  // MP3: "ID3" or 0xFFEx frame sync
  if (magicBytes(u8, 0, "ID3")) return true;
  if (u8[0] === 0xff && (u8[1] & 0xe0) === 0xe0) return true;

  return false;
}

async function decodeArrayBuffer(ctx, arrayBuffer) {
  const ab = arrayBuffer.slice(0);

  try {
    // decodeAudioData can be promise-based OR callback-based depending on browser
    if (ctx.decodeAudioData.length === 1) {
      return await ctx.decodeAudioData(ab);
    }
    return await new Promise((resolve, reject) => {
      ctx.decodeAudioData(ab, resolve, reject);
    });
  } catch (e) {
    return null;
  }
}

async function fetchFirstDecodable(urls) {
  for (const u of urls) {
    try {
      const res = await fetch(u, { cache: "default" });
      if (!res.ok) continue;

      const ct = res.headers.get("content-type") || "";

      // Codespaces/proxies sometimes respond with HTML even for "ok" paths.
      if (isProbablyHtml(ct)) continue;

      const ab = await res.arrayBuffer();

      // If we got text/html or an SPA fallback page, this detects it.
      if (!looksLikeAudioBinary(ab)) {
        // If it’s text, it’s usually either a Git LFS pointer or a fallback HTML.
        // We can’t reliably decode it, so skip.
        if (isProbablyText(ct) || ab.byteLength < 5120) {
          continue;
        }
        continue;
      }

      return { url: u, arrayBuffer: ab };
    } catch {
      // Try next candidate
    }
  }
  return null;
}

function missingAudioHint(url) {
  // Provide a single, clear fix path.
  // Your Sounds.zip contains: Sounds/ambient/** -> must be placed in public/audio/ambient/**
  return (
    `[AmbientLoader] Could not decode ambient audio for: ${url}\n` +
    `Fix: place the Sounds.zip ambient files at:\n` +
    `  public/audio/ambient/**\n` +
    `Example:\n` +
    `  public/audio/ambient/ocean/deep.wav\n`
  );
}

/**
 * Load an ambient AudioBuffer by waveform key (e.g. "ocean_soft").
 * IMPORTANT: decode using the SAME AudioContext that will play it.
 *
 * Supports BOTH signatures:
 *  1) loadAmbientBuffer(ctx, waveform, cache)
 *  2) loadAmbientBuffer(waveform, cache, ctx)
 *
 * @returns {Promise<AudioBuffer|null>}
 */
export async function loadAmbientBuffer(a, b, c) {
  let ctx, waveform, cache;

  if (a && typeof a.decodeAudioData === "function") {
    ctx = a;
    waveform = b;
    cache = c;
  } else {
    waveform = a;
    cache = b;
    ctx = c;
  }

  if (!ctx) return null;
  if (!cache) cache = new Map();

  const url = resolveAmbientUrl(waveform);
  if (!url) return null;

  // Cache hit (buffer or in-flight promise)
  if (cache.has(waveform)) {
    try {
      return await cache.get(waveform);
    } catch {
      cache.delete(waveform);
      return null;
    }
  }

  const p = (async () => {
    const pick = await fetchFirstDecodable(candidateUrls(url));
    if (!pick) {
      console.warn(missingAudioHint(url));
      return null;
    }

    const buffer = await decodeArrayBuffer(ctx, pick.arrayBuffer);
    if (!buffer) {
      console.warn(missingAudioHint(pick.url));
      return null;
    }

    return buffer;
  })();

  cache.set(waveform, p);

  const out = await p;

  // If decode failed, remove so it can retry later
  if (!out) cache.delete(waveform);
  else cache.set(waveform, out);

  return out;
}
