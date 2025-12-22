// src/pages/AuraModes.jsx

import React, { useEffect, useMemo, useRef, useState } from "react";
import { db } from "@/lib/db";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PresetEditor from "@/components/presets/PresetEditor";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useLocation, useNavigate } from "react-router-dom";
import { useGlobalPlayer } from "../audio/GlobalPlayerContext";

// Built-in library
import zodiacPresets from "@/data/presets/zodiacPresets";

// Refactor modules
import AuraModesListView from "./auraModes/AuraModesListView";
import { readFavs, writeFavs } from "./auraModes/storage";
import { dedupeById, isZodiacPreset } from "./auraModes/presetUtils";
import { useAuraModesLibrary } from "./auraModes/hooks";

export default function AuraModes() {
  const player = useGlobalPlayer();

  const [view, setView] = useState("list"); // 'list' | 'edit' | 'create'
  const [editingPreset, setEditingPreset] = useState(null);
  const [isRenaming, setIsRenaming] = useState(null);
  const [autoPlay, setAutoPlay] = useState(false);

  // Discover state
  const [query, setQuery] = useState("");
  const [activeGoal, setActiveGoal] = useState("all");
  const [activeCollection, setActiveCollection] = useState("all");
  const [activeScenario, setActiveScenario] = useState("all"); // ✅ NEW
  const [sortBy, setSortBy] = useState("custom"); // custom | recent | az

  // ✅ Collapsed by default (user must toggle open)
  const [goalsOpen, setGoalsOpen] = useState(false);

  const [favoriteIds, setFavoriteIds] = useState(() => readFavs());

  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const hasAutoActivatedRef = useRef(false);

  const { data: presets = [], isLoading } = useQuery({
    queryKey: ["presets"],
    queryFn: () => db.presets.list(),
  });

  // Combined library: Zodiac (built-in) + DB presets
  const allPresets = useMemo(() => {
    return dedupeById([...(zodiacPresets || []), ...(presets || [])]);
  }, [presets]);

  const createPreset = useMutation({
    mutationFn: (data) => db.presets.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(["presets"]);
      toast.success("New Aura Mode created.");
      setView("list");
    },
  });

  const updatePreset = useMutation({
    mutationFn: ({ id, data }) => db.presets.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["presets"]);
      toast.success("Aura Mode updated.");
      setView("list");
      setEditingPreset(null);
    },
  });

  const deletePreset = useMutation({
    mutationFn: (id) => db.presets.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["presets"]);
      toast.success("Mode deleted.");
    },
  });

  const reorderPreset = useMutation({
    mutationFn: ({ id, direction }) => db.presets.reorder(id, direction),
    onSuccess: () => queryClient.invalidateQueries(["presets"]),
  });

  const renamePreset = useMutation({
    mutationFn: ({ id, newName }) => db.presets.rename(id, newName),
    onSuccess: () => {
      queryClient.invalidateQueries(["presets"]);
      toast.success("Mode renamed.");
    },
    onError: () => toast.error("Failed to rename mode."),
  });

  const {
    recents,
    continuePreset,
    favorites,
    byCollection,
    byGoal,
    byScenario, // ✅ NEW
    filtered,
    isFiltered,
    bumpRecent,
  } = useAuraModesLibrary({
    allPresets,
    favoriteIds,
    query,
    activeGoal,
    activeCollection,
    activeScenario, // ✅ NEW
    sortBy,
  });

  const sanitizeCreatePayload = (data) => {
    const out = { ...(data || {}) };
    if ("id" in out) delete out.id;
    if (out.collection === "Zodiac") out.collection = "Custom";
    return out;
  };

  const handleSave = (data) => {
    // If editing a Zodiac preset, save as a copy (do not update built-in).
    if (editingPreset && isZodiacPreset(editingPreset)) {
      const payload = sanitizeCreatePayload({
        ...data,
        name: data?.name ? data.name : `${editingPreset.name} (Copy)`,
        collection: "Custom",
      });

      createPreset.mutate(payload, {
        onSuccess: () => {
          queryClient.invalidateQueries(["presets"]);
          toast.success("Saved as a new Custom copy.");
          setView("list");
          setEditingPreset(null);
          setAutoPlay(false);
        },
        onError: () => toast.error("Failed to save copy."),
      });
      return;
    }

    if (editingPreset) updatePreset.mutate({ id: editingPreset.id, data });
    else createPreset.mutate(data);
  };

  const handleEditRequest = (preset) => {
    player.stop();
    setEditingPreset(preset);
    setAutoPlay(false);
    setView("edit");
  };

  const handleDelete = (id) => {
    const p = allPresets.find((x) => x?.id === id);
    if (isZodiacPreset(p)) {
      toast.info("This is a built-in preset and can’t be deleted.");
      return;
    }
    deletePreset.mutate(id);
  };

  const handleReorder = (id, direction) => {
    const p = allPresets.find((x) => x?.id === id);
    if (isZodiacPreset(p)) {
      toast.info("This is a built-in preset and can’t be reordered.");
      return;
    }
    reorderPreset.mutate({ id, direction });
  };

  // ✅ Create New must go to Aura Studio (AuraEditor.jsx route)
  const handleCreateNew = () => {
    try {
      player.stop();
    } catch {
      // ignore
    }
    navigate("/AuraEditor");
  };

  const startRename = (id) => {
    const p = allPresets.find((x) => x?.id === id);
    if (isZodiacPreset(p)) {
      toast.info("This is a built-in preset. Save a copy to customize.");
      return;
    }
    setIsRenaming(id);
  };

  const finishRename = () => setIsRenaming(null);

  const handleActivate = (e, preset) => {
    e.stopPropagation();
    player.stop();
    bumpRecent(preset.id);
    setEditingPreset(preset);
    setAutoPlay(true);
    setView("edit");
  };

  const handleCompactActivate = (preset) => {
    player.stop();
    bumpRecent(preset.id);
    setEditingPreset(preset);
    setAutoPlay(true);
    setView("edit");
  };

  const handleCompactOpen = (preset) => {
    player.stop();
    setEditingPreset(preset);
    setAutoPlay(false);
    setView("edit");
  };

  const handleEditorCancel = () => {
    setView("list");
    setEditingPreset(null);
    setAutoPlay(false);
  };

  const toggleFavorite = (id) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      writeFavs(next);
      return next;
    });
  };

  // AUTO-ACTIVATE from Home: /AuraModes?activate=<presetId>
  useEffect(() => {
    if (hasAutoActivatedRef.current) return;

    const params = new URLSearchParams(location.search);
    const activateId = params.get("activate");
    if (!activateId) return;

    const preset = allPresets.find((p) => p.id === activateId);
    if (!preset) return;

    hasAutoActivatedRef.current = true;
    bumpRecent(preset.id);
    setEditingPreset(preset);
    setAutoPlay(true);
    setView("edit");

    navigate(location.pathname, { replace: true });
  }, [allPresets, location.search, location.pathname, navigate, bumpRecent]);

  // Sticky-player-aware padding
  const hasStickyPlayer = Boolean(player?.currentPlayingPreset);
  const pagePadBottom = hasStickyPlayer
    ? "pb-[calc(12rem+env(safe-area-inset-bottom))] md:pb-8"
    : "pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-8";

  const scrollToTop = () => {
    try {
      const el = document?.querySelector("main") || null;
      if (el && typeof el.scrollTo === "function") el.scrollTo({ top: 0, behavior: "smooth" });
      else window?.scrollTo?.({ top: 0, behavior: "smooth" });
    } catch {
      // ignore
    }
  };

  const applyCollection = (c) => {
    setActiveCollection(c);
    setActiveGoal("all");
    setActiveScenario("all"); // ✅ reset scenario when picking a collection
    setQuery("");
    setSortBy("custom");
    scrollToTop();
  };

  const applyGoal = (g) => {
    setActiveGoal(g);
    setActiveCollection("all");
    setActiveScenario("all"); // ✅ reset scenario when picking a goal
    setQuery("");
    setSortBy("custom");
    scrollToTop();
  };

  const applyScenario = (s) => {
    setActiveScenario(s);
    setActiveGoal("all");
    setActiveCollection("all");
    setQuery("");
    setSortBy("custom");
    scrollToTop();
  };

  const clearAllFilters = () => {
    setQuery("");
    setActiveGoal("all");
    setActiveCollection("all");
    setActiveScenario("all"); // ✅ NEW
    setSortBy("custom");
    scrollToTop();
  };

  if (view !== "list") {
    return (
      <div
        className={cn(
          "h-full w-full p-6 md:p-8 overflow-y-auto bg-[url('/bg/auramodes.jpg')] bg-cover bg-center",
          pagePadBottom
        )}
      >
        <PresetEditor
          key={`${view}:${editingPreset?.id || "new"}`}
          initialPreset={editingPreset}
          onSave={handleSave}
          onCancel={handleEditorCancel}
          autoPlay={autoPlay}
        />
      </div>
    );
  }

  return (
    <AuraModesListView
      pagePadBottom={pagePadBottom}
      ctx={{
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

        query,
        setQuery,
        sortBy,
        setSortBy,
        goalsOpen,
        setGoalsOpen,
        activeGoal,
        setActiveGoal,
        activeScenario, // ✅ NEW
        favoriteIds,

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
      }}
    />
  );
}
