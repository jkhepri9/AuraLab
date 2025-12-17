import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { createAudioEngine } from "./AudioEngine";

const GlobalPlayerContext = createContext(null);

export function GlobalPlayerProvider({ children }) {
  const engineRef = useRef(null);
  if (!engineRef.current) engineRef.current = createAudioEngine();

  // Prevent out-of-order async play calls from setting UI state incorrectly.
  const playSeqRef = useRef(0);

  const [currentPlayingPreset, setCurrentPlayingPreset] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLayers, setCurrentLayers] = useState(null);

  // UI flags
  // - Used by Layout to conditionally hide the sticky mini player on certain screens
  //   (e.g., PresetEditor) without relying on route changes.
  const [isStickyPlayerHidden, setIsStickyPlayerHidden] = useState(false);

  const safeUnlock = () => {
    try {
      engineRef.current?.unlock?.();
    } catch {
      // ignore
    }
  };

  const playLayers = async (layers, meta = {}) => {
    if (!layers || layers.length === 0) return false;

    const seq = ++playSeqRef.current;

    safeUnlock();

    try {
      // Stop any existing program, then start a new one.
      engineRef.current.stop();
      await engineRef.current.play(layers);

      // If another play request started while we awaited, abort UI update.
      if (seq !== playSeqRef.current) return false;

      engineRef.current.setNowPlaying(meta);
      setCurrentLayers(layers);
      setIsPlaying(true);
      return true;
    } catch (e) {
      console.error("[GlobalPlayer] playLayers failed:", e);
      if (seq === playSeqRef.current) {
        setIsPlaying(false);
      }
      return false;
    }
  };

  const playPreset = async (preset) => {
    if (!preset?.layers?.length) return false;

    const seq = ++playSeqRef.current;

    // Set Now Playing UI immediately (so sticky updates),
    // but do NOT mark isPlaying true until play succeeds.
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
      return true;
    } catch (e) {
      console.error("[GlobalPlayer] playPreset failed:", e);
      if (seq === playSeqRef.current) {
        setIsPlaying(false);
      }
      return false;
    }
  };

  const stop = () => {
    playSeqRef.current += 1;
    engineRef.current.stop();
    setIsPlaying(false);
    setCurrentLayers(null);
    setCurrentPlayingPreset(null);
  };

  const pause = () => {
    playSeqRef.current += 1;
    engineRef.current.pause();
    setIsPlaying(false);
  };

  const resume = async () => {
    if (!currentLayers?.length) return false;

    const seq = ++playSeqRef.current;
    safeUnlock();

    try {
      await engineRef.current.play(currentLayers);
      if (seq !== playSeqRef.current) return false;
      setIsPlaying(true);
      return true;
    } catch (e) {
      console.error("[GlobalPlayer] resume failed:", e);
      if (seq === playSeqRef.current) setIsPlaying(false);
      return false;
    }
  };

  const togglePlayPause = async () => {
    if (isPlaying) {
      pause();
      return true;
    }
    return await resume();
  };

  const restart = async () => {
    if (!currentLayers?.length) return false;

    const seq = ++playSeqRef.current;
    safeUnlock();

    try {
      engineRef.current.stop();
      await engineRef.current.play(currentLayers);
      if (seq !== playSeqRef.current) return false;
      setIsPlaying(true);
      return true;
    } catch (e) {
      console.error("[GlobalPlayer] restart failed:", e);
      if (seq === playSeqRef.current) setIsPlaying(false);
      return false;
    }
  };

  const updateLayers = async (layers) => {
    setCurrentLayers(layers);
    try {
      await engineRef.current.updateLayers(layers);
      return true;
    } catch (e) {
      console.error("[GlobalPlayer] updateLayers failed:", e);
      return false;
    }
  };

  const updateNowPlaying = (uiPresetLike, meta = {}) => {
    if (uiPresetLike) setCurrentPlayingPreset(uiPresetLike);
    engineRef.current.setNowPlaying(meta);
  };

  const setStickyPlayerHidden = useCallback((hidden) => {
    setIsStickyPlayerHidden(Boolean(hidden));
  }, []);

  const value = useMemo(
    () => ({
      engine: engineRef.current,
      currentPlayingPreset,
      currentLayers,
      isPlaying,
      isStickyPlayerHidden,
      playPreset,
      playLayers,
      pause,
      resume,
      stop,
      restart,
      updateLayers,
      updateNowPlaying,
      togglePlayPause,
      setStickyPlayerHidden,
    }),
    [currentPlayingPreset, currentLayers, isPlaying, isStickyPlayerHidden]
  );

  return (
    <GlobalPlayerContext.Provider value={value}>{children}</GlobalPlayerContext.Provider>
  );
}

export function useGlobalPlayer() {
  const ctx = useContext(GlobalPlayerContext);
  if (!ctx) throw new Error("useGlobalPlayer must be used within a GlobalPlayerProvider");
  return ctx;
}
