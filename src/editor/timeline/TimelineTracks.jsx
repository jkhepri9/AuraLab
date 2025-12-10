// src/editor/timeline/TimelineTracks.jsx
// -------------------------------------------------------------
// Renders track lanes + waveform visualizers
// -------------------------------------------------------------

import React from "react";
import WaveformVisualizer from "../visualizer/WaveformVisualizer";

export default function TimelineTracks({ layers, pixelsPerSecond, isPlaying }) {
  return (
    <div className="absolute left-0 top-10 w-full">
      {layers.map((layer, index) => {
        let color = "#10b981";
        if (layer.type === "noise") color = "#c084fc";
        if (layer.type === "synth") color = "#facc15";
        if (layer.type === "ambient") color = "#60a5fa";

        return (
          <div
            key={layer.id}
            className="relative h-24 border-b border-white/5 bg-black/20 overflow-hidden"
            style={{ top: index * 90 }}
          >
            {/* Waveform layer */}
            <div className="absolute inset-0 opacity-70">
              <WaveformVisualizer
                type={layer.type}
                waveform={layer.waveform}
                isPlaying={isPlaying && layer.enabled}   // <<< FIXED
                color={color}
              />
            </div>

            {/* Layer name */}
            <div className="absolute top-2 left-2 text-xs font-bold text-white/60">
              {layer.name}
            </div>
          </div>
        );
      })}
    </div>
  );
}
