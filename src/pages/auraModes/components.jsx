// src/pages/auraModes/components.jsx

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Play,
  Heart,
  ArrowRight,
  MoreHorizontal,
  Edit,
  Edit3,
  Trash2,
  Check,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  return (
    <div
      className={cn(
        "relative rounded-xl overflow-hidden bg-gradient-to-br from-slate-900 to-emerald-900 border border-white/10",
        "min-w-[240px] max-w-[240px] h-[140px] shrink-0 cursor-pointer group"
      )}
      style={{
        backgroundImage: preset.imageUrl ? `url(${preset.imageUrl})` : undefined,
        backgroundSize: preset.imageUrl ? "cover" : undefined,
        backgroundPosition: "center",
      }}
      onClick={() => onOpen(preset)}
    >
      <div className="absolute inset-0 bg-black/60 group-hover:bg-black/45 transition-colors" />

      <div className="relative h-full p-3 flex flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-white font-extrabold leading-tight truncate">{preset.name}</div>
            {preset.description ? (
              <div className="text-xs text-white/70 mt-1 line-clamp-2">{preset.description}</div>
            ) : null}
          </div>

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
        </div>

        <div className="flex items-center justify-between gap-2">
          <Button
            className="h-9 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            onClick={(e) => {
              e.stopPropagation();
              onActivate(preset);
            }}
          >
            <Play className="w-4 h-4 mr-2 fill-white" />
            Play
          </Button>

          <Button
            variant="ghost"
            className="h-9 px-3 rounded-lg text-white/70 hover:bg-white/10"
            onClick={(e) => {
              e.stopPropagation();
              onOpen(preset);
            }}
          >
            Details <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ModeCard({
  preset,
  handleActivate,
  handleEditRequest,
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
    e.stopPropagation();
    if (isLocked) {
      finishRename();
      toast.info("This is a built-in preset. Save a copy to customize.");
      return;
    }
    if (newName.trim() && newName !== preset.name) {
      renamePreset.mutate({ id: preset.id, newName });
    }
    finishRename();
  };

  return (
    <motion.div
      key={preset.id}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -14 }}
      transition={{ duration: 0.25 }}
      className="w-full rounded-xl overflow-hidden shadow-xl transition-transform duration-300 transform hover:scale-[1.01] relative cursor-pointer group bg-gradient-to-br from-slate-900 to-emerald-900"
      onClick={(e) => handleActivate(e, preset)}
      style={{
        backgroundImage: preset.imageUrl ? `url(${preset.imageUrl})` : undefined,
        backgroundSize: preset.imageUrl ? "cover" : undefined,
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition-colors" />

      <div className="relative p-5 flex flex-col justify-between h-full">
        <div className="flex justify-between items-start mb-3 gap-2">
          <div className="flex-1 min-w-0">
            {isRenaming === preset.id ? (
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onBlur={handleRenameSubmit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRenameSubmit(e);
                }}
                onClick={(e) => e.stopPropagation()}
                className="text-xl font-bold bg-white/10 border-emerald-500/50 text-white"
                autoFocus
              />
            ) : (
              <h3
                className="text-2xl font-extrabold text-white drop-shadow mb-1 truncate"
                onClick={(e) => {
                  e.stopPropagation();
                  if (isLocked) {
                    handleEditRequest(preset);
                    return;
                  }
                  startRename(preset.id);
                }}
                title={isLocked ? "Built-in preset (view details)" : "Click to rename"}
              >
                {preset.name}
              </h3>
            )}
          </div>

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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-white/70 hover:bg-white/10"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-44 bg-zinc-900 border-zinc-700 text-white">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditRequest(preset);
                }}
                className="cursor-pointer hover:bg-zinc-700"
              >
                <Edit className="w-4 h-4 mr-2" /> Edit Details
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  if (isLocked) return;
                  handleReorder(preset.id, "up");
                }}
                disabled={isLocked || index === 0}
                className="cursor-pointer hover:bg-zinc-700"
              >
                Move Up
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  if (isLocked) return;
                  handleReorder(preset.id, "down");
                }}
                disabled={isLocked || index === totalPresets - 1}
                className="cursor-pointer hover:bg-zinc-700"
              >
                Move Down
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  if (isLocked) {
                    toast.info("This is a built-in preset. Save a copy to customize.");
                    return;
                  }
                  startRename(preset.id);
                }}
                disabled={isLocked}
                className="cursor-pointer hover:bg-zinc-700"
              >
                <Edit3 className="w-4 h-4 mr-2" /> Rename
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  if (isLocked) {
                    toast.info("This is a built-in preset and can’t be deleted.");
                    return;
                  }
                  handleDelete(preset.id);
                }}
                disabled={isLocked}
                className={cn(
                  "cursor-pointer hover:bg-red-900/50",
                  isLocked ? "text-white/30" : "text-red-400"
                )}
              >
                <Trash2 className="w-4 h-4 mr-2" /> Delete Mode
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {preset.description ? (
          <p className="mt-1 text-sm text-white/80 line-clamp-2">{preset.description}</p>
        ) : null}

        <div className="mt-4">
          <Button
            onClick={(e) => handleActivate(e, preset)}
            className="w-full h-10 font-semibold tracking-wide text-base rounded-lg shadow-lg bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Play className="w-5 h-5 mr-2 fill-white" />
            Activate Aura Mode
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
