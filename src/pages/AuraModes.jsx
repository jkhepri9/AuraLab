// src/pages/AuraModes.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { db } from "@/lib/db";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Play,
  Trash2,
  MoreHorizontal,
  Edit,
  Edit3,
  Loader2,
  Heart,
  Search,
  ArrowRight,
  ArrowUpDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import PresetEditor from "@/components/presets/PresetEditor";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { useLocation, useNavigate } from "react-router-dom";
import { useGlobalPlayer } from "../audio/GlobalPlayerContext";

// ------------------------------------------------------------
// Local UX persistence (no DB changes required)
// ------------------------------------------------------------
const RECENTS_KEY = "auralab_recent_modes_v1"; // [{ id, t }]
const FAVS_KEY = "auralab_favorite_modes_v1"; // [id]

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}
function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}
function bumpRecent(id) {
  const list = readJSON(RECENTS_KEY, []);
  const next = [{ id, t: Date.now() }, ...list.filter((x) => x?.id !== id)];
  writeJSON(RECENTS_KEY, next.slice(0, 24));
}
function readFavs() {
  return new Set(readJSON(FAVS_KEY, []));
}
function writeFavs(set) {
  writeJSON(FAVS_KEY, Array.from(set));
}

// ------------------------------------------------------------
// Canonical goals + collections
// ------------------------------------------------------------
const GOALS = [
  { key: "sleep", label: "Sleep" },
  { key: "focus", label: "Focus" },
  { key: "calm", label: "Calm" },
  { key: "energy", label: "Energy" },
  { key: "meditate", label: "Meditate" },
  { key: "recovery", label: "Recovery" },
];

const COLLECTIONS = [
  { key: "all", label: "All" },
  { key: "Featured", label: "Featured" },
  { key: "Community", label: "Community" },
  { key: "Fan Favorites", label: "Fan Favorites" },
  { key: "Custom", label: "Custom" },
];

function normalizeText(s) {
  return String(s || "").toLowerCase();
}

function getCollection(preset) {
  return preset?.collection || "Custom";
}

function getGoals(preset) {
  // Canonical metadata-driven path
  if (Array.isArray(preset?.goals) && preset.goals.length) {
    return preset.goals.map((g) => String(g).toLowerCase());
  }
  // Backward-compat (older presets / user-created)
  if (preset?.goal) return [String(preset.goal).toLowerCase()];
  return [];
}

// ------------------------------------------------------------
// UI: Components
// ------------------------------------------------------------
function SectionHeader({ title, subtitle, right }) {
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

function Chip({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-full text-sm font-semibold border transition",
        active
          ? "bg-emerald-600 text-white border-emerald-500/60"
          : "bg-white/5 text-white/75 border-white/10 hover:bg-white/10"
      )}
    >
      {children}
    </button>
  );
}

function Rail({ children }) {
  return <div className="flex gap-3 overflow-x-auto pb-2 pr-2">{children}</div>;
}

function CompactCard({ preset, isFavorite, onToggleFavorite, onActivate, onOpen }) {
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

// ------------------------------------------------------------
// Full grid card (with menu + rename + reorder)
// ------------------------------------------------------------
function ModeCard({
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
}) {
  const [newName, setNewName] = useState(preset.name);

  useEffect(() => {
    setNewName(preset.name);
  }, [preset.id, preset.name]);

  const handleRenameSubmit = (e) => {
    e.stopPropagation();
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
                  startRename(preset.id);
                }}
                title="Click to rename"
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
                  handleReorder(preset.id, "up");
                }}
                disabled={index === 0}
                className="cursor-pointer hover:bg-zinc-700"
              >
                Move Up
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handleReorder(preset.id, "down");
                }}
                disabled={index === totalPresets - 1}
                className="cursor-pointer hover:bg-zinc-700"
              >
                Move Down
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  startRename(preset.id);
                }}
                className="cursor-pointer hover:bg-zinc-700"
              >
                <Edit3 className="w-4 h-4 mr-2" /> Rename
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(preset.id);
                }}
                className="cursor-pointer text-red-400 hover:bg-red-900/50"
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
          <Button className="w-full h-10 font-semibold tracking-wide text-base rounded-lg shadow-lg bg-emerald-600 hover:bg-emerald-700 text-white">
            <Play className="w-5 h-5 mr-2 fill-white" />
            Activate Aura Mode
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// ------------------------------------------------------------
// Page
// ------------------------------------------------------------
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
  const [sortBy, setSortBy] = useState("custom"); // custom | recent | az

  const [favoriteIds, setFavoriteIds] = useState(() => readFavs());

  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const hasAutoActivatedRef = useRef(false);

  const { data: presets = [], isLoading } = useQuery({
    queryKey: ["presets"],
    queryFn: () => db.presets.list(),
  });

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

  const handleSave = (data) => {
    if (editingPreset) updatePreset.mutate({ id: editingPreset.id, data });
    else createPreset.mutate(data);
  };

  const handleEditRequest = (preset) => {
    player.stop();
    setEditingPreset(preset);
    setAutoPlay(false);
    setView("edit");
  };

  const handleDelete = (id) => deletePreset.mutate(id);
  const handleReorder = (id, direction) => reorderPreset.mutate({ id, direction });
  const handleCreateNew = () => {
    player.stop();
    setEditingPreset(null);
    setAutoPlay(false);
    setView("create");
  };

  const startRename = (id) => setIsRenaming(id);
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
    if (isLoading) return;
    if (!presets || presets.length === 0) return;
    if (hasAutoActivatedRef.current) return;

    const params = new URLSearchParams(location.search);
    const activateId = params.get("activate");
    if (!activateId) return;

    const preset = presets.find((p) => p.id === activateId);
    if (!preset) return;

    hasAutoActivatedRef.current = true;
    bumpRecent(preset.id);
    setEditingPreset(preset);
    setAutoPlay(true);
    setView("edit");

    navigate(location.pathname, { replace: true });
  }, [isLoading, presets, location.search, location.pathname, navigate]);

  // Sticky-player-aware padding
  const hasStickyPlayer = Boolean(player?.currentPlayingPreset);
  const pagePadBottom = hasStickyPlayer
    ? "pb-[calc(12rem+env(safe-area-inset-bottom))] md:pb-8"
    : "pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-8";

  // ------------------------------------------------------------
  // Derived: maps, recents, favorites, filters, indices
  // ------------------------------------------------------------
  const presetById = useMemo(() => {
    const map = new Map();
    for (const p of presets) map.set(p.id, p);
    return map;
  }, [presets]);

  const recents = useMemo(() => {
    const list = readJSON(RECENTS_KEY, []);
    const resolved = [];
    for (const item of list) {
      const p = presetById.get(item?.id);
      if (p) resolved.push({ preset: p, t: item?.t || 0 });
    }
    return resolved;
  }, [presetById]);

  const continuePreset = recents[0]?.preset || null;

  const favorites = useMemo(() => presets.filter((p) => favoriteIds.has(p.id)), [presets, favoriteIds]);

  const byCollection = useMemo(() => {
    const map = new Map();
    for (const c of COLLECTIONS) {
      if (c.key !== "all") map.set(c.key, []);
    }
    for (const p of presets) {
      const c = getCollection(p);
      if (!map.has(c)) map.set(c, []);
      map.get(c).push(p);
    }
    return map;
  }, [presets]);

  const byGoal = useMemo(() => {
    const map = new Map();
    for (const g of GOALS) map.set(g.key, []);
    map.set("uncategorized", []);

    for (const p of presets) {
      const goals = getGoals(p);
      if (!goals.length) {
        map.get("uncategorized").push(p);
        continue;
      }
      for (const g of goals) {
        if (!map.has(g)) map.set(g, []);
        map.get(g).push(p);
      }
    }
    return map;
  }, [presets]);

  const filtered = useMemo(() => {
    const q = normalizeText(query).trim();

    let list = presets;

    if (activeCollection !== "all") {
      list = list.filter((p) => getCollection(p) === activeCollection);
    }

    if (activeGoal !== "all") {
      const set = new Set((byGoal.get(activeGoal) || []).map((p) => p.id));
      list = list.filter((p) => set.has(p.id));
    }

    if (q) {
      list = list.filter((p) => {
        const meta = [
          p.name,
          p.description,
          getCollection(p),
          ...(Array.isArray(p.tags) ? p.tags : []),
          ...(Array.isArray(p.scenarios) ? p.scenarios : []),
          ...(Array.isArray(p.styles) ? p.styles : []),
          ...(Array.isArray(p.goals) ? p.goals : []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return meta.includes(q);
      });
    }

    if (sortBy === "az") {
      list = [...list].sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
    } else if (sortBy === "recent") {
      const recentMap = new Map(recents.map((r) => [r.preset.id, r.t]));
      list = [...list].sort((a, b) => (recentMap.get(b.id) || 0) - (recentMap.get(a.id) || 0));
    }

    return list;
  }, [presets, query, activeGoal, activeCollection, sortBy, byGoal, recents]);

  const isFiltered = Boolean(normalizeText(query).trim()) || activeGoal !== "all" || activeCollection !== "all";

  // ------------------------------------------------------------
  // Render
  // ------------------------------------------------------------
  return (
    <div className={cn("h-full w-full p-6 md:p-8 overflow-y-auto bg-black/80", pagePadBottom)}>
      {view === "list" ? (
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

          {/* Search + Sort */}
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

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="bg-black/30 border-white/10 text-white hover:bg-black/40">
                    <ArrowUpDown className="w-4 h-4 mr-2" />
                    Sort: {sortBy === "custom" ? "Library" : sortBy === "recent" ? "Recent" : "A–Z"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-44 bg-zinc-900 border-zinc-700 text-white">
                  <DropdownMenuItem onClick={() => setSortBy("custom")} className="cursor-pointer hover:bg-zinc-700">
                    Library Order
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("recent")} className="cursor-pointer hover:bg-zinc-700">
                    Recent
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("az")} className="cursor-pointer hover:bg-zinc-700">
                    A–Z
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Collections chips */}
            <div className="flex flex-wrap gap-2 mt-4">
              {COLLECTIONS.map((c) => (
                <Chip
                  key={c.key}
                  active={activeCollection === c.key}
                  onClick={() => setActiveCollection(c.key)}
                >
                  {c.label}
                </Chip>
              ))}
            </div>

            {/* Goals chips */}
            <div className="flex flex-wrap gap-2 mt-3">
              <Chip active={activeGoal === "all"} onClick={() => setActiveGoal("all")}>
                All Goals
              </Chip>
              {GOALS.map((g) => (
                <Chip key={g.key} active={activeGoal === g.key} onClick={() => setActiveGoal(g.key)}>
                  {g.label}
                </Chip>
              ))}

              {isFiltered && (
                <button
                  type="button"
                  className="ml-auto text-sm text-emerald-300 hover:text-emerald-200 font-semibold"
                  onClick={() => {
                    setQuery("");
                    setActiveGoal("all");
                    setActiveCollection("all");
                    setSortBy("custom");
                  }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-20 text-gray-400 flex flex-col items-center">
              <Loader2 className="w-8 h-8 animate-spin mb-4" />
              Loading Aura Modes...
            </div>
          ) : presets.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-white/10 rounded-xl">
              <h3 className="text-2xl text-white mb-4">No Modes Yet</h3>
              <p className="text-gray-400 mb-6">
                Create your first Aura Mode to begin crafting custom sonic environments.
              </p>
              <Button onClick={handleCreateNew} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                <Plus className="w-5 h-5 mr-2" /> Create Your First Mode
              </Button>
            </div>
          ) : isFiltered ? (
            <div>
              <SectionHeader title={`Results (${filtered.length})`} subtitle="Filtered by your selections." />
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
                        <div className="text-2xl font-extrabold text-white truncate">{continuePreset.name}</div>
                        {continuePreset.description ? (
                          <div className="text-white/70 mt-1 line-clamp-2">{continuePreset.description}</div>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold" onClick={() => handleCompactActivate(continuePreset)}>
                          <Play className="w-4 h-4 mr-2 fill-white" />
                          Play
                        </Button>
                        <Button variant="outline" className="bg-black/30 border-white/10 text-white hover:bg-black/40" onClick={() => handleCompactOpen(continuePreset)}>
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
                    Tap the <Heart className="inline w-4 h-4 mx-1 text-white/70" /> on any mode to save it here.
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

              {/* Collection rails */}
              {["Featured", "Community", "Fan Favorites"].map((c) => {
                const list = byCollection.get(c) || [];
                if (!list.length) return null;
                return (
                  <div key={c}>
                    <SectionHeader
                      title={c}
                      subtitle={`Curated from ${c}.`}
                      right={
                        <Button
                          variant="ghost"
                          className="text-emerald-300 hover:bg-white/5"
                          onClick={() => setActiveCollection(c)}
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
                            onClick={() => setActiveGoal(g.key)}
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

              {/* All Modes management grid */}
              <div>
                <SectionHeader title="All Aura Modes" subtitle="Your full library (edit, reorder, manage)." />
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
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <PresetEditor
          key={`${view}:${editingPreset?.id || "new"}`}
          initialPreset={editingPreset}
          onSave={handleSave}
          onCancel={handleEditorCancel}
          autoPlay={autoPlay}
        />
      )}
    </div>
  );
}
