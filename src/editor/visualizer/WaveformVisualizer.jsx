// src/editor/visualizer/WaveformVisualizer.jsx
// -----------------------------------------------------------------------------
// Lightweight Canvas Waveform Visualizer
// -----------------------------------------------------------------------------
// This visualizer does NOT read real audio buffers. It generates animated
// waveforms for UI feedback and performance. It works for:
//  - oscillator
//  - synth
//  - noise
//  - ambient
// and keeps the UI responsive.
// -----------------------------------------------------------------------------

import React, { useEffect, useRef } from "react";

export default function WaveformVisualizer({
  type = "oscillator",
  waveform = "sine",
  isPlaying = false,
  color = "#10b981"
}) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const phaseRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    const midY = height / 2;

    function draw() {
      ctx.clearRect(0, 0, width, height);
      ctx.lineWidth = 2;
      ctx.strokeStyle = color;
      ctx.beginPath();

      if (isPlaying) {
        phaseRef.current += 0.12;
      }

      const amplitude = height * 0.35;
      const freq = 0.04;

      for (let x = 0; x < width; x++) {
        let y = midY;
        const t = x * freq + phaseRef.current;

        // -------------------------------
        // OSCILLATOR / SYNTH WAVE SHAPES
        // -------------------------------
        if (type === "oscillator" || type === "synth") {
          switch (waveform) {
            case "sine":
            case "fm":
            case "sub":
              y = midY + Math.sin(t) * amplitude;
              break;

            case "square":
              y = midY + (Math.sin(t) > 0 ? amplitude : -amplitude);
              break;

            case "triangle":
            case "drone":
              y = midY + (2 * amplitude / Math.PI) * Math.asin(Math.sin(t));
              break;

            case "sawtooth":
            case "analog":
            case "wavetable":
              y = midY + (((t % (Math.PI * 2)) / Math.PI) * amplitude) - amplitude;
              break;

            default:
              y = midY + Math.sin(t) * amplitude;
          }
        }

        // -------------------------------
        // NOISE VISUALIZATION
        // -------------------------------
        else if (type === "noise") {
          y = midY + (Math.random() * 2 - 1) * amplitude * 0.7;
        }

        // -------------------------------
        // AMBIENT VISUALIZATION (slow waves)
        // -------------------------------
        else if (type === "ambient") {
          const slow = x * 0.02 + phaseRef.current * 0.4;
          y =
            midY +
            Math.sin(slow) * amplitude * 0.6 +
            Math.cos(slow * 2.0) * (amplitude * 0.2);
        }

        ctx.lineTo(x, y);
      }

      ctx.stroke();
      animationRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animationRef.current);
  }, [type, waveform, isPlaying, color]);

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={100}
      className="w-full h-full opacity-70"
    />
  );
}