// src/editor/effects/MixControls.jsx

import React from "react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Volume2 } from "lucide-react";
import EffectSection from "./EffectSection";

export default function MixControls({ layer, onUpdate }) {
  const num = (v) => (typeof v === "number" ? v : 0);

  return (
    <EffectSection title="Mix" icon={Volume2}>
      <div className="space-y-4 mt-2">

        {/* VOLUME */}
        <div>
          <div className="flex justify-between">
            <span className="text-xs text-gray-400">Volume</span>
            <span className="text-xs font-mono">
              {Math.round(num(layer.volume) * 100)}%
            </span>
          </div>

          <Slider
            value={[num(layer.volume ?? 0.5)]}
            min={0}
            max={1}
            step={0.01}
            onValueChange={(v) => onUpdate({ volume: v[0] })}
          />

          <Input
            type="number"
            value={num(layer.volume).toFixed(2)}
            onChange={(e) => {
              const v = Math.min(1, Math.max(0, parseFloat(e.target.value)));
              onUpdate({ volume: v });
            }}
            className="w-16 h-7 text-xs text-right mt-1"
          />
        </div>

        {/* PAN */}
        <div>
          <div className="flex justify-between">
            <span className="text-xs text-gray-400">Pan</span>
            <span className="text-xs font-mono">{num(layer.pan)}</span>
          </div>

          <Slider
            value={[num(layer.pan)]}
            min={-1}
            max={1}
            step={0.01}
            onValueChange={(v) => onUpdate({ pan: v[0] })}
          />

          <Input
            type="number"
            value={num(layer.pan).toFixed(2)}
            onChange={(e) => {
              const v = Math.min(1, Math.max(-1, parseFloat(e.target.value)));
              onUpdate({ pan: v });
            }}
            className="w-16 h-7 text-xs text-right mt-1"
          />
        </div>

        {/* BINAURAL PHASE */}
        <div>
          <div className="flex justify-between">
            <span className="text-xs text-gray-400">Binaural Phase</span>
            <span className="text-xs font-mono">{num(layer.phaseShift)}°</span>
          </div>

          <Slider
            value={[num(layer.phaseShift)]}
            min={0}
            max={360}
            step={1}
            onValueChange={(v) => onUpdate({ phaseShift: v[0] })}
          />

          <Input
            type="number"
            value={num(layer.phaseShift).toFixed(0)}
            onChange={(e) => {
              const v = Math.min(360, Math.max(0, parseInt(e.target.value)));
              onUpdate({ phaseShift: v });
            }}
            className="w-16 h-7 text-xs text-right mt-1"
          />

          <p className="text-[10px] text-gray-600">0° Left — 90° Center — 180° Right</p>
        </div>

      </div>
    </EffectSection>
  );
}
