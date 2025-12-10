// src/editor/effects/FilterControls.jsx

import React from "react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Wind } from "lucide-react";
import EffectSection from "./EffectSection";

export default function FilterControls({ layer, onUpdate }) {
  const num = (v) => (typeof v === "number" && !isNaN(v) ? v : 0);

  const filter = layer.filter || { frequency: 20000, Q: 1 };

  return (
    <EffectSection title="Filter" icon={Wind}>
      <div className="mt-2 space-y-4">

        {/* ENABLE TOGGLE FOR OSCILLATOR */}
        {layer.type === "oscillator" && (
          <button
            onClick={() => onUpdate({ filterEnabled: !layer.filterEnabled===false })}
            className={
              layer.filterEnabled==false
                ? "px-2 py-1 text-xs rounded bg-emerald-500/20 border border-emerald-500 text-emerald-300"
                : "px-2 py-1 text-xs rounded bg-black/40 border border-white/10 text-gray-400"
            }
          >
            Filter: {layer.filterEnabled ? "On" : "Off"}
          </button>
        )}

        {(layer.type !== "oscillator" || layer.filterEnabled) && (
          <>
            {/* CUTOFF */}
            <div>
              <span className="text-xs text-gray-400">Cutoff</span>
              <Slider
                value={[num(filter.frequency)]}
                min={20}
                max={20000}
                step={10}
                onValueChange={(v) =>
                  onUpdate({
                    filter: { ...filter, frequency: v[0] }
                  })
                }
              />
              <Input
                type="number"
                value={num(filter.frequency).toFixed(0)}
                onChange={(e) => {
                  const v = Math.min(20000, Math.max(20, parseFloat(e.target.value)));
                  onUpdate({ filter: { ...filter, frequency: v } });
                }}
                className="w-20 h-7 text-xs text-right mt-1"
              />
            </div>

            {/* RESONANCE */}
            <div>
              <span className="text-xs text-gray-400">Resonance</span>
              <Slider
                value={[num(filter.Q)]}
                min={0.1}
                max={20}
                step={0.1}
                onValueChange={(v) =>
                  onUpdate({
                    filter: { ...filter, Q: v[0] }
                  })
                }
              />
              <Input
                type="number"
                value={num(filter.Q).toFixed(1)}
                onChange={(e) => {
                  const v = Math.min(20, Math.max(0.1, parseFloat(e.target.value)));
                  onUpdate({ filter: { ...filter, Q: v } });
                }}
                className="w-20 h-7 text-xs text-right mt-1"
              />
            </div>
          </>
        )}
      </div>
    </EffectSection>
  );
}
