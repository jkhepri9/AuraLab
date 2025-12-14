import React, { useEffect, useRef, useState } from 'react';
import { db } from "@/lib/db";
import {
  useQuery,
  useMutation,
  useQueryClient
} from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Play,
  Trash2,
  MoreHorizontal,
  Edit,
  Edit3,
  Loader2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import PresetEditor from '@/components/presets/PresetEditor';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { useLocation, useNavigate } from 'react-router-dom';
import { useGlobalPlayer } from '../audio/GlobalPlayerContext';

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
}) {
  const [newName, setNewName] = useState(preset.name);

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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full rounded-xl overflow-hidden shadow-xl transition-transform duration-300 transform hover:scale-[1.01] relative cursor-pointer group bg-gradient-to-br from-slate-900 to-emerald-900"
      onClick={(e) => handleActivate(e, preset)}
      style={{
        backgroundImage: preset.imageUrl ? `url(${preset.imageUrl})` : undefined,
        backgroundSize: preset.imageUrl ? 'cover' : undefined,
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition-colors" />

      <div className="relative p-5 flex flex-col justify-between h-full">
        {/* Top row: name + menu */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 min-w-0">
            {isRenaming === preset.id ? (
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onBlur={handleRenameSubmit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameSubmit(e);
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white/70 hover:bg-white/10"
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
                  handleReorder(preset.id, 'up');
                }}
                disabled={index === 0}
                className="cursor-pointer hover:bg-zinc-700"
              >
                Move Up
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handleReorder(preset.id, 'down');
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

        {/* Description if present */}
        {preset.description && (
          <p className="mt-1 text-sm text-white/80 line-clamp-2">
            {preset.description}
          </p>
        )}

        {/* Bottom: Activate button */}
        <div className="mt-4">
          <Button
            onClick={(e) => handleActivate(e, preset)}
            className={cn(
              "w-full h-10 font-semibold tracking-wide text-base rounded-lg shadow-lg bg-emerald-600 hover:bg-emerald-700 text-white"
            )}
          >
            <Play className="w-5 h-5 mr-2 fill-white" />
            Activate Aura Mode
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

export default function AuraModes() {
  const player = useGlobalPlayer();
  const [view, setView] = useState('list'); // 'list' | 'edit' | 'create'
  const [editingPreset, setEditingPreset] = useState(null);
  const [isRenaming, setIsRenaming] = useState(null);
  const [autoPlay, setAutoPlay] = useState(false);

  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const hasAutoActivatedRef = useRef(false);

  const { data: presets = [], isLoading } = useQuery({
    queryKey: ['presets'],
    queryFn: () => db.presets.list()
  });

  const createPreset = useMutation({
    mutationFn: (data) => db.presets.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['presets']);
      toast.success("New Aura Mode created.");
      setView('list');
    }
  });

  const updatePreset = useMutation({
    mutationFn: ({ id, data }) => db.presets.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['presets']);
      toast.success("Aura Mode updated.");
      setView('list');
      setEditingPreset(null);
    }
  });

  const deletePreset = useMutation({
    mutationFn: (id) => db.presets.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['presets']);
      toast.success("Mode deleted.");
    }
  });

  const reorderPreset = useMutation({
    mutationFn: ({ id, direction }) => db.presets.reorder(id, direction),
    onSuccess: () => {
      queryClient.invalidateQueries(['presets']);
    }
  });

  const renamePreset = useMutation({
    mutationFn: ({ id, newName }) => db.presets.rename(id, newName),
    onSuccess: () => {
      queryClient.invalidateQueries(['presets']);
      toast.success("Mode renamed.");
    },
    onError: () => {
      toast.error("Failed to rename mode.");
    }
  });

  const handleSave = (data) => {
    if (editingPreset) {
      updatePreset.mutate({ id: editingPreset.id, data });
    } else {
      createPreset.mutate(data);
    }
  };

  const handleEditRequest = (preset) => {
    // Selecting a different preset (even just to edit) should stop any previous audio.
    player.stop();
    setEditingPreset(preset);
    setAutoPlay(false);
    setView('edit');
  };

  const handleDelete = (id) => {
    deletePreset.mutate(id);
  };

  const handleReorder = (id, direction) => {
    reorderPreset.mutate({ id, direction });
  };

  const handleCreateNew = () => {
    player.stop();
    setEditingPreset(null);
    setAutoPlay(false);
    setView('create');
  };

  const startRename = (id) => setIsRenaming(id);
  const finishRename = () => setIsRenaming(null);

  const handleActivate = (e, preset) => {
    e.stopPropagation();
    // Ensure only one active program at a time.
    player.stop();
    setEditingPreset(preset);
    setAutoPlay(true);
    setView('edit');
  };

  const handleEditorCancel = () => {
    setView('list');
    setEditingPreset(null);
    setAutoPlay(false);
  };

  // AUTO-ACTIVATE from Home: /AuraModes?activate=<presetId>
  useEffect(() => {
    if (isLoading) return;
    if (!presets || presets.length === 0) return;
    if (hasAutoActivatedRef.current) return;

    const params = new URLSearchParams(location.search);
    const activateId = params.get('activate');
    if (!activateId) return;

    const preset = presets.find((p) => p.id === activateId);
    if (!preset) return;

    hasAutoActivatedRef.current = true;
    setEditingPreset(preset);
    setAutoPlay(true);
    setView('edit');

    // Remove the query so it doesn't re-trigger later
    navigate(location.pathname, { replace: true });
  }, [isLoading, presets, location.search, location.pathname, navigate]);

  return (
    <div className="h-full w-full p-8 overflow-y-auto bg-black/80">
      {view === 'list' ? (
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-extrabold text-white tracking-tight">
              Aura Modes <span className="text-emerald-400">| Library</span>
            </h1>

            <Button
              onClick={handleCreateNew}
              className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 font-bold shadow-lg shadow-emerald-500/30"
            >
              <Plus className="w-5 h-5 mr-2" /> Create New
            </Button>
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
              <Button
                onClick={handleCreateNew}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                <Plus className="w-5 h-5 mr-2" /> Create Your First Mode
              </Button>
            </div>
          ) : (
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
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <PresetEditor
          // CRITICAL FIX: force remount so internal state cannot “stick” to the previous preset
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
