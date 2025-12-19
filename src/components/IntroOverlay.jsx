// src/components/IntroOverlay.jsx
// -----------------------------------------------------------------------------
// AuraLab — Intro Overlay (3-second attunement)
// - Shows once per app open (session)
// - 3-beat microcopy: Tune the field -> Set the frequency -> Craft your aura
// - Always skippable
// -----------------------------------------------------------------------------

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const SESSION_KEY = "auralab_intro_seen_v1";

export default function IntroOverlay() {
  const reduceMotion = useReducedMotion();
  const timersRef = useRef([]);

  const phrases = useMemo(
    () => ["Tune The Field", "Set The Frequency", "Craft Your Aura"],
    []
  );

  const [open, setOpen] = useState(false);
  const [beat, setBeat] = useState(0);

  const clearTimers = () => {
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];
  };

  const closeNow = () => {
    clearTimers();
    setOpen(false);
  };

  useEffect(() => {
    // Show once per "app open" (session). SessionStorage resets when the tab/app is closed.
    let already = false;
    try {
      already = sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      already = false;
    }
    if (already) return;

    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {}

    setOpen(true);
    setBeat(0);

    const TOTAL_MS = 3000;
    const EXIT_MS = reduceMotion ? 150 : 300;
    const HIDE_AT_MS = Math.max(0, TOTAL_MS - EXIT_MS);

    // 3-beat progression at 1s + 2s.
    timersRef.current.push(window.setTimeout(() => setBeat(1), 1000));
    timersRef.current.push(window.setTimeout(() => setBeat(2), 2000));

    // Start exit so the overlay is fully gone at ~3.0s.
    timersRef.current.push(window.setTimeout(() => setOpen(false), HIDE_AT_MS));

    return () => clearTimers();
  }, [reduceMotion]);

  const current = phrases[Math.min(beat, phrases.length - 1)] || "";

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="auralab-intro"
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          role="dialog"
          aria-label="AuraLab opening attunement"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0.15 : 0.3, ease: "easeOut" }}
          style={{
            // Avoid accidental scroll/pan while the intro is visible.
            touchAction: "none",
          }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" />

          {/* Skip */}
          <button
            type="button"
            onClick={closeNow}
            className="absolute right-4 top-4 z-10 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90 hover:bg-white/15 active:bg-white/20"
          >
            Skip
          </button>

          {/* Center content */}
          <div className="relative z-10 flex flex-col items-center justify-center px-6 text-center">
            <motion.div
              className="relative mb-6"
              aria-hidden="true"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: reduceMotion ? 0.15 : 0.35, ease: "easeOut" }}
            >
              <motion.div
                className="h-32 w-32 rounded-full border border-white/15"
                animate={
                  reduceMotion
                    ? { opacity: 0.25 }
                    : { scale: [0.95, 1.05, 0.95], opacity: [0.2, 0.35, 0.2] }
                }
                transition={
                  reduceMotion
                    ? { duration: 0.1 }
                    : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }
                }
              />
              <div className="absolute inset-0 rounded-full border border-white/5" />
            </motion.div>

            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: reduceMotion ? 0.12 : 0.22, ease: "easeOut" }}
                className="text-xl sm:text-2xl font-extrabold tracking-tight text-white"
              >
                {current}
              </motion.div>
            </AnimatePresence>

            <div className="mt-3 text-[12px] font-semibold tracking-[0.22em] text-white/70 uppercase">
              AuraLab
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
