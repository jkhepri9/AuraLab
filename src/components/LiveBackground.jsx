import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

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

  // Day sources (existing behavior)
  webmSrc = null,
  mp4Src = "/live/home.mp4",
  poster = "/live/home.png",

  // Optional PM/Night sources (add these files in /public/live/)
  pmWebmSrc = null,
  pmMp4Src = "/live/home_pm.mp4",
  pmPoster = "/live/home_pm.png",

  // Time rule (local device time)
  dayStartHour = 6, // 6:00 AM
  pmStartHour = 18, // 6:00 PM

  dim = 0.55, // 0..1 overlay strength
}) {
  const videoRef = useRef(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  const tryPlay = useCallback(() => {
    const el = videoRef.current;
    if (!el || reduceMotion || !active) return;

    // Some mobile browsers require the properties to be set before play() resolves.
    el.muted = true;
    el.playsInline = true;
    el.autoplay = true;

    try {
      const p = el.play?.();
      if (p && typeof p.catch === "function") p.catch(() => {});
    } catch {}
  }, [active, reduceMotion]);

  const refreshAndPlay = useCallback(
    (forceLoad = false) => {
      const el = videoRef.current;
      if (!el || reduceMotion || !active) return;

      setVideoReady(false);

      try {
        // In some hybrid shells, the media pipeline is torn down when backgrounded.
        // Force a reload when coming back to the foreground so autoplay is available.
        if (forceLoad || el.readyState < 2) {
          el.load?.();
        }
      } catch {}

      tryPlay();
    },
    [active, reduceMotion, tryPlay]
  );

  // Enable swapping only if PM assets are configured (poster or video).
  const hasPmAssets = !!(pmPoster || pmMp4Src || pmWebmSrc);

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
  const effectiveWebm = hasPmAssets && isPmNow ? pmWebmSrc || webmSrc : webmSrc;
  const effectiveMp4 = hasPmAssets && isPmNow ? pmMp4Src || mp4Src : mp4Src;

  const shouldPlay = useCallback(() => {
    const el = videoRef.current;
    if (!el || reduceMotion || !active) return false;
    if (!effectiveWebm && !effectiveMp4) return false;

    return true;
  }, [active, effectiveMp4, effectiveWebm, reduceMotion]);

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

    tryPlay();
  }, [active, reduceMotion, tryPlay]);

  // Persistent auto-play nudge: some browsers pause/deny autoplay after
  // navigation. Retry while the layer should be active.
  useEffect(() => {
    if (!shouldPlay()) return;

    let cancelled = false;
    let t;

    const tick = () => {
      if (cancelled) return;

      const el = videoRef.current;
      if (!el) return;

      if (el.paused || el.readyState < 2) {
        tryPlay();
      }

      t = window.setTimeout(tick, 800);
    };

    t = window.setTimeout(tick, 50);

    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [shouldPlay, tryPlay]);

  useEffect(() => {
    const onVis = () => {
      const el = videoRef.current;
      if (!el) return;

      if (document.visibilityState === "hidden") {
        try {
          el.pause();
        } catch {}
      } else if (active && !reduceMotion) {
        refreshAndPlay(true);
      }
    };

    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [active, reduceMotion, refreshAndPlay]);

  // Native shells may hide the WebView during auth flows; refresh playback on focus/resume.
  useEffect(() => {
    if (!shouldPlay()) return;

    const onFocus = () => refreshAndPlay(true);
    const onPageShow = () => refreshAndPlay(true);
    const onResume = () => refreshAndPlay(true);

    window.addEventListener("focus", onFocus);
    window.addEventListener("pageshow", onPageShow);
    document.addEventListener("resume", onResume);

    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("resume", onResume);
    };
  }, [refreshAndPlay, shouldPlay]);

  // If the wallpaper source changes (day <-> PM), reload the video and fade it back in when ready.
  useEffect(() => {
    setVideoReady(false);

    const el = videoRef.current;
    if (!el) return;
    if (reduceMotion) return;

    refreshAndPlay(true);
  }, [effectivePoster, effectiveWebm, effectiveMp4, active, reduceMotion, refreshAndPlay]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    if (el.readyState >= 2) {
      setVideoReady(true);
      tryPlay();
    }
  }, [tryPlay]);

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
        src={effectivePoster}
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
          poster={effectivePoster}
          onCanPlay={() => {
            setVideoReady(true);
            tryPlay();
          }}
          onLoadedData={() => {
            setVideoReady(true);
            tryPlay();
          }}
          onLoadedMetadata={() => {
            setVideoReady(true);
            tryPlay();
          }}
          onPlay={() => setVideoReady(true)}
          onPlaying={() => setVideoReady(true)}
          onPause={() => {
            if (shouldPlay()) {
              tryPlay();
            }
          }}
          onStalled={() => shouldPlay() && tryPlay()}
          onSuspend={() => shouldPlay() && tryPlay()}
          onError={() => setVideoReady(false)}
        >
          {effectiveWebm ? <source src={effectiveWebm} type="video/webm" /> : null}
          {effectiveMp4 ? <source src={effectiveMp4} type="video/mp4" /> : null}
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
