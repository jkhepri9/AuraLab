// src/editor/layers/LayerItem.jsx
// -------------------------------------------------------------
// INDIVIDUAL LAYER CARD
// Replaces the giant clickable blocks from the old AuraEditor.
// -------------------------------------------------------------

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Activity, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function LayerItem({
  layer,
  selected,
  onSelect,
  onUpdate,
  onDelete
}) {
  const [editingName, setEditingName] = useState(false);

  return (
    <div
      onClick={onSelect}
      className={cn(
        "p-2 rounded-lg border transition-all cursor-pointer group relative",
        selected
          ? "bg-white/10 border-emerald-500/50"
          : "bg-black/20 border-white/5 hover:bg-white/5"
      )}
    >
      {/* NAME + ENABLE + DELETE */}
      <div className="flex items-center justify-between mb-1">

        {/* NAME FIELD */}
        {editingName ? (
          <Input
            value={layer.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            onBlur={() => setEditingName(false)}
            onKeyDown={(e) => e.key === "Enter" && setEditingName(false)}
            className="h-6 text-sm bg-white/10 border-white/20 px-2"
            autoFocus
          />
        ) : (
          <span
            className="text-sm font-medium truncate max-w-[120px] cursor-text hover:text-emerald-400"
            onDoubleClick={(e) => {
              e.stopPropagation();
              setEditingName(true);
            }}
          >
            {layer.name}
          </span>
        )}

        {/* ENABLE + DELETE BUTTONS */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">

          {/* ENABLE TOGGLE */}
          <Button
            size="icon"
            variant="ghost"
            className="h-5 w-5"
            onClick={(e) => {
              e.stopPropagation();
              onUpdate({ enabled: !layer.enabled });
            }}
          >
            <Activity
              className={cn(
                "w-3 h-3",
                layer.enabled ? "text-emerald-400" : "text-gray-600"
              )}
            />
          </Button>

          {/* DELETE */}
          <Button
            size="icon"
            variant="ghost"
            className="h-5 w-5 hover:text-red-400"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* VOLUME PREVIEW BAR */}
      <div className="flex items-center gap-2">
        <div className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500"
            style={{ width: `${(layer.volume ?? 0.5) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
