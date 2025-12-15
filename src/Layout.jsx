import React from 'react';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from './components/ui/button';
import { RefreshCw, Layers, Pause, Play, RotateCcw, Square } from 'lucide-react';
import { cn } from './lib/utils';
import { toast } from 'sonner';

function GlobalAudioPlayer({ currentPlayingPreset, isPlaying, onStop, onTogglePlayPause, onBack }) {
  const navigate = useNavigate();

  if (!currentPlayingPreset) return null;

  const { id, name, color, imageUrl } = currentPlayingPreset;

  const isInternalTrack = typeof id === "string" && id.startsWith("__");
  const isStudioTrack = id === "__studio__";

  const modesLink = !isInternalTrack && id
    ? `/AuraModes?activate=${encodeURIComponent(id)}`
    : "/AuraModes";

  const handleOpen = () => {
    // ✅ FIX: If the current session is Aura Studio playback, always navigate
    // straight back into Aura Studio (not NowPlaying / PresetEditor).
    if (isStudioTrack) {
      navigate("/AuraEditor");
      return;
    }
    navigate("/NowPlaying");
  };

  return (
    <div className="fixed left-0 right-0 z-40 p-4 bottom-[calc(4rem+env(safe-area-inset-bottom))] md:bottom-0 w-screen max-w-[100vw] overflow-x-hidden">
      <div className="relative overflow-hidden border border-white/10 rounded-2xl shadow-2xl max-w-full">
        {imageUrl && (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${imageUrl})` }}
          />
        )}

        <div
          className={cn(
            "absolute inset-0",
            imageUrl ? "bg-black/55 backdrop-blur-md" : "bg-zinc-800/90 backdrop-blur-md"
          )}
        />

        <div
          className="absolute inset-0 opacity-70"
          style={{
            background: color?.includes('gradient')
              ? color
              : `linear-gradient(135deg, ${color || '#10b981'}, #000000)`,
          }}
        />

        <div className="relative p-4 flex items-center justify-between">
          {/* CLICKABLE LEFT AREA: opens current session */}
          <button
            type="button"
            className="flex items-center space-x-3 min-w-0 text-left hover:opacity-95 active:opacity-90"
            onClick={handleOpen}
            title="Open current session"
          >
            <Layers className="w-6 h-6 text-white/80 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-white leading-none">
                NOW PLAYING
              </span>
              <span className="text-lg font-extrabold text-white tracking-tight truncate">
                {name}
              </span>
            </div>
          </button>

          <div className="flex items-center space-x-3 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="text-white/80 hover:text-white hover:bg-white/10"
              onClick={onBack}
              title="Back (Restart)"
            >
              <RotateCcw className="w-5 h-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="text-white/80 hover:text-white hover:bg-white/10"
              onClick={onTogglePlayPause}
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </Button>

            {!isInternalTrack && (
              <Link to={modesLink}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white/80 hover:text-white hover:bg-white/10"
                  onClick={() => toast.success(`Opening ${name} in Aura Modes.`)}
                  title="Open in Aura Modes"
                >
                  <RefreshCw className="w-5 h-5" />
                </Button>
              </Link>
            )}

            <Button
              onClick={onStop}
              className="bg-white/90 text-black hover:bg-white font-bold h-10 w-24 shadow-md"
            >
              <Square className="w-4 h-4 mr-2 fill-current" /> Stop
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Layout({
  children,
  currentPlayingPreset,
  isPlaying,
  onStop,
  onTogglePlayPause,
  onBack,
}) {
  const location = useLocation();

  // UX RULE:
  // - If user entered Aura Studio while a Mode is playing, keep the sticky player visible.
  // - Once Aura Studio claims playback (__studio__), hide the sticky player while inside Aura Studio.
  const hideStickyInStudio =
    location.pathname === "/AuraEditor" &&
    currentPlayingPreset?.id === "__studio__";

  const showStickyPlayer = Boolean(currentPlayingPreset) && !hideStickyInStudio;

  const mainPadBottom = showStickyPlayer
    ? 'pb-[calc(11rem+env(safe-area-inset-bottom))] md:pb-0'
    : 'pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0';

  return (
    <div
      className="
        min-h-screen bg-zinc-950 text-white relative
        w-screen max-w-[100vw] overflow-x-hidden
        touch-pan-y
      "
      style={{ overscrollBehaviorX: 'none' }}
    >
      <div
        className="fixed inset-0 pointer-events-none opacity-20 w-screen max-w-[100vw] overflow-x-hidden"
        style={{
          background: 'radial-gradient(circle at top, #ffffff33, transparent 75%)',
        }}
      />

      <Navbar />

      <main className={cn('z-20 relative w-screen max-w-[100vw] overflow-x-hidden', mainPadBottom)}>
        {children}
      </main>

      {showStickyPlayer && (
        <GlobalAudioPlayer
          currentPlayingPreset={currentPlayingPreset}
          isPlaying={isPlaying}
          onStop={onStop}
          onTogglePlayPause={onTogglePlayPause}
          onBack={onBack}
        />
      )}

      <BottomNav />
    </div>
  );
}
