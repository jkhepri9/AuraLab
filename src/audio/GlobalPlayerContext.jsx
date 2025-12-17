import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { createAudioEngine } from "./AudioEngine";

const GlobalPlayerContext = createContext(null);

export function GlobalPlayerProvider({ children }) {
  const engineRef = useRef(createAudioEngine());
  const playSeqRef = useRef(0);

  const [currentPlayingPreset, setCurrentPlayingPreset] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLayers, setCurrentLayers] = useState(null);
  const [isStickyPlayerHidden, setIsStickyPlayerHidden] = useState(false);
  const [tempHidden, setTempHidden] = useState(false);

  const safeUnlock = () => {
    try {
      engineRef.current?.unlock?.();
    } catch {}
  };

  const playLayers = async (layers, meta = {}) => {
    if (!layers?.length) return false;
    const seq = ++playSeqRef.current;
    safeUnlock();
    try {
      engineRef.current.stop();
      await engineRef.current.play(layers);
      if (seq !== playSeqRef.current) return false;
      engineRef.current.setNowPlaying(meta);
      setCurrentLayers(layers);
      setIsPlaying(true);
      setTempHidden(false);
      return true;
    } catch (e) {
      console.error("[GlobalPlayer] playLayers failed:", e);
      if (seq === playSeqRef.current) setIsPlaying(false);
      return false;
    }
  };

  const playPreset = async (preset) => {
    if (!preset?.layers?.length) return false;
    const seq = ++playSeqRef.current;
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
      setTempHidden(false);
      return true;
    } catch (e) {
      console.error("[GlobalPlayer] playPreset failed:", e);
      if (seq === playSeqRef.current) setIsPlaying(false);
      return false;
    }
  };

  const stop = () => {
    playSeqRef.current += 1;
    engineRef.current.stop();
    setIsPlaying(false);
    setCurrentLayers(null);
    setCurrentPlayingPreset(null);
    setTempHidden(false);
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
      setTempHidden(false);
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

  const hideStickyPlayerOnce = useCallback(() => {
    setTempHidden(true);
  }, []);

  const setStickyPlayerHidden = useCallback((hidden) => {
    setIsStickyPlayerHidden(Boolean(hidden));
  }, []);

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

  const value = useMemo(
    () => ({
      engine: engineRef.current,
      currentPlayingPreset,
      currentLayers,
      isPlaying,
      isStickyPlayerHidden: isStickyPlayerHidden || tempHidden,
      playPreset,
      playLayers,
      pause,
      resume,
      stop,
      togglePlayPause,
      updateLayers,
      setStickyPlayerHidden,
      hideStickyPlayerOnce,
    }),
    [currentPlayingPreset, currentLayers, isPlaying, isStickyPlayerHidden, tempHidden]
  );

  return <GlobalPlayerContext.Provider value={value}>{children}</GlobalPlayerContext.Provider>;
}

export function useGlobalPlayer() {
  const ctx = useContext(GlobalPlayerContext);
  if (!ctx) throw new Error("useGlobalPlayer must be used within a GlobalPlayerProvider");
  return ctx;
}
