// src/editor/layers/LayerList.jsx
// -------------------------------------------------------------
// LEFT SIDEBAR — LAYER LIST (Collapsible)
// -------------------------------------------------------------

import React, { useEffect, useMemo, useState } from "react";
import LayerItem from "./LayerItem";
import {
  Activity,
  Waves,
  Zap,
  Wind,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "auralab_layerlist_collapsed";

function iconForType(type) {
  switch (type) {
    case "oscillator":
    case "frequency":
      return Activity;
    case "noise":
    case "color":
      return Waves;
    case "synth":
      return Zap;
    case "ambient":
      return Wind;
    default:
      return Activity;
  }
}

export default function LayerList({
  layers,
  selectedLayerId,
  onSelectLayer,
  onAddLayer,
  onUpdateLayer,
  onDuplicateLayer,
  onDeleteLayer,
}) {
  const [collapsed, setCollapsed] = useState(false);

  // Load persisted state
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "1") setCollapsed(true);
    } catch {}
  }, []);

  // Persist state
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
    } catch {}
  }, [collapsed]);

  const safeLayers = useMemo(
    () => (Array.isArray(layers) ? layers.filter(Boolean) : []),
    [layers]
  );

  return (
    <div
      className={cn(
        "border-r border-white/10 flex flex-col bg-[#0d0d0d] transition-all duration-200",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* LIBRARY PANEL */}
      <div className="border-b border-white/10">
        <div className={cn("p-4", collapsed && "p-3")}>
          <div className="flex items-center justify-between">
            {!collapsed ? (
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Library
              </h2>
            ) : (
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                Lib
              </div>
            )}

            <Button
              size="icon"
              variant="ghost"
              onClick={() => setCollapsed((v) => !v)}
              className={cn("h-8 w-8", collapsed && "h-9 w-9")}
              title={collapsed ? "Expand" : "Collapse"}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* LIBRARY BUTTONS */}
          <div className={cn("mt-3 grid gap-2", collapsed ? "grid-cols-1" : "grid-cols-2")}>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "border-white/10 h-9",
                collapsed ? "justify-center px-0" : "justify-start text-xs"
              )}
              onClick={() => onAddLayer("oscillator")}
              title="Add Frequency"
              aria-label="Add Frequency"
            >
              <Activity className={cn("w-4 h-4 text-emerald-400", !collapsed && "w-3 h-3 mr-1.5")} />
              {!collapsed && <span className="text-white">Frequency</span>}
            </Button>

            <Button
              variant="outline"
              size="sm"
              className={cn(
                "border-white/10 h-9",
                collapsed ? "justify-center px-0" : "justify-start text-xs"
              )}
              onClick={() => onAddLayer("noise")}
              title="Add Noise"
              aria-label="Add Noise"
            >
              <Waves className={cn("w-4 h-4 text-purple-400", !collapsed && "w-3 h-3 mr-1.5")} />
              {!collapsed && <span className="text-white">Noise</span>}
            </Button>

            <Button
              variant="outline"
              size="sm"
              className={cn(
                "border-white/10 h-9",
                collapsed ? "justify-center px-0" : "justify-start text-xs"
              )}
              onClick={() => onAddLayer("synth")}
              title="Add Synth"
              aria-label="Add Synth"
            >
              <Zap className={cn("w-4 h-4 text-yellow-400", !collapsed && "w-3 h-3 mr-1.5")} />
              {!collapsed && <span className="text-white">Synths</span>}
            </Button>

            <Button
              variant="outline"
              size="sm"
              className={cn(
                "border-white/10 h-9",
                collapsed ? "justify-center px-0" : "justify-start text-xs"
              )}
              onClick={() => onAddLayer("ambient")}
              title="Add Ambient"
              aria-label="Add Ambient"
            >
              <Wind className={cn("w-4 h-4 text-blue-400", !collapsed && "w-3 h-3 mr-1.5")} />
              {!collapsed && <span className="text-white">Ambient</span>}
            </Button>
          </div>
        </div>
      </div>

      {/* LAYER LIST */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {!collapsed ? (
          safeLayers.map((layer) => (
            <LayerItem
              key={layer.id}
              layer={layer}
              selected={layer.id === selectedLayerId}
              onSelect={() => onSelectLayer(layer.id)}
              onUpdate={(updates) => onUpdateLayer(layer.id, updates)}
              onDuplicate={() => onDuplicateLayer?.(layer.id)}
              onDelete={() => onDeleteLayer(layer.id)}
            />
          ))
        ) : (
          safeLayers.map((layer) => {
            const Icon = iconForType(layer?.type);
            const active = layer?.id === selectedLayerId;

            return (
              <button
                key={layer.id}
                onClick={() => onSelectLayer(layer.id)}
                className={cn(
                  "w-full h-11 rounded-xl border border-white/10 flex items-center justify-center transition",
                  active
                    ? "bg-emerald-500/15 border-emerald-500/40"
                    : "bg-white/0 hover:bg-white/5"
                )}
                title={layer?.name || "Layer"}
                aria-label={layer?.name || "Layer"}
              >
                <Icon className={cn("w-5 h-5", active ? "text-emerald-300" : "text-gray-300")} />
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
