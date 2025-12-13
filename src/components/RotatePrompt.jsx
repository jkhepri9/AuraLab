import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Smartphone, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "auralab_rotate_prompt_dismissed";

function useIsPortrait() {
  const [portrait, setPortrait] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(orientation: portrait)");
    const update = () => setPortrait(!!mq.matches);

    update();

    // Safari uses addListener/removeListener
    if (mq.addEventListener) mq.addEventListener("change", update);
    else mq.addListener(update);

    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", update);
      else mq.removeListener(update);
    };
  }, []);

  return portrait;
}

function useIsMobile() {
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    const update = () => {
      const uaMobile = !!navigator.userAgentData?.mobile;
      setMobile(uaMobile || mq.matches);
    };

    update();

    if (mq.addEventListener) mq.addEventListener("change", update);
    else mq.addListener(update);

    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", update);
      else mq.removeListener(update);
    };
  }, []);

  return mobile;
}

export default function RotatePrompt({
  className,
  title = "Rotate your device",
  message = "Aura Studio is designed for landscape on mobile. Rotate for the best editing experience.",
}) {
  const isMobile = useIsMobile();
  const isPortrait = useIsPortrait();

  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  const shouldShow = useMemo(() => {
    // Only show on mobile portrait, and only if user hasn't dismissed it
    return isMobile && isPortrait && !dismissed;
  }, [isMobile, isPortrait, dismissed]);

  if (!shouldShow) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {}
  };

  return (
    <div
      className={cn(
        "fixed inset-0 z-[9999] flex items-center justify-center",
        "bg-black/85 backdrop-blur-md",
        className
      )}
      role="dialog"
      aria-modal="true"
      aria-label="Rotate device prompt"
    >
      <div className="w-[92vw] max-w-md rounded-2xl border border-white/10 bg-zinc-950/80 p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
            <RotateCw className="w-5 h-5 text-emerald-300" />
          </div>
          <div className="min-w-0">
            <div className="text-lg font-extrabold text-white leading-tight">
              {title}
            </div>
            <div className="text-xs text-gray-400">
              Landscape recommended
            </div>
          </div>
        </div>

        <div className="text-sm text-gray-200 leading-relaxed">
          {message}
        </div>

        <div className="mt-5 flex items-center gap-2">
          <div className="flex-1 flex items-center justify-center rounded-xl border border-white/10 bg-white/5 py-3">
            <Smartphone className="w-5 h-5 text-white/70" />
            <span className="ml-2 text-xs text-white/80">
              Rotate to landscape
            </span>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <Button
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-black font-bold"
            onClick={() => {
              // No force; we simply let them rotate. Keep prompt visible until rotation.
            }}
          >
            Got it
          </Button>

          <Button
            className="flex-1"
            variant="outline"
            onClick={dismiss}
          >
            Continue anyway
          </Button>
        </div>

        <div className="mt-3 text-[10px] text-gray-500">
          Tip: If you installed AuraLab as an app, landscape is usually smoother.
        </div>
      </div>
    </div>
  );
}
