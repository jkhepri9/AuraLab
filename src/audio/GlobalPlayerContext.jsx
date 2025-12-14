import React, { createContext, useContext, useMemo, useRef, useState } from "react";
import { createAudioEngine } from "./AudioEngine";

const GlobalPlayerContext = createContext(null);

export function GlobalPlayerProvider({ children }) {
  const engineRef = useRef(null);
  if (!engineRef.current) engineRef.current = createAudioEngine();

  const playSeqRef = useRef(0);

  const [currentPlayingPreset, setCurrentPlayingPreset] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLayers, setCurrentLayers] = useState(null);

  const playLayers = async (layers, meta = {}) => {
    if (!layers || layers.length === 0) return;

    const seq = ++playSeqRef.current;

    engineRef.current.stop();
    await engineRef.current.play(layers);

    if (seq !== playSeqRef.current) return;

    engineRef.current.setNowPlaying(meta);
    setCurrentLayers(layers);
    setIsPlaying(true);
  };

  const playPreset = async (preset) => {
    if (!preset?.layers?.length) return;

    const seq = ++playSeqRef.current;

    setCurrentPlayingPreset(preset);

    engineRef.current.stop();
    await engineRef.current.play(preset.layers);

    if (seq !== playSeqRef.current) return;

    engineRef.current.setNowPlaying({
      title: preset.name || "Aura Mode",
      artist: "AuraLab",
      artworkUrl: preset.imageUrl,
    });

    setCurrentLayers(preset.layers);
    setIsPlaying(true);
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
    if (!currentLayers?.length) return;

    const seq = ++playSeqRef.current;

    await engineRef.current.play(currentLayers);

    if (seq !== playSeqRef.current) return;

    setIsPlaying(true);
  };

  const togglePlayPause = async () => {
    if (isPlaying) pause();
    else await resume();
  };

  const restart = async () => {
    if (!currentLayers?.length) return;

    const seq = ++playSeqRef.current;

    engineRef.current.stop();
    await engineRef.current.play(currentLayers);

    if (seq !== playSeqRef.current) return;

    if (currentPlayingPreset) {
      engineRef.current.setNowPlaying({
        title: currentPlayingPreset.name || "AuraLab",
        artist: "AuraLab",
        artworkUrl: currentPlayingPreset.imageUrl,
      });
    }

    setIsPlaying(true);
  };

  const updateLayers = async (layers) => {
    setCurrentLayers(layers);
    await engineRef.current.updateLayers(layers);
  };

  const updateNowPlaying = (uiPresetLike, meta = {}) => {
    if (uiPresetLike) setCurrentPlayingPreset(uiPresetLike);
    engineRef.current.setNowPlaying(meta);
  };

  const value = useMemo(
    () => ({
      engine: engineRef.current,
      currentPlayingPreset,
      currentLayers, // ✅ EXPOSE LIVE SESSION LAYERS
      isPlaying,
      playPreset,
      playLayers,
      pause,
      resume,
      stop,
      restart,
      updateLayers,
      updateNowPlaying,
      togglePlayPause,
    }),
    [currentPlayingPreset, currentLayers, isPlaying]
  );

  return (
    <GlobalPlayerContext.Provider value={value}>
      {children}
    </GlobalPlayerContext.Provider>
  );
}

export function useGlobalPlayer() {
  const ctx = useContext(GlobalPlayerContext);
  if (!ctx) throw new Error("useGlobalPlayer must be used within a GlobalPlayerProvider");
  return ctx;
}
