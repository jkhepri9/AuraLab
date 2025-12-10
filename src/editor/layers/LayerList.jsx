// src/editor/layers/LayerList.jsx
// -------------------------------------------------------------
// LEFT SIDEBAR — LAYER LIST
// Replaces the entire left-pane logic of the old AuraEditor.
// -------------------------------------------------------------

import React from "react";
import LayerItem from "./LayerItem";
import { Activity, Waves, Zap, Wind } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LayerList({
  layers,
  selectedLayerId,
  onSelectLayer,
  onAddLayer,
  onUpdateLayer,
  onDeleteLayer
}) {
  return (
    <div className="w-64 border-r border-white/10 flex flex-col bg-[#0d0d0d]">

      {/* LIBRARY PANEL */}
      <div className="p-4 border-b border-white/10">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
          Library
        </h2>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            className="justify-start text-xs border-white/10 h-9"
            onClick={() => onAddLayer("oscillator")}
          >
            <Activity className="w-3 h-3 mr-1.5 text-emerald-400" />
            <span className="text-white">Frequency</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="justify-start text-xs border-white/10 h-9"
            onClick={() => onAddLayer("noise")}
          >
            <Waves className="w-3 h-3 mr-1.5 text-purple-400" />
            <span className="text-white">Noise</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="justify-start text-xs border-white/10 h-9"
            onClick={() => onAddLayer("synth")}
          >
            <Zap className="w-3 h-3 mr-1.5 text-yellow-400" />
            <span className="text-white">Synths</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="justify-start text-xs border-white/10 h-9"
            onClick={() => onAddLayer("ambient")}
          >
            <Wind className="w-3 h-3 mr-1.5 text-blue-400" />
            <span className="text-white">Ambient</span>
          </Button>
        </div>
      </div>

      {/* LAYER LIST */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {layers.map((layer) => (
          <LayerItem
            key={layer.id}
            layer={layer}
            selected={layer.id === selectedLayerId}
            onSelect={() => onSelectLayer(layer.id)}
            onUpdate={(updates) => onUpdateLayer(layer.id, updates)}
            onDelete={() => onDeleteLayer(layer.id)}
          />
        ))}
      </div>
    </div>
  );
}
