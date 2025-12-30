import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createAudioEngine } from "./AudioEngine";
import { useAuth } from "@/auth/AuthProvider";
import {
  initSystemMediaSession,
  resetSystemMediaSession,
  updateSystemMediaMetadata,
  updateSystemPlaybackState,
} from "@/lib/systemMediaSession";

const GlobalPlayerContext = createContext(null);

// DEV-only auth bypass (must also be enabled by env flag)
// .env.development.local: VITE_DEV_AUTH_BYPASS=true
const DEV_AUTH_BYPASS =
  import.meta.env.DEV === true &&
  String(import.meta.env.VITE_DEV_AUTH_BYPASS || "").toLowerCase() === "true";

export function GlobalPlayerProvider({ children }) {
  const engineRef = useRef(createAudioEngine());
  const playSeqRef = useRef(0);

  const { loading, requireAuth } = useAuth();

  const [currentPlayingPreset, setCurrentPlayingPreset] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLayers, setCurrentLayers] = useState(null);

  // Used to hide sticky player on certain screens (PresetEditor, etc.)
  const [isStickyPlayerHidden, setIsStickyPlayerHidden] = useState(false);

  // Used when user closes the sticky player (X)
  const [tempHidden, setTempHidden] = useState(false);

  // Optional: for Layout animations (fade/slide). If your Layout uses this, it can animate out.
  const [stickyPlayerVisible, setStickyPlayerVisible] = useState(true);

  // Keep latest transport callbacks for Media Session handlers without re-registering constantly.
  const transportRef = useRef({
    onPlay: null,
    onPause: null,
    onStop: null,
  });

  const safeUnlock = () => {
    try {
      engineRef.current?.unlock?.();
    } catch {
      // ignore
    }
  };

  // ---------------------------------------------------------------------------
  // ✅ Register Media Session action handlers once (best-effort)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    initSystemMediaSession({
      onPlay: () => transportRef.current.onPlay?.(),
      onPause: () => transportRef.current.onPause?.(),
      onStop: () => transportRef.current.onStop?.(),
    });
  }, []);

  // ---------------------------------------------------------------------------
  // ✅ Keep Media Session metadata + playbackState in sync with app state
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!currentPlayingPreset) {
      // Clear out the session when nothing is playing
      resetSystemMediaSession();
      return;
    }

    updateSystemMediaMetadata({
      title: currentPlayingPreset?.name || "Aura Mode",
      artist: "AuraLab",
      album: "Aura Session",
      artworkUrl: currentPlayingPreset?.imageUrl || null,
    });

    updateSystemPlaybackState(isPlaying ? "playing" : "paused");
  }, [currentPlayingPreset, isPlaying]);

  const playLayers = async (layers, meta = {}) => {
    if (!layers?.length) return false;

    // Avoid modal flash while session is still loading (unless bypassing auth in dev)
    if (loading && !DEV_AUTH_BYPASS) return false;

    // Must be authed (unless bypassing auth in dev)
    if (!DEV_AUTH_BYPASS) {
      if (!requireAuth()) return false;
    }

    const seq = ++playSeqRef.current;

    safeUnlock();

    try {
      engineRef.current.stop();
      await engineRef.current.play(layers);

      if (seq !== playSeqRef.current) return false;

      engineRef.current.setNowPlaying(meta);

      // ✅ Media Session: if caller provides meta, reflect it
      updateSystemMediaMetadata({
        title: meta?.title || currentPlayingPreset?.name || "Aura Session",
        artist: meta?.artist || "AuraLab",
        album: meta?.album || "Aura Session",
        artworkUrl: meta?.artworkUrl || meta?.artwork || meta?.imageUrl || currentPlayingPreset?.imageUrl || null,
      });

      setCurrentLayers(layers);
      setIsPlaying(true);

      // Re-show sticky if user closed it previously
      setTempHidden(false);
      setStickyPlayerVisible(true);

      return true;
    } catch (e) {
      console.error("[GlobalPlayer] playLayers failed:", e);
      if (seq === playSeqRef.current) setIsPlaying(false);
      return false;
    }
  };

  const playPreset = async (preset) => {
    if (!preset?.layers?.length) return false;

    if (loading && !DEV_AUTH_BYPASS) return false;

    // Must be authed (unless bypassing auth in dev)
    if (!DEV_AUTH_BYPASS) {
      if (!requireAuth()) return false;
    }

    const seq = ++playSeqRef.current;

    // Set UI immediately so sticky updates fast
    setCurrentPlayingPreset(preset);

    safeUnlock();

    try {
      engineRef.current.stop();
      await engineRef.current.play(preset.layers);

      if (seq !== playSeqRef.current) return false;

      engineRef.current.setNowPlaying({
        title: preset.name || "Aura Mode",
        artist: "AuraLab",
        artworkUrl: preset.imageUrl,
      });

      setCurrentLayers(preset.layers);
      setIsPlaying(true);

      // ✅ Media Session (Web)
      updateSystemMediaMetadata({
        title: preset?.name || "Aura Mode",
        artist: "AuraLab",
        album: "Aura Session",
        artworkUrl: preset?.imageUrl || null,
      });
      updateSystemPlaybackState("playing");

      // Re-show sticky if user closed it previously
      setTempHidden(false);
      setStickyPlayerVisible(true);

      return true;
    } catch (e) {
      console.error("[GlobalPlayer] playPreset failed:", e);
      if (seq === playSeqRef.current) setIsPlaying(false);
      return false;
    }
  };

  const stop = useCallback(() => {
    playSeqRef.current += 1;
    try {
      engineRef.current.stop();
    } catch {
      // ignore
    }

    setIsPlaying(false);
    setCurrentLayers(null);
    setCurrentPlayingPreset(null);
    setTempHidden(false);
    setStickyPlayerVisible(true);

    // ✅ Media Session
    resetSystemMediaSession();
  }, []);

  const pause = useCallback(() => {
    playSeqRef.current += 1;
    try {
      engineRef.current.pause();
    } catch {
      // ignore
    }
    setIsPlaying(false);

    // ✅ Media Session
    updateSystemPlaybackState("paused");
  }, []);

  const resume = useCallback(async () => {
    if (!currentLayers?.length) return false;

    if (loading && !DEV_AUTH_BYPASS) return false;

    // Must be authed (unless bypassing auth in dev)
    if (!DEV_AUTH_BYPASS) {
      if (!requireAuth()) return false;
    }

    const seq = ++playSeqRef.current;

    safeUnlock();

    try {
      await engineRef.current.play(currentLayers);

      if (seq !== playSeqRef.current) return false;

      setIsPlaying(true);
      setTempHidden(false);
      setStickyPlayerVisible(true);

      // ✅ Media Session
      updateSystemPlaybackState("playing");

      return true;
    } catch (e) {
      console.error("[GlobalPlayer] resume failed:", e);
      if (seq === playSeqRef.current) setIsPlaying(false);
      return false;
    }
  }, [currentLayers, loading, requireAuth]);

  const togglePlayPause = useCallback(async () => {
    if (isPlaying) {
      pause();
      return true;
    }
    return await resume();
  }, [isPlaying, pause, resume]);

  /**
   * IMPORTANT: Aura Studio currently calls `updateNowPlaying(...)`.
   * Your existing AuraEditor.jsx expects this function.
   */
  const updateNowPlaying = useCallback((uiPresetLike, meta = {}) => {
    if (uiPresetLike) setCurrentPlayingPreset(uiPresetLike);
    try {
      engineRef.current.setNowPlaying(meta);
    } catch {
      // ignore
    }

    // ✅ Media Session: keep system UI in sync even when Aura Studio updates now-playing
    const title = meta?.title || uiPresetLike?.name || currentPlayingPreset?.name || "Aura Session";
    const artworkUrl =
      meta?.artworkUrl ||
      meta?.artwork ||
      uiPresetLike?.imageUrl ||
      currentPlayingPreset?.imageUrl ||
      null;

    updateSystemMediaMetadata({
      title,
      artist: meta?.artist || "AuraLab",
      album: meta?.album || "Aura Session",
      artworkUrl,
    });
  }, [currentPlayingPreset]);

  const updateLayers = useCallback(async (layers) => {
    setCurrentLayers(layers);
    try {
      await engineRef.current.updateLayers(layers);
      return true;
    } catch (e) {
      console.error("[GlobalPlayer] updateLayers failed:", e);
      return false;
    }
  }, []);

  const setStickyHidden = useCallback((hidden) => {
    setIsStickyPlayerHidden(Boolean(hidden));
  }, []);

  const hideStickyPlayerOnce = useCallback(() => {
    // Hide UI (for Layout animation support)
    setTempHidden(true);
    setStickyPlayerVisible(false);

    // Stop audio immediately
    playSeqRef.current += 1;
    try {
      engineRef.current.stop();
    } catch {
      // ignore
    }
    setIsPlaying(false);

    // ✅ Media Session
    updateSystemPlaybackState("none");

    // Allow UI animation time, then clear now-playing state
    const mySeq = playSeqRef.current;
    window.setTimeout(() => {
      if (playSeqRef.current !== mySeq) return;

      setCurrentLayers(null);
      setCurrentPlayingPreset(null);
      resetSystemMediaSession();

      setStickyPlayerVisible(true);
    }, 320);
  }, []);

  // Keep Media Session button handlers wired to your transport
  useEffect(() => {
    transportRef.current.onPlay = () => resume();
    transportRef.current.onPause = () => pause();
    transportRef.current.onStop = () => stop();
  }, [resume, pause, stop]);

  const value = useMemo(
    () => ({
      engine: engineRef.current,
      currentPlayingPreset,
      currentLayers,
      isPlaying,

      isStickyPlayerHidden: isStickyPlayerHidden || tempHidden,
      stickyPlayerVisible,

      playPreset,
      playLayers,
      pause,
      resume,
      stop,
      togglePlayPause,

      updateLayers,
      updateNowPlaying,

      setStickyPlayerHidden: setStickyHidden,
      hideStickyPlayerOnce,
    }),
    [
      currentPlayingPreset,
      currentLayers,
      isPlaying,
      isStickyPlayerHidden,
      tempHidden,
      stickyPlayerVisible,
      playPreset,
      playLayers,
      pause,
      resume,
      stop,
      togglePlayPause,
      updateLayers,
      updateNowPlaying,
      setStickyHidden,
      hideStickyPlayerOnce,
    ]
  );

  return (
    <GlobalPlayerContext.Provider value={value}>
      {children}
    </GlobalPlayerContext.Provider>
  );
}

export function useGlobalPlayer() {
  const ctx = useContext(GlobalPlayerContext);
  if (!ctx)
    throw new Error("useGlobalPlayer must be used within a GlobalPlayerProvider");
  return ctx;
}
