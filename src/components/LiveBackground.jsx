import React, { useEffect, useMemo, useRef, useState } from "react";

export default function LiveBackground({
  active = false,
  webmSrc = null,
  mp4Src = "/live/home.mp4",
  poster = "/live/home.png",
  dim = 0.55, // 0..1 overlay strength
}) {
  const videoRef = useRef(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

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

  // When inactive, pause video (saves CPU). When active, attempt play.
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    if (!active) {
      try {
        el.pause();
      } catch {}
      return;
    }

    if (reduceMotion) return;

    try {
      const p = el.play?.();
      if (p && typeof p.catch === "function") p.catch(() => {});
    } catch {}
  }, [active, reduceMotion]);

  useEffect(() => {
    const onVis = () => {
      const el = videoRef.current;
      if (!el) return;

      if (document.visibilityState === "hidden") {
        try {
          el.pause();
        } catch {}
      } else if (active && !reduceMotion) {
        try {
          el.play?.();
        } catch {}
      }
    };

    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
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

  // Entire layer fades on/off; video fades in only when ready AND active.
  const layerOpacity = active ? 1 : 0;
  const videoOpacity = active && videoReady ? 1 : 0;

  return (
    <div
      className="fixed inset-0 z-0 overflow-hidden pointer-events-none transition-opacity duration-200"
      style={{ opacity: layerOpacity }}
      aria-hidden="true"
    >
      {/* Poster always paints immediately (React layer). App-shell poster is behind this. */}
      <img
        src={poster}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        draggable="false"
        loading="eager"
      />

      {!reduceMotion && (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-300"
          style={{ opacity: videoOpacity }}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster={poster}
          onCanPlay={() => setVideoReady(true)}
          onLoadedData={() => setVideoReady(true)}
          onError={() => setVideoReady(false)}
        >
          {webmSrc ? <source src={webmSrc} type="video/webm" /> : null}
          {mp4Src ? <source src={mp4Src} type="video/mp4" /> : null}
        </video>
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
