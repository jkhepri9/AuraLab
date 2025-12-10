// src/editor/transport/TransportBar.jsx
// -------------------------------------------------------------
// DAW-STYLE TRANSPORT BAR
// -------------------------------------------------------------
// Controls:
//  - Play / Pause
//  - Stop
//  - Skip Forward
//  - Skip Backward
//  - Current Time / Duration display
// -------------------------------------------------------------

import React from "react";
import {
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward
} from "lucide-react";
import TimeDisplay from "./TimeDisplay";

export default function TransportBar({
  isPlaying,
  currentTime,
  duration,
  onPlay,
  onPause,
  onStop,
  onJumpForward,
  onJumpBackward
}) {
  return (
    <div className="h-14 w-full bg-[#0d0d0d] border-b border-white/10 flex items-center justify-between px-5">
      
      {/* LEFT GROUP */}
      <div className="flex items-center gap-3">

        {/* Back */}
        <button
          onClick={onJumpBackward}
          className="h-10 w-10 flex items-center justify-center border border-white/10 rounded-lg hover:bg-white/10"
        >
          <SkipBack className="w-4 h-4 text-gray-300" />
        </button>

        {/* Play / Pause */}
        {!isPlaying ? (
          <button
            onClick={onPlay}
            className="h-12 w-12 flex items-center justify-center rounded-full bg-emerald-500 text-black hover:bg-emerald-600"
          >
            <Play className="w-5 h-5 fill-current ml-1" />
          </button>
        ) : (
          <button
            onClick={onPause}
            className="h-12 w-12 flex items-center justify-center rounded-full bg-emerald-600 text-black hover:bg-emerald-700"
          >
            <Pause className="w-5 h-5" />
          </button>
        )}

        {/* Stop */}
        <button
          onClick={onStop}
          className="h-10 w-10 flex items-center justify-center border border-white/10 rounded-lg hover:bg-white/10 text-red-500"
        >
          <Square className="w-4 h-4" />
        </button>

        {/* Forward */}
        <button
          onClick={onJumpForward}
          className="h-10 w-10 flex items-center justify-center border border-white/10 rounded-lg hover:bg-white/10"
        >
          <SkipForward className="w-4 h-4 text-gray-300" />
        </button>
      </div>

      {/* RIGHT SIDE: TIME DISPLAY */}
      <div className="flex items-center">
        <TimeDisplay
          currentTime={currentTime}
          duration={duration}
        />
      </div>
    </div>
  );
}
