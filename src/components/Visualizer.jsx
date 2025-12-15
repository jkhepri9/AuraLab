import React, { useEffect, useRef } from "react";

// Real-signal visualizer.
// Preferred usage: pass analyserNode from AudioEngine.getAnalyser().
// Back-compat: if analyserNode is not provided, we will create our own analyser and
// optionally connect sourceNode (best-effort).
export default function Visualizer({
  audioContext,
  analyserNode,
  sourceNode,
  isPlaying,
  color = "#10b981",
}) {
  const canvasRef = useRef(null);
  const analyserRef = useRef(null);
  const requestRef = useRef(null);

  useEffect(() => {
    // If caller provides an analyser, use it directly.
    if (analyserNode) {
      analyserRef.current = analyserNode;
      return () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
      };
    }

    if (!audioContext) return;

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.85;

    if (sourceNode) {
      try {
        sourceNode.connect(analyser);
      } catch {
        // Connection can fail depending on node graph; ignore gracefully.
      }
    }

    analyserRef.current = analyser;

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      // Do NOT disconnect sourceNode here; it may be shared by the engine.
    };
  }, [audioContext, analyserNode, sourceNode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const analyser = analyserRef.current;

    const draw = () => {
      if (!canvas || !analyser) return;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteTimeDomainData(dataArray);

      ctx.fillStyle = "rgba(10, 10, 10, 0.2)"; // Fade effect
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (!isPlaying) {
        // Draw flat line when not playing
        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2);
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
        ctx.stroke();
        requestRef.current = requestAnimationFrame(draw);
        return;
      }

      ctx.lineWidth = 2;
      ctx.strokeStyle = color;
      ctx.beginPath();

      const sliceWidth = (canvas.width * 1.0) / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);

        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

      requestRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, color]);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={200}
      className="w-full h-48 rounded-xl bg-black/40 border border-white/5 shadow-inner"
    />
  );
}
