// src/editor/effects/EffectSection.jsx
import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function EffectSection({ title, icon: Icon, children }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="border-t border-white/10 pt-3">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider mb-2"
      >
        <span className="flex items-center gap-2">
          {Icon && <Icon className="w-3 h-3" />}
          {title}
        </span>

        {open ? (
          <ChevronDown className="w-3 h-3" />
        ) : (
          <ChevronRight className="w-3 h-3" />
        )}
      </button>

      <div
        className={cn(
          "transition-all overflow-hidden",
          open ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        {children}
      </div>
    </div>
  );
}
