import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { createAudioEngine } from "./AudioEngine";
import { useAuth } from "@/auth/AuthProvider";

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

  const safeUnlock = () => {
    try {
      engineRef.current?.unlock?.();
    } catch {
      // ignore
    }
  };

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
  }, []);

  const pause = useCallback(() => {
    playSeqRef.current += 1;
    try {
      engineRef.current.pause();
    } catch {
      // ignore
    }
    setIsPlaying(false);
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
  }, []);

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

    // Allow UI animation time, then clear now-playing state
    const mySeq = playSeqRef.current;
    window.setTimeout(() => {
      if (playSeqRef.current !== mySeq) return;

      setCurrentLayers(null);
      setCurrentPlayingPreset(null);

      setStickyPlayerVisible(true);
    }, 320);
  }, []);

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
