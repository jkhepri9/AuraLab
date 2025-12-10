// src/editor/timeline/Timeline.jsx
// -------------------------------------------------------------
// UNIFIED TIMELINE CONTROLLER
// -------------------------------------------------------------
// Handles:
//  - Zoom (ctrl + wheel)
//  - Scroll sync
//  - Playhead
//  - Ruler
//  - Track Waveforms (with proper play/pause sync)
// -------------------------------------------------------------

import React, { useRef, useState, useEffect, useMemo } from "react";
import TimelineRuler from "./TimelineRuler";
import TimelineTracks from "./TimelineTracks";

export default function Timeline({
  layers,
  currentTime,
  duration,
  isPlaying
}) {
  // Zoom level (1 = 100%, 2 = 200%)
  const [zoom, setZoom] = useState(1);

  // Horizontal scroll container
  const scrollRef = useRef(null);

  // Pixel resolution per second (scales with zoom)
  const PIXELS_PER_SECOND = 80 * zoom;

  // Calculate full timeline width
  const totalWidth = useMemo(() => {
    return Math.max(2000, duration * PIXELS_PER_SECOND + 200);
  }, [duration, zoom]);

  // Handle ctrl + wheel zoom
  const handleWheel = (e) => {
    if (!e.ctrlKey) return;
    e.preventDefault();

    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const nextZoom = Math.min(5, Math.max(0.2, zoom + delta));
    setZoom(nextZoom);
  };

  // Auto-scroll playhead when playing
  useEffect(() => {
    if (!isPlaying) return;
    const scroll = scrollRef.current;
    if (!scroll) return;

    const playheadX = currentTime * PIXELS_PER_SECOND;
    const visibleStart = scroll.scrollLeft;
    const visibleEnd = visibleStart + scroll.clientWidth;

    // Follow playhead if approaching right side of viewport
    if (playheadX > visibleEnd - 200) {
      scroll.scrollLeft = playheadX - 200;
    }
  }, [currentTime, isPlaying, PIXELS_PER_SECOND]);

  return (
    <div
      className="relative w-full h-full bg-[#0a0a0a] overflow-x-auto overflow-y-hidden border-b border-white/5"
      ref={scrollRef}
      onWheel={handleWheel}
    >
      {/* CONTENT WRAPPER */}
      <div
        className="relative"
        style={{
          width: totalWidth,
          height: layers.length * 90 + 60 // tracks area + ruler height
        }}
      >
        {/* RULER */}
        <TimelineRuler
          duration={duration}
          pixelsPerSecond={PIXELS_PER_SECOND}
        />

        {/* TRACKS (now receives isPlaying!) */}
        <TimelineTracks
          layers={layers}
          pixelsPerSecond={PIXELS_PER_SECOND}
          isPlaying={isPlaying}          // <<< CRITICAL FIX
        />

        {/* PLAYHEAD */}
        <div
          className="absolute top-0 bottom-0 w-[2px] bg-red-500 pointer-events-none"
          style={{ left: currentTime * PIXELS_PER_SECOND }}
        />
      </div>
    </div>
  );
}
