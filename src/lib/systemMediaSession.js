const MEDIA_SIZES = [96, 128, 192, 256, 384, 512];

function canUseMediaSession() {
  return (
    typeof navigator !== "undefined" &&
    "mediaSession" in navigator &&
    typeof window !== "undefined" &&
    typeof window.MediaMetadata !== "undefined"
  );
}

function buildArtwork(artworkUrl) {
  if (!artworkUrl) return [];
  return MEDIA_SIZES.map((size) => ({
    src: artworkUrl,
    sizes: `${size}x${size}`,
    type: "image/jpeg",
  }));
}

export function initSystemMediaSession(handlers = {}) {
  if (!canUseMediaSession()) return;

  const safeSet = (action, cb) => {
    try {
      navigator.mediaSession.setActionHandler(action, cb || null);
    } catch {
      // Ignore unsupported actions.
    }
  };

  safeSet("play", handlers.onPlay);
  safeSet("pause", handlers.onPause);
  safeSet("stop", handlers.onStop);
  safeSet("previoustrack", handlers.onPrevious);
  safeSet("nexttrack", handlers.onNext);
  safeSet("seekbackward", handlers.onSeekBackward);
  safeSet("seekforward", handlers.onSeekForward);
  safeSet("seekto", handlers.onSeekTo);
}

export function updateSystemMediaMetadata(meta = {}) {
  if (!canUseMediaSession()) return;

  try {
    navigator.mediaSession.metadata = new window.MediaMetadata({
      title: meta.title || "Aura Session",
      artist: meta.artist || "AuraLab",
      album: meta.album || "",
      artwork: buildArtwork(meta.artworkUrl || meta.artwork || meta.imageUrl),
    });
  } catch {
    // ignore
  }
}

export function updateSystemPlaybackState(state = "none") {
  if (!canUseMediaSession()) return;
  try {
    navigator.mediaSession.playbackState = state;
  } catch {
    // ignore
  }
}

export function resetSystemMediaSession() {
  if (!canUseMediaSession()) return;
  try {
    navigator.mediaSession.metadata = null;
    navigator.mediaSession.playbackState = "none";
  } catch {
    // ignore
  }
}
