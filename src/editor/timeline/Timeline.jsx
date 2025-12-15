// src/editor/timeline/Timeline.jsx
// -------------------------------------------------------------
// UNIFIED TIMELINE CONTROLLER
// -------------------------------------------------------------
// Handles:
//  - Zoom (ctrl + wheel)
//  - Scroll sync
//  - Playhead
//  - Ruler
//  - Track Waveforms
// -------------------------------------------------------------
//
// PATCH:
//  - Playhead “laser” now spans the FULL track view height (top-to-bottom),
//    regardless of how many layers are present.
//  - Keeps your glow + core laser styling.
//

import React, { useRef, useState, useEffect, useMemo } from "react";
import TimelineRuler from "./TimelineRuler";
import TimelineTracks from "./TimelineTracks";

export default function Timeline({ layers, currentTime, duration, isPlaying }) {
  // Zoom level (1 = 100%, 2 = 200%)
  const [zoom, setZoom] = useState(1);

  // Horizontal scroll container
  const scrollRef = useRef(null);

  // Track the visible viewport height so the laser can span full view height
  const [viewHeight, setViewHeight] = useState(0);

  // Pixel resolution per second (scales with zoom)
  const PIXELS_PER_SECOND = 80 * zoom;

  // Calculate full timeline width
  const totalWidth = useMemo(() => {
    return Math.max(2000, duration * PIXELS_PER_SECOND + 200);
  }, [duration, PIXELS_PER_SECOND]);

  // Base content height driven by number of layers
  // (Tracks typically stack at ~90px increments plus headroom)
  const baseHeight = useMemo(() => {
    return layers.length * 90 + 60;
  }, [layers.length]);

  // Ensure content height is at least the visible viewport height
  const totalHeight = useMemo(() => {
    return Math.max(baseHeight, viewHeight || 0);
  }, [baseHeight, viewHeight]);

  // Measure viewport height (and keep it updated)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const update = () => setViewHeight(el.clientHeight || 0);

    update();

    // Prefer ResizeObserver for accurate layout changes
    let ro = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => update());
      ro.observe(el);
    } else {
      window.addEventListener("resize", update);
    }

    return () => {
      if (ro) ro.disconnect();
      else window.removeEventListener("resize", update);
    };
  }, []);

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

  const playheadLeft = currentTime * PIXELS_PER_SECOND;

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
          height: totalHeight,
          minHeight: "100%",
        }}
      >
        {/* RULER */}
        <TimelineRuler duration={duration} pixelsPerSecond={PIXELS_PER_SECOND} />

        {/* TRACKS */}
        <TimelineTracks
          layers={layers}
          pixelsPerSecond={PIXELS_PER_SECOND}
          isPlaying={isPlaying}
        />

        {/* PLAYHEAD LASER (FULL VIEW HEIGHT TOP-TO-BOTTOM) */}
        <div
          className="absolute pointer-events-none z-50"
          style={{
            left: playheadLeft,
            top: 0,
            bottom: 0,
          }}
        >
          {/* Glow layer (wide + blurred) */}
          <div className="absolute -left-[7px] top-0 bottom-0 w-[16px] bg-red-500/25 blur-[6px]" />

          {/* Core laser */}
          <div
            className="absolute left-0 top-0 bottom-0 w-[2px] bg-red-500"
            style={{
              boxShadow:
                "0 0 18px rgba(239,68,68,0.9), 0 0 40px rgba(239,68,68,0.35)",
            }}
          />

          {/* Top marker */}
          <div
            className="absolute top-0 -left-[6px] w-0 h-0"
            style={{
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderBottom: "8px solid rgba(239,68,68,0.95)",
              filter: "drop-shadow(0 0 10px rgba(239,68,68,0.65))",
            }}
          />
        </div>
      </div>
    </div>
  );
}
