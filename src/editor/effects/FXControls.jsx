// src/editor/effects/FXControls.jsx
// -------------------------------------------------------------
// REVERB + DELAY FX CONTROLS
// -------------------------------------------------------------

import React from "react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Waves } from "lucide-react";
import EffectSection from "./EffectSection";

export default function FXControls({
  reverbWet = 0,
  delayWet = 0,
  delayTime = 0.5,
  onReverbChange,
  onDelayChange,
  onDelayTime
}) {
  const num = (v) => (typeof v === "number" && !isNaN(v) ? v : 0);

  return (
    <EffectSection title="Effects" icon={Waves}>
      <div className="space-y-6 mt-3">

        {/* REVERB */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-xs text-gray-400">Reverb</span>
            <span className="text-xs font-mono">
              {Math.round(num(reverbWet) * 100)}%
            </span>
          </div>

          <Slider
            value={[num(reverbWet)]}
            min={0}
            max={1}
            step={0.01}
            onValueChange={(v) => onReverbChange(v[0])}
          />

          <Input
            type="number"
            value={num(reverbWet).toFixed(2)}
            onChange={(e) => {
              const v = Math.min(1, Math.max(0, parseFloat(e.target.value)));
              onReverbChange(v);
            }}
            className="w-20 h-7 text-xs text-right"
          />
        </div>

        {/* DELAY WET */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-xs text-gray-400">Delay</span>
            <span className="text-xs font-mono">
              {Math.round(num(delayWet) * 100)}%
            </span>
          </div>

          <Slider
            value={[num(delayWet)]}
            min={0}
            max={1}
            step={0.01}
            onValueChange={(v) => onDelayChange(v[0])}
          />

          <Input
            type="number"
            value={num(delayWet).toFixed(2)}
            onChange={(e) => {
              const v = Math.min(1, Math.max(0, parseFloat(e.target.value)));
              onDelayChange(v);
            }}
            className="w-20 h-7 text-xs text-right"
          />
        </div>

        {/* DELAY TIME */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-xs text-gray-400">Delay Time</span>
            <span className="text-xs font-mono">
              {num(delayTime).toFixed(2)}s
            </span>
          </div>

          <Slider
            value={[num(delayTime)]}
            min={0.01}
            max={2}
            step={0.01}
            onValueChange={(v) => onDelayTime(v[0])}
          />

          <Input
            type="number"
            value={num(delayTime).toFixed(2)}
            onChange={(e) => {
              const v = Math.min(2, Math.max(0.01, parseFloat(e.target.value)));
              onDelayTime(v);
            }}
            className="w-20 h-7 text-xs text-right"
          />
        </div>
      </div>
    </EffectSection>
  );
}
