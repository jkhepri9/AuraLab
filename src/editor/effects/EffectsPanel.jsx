// src/editor/effects/EffectsPanel.jsx
// -------------------------------------------------------------
// EFFECTS PANEL (RIGHT SIDEBAR)
// Fully patched for:
//  - correct prop forwarding
//  - reverb slider working
//  - delay sliders stable
//  - always-safe numeric defaults
// -------------------------------------------------------------
//
// MINOR UI PATCH:
//  - Collapse Arrow moved to LEFT
//  - "Effects" label moved to RIGHT
// -------------------------------------------------------------

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

import SourceControls from "./SourceControls";
import FilterControls from "./FilterControls";
import PulseControls from "./PulseControls";
import MixControls from "./MixControls";
import FXControls from "./FXControls";

import { cn } from "@/lib/utils";

export default function EffectsPanel({
  selectedLayer,
  onUpdateLayer,

  // FX values passed from AuraEditor
  reverbWet,
  delayWet,
  delayTime,

  // FX callbacks (AuraEditor → AudioEngine)
  onReverbChange,
  onDelayChange,
  onDelayTime,
}) {
  const [collapsed, setCollapsed] = useState(false);

  // Helper: always return safe numeric values (prevents slider lock)
  const safe = (v, fallback = 0) =>
    typeof v === "number" && !isNaN(v) ? v : fallback;

  // ---------------------------------------------------------------------------
  // NO LAYER SELECTED
  // ---------------------------------------------------------------------------
  if (!selectedLayer) {
    return (
      <div
        className={cn(
          "border-l border-white/10 bg-[#0d0d0d] flex flex-col items-center justify-center text-gray-600 transition-all duration-300 relative",
          collapsed ? "w-12" : "w-80"
        )}
      >
        {!collapsed && (
          <p className="text-sm px-8 text-center">
            Select a layer to edit its properties, or add a new one from the left panel.
          </p>
        )}

        {/* Collapse Arrow on LEFT */}
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setCollapsed(!collapsed)}
          className="absolute top-2 left-2 h-8 w-8"
          aria-label={collapsed ? "Expand effects panel" : "Collapse effects panel"}
          title={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? <ChevronLeft /> : <ChevronRight />}
        </Button>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // FULL PANEL
  // ---------------------------------------------------------------------------
  return (
    <div
      className={cn(
        "border-l border-white/10 bg-[#0d0d0d] flex flex-col overflow-y-auto transition-all duration-300",
        collapsed ? "w-12" : "w-80"
      )}
    >
      {/* HEADER */}
      <div className="h-12 border-b border-white/10 flex items-center justify-between px-3 shrink-0">
        {/* Collapse Arrow on LEFT */}
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand effects panel" : "Collapse effects panel"}
          title={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? <ChevronLeft /> : <ChevronRight />}
        </Button>

        {/* "Effects" label on RIGHT */}
        {!collapsed && (
          <span className="text-xs font-bold text-gray-500 uppercase">
            Effects
          </span>
        )}
      </div>

      {/* CONTENT */}
      {!collapsed && (
        <div className="p-6 space-y-6">
          {/* LAYER TITLE */}
          <div>
            <h3 className="text-lg font-bold text-white mb-1">
              {selectedLayer.name}
            </h3>

            <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30 uppercase">
              {selectedLayer.type}
            </span>
          </div>

          {/* SOURCE */}
          <SourceControls layer={selectedLayer} onUpdate={onUpdateLayer} />

          {/* FILTER */}
          <FilterControls layer={selectedLayer} onUpdate={onUpdateLayer} />

          {/* PULSE */}
          <PulseControls layer={selectedLayer} onUpdate={onUpdateLayer} />

          {/* MIX */}
          <MixControls layer={selectedLayer} onUpdate={onUpdateLayer} />

          {/* FX — FULLY ENABLED + PATCHED */}
          <FXControls
            reverbWet={safe(reverbWet, 0)}
            delayWet={safe(delayWet, 0)}
            delayTime={safe(delayTime, 0.5)}
            onReverbChange={onReverbChange}
            onDelayChange={onDelayChange}
            onDelayTime={onDelayTime}
          />
        </div>
      )}
    </div>
  );
}
