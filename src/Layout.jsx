import React from 'react';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from './components/ui/button';
import { Pause, Play, Music } from 'lucide-react';
import { cn } from './lib/utils';
import { Toaster } from 'sonner';

function GlobalAudioPlayer({ currentPlayingPreset, isPlaying, onTogglePlayPause }) {
  const navigate = useNavigate();

  if (!currentPlayingPreset) return null;

  const { id, name, color, imageUrl } = currentPlayingPreset;

  const isStudioTrack = id === "__studio__";

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
    <div className="fixed left-0 right-0 z-40 px-4 bottom-[calc(4rem+env(safe-area-inset-bottom))] md:bottom-0 w-screen max-w-[100vw] overflow-x-hidden">
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
          className="absolute inset-0 opacity-60"
          style={{
            background: color?.includes('gradient')
              ? color
              : `linear-gradient(135deg, ${color || '#10b981'}, #000000)`,
          }}
        />

        {/* Apple Music-style mini player (tap left area to open; only Play/Pause control) */}
        <button
          type="button"
          className="relative w-full flex items-center gap-3 p-3 text-left hover:opacity-95 active:opacity-90"
          onClick={handleOpen}
          title="Open current session"
        >
          <div className="h-12 w-12 rounded-xl overflow-hidden bg-white/10 shrink-0 flex items-center justify-center">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={name}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <Music className="w-6 h-6 text-white/80" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold text-white/70 uppercase tracking-wide leading-none">
              Now Playing
            </div>
            <div className="text-base font-extrabold text-white tracking-tight truncate">
              {name}
            </div>
          </div>

          <div className="shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-12 w-12 rounded-full text-white/90 hover:text-white hover:bg-white/10"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onTogglePlayPause?.();
              }}
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </Button>
          </div>
        </button>
      </div>
    </div>
  );
}

export default function Layout({
  children,
  currentPlayingPreset,
  isPlaying,
  hideStickyPlayer = false,
  onTogglePlayPause,
}) {
  const location = useLocation();

  // Immersive onboarding/session (first 60 seconds)
  const isImmersive = location.pathname === "/Start";

  // UX RULE:
  // - If user entered Aura Studio while a Mode is playing, keep the sticky player visible.
  // - Once Aura Studio claims playback (__studio__), hide the sticky player while inside Aura Studio.
  const hideStickyInStudio =
    location.pathname === "/AuraEditor" &&
    currentPlayingPreset?.id === "__studio__";

  const showStickyPlayer =
    !isImmersive &&
    Boolean(currentPlayingPreset) &&
    !hideStickyInStudio &&
    !hideStickyPlayer &&
    location.pathname !== "/NowPlaying";

  const mainPadBottom = isImmersive
    ? "pb-0"
    : showStickyPlayer
      ? 'pb-[calc(9rem+env(safe-area-inset-bottom))] md:pb-0'
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

      {!isImmersive && <Navbar />}

      <main className={cn('z-20 relative w-screen max-w-[100vw] overflow-x-hidden', mainPadBottom)}>
        {children}
      </main>

      {showStickyPlayer && (
        <GlobalAudioPlayer
          currentPlayingPreset={currentPlayingPreset}
          isPlaying={isPlaying}
          onTogglePlayPause={onTogglePlayPause}
        />
      )}

      {!isImmersive && <BottomNav />}

      {/* Sonner toast mount (used across the app) */}
      <Toaster richColors position="top-center" />
    </div>
  );
}
