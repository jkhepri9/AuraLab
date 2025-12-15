// src/components/RotatePrompt.jsx
// -----------------------------------------------------------------------------
// RotatePrompt — mobile portrait prompt to rotate to landscape
// -----------------------------------------------------------------------------
// Behavior (as requested):
// - Shows EVERY time user enters the page while in portrait on mobile.
// - "Continue anyway" only dismisses for the current visit.
// - Navigating away/back (or returning to portrait) shows it again.
// -----------------------------------------------------------------------------

import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { RotateCw } from "lucide-react";

function isMobileDevice() {
  if (typeof window === "undefined") return false;

  const coarse =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(pointer: coarse)").matches;

  const small =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(max-width: 900px)").matches;

  const ua = typeof navigator !== "undefined" ? navigator.userAgent || "" : "";
  const uaMobile = /Android|iPhone|iPad|iPod|Mobi/i.test(ua);

  return coarse || small || uaMobile;
}

function isPortrait() {
  if (typeof window === "undefined") return false;

  if (typeof window.matchMedia === "function") {
    const mq = window.matchMedia("(orientation: portrait)");
    if (mq && typeof mq.matches === "boolean") return mq.matches;
  }

  return window.innerHeight > window.innerWidth;
}

export default function RotatePrompt({
  title = "Rotate your device",
  message = "For the best experience on mobile, rotate your screen to landscape.",
}) {
  const location = useLocation();

  const [dismissed, setDismissed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [portrait, setPortrait] = useState(false);

  // Re-check device + orientation on resize/orientation changes
  useEffect(() => {
    const handle = () => {
      setMobile(isMobileDevice());
      setPortrait(isPortrait());
    };

    handle();

    window.addEventListener("resize", handle);
    window.addEventListener("orientationchange", handle);

    let mq = null;
    if (typeof window.matchMedia === "function") {
      mq = window.matchMedia("(orientation: portrait)");
      if (mq && typeof mq.addEventListener === "function") mq.addEventListener("change", handle);
      else if (mq && typeof mq.addListener === "function") mq.addListener(handle);
    }

    return () => {
      window.removeEventListener("resize", handle);
      window.removeEventListener("orientationchange", handle);
      if (mq && typeof mq.removeEventListener === "function") mq.removeEventListener("change", handle);
      else if (mq && typeof mq.removeListener === "function") mq.removeListener(handle);
    };
  }, []);

  // ✅ Prompt again every time the user ENTERS the page (route changes)
  useEffect(() => {
    setDismissed(false);
  }, [location.pathname]);

  // ✅ If user rotates to landscape, clear dismissal.
  // When they rotate back to portrait, prompt shows again.
  useEffect(() => {
    if (!portrait) setDismissed(false);
  }, [portrait]);

  const shouldShow = mobile && portrait && !dismissed;

  if (!shouldShow) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0b0b0b] shadow-2xl p-6 text-center">
        <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
          <RotateCw className="h-7 w-7 text-white/80" />
        </div>

        <div className="text-lg font-extrabold text-white">{title}</div>
        <div className="text-sm text-gray-400 mt-2 leading-relaxed">{message}</div>

        <div className="mt-5 flex justify-center">
          <Button
            onClick={() => setDismissed(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold"
          >
            Continue anyway
          </Button>
        </div>
      </div>
    </div>
  );
}
