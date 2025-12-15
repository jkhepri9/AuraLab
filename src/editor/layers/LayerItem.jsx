// src/editor/layers/LayerItem.jsx
// -----------------------------------------------------------------------------
// Layer row UI (rename, enable, duplicate, delete)
// - Outer wrapper is NOT a <button> to avoid nested <button> warnings.
// - Duplicate button calls onDuplicate(layer).
// -----------------------------------------------------------------------------

import React, { useEffect, useRef, useState } from "react";
import { Trash2, Pencil, Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAmbientLabel } from "@/editor/effects/sourceDefs";

const TYPE_LABEL = {
  oscillator: "Frequency",
  frequency: "Frequency",
  noise: "Noise",
  color: "Noise",
  synth: "Synth",
  ambient: "Ambient",
};

export default function LayerItem({
  layer,
  selected,
  onSelect,
  onUpdate,
  onDuplicate,
  onDelete,
}) {
  if (!layer) return null;

  const type = layer.type || "oscillator";
  const typeLabel = TYPE_LABEL[type] || String(type);

  let detail = "";
  if (type === "oscillator" || type === "frequency") {
    detail = `${Number(layer.frequency ?? 432).toFixed(0)} Hz`;
  }
  if (type === "noise" || type === "color") detail = String(layer.waveform || "white");
  if (type === "synth") detail = String(layer.waveform || "analog");
  if (type === "ambient") detail = getAmbientLabel(layer.waveform) || String(layer.waveform || "");

  // ---- Rename state ----
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(layer.name || typeLabel);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!editing) setDraft(layer.name || typeLabel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layer.name, typeLabel]);

  useEffect(() => {
    if (editing) {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
    }
  }, [editing]);

  const commit = () => {
    const next = (draft || "").trim();
    if (!next) {
      setDraft(layer.name || typeLabel);
      setEditing(false);
      return;
    }
    if (next !== (layer.name || typeLabel)) {
      onUpdate?.({ name: next });
    }
    setEditing(false);
  };

  const cancel = () => {
    setDraft(layer.name || typeLabel);
    setEditing(false);
  };

  const onActivate = () => {
    if (!editing) onSelect?.();
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onActivate}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onActivate();
        }
      }}
      className={cn(
        "w-full text-left rounded-lg px-3 py-2 border transition cursor-pointer outline-none",
        "focus-visible:ring-2 focus-visible:ring-emerald-500/40",
        selected
          ? "bg-white/10 border-white/20"
          : "bg-white/0 border-white/10 hover:bg-white/5"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {editing ? (
              <input
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    commit();
                  }
                  if (e.key === "Escape") {
                    e.preventDefault();
                    cancel();
                  }
                }}
                onBlur={commit}
                className="w-full max-w-[220px] bg-black/30 border border-white/10 rounded px-2 py-1 text-sm font-semibold text-white outline-none focus:border-white/20"
              />
            ) : (
              <span
                className="text-sm font-semibold text-white truncate max-w-[220px]"
                title="Double-click to rename"
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setEditing(true);
                }}
              >
                {layer.name || typeLabel}
              </span>
            )}
          </div>

          {detail ? <div className="text-[11px] text-gray-500 truncate mt-0.5">{detail}</div> : null}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Duplicate */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate?.();
            }}
            className="h-8 w-8 inline-flex items-center justify-center rounded border border-white/10 text-gray-500 hover:text-white hover:border-white/20"
            title="Duplicate layer"
            aria-label="Duplicate layer"
          >
            <Copy className="w-4 h-4" />
          </button>

          {/* Rename */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setEditing((v) => !v);
            }}
            className={cn(
              "h-8 w-8 inline-flex items-center justify-center rounded border border-white/10 text-gray-500 hover:text-white hover:border-white/20",
              editing && "text-emerald-400 border-emerald-500/30"
            )}
            title={editing ? "Finish rename" : "Rename"}
            aria-label={editing ? "Finish rename" : "Rename"}
          >
            {editing ? <Check className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
          </button>

          {/* Enable / Disable */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onUpdate?.({ enabled: !layer.enabled });
            }}
            className={cn(
              "text-[10px] px-2 py-1 rounded border",
              layer.enabled
                ? "text-emerald-400 border-emerald-500/30"
                : "text-gray-500 border-white/10"
            )}
            title="Enable / Disable"
            aria-label="Enable / Disable"
          >
            {layer.enabled ? "ON" : "OFF"}
          </button>

          {/* Delete */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.();
            }}
            className="h-8 w-8 inline-flex items-center justify-center rounded border border-white/10 text-gray-500 hover:text-red-400 hover:border-red-500/30"
            title="Delete layer"
            aria-label="Delete layer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
