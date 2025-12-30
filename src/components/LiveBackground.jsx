import React, { useEffect, useMemo, useRef, useState } from "react";

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

  // Posters remain as instant paint + reduced-motion fallback
  poster = "/live/home.png",

  // Optional PM/Night posters (add these files in /public/live/)
  pmPoster = "/live/home_pm.png",

  // Time rule (local device time)
  dayStartHour = 6, // 6:00 AM
  pmStartHour = 18, // 6:00 PM

  dim = 0.55, // 0..1 overlay strength
}) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const glStateRef = useRef(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  // Enable swapping only if PM assets are configured (poster present).
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
    const canvas = canvasRef.current;
    if (!canvas) return;

    const initGl = () => {
      const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true });
      if (!gl) return null;

      const vertSrc = `
        attribute vec2 a_position;
        void main() {
          gl_Position = vec4(a_position, 0.0, 1.0);
        }
      `;

      const fragSrc = `
        precision highp float;
        uniform vec2 u_resolution;
        uniform float u_time;
        uniform int u_isPm;

        // Simple pseudo-random
        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          float a = hash(i);
          float b = hash(i + vec2(1.0, 0.0));
          float c = hash(i + vec2(0.0, 1.0));
          float d = hash(i + vec2(1.0, 1.0));
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
        }

        vec3 paletteDay(float t) {
          vec3 a = vec3(0.1, 0.28, 0.4);
          vec3 b = vec3(0.15, 0.3, 0.55);
          vec3 c = vec3(0.9, 0.7, 0.5);
          vec3 d = vec3(0.35, 0.6, 0.9);
          return a + b * cos(6.28318 * (c * t + d));
        }

        vec3 paletteNight(float t) {
          vec3 a = vec3(0.05, 0.08, 0.15);
          vec3 b = vec3(0.1, 0.15, 0.3);
          vec3 c = vec3(1.0, 0.8, 0.6);
          vec3 d = vec3(0.5, 0.25, 0.75);
          return a + b * cos(6.28318 * (c * t + d));
        }

        void main() {
          vec2 uv = gl_FragCoord.xy / u_resolution.xy;
          uv.x *= u_resolution.x / u_resolution.y;

          float t = u_time * 0.05;
          float flow = noise(uv * 2.5 + vec2(t * 0.5, t * 0.25));
          float ripples = sin((uv.y + flow * 0.2 + t * 0.1) * 6.28318) * 0.07;
          float blend = clamp(uv.y + ripples + flow * 0.2, 0.0, 1.0);

          float paletteT = blend + noise(uv * 4.0 + t * 0.2) * 0.15;
          vec3 col = mix(paletteDay(paletteT), paletteNight(paletteT), float(u_isPm));

          float vignette = smoothstep(1.0, 0.6, length(uv - 0.5));
          col *= vignette;

          gl_FragColor = vec4(col, 1.0);
        }
      `;

      const createShader = (type, src) => {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, src);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          console.warn("LiveBackground shader compile error", gl.getShaderInfoLog(shader));
          gl.deleteShader(shader);
          return null;
        }
        return shader;
      };

      const vs = createShader(gl.VERTEX_SHADER, vertSrc);
      const fs = createShader(gl.FRAGMENT_SHADER, fragSrc);
      if (!vs || !fs) return null;

      const program = gl.createProgram();
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.warn("LiveBackground shader link error", gl.getProgramInfoLog(program));
        return null;
      }

      const positionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
          -1, -1,
          1, -1,
          -1, 1,
          -1, 1,
          1, -1,
          1, 1,
        ]),
        gl.STATIC_DRAW
      );

      return {
        gl,
        program,
        positionBuffer,
        attrib: gl.getAttribLocation(program, "a_position"),
        uniforms: {
          resolution: gl.getUniformLocation(program, "u_resolution"),
          time: gl.getUniformLocation(program, "u_time"),
          isPm: gl.getUniformLocation(program, "u_isPm"),
        },
      };
    };

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = Math.floor(window.innerWidth * dpr);
      const height = Math.floor(window.innerHeight * dpr);
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
    };

    const render = (timeMs) => {
      const state = glStateRef.current;
      if (!state) return;
      const { gl, program, positionBuffer, attrib, uniforms } = state;

      resize();
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(program);

      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.enableVertexAttribArray(attrib);
      gl.vertexAttribPointer(attrib, 2, gl.FLOAT, false, 0, 0);

      gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
      gl.uniform1f(uniforms.time, timeMs * 0.001);
      gl.uniform1i(uniforms.isPm, isPmNow ? 1 : 0);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

    const start = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (!active || reduceMotion || document.visibilityState === "hidden") return;
      if (!glStateRef.current) {
        glStateRef.current = initGl();
      }
      if (!glStateRef.current) return;

      const loop = (time) => {
        render(time);
        rafRef.current = requestAnimationFrame(loop);
      };

      rafRef.current = requestAnimationFrame(loop);
    };

    const stop = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };

    start();

    const handleVis = () => {
      if (document.visibilityState === "hidden") stop();
      else start();
    };

    window.addEventListener("resize", start);
    document.addEventListener("visibilitychange", handleVis);

    return () => {
      stop();
      window.removeEventListener("resize", start);
      document.removeEventListener("visibilitychange", handleVis);
      glStateRef.current = null;
    };
  }, [active, reduceMotion, isPmNow]);

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

  // Entire layer fades on/off.
  const layerOpacity = active ? 1 : 0;

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
          className="absolute inset-0 h-full w-full object-cover"
          style={{ mixBlendMode: "screen" }}
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
