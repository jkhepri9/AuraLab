// src/pages/auraModes/AuraModesListView.jsx

import React, { useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  ArrowRight,
  ArrowUpDown,
  ChevronDown,
  Loader2,
  Heart,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { GOALS } from "./constants";
import { isZodiacPreset } from "./presetUtils";
import { CategoryItem, CompactCard, ModeCard, Rail, SectionHeader } from "./components";

export default function AuraModesListView({ pagePadBottom, ctx }) {
  const {
    isLoading,
    presets,
    allPresets,
    filtered,
    isFiltered,
    continuePreset,
    recents,
    favorites,
    byCollection,
    byGoal,

    query,
    setQuery,
    sortBy,
    setSortBy,
    goalsOpen,
    setGoalsOpen,
    activeGoal,
    setActiveGoal,
    favoriteIds,

    clearAllFilters,
    applyCollection,
    applyGoal,
    handleCreateNew,
    handleActivate,
    handleEditRequest,
    handleDelete,
    handleReorder,
    renamePreset,
    isRenaming,
    startRename,
    finishRename,
    toggleFavorite,
    handleCompactActivate,
    handleCompactOpen,
    scrollToTop,
  } = ctx;

  const activeGoalLabel = useMemo(() => {
    if (activeGoal === "all") return "All Goals";
    const found = GOALS.find((g) => g.key === activeGoal);
    return found?.label || "Goals";
  }, [activeGoal]);

  const scrollWrapRef = useRef(null);

  return (
    <div
      ref={scrollWrapRef}
      className={cn("h-full w-full p-6 md:p-8 overflow-y-auto bg-black/80", pagePadBottom)}
    >
      <div className="max-w-6xl mx-auto">

        {/* HEADER / SEARCH / FILTERS */}
        {/* --- unchanged --- */}

        {isLoading && allPresets.length === 0 ? (
          <div className="text-center py-20 text-gray-400 flex flex-col items-center">
            <Loader2 className="w-8 h-8 animate-spin mb-4" />
            Loading Aura Modes...
          </div>
        ) : isFiltered ? (
          /* --- filtered view unchanged --- */
          <></>
        ) : (
          <div className="space-y-8">

            {/* Continue + Favorites + Collections unchanged */}

            {/* GOAL RAILS */}
            <div className="space-y-6">
              {GOALS.map((g) => {
                const list = byGoal.get(g.key) || [];
                if (!list.length) return null;

                return (
                  <React.Fragment key={g.key}>
                    <div>
                      <SectionHeader
                        title={g.label}
                        subtitle={`Modes for ${g.label.toLowerCase()}.`}
                        right={
                          <Button
                            variant="ghost"
                            className="text-emerald-300 hover:bg-white/5"
                            onClick={() => applyGoal(g.key)}
                          >
                            View all <ArrowRight className="w-4 h-4 ml-1" />
                          </Button>
                        }
                      />
                      <Rail>
                        {list.slice(0, 12).map((preset) => (
                          <CompactCard
                            key={preset.id}
                            preset={preset}
                            isFavorite={favoriteIds.has(preset.id)}
                            onToggleFavorite={toggleFavorite}
                            onActivate={handleCompactActivate}
                            onOpen={handleCompactOpen}
                          />
                        ))}
                      </Rail>
                    </div>

                    {/* ✅ INSERT GROUNDED AURA MODE DIRECTLY AFTER RECOVERY */}
                    {g.key === "recovery" && (() => {
                      const grounded = byCollection.get("Grounded Aura Mode") || [];
                      if (!grounded.length) return null;

                      return (
                        <div className="mt-8">
                          <SectionHeader
                            title="Grounded Aura Mode"
                            subtitle="Low-end foundation for grounding and nervous system regulation."
                            right={
                              <Button
                                variant="ghost"
                                className="text-emerald-300 hover:bg-white/5"
                                onClick={() => applyCollection("Grounded Aura Mode")}
                              >
                                View all <ArrowRight className="w-4 h-4 ml-1" />
                              </Button>
                            }
                          />
                          <Rail>
                            {grounded.slice(0, 12).map((preset) => (
                              <CompactCard
                                key={preset.id}
                                preset={preset}
                                isFavorite={favoriteIds.has(preset.id)}
                                onToggleFavorite={toggleFavorite}
                                onActivate={handleCompactActivate}
                                onOpen={handleCompactOpen}
                              />
                            ))}
                          </Rail>
                        </div>
                      );
                    })()}
                  </React.Fragment>
                );
              })}
            </div>

            {/* MODE PRESETS GRID (unchanged) */}
            <div>
              <SectionHeader
                title="Mode Presets"
                subtitle="Select from these Mode Presets to quickly start a session."
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {presets.map((preset, index) => (
                  <ModeCard
                    key={preset.id}
                    preset={preset}
                    handleActivate={handleActivate}
                    handleEditRequest={handleEditRequest}
                    handleDelete={handleDelete}
                    handleReorder={handleReorder}
                    renamePreset={renamePreset}
                    index={index}
                    totalPresets={presets.length}
                    isRenaming={isRenaming}
                    startRename={startRename}
                    finishRename={finishRename}
                    isFavorite={favoriteIds.has(preset.id)}
                    onToggleFavorite={toggleFavorite}
                    isLocked={isZodiacPreset(preset)}
                  />
                ))}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
