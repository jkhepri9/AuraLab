// src/editor/timeline/TimelineTracks.jsx
// -------------------------------------------------------------
// Renders track lanes + waveform visualizers
// -------------------------------------------------------------
// PATCH v9:
//  - Layer name label upgraded for readability (pill + wrap + title).

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

        const name = layer?.name || "Layer";

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
                isPlaying={isPlaying && layer.enabled}
                color={color}
              />
            </div>

            {/* Layer name (readable + full name available) */}
            <div
              className="absolute top-2 left-2 max-w-[320px] text-[11px] leading-snug font-semibold text-white/80 bg-black/50 border border-white/10 rounded-md px-2 py-1 whitespace-normal break-words"
              title={name}
            >
              {name}
            </div>
          </div>
        );
      })}
    </div>
  );
}
