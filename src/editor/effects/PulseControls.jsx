// src/editor/effects/PulseControls.jsx

import React from "react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Activity } from "lucide-react";
import EffectSection from "./EffectSection";

export default function PulseControls({ layer, onUpdate }) {
  const num = (v) => (typeof v === "number" ? v : 0);

  return (
    <EffectSection title="Pulse (LFO)" icon={Activity}>
      <div className="grid grid-cols-2 gap-4 mt-2">

        {/* RATE */}
        <div className="space-y-2">
          <span className="text-xs text-gray-400">Rate (Hz)</span>
          <Slider
            value={[num(layer.pulseRate)]}
            min={0}
            max={20}
            step={0.1}
            onValueChange={(v) => onUpdate({ pulseRate: v[0] })}
          />
          <Input
            type="number"
            value={num(layer.pulseRate).toFixed(1)}
            onChange={(e) => {
              const v = Math.min(20, Math.max(0, parseFloat(e.target.value)));
              onUpdate({ pulseRate: v });
            }}
            className="w-16 h-7 text-xs text-right"
          />
        </div>

        {/* DEPTH */}
        <div className="space-y-2">
          <span className="text-xs text-gray-400">Depth</span>
          <Slider
            value={[num(layer.pulseDepth)]}
            min={0}
            max={1}
            step={0.01}
            onValueChange={(v) => onUpdate({ pulseDepth: v[0] })}
          />
          <Input
            type="number"
            value={num(layer.pulseDepth).toFixed(2)}
            onChange={(e) => {
              const v = Math.min(1, Math.max(0, parseFloat(e.target.value)));
              onUpdate({ pulseDepth: v });
            }}
            className="w-16 h-7 text-xs text-right"
          />
        </div>

      </div>
    </EffectSection>
  );
}
