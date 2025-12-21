// src/editor/effects/SourceControls.jsx

import React, { useEffect, useMemo, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Zap, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

import EffectSection from "./EffectSection";
import { AMBIENT_GROUPS, NOISE_TYPES, SYNTH_TYPES } from "./sourceDefs";

const OSC_TYPES = ["sine", "square", "triangle", "sawtooth"];

// Ensure "black" appears in the noise dropdown even if sourceDefs wasn't updated yet.
// This avoids breaking other code paths and keeps behavior deterministic.
const NOISE_TYPES_UI = Array.isArray(NOISE_TYPES)
  ? NOISE_TYPES.includes("black")
    ? NOISE_TYPES
    : [...NOISE_TYPES, "black"]
  : ["black"];

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

  // ---------------------------------------------------------------------------
  // AMBIENT GROUP COLLAPSE STATE
  // - Each ambient category (birds, crickets, etc.) is collapsible.
  // - Defaults: open the group containing the current waveform; otherwise open the first group.
  // - If user selects a variant, ensure its group stays open.
  // ---------------------------------------------------------------------------
  const ambientInitialOpen = useMemo(() => {
    const entries = Object.entries(AMBIENT_GROUPS);
    const wf = layer?.waveform;
    const open = {};

    for (const [key, group] of entries) {
      open[key] = Boolean(group?.variants?.some((v) => v.value === wf));
    }

    // If none active, open the first group by default.
    if (!Object.values(open).some(Boolean)) {
      const firstKey = entries[0]?.[0];
      if (firstKey) open[firstKey] = true;
    }

    return open;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layer?.id]);

  const [openGroups, setOpenGroups] = useState(() => ambientInitialOpen);

  // Reset open state when selecting a different layer.
  useEffect(() => {
    if (uiType !== "ambient") return;
    setOpenGroups(ambientInitialOpen);
  }, [uiType, ambientInitialOpen]);

  // If user selects a variant, ensure its group is open (without collapsing others).
  useEffect(() => {
    if (uiType !== "ambient") return;
    const wf = layer?.waveform;
    if (!wf) return;

    for (const [key, group] of Object.entries(AMBIENT_GROUPS)) {
      if (group?.variants?.some((v) => v.value === wf)) {
        setOpenGroups((prev) => (prev?.[key] ? prev : { ...prev, [key]: true }));
        break;
      }
    }
  }, [uiType, layer?.waveform]);

  const toggleGroup = (key) => {
    setOpenGroups((prev) => ({ ...prev, [key]: !prev?.[key] }));
  };

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
              {NOISE_TYPES_UI.map((t) => (
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
            {Object.entries(AMBIENT_GROUPS).map(([key, group]) => {
              const isOpen = Boolean(openGroups?.[key]);
              const activeInGroup = Boolean(
                group?.variants?.some((v) => v.value === layer.waveform)
              );

              return (
                <div key={key} className="rounded-md">
                  <button
                    type="button"
                    onClick={() => toggleGroup(key)}
                    className={cn(
                      "w-full flex items-center justify-between gap-2 px-2 py-1 rounded-md",
                      activeInGroup
                        ? "bg-emerald-500/10 border border-emerald-500/20"
                        : "hover:bg-white/5"
                    )}
                    aria-expanded={isOpen}
                    aria-controls={`ambient_group_${key}`}
                  >
                    <span
                      className={cn(
                        "text-xs",
                        activeInGroup ? "text-emerald-200" : "text-gray-300"
                      )}
                    >
                      {group.label}
                    </span>

                    {isOpen ? (
                      <ChevronDown
                        className={cn(
                          "w-4 h-4",
                          activeInGroup ? "text-emerald-200" : "text-gray-400"
                        )}
                      />
                    ) : (
                      <ChevronRight
                        className={cn(
                          "w-4 h-4",
                          activeInGroup ? "text-emerald-200" : "text-gray-400"
                        )}
                      />
                    )}
                  </button>

                  <div
                    id={`ambient_group_${key}`}
                    className={cn(
                      "pl-3 mt-1 overflow-hidden transition-all",
                      isOpen ? "max-h-[520px] opacity-100" : "max-h-0 opacity-0"
                    )}
                  >
                    <div className={cn("space-y-1", isOpen ? "pb-2" : "pb-0")}>
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
                </div>
              );
            })}
          </div>
        </div>
      )}
    </EffectSection>
  );
}
