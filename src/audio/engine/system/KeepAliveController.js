// src/editor/audio/engine/system/KeepAliveController.js
// -----------------------------------------------------------------------------
// AuraLab — KeepAlive Controller
// Extracts:
// - Hidden MediaElement keep-alive (MediaStreamDestination -> <audio>)
// - visibilitychange resume + keep-alive kick
// - Media Session play/pause/stop handlers
// - Now Playing metadata set/clear
// -----------------------------------------------------------------------------

export function createKeepAliveController(adapter = {}) {
  const {
    getDocument,
    getNavigator,
    getWindow,

    getUseMediaOutput,
    getMediaDest,

    getIsPlaying,
    getLastLayers,

    resumeIfNeeded,
    onPlayRequest,
    onPauseRequest,
    onStopRequest,

    // Optional: allow AudioEngine to store the created element if desired
    setMediaEl,
    getMediaEl,
  } = adapter;

  let boundVisibility = false;
  let boundMediaSession = false;

  // internal element reference (authoritative)
  let elRef = null;

  const _doc = () => (typeof getDocument === "function" ? getDocument() : null);
  const _nav = () => (typeof getNavigator === "function" ? getNavigator() : null);
  const _win = () => (typeof getWindow === "function" ? getWindow() : null);

  const _syncExternalRef = (el) => {
    elRef = el || null;
    try {
      if (typeof setMediaEl === "function") setMediaEl(elRef);
    } catch {}
  };

  const _getEl = () => {
    if (elRef) return elRef;
    try {
      const ext = typeof getMediaEl === "function" ? getMediaEl() : null;
      if (ext) {
        elRef = ext;
        return elRef;
      }
    } catch {}
    return null;
  };

  function ensureMediaElement() {
    const doc = _doc();
    const mediaDest = typeof getMediaDest === "function" ? getMediaDest() : null;
    const useMedia = typeof getUseMediaOutput === "function" ? Boolean(getUseMediaOutput()) : false;

    if (!doc || !useMedia || !mediaDest) return null;

    // HMR-safe cleanup (remove any prior aura_media_el nodes)
    try {
      doc.querySelectorAll("audio#aura_media_el").forEach((n) => {
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

    // If we already have an element, rebind to current stream
    const existing = _getEl();
    if (existing) {
      try {
        existing.srcObject = mediaDest.stream;
      } catch {}
      return existing;
    }

    const el = doc.createElement("audio");
    el.id = "aura_media_el";
    el.style.display = "none";
    el.autoplay = false;
    el.controls = false;

    el.setAttribute("playsinline", "");
    el.setAttribute("webkit-playsinline", "");

    try {
      el.srcObject = mediaDest.stream;
    } catch {}

    // Keep silent to avoid doubling the audible path (ctx.destination).
    el.muted = false;
    el.volume = 0.0;

    try {
      doc.body.appendChild(el);
    } catch {}

    _syncExternalRef(el);
    return el;
  }

  function kickMediaElement() {
    const useMedia = typeof getUseMediaOutput === "function" ? Boolean(getUseMediaOutput()) : false;
    if (!useMedia) return;

    const el = _getEl();
    if (!el) return;

    try {
      if (el.paused) el.play();
    } catch {
      // Autoplay policies may block; ctx.destination still works.
    }
  }

  function bindVisibility() {
    if (boundVisibility) return;

    const doc = _doc();
    if (!doc) return;

    boundVisibility = true;

    doc.addEventListener("visibilitychange", async () => {
      const playing = typeof getIsPlaying === "function" ? Boolean(getIsPlaying()) : false;
      if (!playing) return;

      try {
        if (typeof resumeIfNeeded === "function") await resumeIfNeeded();
      } catch {}

      kickMediaElement();
    });
  }

  function bindMediaSession() {
    if (boundMediaSession) return;

    const nav = _nav();
    if (!nav || !("mediaSession" in nav)) return;

    boundMediaSession = true;

    try {
      nav.mediaSession.setActionHandler("play", async () => {
        const playing = typeof getIsPlaying === "function" ? Boolean(getIsPlaying()) : false;
        if (playing) return;

        if (typeof onPlayRequest === "function") {
          await onPlayRequest();
          return;
        }

        const layers = typeof getLastLayers === "function" ? getLastLayers() : null;
        if (layers && typeof adapter.play === "function") {
          await adapter.play(layers, { fromSystem: true });
        }
      });

      nav.mediaSession.setActionHandler("pause", () => {
        if (typeof onPauseRequest === "function") onPauseRequest();
      });

      nav.mediaSession.setActionHandler("stop", () => {
        if (typeof onStopRequest === "function") onStopRequest();
      });
    } catch {}
  }

  function setNowPlaying(meta = {}) {
    const nav = _nav();
    const win = _win();
    if (!nav || !("mediaSession" in nav) || !win) return;

    try {
      const artwork = meta.artworkUrl
        ? [{ src: meta.artworkUrl, sizes: "512x512", type: "image/png" }]
        : [];

      nav.mediaSession.metadata = new win.MediaMetadata({
        title: meta.title || "AuraLab",
        artist: meta.artist || "AuraLab",
        album: meta.album || "",
        artwork,
      });
    } catch {}
  }

  function clearNowPlaying() {
    const nav = _nav();
    if (!nav || !("mediaSession" in nav)) return;
    try {
      nav.mediaSession.metadata = null;
    } catch {}
  }

  return {
    ensureMediaElement,
    kickMediaElement,
    bindVisibility,
    bindMediaSession,
    setNowPlaying,
    clearNowPlaying,
  };
}
