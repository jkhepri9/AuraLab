import React, { useEffect, useMemo, useRef, useState } from "react";
import { App as CapApp } from "@capacitor/app";

function computeIsPmNow(now, dayStartHour, pmStartHour) {
  const h = now.getHours();
  // "PM/Night" is from pmStartHour to (dayStartHour - 1), wrapping overnight.
  return h >= pmStartHour || h < dayStartHour;
}

function msUntilNextBoundary(now, isPm, dayStartHour, pmStartHour) {
  const targetHour = isPm ? dayStartHour : pmStartHour;

  const next = new Date(now);
  next.setHours(targetHour, 0, 0, 0);

  if (next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 1);
  }

  return Math.max(250, next.getTime() - now.getTime());
}

export default function LiveBackground({
  active = false,

  // Day poster (existing behavior)
  poster = "/live/home.png",

  // Optional PM/Night poster (add this file in /public/live/)
  pmPoster = "/live/home_pm.png",

  // Time rule (local device time)
  dayStartHour = 6, // 6:00 AM
  pmStartHour = 18, // 6:00 PM

  dim = 0.55, // 0..1 overlay strength
}) {
  const canvasRef = useRef(null);
  const activeRef = useRef(active);
  const glStateRef = useRef(null);
  const rafRef = useRef(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [backgroundReady, setBackgroundReady] = useState(false);

  // Enable swapping only if PM poster is configured.
  const hasPmAssets = !!pmPoster;

  const [isPmNow, setIsPmNow] = useState(() => {
    if (!hasPmAssets) return false;
    return computeIsPmNow(new Date(), dayStartHour, pmStartHour);
  });

  // Keep isPmNow accurate and flip exactly at the next boundary.
  useEffect(() => {
    if (!hasPmAssets) return;

    let t = null;

    const schedule = () => {
      const now = new Date();
      const nextIsPm = computeIsPmNow(now, dayStartHour, pmStartHour);
      setIsPmNow(nextIsPm);

      const ms = msUntilNextBoundary(now, nextIsPm, dayStartHour, pmStartHour);
      t = window.setTimeout(schedule, ms);
    };

    schedule();

    return () => {
      if (t) window.clearTimeout(t);
    };
  }, [hasPmAssets, dayStartHour, pmStartHour]);

  const effectivePoster = hasPmAssets && isPmNow ? pmPoster || poster : poster;

  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mq) return;

    const onChange = () => setReduceMotion(!!mq.matches);
    onChange();

    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else mq.addListener(onChange);

    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", onChange);
      else mq.removeListener(onChange);
    };
  }, []);

  useEffect(() => {
    setBackgroundReady(false);

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (reduceMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: true,
      premultipliedAlpha: true,
    });

    if (!gl) return;

    const createShader = (type, source) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = createShader(
      gl.VERTEX_SHADER,
      `attribute vec2 position;\n\nvoid main() {\n  gl_Position = vec4(position, 0.0, 1.0);\n}`
    );

    const fragmentShader = createShader(
      gl.FRAGMENT_SHADER,
      `precision mediump float;\nuniform vec2 u_resolution;\nuniform float u_time;\n\nfloat wave(vec2 p, float offset) {\n  return sin(p.x * 2.5 + offset) + cos(p.y * 2.0 - offset * 1.3);\n}\n\nvoid main() {\n  vec2 st = gl_FragCoord.xy / u_resolution.xy;\n  st.x *= u_resolution.x / u_resolution.y;\n  float t = u_time * 0.001;\n  float layered = wave(st, t) + wave(st * 1.4, t * 0.6);\n  float glow = 0.5 + 0.5 * sin((st.x + st.y) * 3.2 + t * 0.8);\n  vec3 base = mix(vec3(0.07, 0.15, 0.28), vec3(0.16, 0.4, 0.62), layered * 0.18 + 0.5);\n  vec3 color = base + glow * 0.08;\n  gl_FragColor = vec4(color, 1.0);\n}`
    );

    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      return;
    }

    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    const positionLocation = gl.getAttribLocation(program, "position");
    const buffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    gl.useProgram(program);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    const timeLocation = gl.getUniformLocation(program, "u_time");

    glStateRef.current = {
      gl,
      program,
      resolutionLocation,
      timeLocation,
      startTime: performance.now(),
    };

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const displayWidth = Math.max(1, Math.floor(canvas.clientWidth * dpr));
      const displayHeight = Math.max(1, Math.floor(canvas.clientHeight * dpr));

      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
      }

      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    const render = (time) => {
      const state = glStateRef.current;
      if (!state) return;

      resize();

      gl.useProgram(program);
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.uniform1f(timeLocation, time - state.startTime);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      rafRef.current = requestAnimationFrame(render);
    };

    const stopLoop = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };

    const startLoop = () => {
      const state = glStateRef.current;
      if (!state) return;
      stopLoop();
      state.startTime = performance.now();
      rafRef.current = requestAnimationFrame(render);
    };

    glStateRef.current.start = startLoop;
    glStateRef.current.stop = stopLoop;

    resize();
    setBackgroundReady(true);

    if (activeRef.current && document.visibilityState === "visible") {
      startLoop();
    }

    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      stopLoop();
      gl.deleteProgram(program);
      glStateRef.current = null;
      setBackgroundReady(false);
    };
  }, [reduceMotion]);

  useEffect(() => {
    activeRef.current = active;

    if (reduceMotion) {
      if (glStateRef.current?.stop) glStateRef.current.stop();
      return;
    }

    const state = glStateRef.current;
    if (!state) return;

    if (active && document.visibilityState === "visible") {
      state.start?.();
    } else {
      state.stop?.();
    }
  }, [active, reduceMotion]);

  useEffect(() => {
    const onVis = () => {
      if (reduceMotion) return;
      const state = glStateRef.current;
      if (!state) return;

      if (document.visibilityState === "visible" && active) {
        state.start?.();
      } else {
        state.stop?.();
      }
    };

    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [active, reduceMotion]);

  useEffect(() => {
    const listener = CapApp?.addListener?.("appStateChange", ({ isActive }) => {
      if (reduceMotion) return;
      const state = glStateRef.current;
      if (!state) return;

      if (isActive && active && document.visibilityState === "visible") {
        state.start?.();
      } else {
        state.stop?.();
      }
    });

    return () => listener?.remove?.();
  }, [active, reduceMotion]);

  const overlayStyle = useMemo(
    () => ({
      background: `linear-gradient(
        180deg,
        rgba(0,0,0,${dim}) 0%,
        rgba(0,0,0,${Math.min(0.9, dim + 0.2)}) 100%
      )`,
    }),
    [dim]
  );

  // Entire layer fades on/off; canvas fades in only when ready AND active.
  const layerOpacity = active ? 1 : 0;
  const canvasOpacity = active && backgroundReady && !reduceMotion ? 1 : 0;

  return (
    <div
      className="fixed inset-0 z-0 overflow-hidden pointer-events-none transition-opacity duration-200"
      style={{ opacity: layerOpacity }}
      aria-hidden="true"
    >
      {/* Poster always paints immediately (React layer). App-shell poster is behind this. */}
      <img
        src={effectivePoster}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        draggable="false"
        loading="eager"
      />

      {!reduceMotion && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full transition-opacity duration-300"
          style={{ opacity: canvasOpacity }}
        />
      )}

      {/* Readability overlay */}
      <div className="absolute inset-0" style={overlayStyle} />

      {/* Optional subtle grain */}
      <div
        className="absolute inset-0 opacity-[0.06] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='.35'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}
