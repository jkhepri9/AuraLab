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
  ChevronDown,
  Loader2,
  Heart,
} from "lucide-react";

import { GOALS } from "./constants";
import { isZodiacPreset } from "./presetUtils";
import {
  CategoryItem,
  CompactCard,
  ModeCard,
  Rail,
  SectionHeader,
} from "./components";

// ✅ Pull registry collections for stable rendering + one-click label edits
import { PRESET_COLLECTIONS } from "@/data/presets";

export default function AuraModesListView({ pagePadBottom, ctx }) {
  const {
    // data
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
    byScenario, // ✅ NEW

    // view state
    query,
    setQuery,
    goalsOpen,
    setGoalsOpen,
    activeGoal,
    setActiveGoal,
    activeScenario, // ✅ NEW
    favoriteIds,

    // actions
    clearAllFilters,
    applyCollection,
    applyGoal,
    applyScenario, // ✅ NEW
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

  // ------------------------------------------------------------
  // ✅ Scroll-to-top-of-results after choosing a Goal (and close the panel)
  // ------------------------------------------------------------
  const scrollWrapRef = useRef(null);
  const pendingGoalScrollRef = useRef(false);

  const scrollResultsTop = (behavior = "smooth") => {
    try {
      const container = scrollWrapRef.current;
      const anchor = document.getElementById("auramodes-results-top");
      if (!anchor) return false;

      if (container && typeof container.scrollTo === "function") {
        const cRect = container.getBoundingClientRect();
        const aRect = anchor.getBoundingClientRect();
        const delta = aRect.top - cRect.top;

        const pad = 8;
        const top = Math.max(0, container.scrollTop + delta - pad);

        container.scrollTo({ top, behavior });
        return true;
      }

      if (typeof anchor.scrollIntoView === "function") {
        anchor.scrollIntoView({ behavior, block: "start" });
        return true;
      }

      return false;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    if (!pendingGoalScrollRef.current) return;

    if (activeGoal === "all") {
      pendingGoalScrollRef.current = false;
      return;
    }

    let tries = 0;

    const tick = () => {
      const ok = scrollResultsTop("smooth");
      if (ok) {
        // Hard-correct after layout settles (images/fonts/framer-motion can shift layout)
        setTimeout(() => scrollResultsTop("auto"), 250);
        setTimeout(() => scrollResultsTop("auto"), 650);

        pendingGoalScrollRef.current = false;
        return;
      }

      tries += 1;
      if (tries < 24) requestAnimationFrame(tick);
      else pendingGoalScrollRef.current = false;
    };

    requestAnimationFrame(tick);
  }, [activeGoal, isFiltered]);

  const chooseGoalFromPanel = (goalKey) => {
    setActiveGoal(goalKey);
    setGoalsOpen(false);

    if (goalKey === "all") {
      scrollToTop();
      return;
    }

    pendingGoalScrollRef.current = true;
  };

  // ------------------------------------------------------------
  // ✅ Collection subtitles (brief descriptions per section)
  // Uses stable registry keys (catalog/community/etc.)
  // ------------------------------------------------------------
  const collectionSubtitle = (collectionKey) => {
    if (collectionKey === "catalog") return "Hand-picked essentials to start strong.";
    if (collectionKey === "master_sequence") return "A numbered ascension ladder—progress through the gates.";
    if (collectionKey === "zodiac") return "Celestial sound-stacks tuned for each sign.";
    if (collectionKey === "grounded") return "Low-end foundation for calm, safety, and stability.";
    if (collectionKey === "community") return "Created by the community—discover new favorites.";
    if (collectionKey === "fan_favorites") return "Most-loved stacks—popular for a reason.";
    return "Explore this collection.";
  };

  // ------------------------------------------------------------
  // ✅ Deterministic sort helper (does NOT mutate input)
  // ------------------------------------------------------------
  const sortByOrder = (arr) =>
    (arr || [])
      .slice()
      .sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0));

  // ------------------------------------------------------------
  // ✅ Scenario bubbles (human-friendly label)
  // ------------------------------------------------------------
  const scenarioLabel = (s) => {
    const raw = String(s || "").trim();
    if (!raw) return "Scenario";
    const words = raw.replace(/[_-]+/g, " ").split(/\s+/).filter(Boolean);
    return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  };

  const scenarioList = useMemo(() => {
    const entries = Array.from((byScenario || new Map()).entries())
      .filter(([k, arr]) => k && k !== "all" && Array.isArray(arr) && arr.length > 0)
      .map(([k, arr]) => ({ key: k, count: arr.length }));

    // Most common scenarios first (Endel/Calm-like “top use cases” feel)
    entries.sort((a, b) => b.count - a.count || String(a.key).localeCompare(String(b.key)));

    return entries.slice(0, 14); // keep it clean; still scrollable
  }, [byScenario]);

  const ScenarioChip = ({ active, children, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 px-3 py-2 rounded-full text-sm font-semibold border transition",
        active
          ? "bg-emerald-500/20 border-emerald-400/40 text-emerald-200"
          : "bg-black/30 border-white/10 text-white/80 hover:bg-black/40 hover:text-white"
      )}
    >
      {children}
    </button>
  );

  const renderScenariosSection = () => (
    <div>
      <SectionHeader
        title="Scenarios"
        subtitle="Tap a scenario to filter fast."
        right={
          activeScenario !== "all" ? (
            <Button
              variant="ghost"
              className="text-emerald-300 hover:bg-white/5"
              onClick={() => applyScenario("all")}
            >
              Clear <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : null
        }
      />

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-5">
        <div className="flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
          <ScenarioChip active={activeScenario === "all"} onClick={() => applyScenario("all")}>
            All
          </ScenarioChip>

          {scenarioList.map((s) => (
            <ScenarioChip
              key={s.key}
              active={activeScenario === s.key}
              onClick={() => applyScenario(s.key)}
            >
              {scenarioLabel(s.key)}
            </ScenarioChip>
          ))}
        </div>

        <div className="text-xs text-white/50 mt-3">
          These are pulled from your presets’ <span className="text-white/70">scenarios</span> metadata.
        </div>
      </div>
    </div>
  );

  return (
    <div
      ref={scrollWrapRef}
      className={cn(
        // ✅ Background is owned by Layout.jsx for /AuraModes
        "min-h-[100svh] w-full p-6 md:p-8 overflow-y-auto bg-transparent",
        pagePadBottom
      )}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight">
              Aura Modes <span className="text-emerald-400">| Discover</span>
            </h1>
            <p className="text-white/60 mt-2">Find a mode fast. Or build your own.</p>
          </div>

          <Button
            onClick={handleCreateNew}
            className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 font-bold shadow-lg shadow-emerald-500/30"
          >
            <Plus className="w-5 h-5 mr-2" /> Create New
          </Button>
        </div>

        {/* Search + Filters */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-5 mb-4">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-white/50 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search modes (sleep, focus, ocean, theta...)"
                className="pl-9 bg-black/40 border-white/10 text-white placeholder:text-white/40"
              />
            </div>
          </div>

          {/* GOALS (collapsible) */}
          <div className="mt-4 rounded-xl border border-white/10 bg-black/20 overflow-hidden">
            <button
              type="button"
              onClick={() => setGoalsOpen((v) => !v)}
              className="w-full px-3 py-3 flex items-center justify-between gap-3"
            >
              <div className="min-w-0 text-left">
                <div className="text-xs font-extrabold text-white/70 uppercase tracking-wider">
                  Goals
                </div>
                <div className="text-sm font-semibold text-white truncate">
                  {activeGoalLabel}
                </div>
              </div>

              <motion.div
                animate={{ rotate: goalsOpen ? 180 : 0 }}
                transition={{ duration: 0.18 }}
                className="shrink-0 text-white/70"
              >
                <ChevronDown className="w-5 h-5" />
              </motion.div>
            </button>

            <AnimatePresence initial={false}>
              {goalsOpen ? (
                <motion.div
                  key="goals-panel"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <div className="px-3 pb-3 grid grid-cols-1 gap-2">
                    <CategoryItem
                      active={activeGoal === "all"}
                      onClick={() => chooseGoalFromPanel("all")}
                    >
                      All Goals
                    </CategoryItem>

                    {GOALS.map((g) => (
                      <CategoryItem
                        key={g.key}
                        active={activeGoal === g.key}
                        onClick={() => chooseGoalFromPanel(g.key)}
                      >
                        {g.label}
                      </CategoryItem>
                    ))}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          {isFiltered ? (
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                className="text-sm text-emerald-300 hover:text-emerald-200 font-semibold"
                onClick={clearAllFilters}
              >
                Clear
              </button>
            </div>
          ) : null}
        </div>

        {isLoading && allPresets.length === 0 ? (
          <div className="text-center py-20 text-gray-400 flex flex-col items-center">
            <Loader2 className="w-8 h-8 animate-spin mb-4" />
            Loading Aura Modes...
          </div>
        ) : allPresets.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-white/10 rounded-xl">
            <h3 className="text-2xl text-white mb-4">No Modes Yet</h3>
            <p className="text-gray-400 mb-6">
              Create your first Aura Mode to begin crafting custom sonic environments.
            </p>
            <Button
              onClick={handleCreateNew}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              <Plus className="w-5 h-5 mr-2" /> Create Your First Mode
            </Button>
          </div>
        ) : isFiltered ? (
          <div>
            <div id="auramodes-results-top" />

            <SectionHeader
              title={`Results (${filtered.length})`}
              subtitle="Filtered by your selections."
            />

            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-white/70">
                No modes found. Try a different search term.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filtered.map((preset, index) => (
                  <ModeCard
                    key={preset.id}
                    preset={preset}
                    handleActivate={handleActivate}
                    handleEditRequest={handleEditRequest}
                    handleDelete={handleDelete}
                    handleReorder={handleReorder}
                    renamePreset={renamePreset}
                    index={index}
                    totalPresets={filtered.length}
                    isRenaming={isRenaming}
                    startRename={startRename}
                    finishRename={finishRename}
                    isFavorite={favoriteIds.has(preset.id)}
                    onToggleFavorite={toggleFavorite}
                    isLocked={isZodiacPreset(preset)}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {/* Continue + Recent */}
            {continuePreset ? (
              <div>
                <SectionHeader title="Continue" subtitle="Pick up where you left off." />
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-5">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-white/60 text-sm font-semibold">Last played</div>
                      <div className="text-2xl font-extrabold text-white truncate">
                        {continuePreset.name}
                      </div>
                      {continuePreset.description ? (
                        <div className="text-white/70 mt-1 line-clamp-2">
                          {continuePreset.description}
                        </div>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center"
                        onClick={() => handleCompactActivate(continuePreset)}
                      >
                        Play
                      </Button>
                      <Button
                        variant="outline"
                        className="bg-black/30 border-white/10 text-white hover:bg-black/40"
                        onClick={() => handleCompactOpen(continuePreset)}
                      >
                        Details <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </div>

                {recents.length > 1 ? (
                  <div className="mt-5">
                    <SectionHeader title="Recent" subtitle="Fast re-entry." />
                    <Rail>
                      {recents.slice(0, 12).map(({ preset }) => (
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
                ) : null}
              </div>
            ) : null}

            {/* Favorites */}
            <div>
              <SectionHeader title="Favorites" subtitle="Your go-to modes." />
              {favorites.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">
                  Tap the <Heart className="inline w-4 h-4 mx-1 text-white/70" /> on
                  any mode to save it here.
                </div>
              ) : (
                <Rail>
                  {favorites.slice(0, 12).map((preset) => (
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
              )}
            </div>

            {/* Collection rails (registry-driven, back-compatible grouping) */}
            {PRESET_COLLECTIONS.map((c) => {
              const raw =
                byCollection.get(c.legacyLabel) ||
                byCollection.get(c.displayedLabel) ||
                [];

              if (!raw.length) return null;

              const list = sortByOrder(raw);

              // ✅ Insert Scenarios section immediately after Grounded Aura Mode rail
              const isGrounded = c.key === "grounded";

              return (
                <React.Fragment key={c.key}>
                  <div>
                    <SectionHeader
                      title={c.displayedLabel}
                      subtitle={collectionSubtitle(c.key)}
                      right={
                        <Button
                          variant="ghost"
                          className="text-emerald-300 hover:bg-white/5"
                          onClick={() => applyCollection(c.legacyLabel)}
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

                  {isGrounded ? renderScenariosSection() : null}
                </React.Fragment>
              );
            })}

            {/* Goal rails */}
            <div className="space-y-6">
              {GOALS.map((g) => {
                const list = byGoal.get(g.key) || [];
                if (!list.length) return null;
                return (
                  <div key={g.key}>
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
                );
              })}
            </div>

            {/* Mode Presets grid */}
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
                    isLocked={false}
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
