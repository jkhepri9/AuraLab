// src/editor/transport/TimeDisplay.jsx
// -------------------------------------------------------------
// Formats and displays current time and total duration.
// -------------------------------------------------------------

import React from "react";
import { formatTime } from "./formatTime";

export default function TimeDisplay({ currentTime, duration }) {
  return (
    <div className="font-mono text-xs text-emerald-400 bg-black/20 px-3 py-1 rounded border border-white/10">
      {formatTime(currentTime)} / {formatTime(duration)}
    </div>
  );
}
