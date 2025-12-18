// src/editor/audio/engine/system/MediaSessionController.js
// -----------------------------------------------------------------------------
// AuraLab — Media Session + Visibility Keep-Alive (internal)
//
// Extracts from AudioEngine:
// - Media Session action handlers (play/pause/stop)
// - Now Playing metadata wiring
// - visibilitychange keep-alive (resume ctx + kick silent media element)
//
// This module is intentionally defensive and best-effort.
// -----------------------------------------------------------------------------

export function createMediaSessionController(deps = {}) {
  return new MediaSessionController(deps);
}

class MediaSessionController {
  constructor(deps) {
    this.deps = deps;

    this._mediaSessionBound = false;
    this._visibilityBound = false;
  }

  _nav() {
    try {
      return this.deps.getNavigator?.() || (typeof navigator !== "undefined" ? navigator : null);
    } catch {
      return null;
    }
  }

  _doc() {
    try {
      return this.deps.getDocument?.() || (typeof document !== "undefined" ? document : null);
    } catch {
      return null;
    }
  }

  _win() {
    try {
      return this.deps.getWindow?.() || (typeof window !== "undefined" ? window : null);
    } catch {
      return null;
    }
  }

  bindVisibility() {
    if (this._visibilityBound) return;
    this._visibilityBound = true;

    const doc = this._doc();
    if (!doc?.addEventListener) return;

    doc.addEventListener("visibilitychange", async () => {
      try {
        if (!this.deps.getIsPlaying?.()) return;
        await this.deps.resumeIfNeeded?.();
        this.deps.kickMediaElement?.();
      } catch {
        // best-effort only
      }
    });
  }

  bindMediaSession() {
    if (this._mediaSessionBound) return;

    const nav = this._nav();
    if (!nav || !("mediaSession" in nav)) return;

    this._mediaSessionBound = true;

    try {
      nav.mediaSession.setActionHandler("play", async () => {
        try {
          if (this.deps.getIsPlaying?.()) return;
          const last = this.deps.getLastLayers?.();
          if (last) await this.deps.play?.(last, { fromSystem: true });
        } catch {
          // ignore
        }
      });

      nav.mediaSession.setActionHandler("pause", () => {
        try {
          this.deps.pause?.();
        } catch {}
      });

      nav.mediaSession.setActionHandler("stop", () => {
        try {
          this.deps.stop?.();
        } catch {}
      });
    } catch {
      // Some browsers may throw on unsupported handlers; ignore.
    }
  }

  bindAll() {
    this.bindVisibility();
    this.bindMediaSession();
  }

  setNowPlaying(meta = {}) {
    const nav = this._nav();
    const win = this._win();
    if (!nav || !("mediaSession" in nav)) return;
    if (!win?.MediaMetadata) return;

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
    } catch {
      // best-effort
    }
  }

  clearNowPlaying() {
    const nav = this._nav();
    if (!nav || !("mediaSession" in nav)) return;

    try {
      nav.mediaSession.metadata = null;
    } catch {
      // best-effort
    }
  }
}
