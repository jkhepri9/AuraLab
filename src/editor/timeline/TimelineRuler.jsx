// src/editor/timeline/TimelineRuler.jsx
// -------------------------------------------------------------
// Timeline ruler with time markers
// -------------------------------------------------------------

import React, { useMemo } from "react";

export default function TimelineRuler({ duration, pixelsPerSecond }) {
  const ticks = useMemo(() => {
    const arr = [];
    for (let s = 0; s <= duration; s += 5) {
      arr.push({
        x: s * pixelsPerSecond,
        label: `${s}s`,
      });
    }
    return arr;
  }, [duration, pixelsPerSecond]);

  return (
    <div className="absolute top-0 left-0 w-full h-10 bg-[#0d0d0d] border-b border-white/10">
      {ticks.map((tick, index) => (
        <div
          key={index}
          className="absolute top-0 h-full text-[10px] text-gray-500"
          style={{ left: tick.x }}
        >
          <div className="border-l border-white/10 h-full" />
          <div className="ml-1 mt-1">{tick.label}</div>
        </div>
      ))}
    </div>
  );
}
