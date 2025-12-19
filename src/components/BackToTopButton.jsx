// src/components/BackToTopButton.jsx
// -----------------------------------------------------------------------------
// AuraLab — Back-to-top floating action button
// - Tracks window scroll by default
// - Optionally also tracks a specific scroll container via a CSS selector
// -----------------------------------------------------------------------------

import React, { useEffect, useRef, useState } from "react";
import { ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function getWindowScrollTop() {
  try {
    return (
      window.scrollY ||
      window.pageYOffset ||
      document.documentElement?.scrollTop ||
      0
    );
  } catch {
    return 0;
  }
}

export default function BackToTopButton({
  enabled = true,
  threshold = 320,

  // If provided, we will ALSO track this container's scrollTop (in addition to window).
  // Useful for pages that scroll inside an overflow-y-auto wrapper.
  containerSelector = null,

  // Positioning (tuned to avoid BottomNav + Sticky Player)
  bottomClassName = "bottom-[calc(11rem+env(safe-area-inset-bottom))] md:bottom-24",
  rightClassName = "right-4 md:right-6",
  className = "",

  ariaLabel = "Back to top",
}) {
  const containerRef = useRef(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!enabled) return;

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
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    let tries = 0;
    let rafId = null;

    const resolveContainer = () => {
      if (!containerSelector) {
        containerRef.current = null;
        return true;
      }

      const el = document.querySelector?.(containerSelector) || null;
      if (el) {
        containerRef.current = el;
        return true;
      }

      return false;
    };

    const onScroll = () => {
      const winTop = getWindowScrollTop();
      const el = containerRef.current;
      const elTop = el ? el.scrollTop || 0 : 0;
      const top = Math.max(winTop, elTop);
      setVisible(top > threshold);
    };

    // Bind window scroll always
    window.addEventListener("scroll", onScroll, { passive: true });

    // Bind container scroll (if present); try for a short period if not mounted yet.
    const bindContainerIfNeeded = () => {
      const ok = resolveContainer();
      if (ok) {
        const el = containerRef.current;
        if (el) el.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
        return;
      }

      tries += 1;
      if (tries < 60) {
        rafId = requestAnimationFrame(bindContainerIfNeeded);
      } else {
        onScroll();
      }
    };

    bindContainerIfNeeded();

    return () => {
      window.removeEventListener("scroll", onScroll);
      const el = containerRef.current;
      if (el) el.removeEventListener("scroll", onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [enabled, containerSelector, threshold]);

  const handleClick = () => {
    const behavior = reduceMotion ? "auto" : "smooth";

    // Always try to scroll both (safe when one isn't scrollable).
    try {
      window.scrollTo({ top: 0, behavior });
    } catch {
      try {
        window.scrollTo(0, 0);
      } catch {
        // ignore
      }
    }

    const el = containerRef.current;
    if (el && typeof el.scrollTo === "function") {
      try {
        el.scrollTo({ top: 0, behavior });
      } catch {
        try {
          el.scrollTop = 0;
        } catch {
          // ignore
        }
      }
    }
  };

  if (!enabled) return null;

  return (
    <div
      className={cn(
        "fixed z-50 transition-all duration-200",
        rightClassName,
        bottomClassName,
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-2 pointer-events-none",
        className
      )}
    >
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={handleClick}
        aria-label={ariaLabel}
        title={ariaLabel}
        className={cn(
          "h-11 w-11 rounded-full",
          "bg-black/45 hover:bg-black/60 border-white/15",
          "backdrop-blur-md shadow-lg shadow-black/30"
        )}
      >
        <ChevronUp className="h-5 w-5 text-white" />
      </Button>
    </div>
  );
}
