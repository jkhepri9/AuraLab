// src/pages/auraModes/components.jsx

import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Check, Heart } from "lucide-react";

// ------------------------------------------------------------
// UI: Small building blocks
// ------------------------------------------------------------
export function SectionHeader({ title, subtitle, right }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-3">
      <div className="min-w-0">
        <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight truncate">
          {title}
        </h2>
        {subtitle ? <p className="text-sm text-white/60 mt-1">{subtitle}</p> : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

export function CategoryItem({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-sm font-semibold border transition",
        active
          ? "bg-emerald-600 text-white border-emerald-500/60 shadow-[0_0_0_1px_rgba(16,185,129,0.25)]"
          : "bg-white/5 text-white/80 border-white/10 hover:bg-white/10"
      )}
    >
      <span className="truncate">{children}</span>
      {active ? <Check className="w-4 h-4 shrink-0" /> : <span className="w-4 h-4 shrink-0" />}
    </button>
  );
}

export function Rail({ children }) {
  return <div className="flex gap-3 overflow-x-auto pb-2 pr-2">{children}</div>;
}

export function CompactCard({ preset, isFavorite, onToggleFavorite, onActivate, onOpen }) {
  const handleClick = () => {
    // Prefer "activate" (open + autoplay). Keep "open" as a fallback for older call sites.
    if (typeof onActivate === "function") onActivate(preset);
    else if (typeof onOpen === "function") onOpen(preset);
  };

  return (
    <div className={cn("min-w-[240px] max-w-[240px] shrink-0 group")}>
      {/* Image-only card */}
      <div
        className={cn(
          "rounded-xl overflow-hidden border border-white/10",
          "h-[140px] bg-gradient-to-br from-slate-900 to-emerald-900",
          "transition-transform duration-300 group-hover:scale-[1.01] cursor-pointer"
        )}
        onClick={handleClick}
        style={{
          backgroundImage: preset?.imageUrl ? `url(${preset.imageUrl})` : undefined,
          backgroundSize: preset?.imageUrl ? "cover" : undefined,
          backgroundPosition: "center",
        }}
      />

      {/* Title + description UNDER the image */}
      <div className="mt-2 px-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-white font-extrabold leading-tight truncate">{preset.name}</div>
            {preset.description ? (
              <div className="text-xs text-white/70 mt-1 line-clamp-2">{preset.description}</div>
            ) : null}
          </div>

          {typeof onToggleFavorite === "function" ? (
            <button
              type="button"
              className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center",
                "bg-white/10 hover:bg-white/15 border border-white/10"
              )}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(preset.id);
              }}
              title={isFavorite ? "Unfavorite" : "Favorite"}
            >
              <Heart
                className={cn(
                  "w-4 h-4",
                  isFavorite ? "fill-emerald-400 text-emerald-400" : "text-white/70"
                )}
              />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// Full grid card (NO 3-dot menu)
// ------------------------------------------------------------
export function ModeCard({
  preset,
  handleActivate,
  handleEditRequest,
  // (kept for signature compatibility; menu removed for now)
  handleDelete,
  handleReorder,
  renamePreset,
  index,
  totalPresets,
  isRenaming,
  startRename,
  finishRename,
  isFavorite,
  onToggleFavorite,
  isLocked,
}) {
  const [newName, setNewName] = useState(preset.name);

  useEffect(() => {
    setNewName(preset.name);
  }, [preset.id, preset.name]);

  const handleRenameSubmit = (e) => {
    e?.stopPropagation?.();

    // Built-ins are view-only: exit rename mode and open details instead.
    if (isLocked) {
      finishRename?.();
      handleEditRequest?.(preset);
      return;
    }

    const next = String(newName || "").trim();
    if (next && next !== preset.name) {
      renamePreset?.mutate?.({ id: preset.id, newName: next });
    }
    finishRename?.();
  };

  return (
    <motion.div
      key={preset.id}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -14 }}
      transition={{ duration: 0.25 }}
      className={cn("w-full group")}
    >
      {/* Image-only card */}
      <div
        className={cn(
          "w-full rounded-xl overflow-hidden shadow-xl",
          "border border-white/10",
          "h-[220px] md:h-[240px]",
          "bg-gradient-to-br from-slate-900 to-emerald-900",
          "transition-transform duration-300 group-hover:scale-[1.01] cursor-pointer"
        )}
        onClick={(e) => handleActivate(e, preset)}
        style={{
          backgroundImage: preset?.imageUrl ? `url(${preset.imageUrl})` : undefined,
          backgroundSize: preset?.imageUrl ? "cover" : undefined,
          backgroundPosition: "center",
        }}
      />

      {/* Title + description UNDER the image */}
      <div className="mt-3 px-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {isRenaming === preset.id ? (
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onBlur={handleRenameSubmit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRenameSubmit(e);
                  if (e.key === "Escape") finishRename?.();
                }}
                onClick={(e) => e.stopPropagation()}
                className="text-lg font-bold bg-white/10 border-emerald-500/50 text-white"
                autoFocus
              />
            ) : (
              <h3
                className="text-xl font-extrabold text-white truncate"
                onDoubleClick={(e) => {
                  // Keep rename available without stealing single-click (single-click opens + autoplay)
                  e.stopPropagation();
                  if (isLocked) return;
                  startRename?.(preset.id);
                }}
                title={isLocked ? "Built-in preset" : "Double-click to rename"}
              >
                {preset.name}
              </h3>
            )}
          </div>

          {typeof onToggleFavorite === "function" ? (
            <button
              type="button"
              className={cn(
                "h-9 w-9 rounded-full flex items-center justify-center",
                "bg-white/10 hover:bg-white/15 border border-white/10"
              )}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(preset.id);
              }}
              title={isFavorite ? "Unfavorite" : "Favorite"}
            >
              <Heart
                className={cn(
                  "w-4 h-4",
                  isFavorite ? "fill-emerald-400 text-emerald-400" : "text-white/70"
                )}
              />
            </button>
          ) : null}
        </div>

        {preset.description ? (
          <p className="mt-1 text-sm text-white/70 line-clamp-2">{preset.description}</p>
        ) : null}
      </div>
    </motion.div>
  );
}
