// src/editor/effects/SourceControls.jsx

import React from "react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

import EffectSection from "./EffectSection";
import { AMBIENT_GROUPS, NOISE_TYPES, SYNTH_TYPES } from "./sourceDefs";

const OSC_TYPES = ["sine", "square", "triangle", "sawtooth"];

function resolveUiType(type) {
  // Support both conventions used across the codebase
  if (type === "frequency") return "oscillator";
  if (type === "color") return "noise";
  return type;
}

export default function SourceControls({ layer, onUpdate }) {
  const uiType = resolveUiType(layer?.type);

  const num = (v, fallback = 0) =>
    typeof v === "number" && !isNaN(v) ? v : fallback;

  // Safety: if layer is somehow undefined, don't crash the panel
  if (!layer) return null;

  return (
    <EffectSection title="Source" icon={Zap}>
      {/* OSCILLATOR (Frequency) + SYNTH */}
      {(uiType === "oscillator" || uiType === "synth") && (
        <div className="space-y-4 mt-2">
          {/* FREQUENCY */}
          <div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">Frequency</span>
              <Input
                type="number"
                value={num(layer.frequency, 432)}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  if (!isNaN(v)) onUpdate({ frequency: v });
                }}
                className="w-20 h-7 text-right text-xs"
              />
            </div>

            <Slider
              value={[num(layer.frequency, 432)]}
              min={0.1}
              max={1000}
              step={0.1}
              onValueChange={(v) => onUpdate({ frequency: v[0] })}
              className="mt-2"
            />
          </div>

          {/* WAVE / SYNTH TYPE */}
          <div>
            <span className="text-xs text-gray-400">
              {uiType === "oscillator" ? "Wave" : "Type"}
            </span>

            <Select
              value={layer.waveform || ""}
              onValueChange={(v) => onUpdate({ waveform: v })}
            >
              <SelectTrigger className="w-44 h-7 text-xs mt-1">
                <SelectValue
                  placeholder={uiType === "oscillator" ? "Select wave" : "Select type"}
                />
              </SelectTrigger>

              <SelectContent>
                {(uiType === "oscillator" ? OSC_TYPES : SYNTH_TYPES).map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* NOISE (Color Noise) */}
      {uiType === "noise" && (
        <div className="space-y-2 mt-2">
          <span className="text-xs text-gray-400">Noise Type</span>

          <Select
            value={layer.waveform || ""}
            onValueChange={(v) => onUpdate({ waveform: v })}
          >
            <SelectTrigger className="w-44 h-7 text-xs">
              <SelectValue placeholder="Select noise" />
            </SelectTrigger>

            <SelectContent>
              {NOISE_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* AMBIENT */}
      {uiType === "ambient" && (
        <div className="mt-2 space-y-2">
          <span className="text-xs text-gray-400">Ambient Sound</span>

          <div className="space-y-1 rounded-md border border-white/10 bg-black/20 p-2">
            {Object.entries(AMBIENT_GROUPS).map(([key, group]) => (
              <div key={key}>
                <span className="text-gray-300 text-xs">{group.label}</span>

                <div className="pl-3 mt-1 space-y-1">
                  {group.variants.map((v) => {
                    const active = layer.waveform === v.value;
                    return (
                      <button
                        key={v.value}
                        type="button"
                        onClick={() => onUpdate({ waveform: v.value })}
                        className={cn(
                          "w-full text-left text-xs px-2 py-1 rounded-md",
                          active
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                            : "text-gray-300 hover:bg-white/5"
                        )}
                      >
                        {v.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </EffectSection>
  );
}
