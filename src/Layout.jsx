import React from 'react';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import { Link, useLocation } from 'react-router-dom';
import { Button } from './components/ui/button';
import { Square, RefreshCw, Layers } from 'lucide-react';
import { cn } from './lib/utils';
import { toast } from 'sonner';

// Global Player Component
function GlobalAudioPlayer({ currentPlayingPreset, handleStopPlaying }) {
  if (!currentPlayingPreset) return null;

  const { name, color, imageUrl } = currentPlayingPreset;

  const handleRestart = () => {
    handleStopPlaying?.();
    toast.success(`Restarted ${name}. (Click Activate in Modes to resume)`);
  };

  return (
    <div className="fixed left-0 right-0 z-40 p-4 bottom-[calc(4rem+env(safe-area-inset-bottom))] md:bottom-0 w-screen max-w-[100vw] overflow-x-hidden">
      <div
        className="relative overflow-hidden border border-white/10 rounded-2xl shadow-2xl max-w-full"
      >
        {/* Background vibe image (if available) */}
        {imageUrl && (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${imageUrl})` }}
          />
        )}

        {/* Always-on overlay for readability (stronger if no image) */}
        <div
          className={cn(
            "absolute inset-0",
            imageUrl ? "bg-black/55 backdrop-blur-md" : "bg-zinc-800/90 backdrop-blur-md"
          )}
        />

        {/* Color/gradient wash to preserve brand identity */}
        <div
          className="absolute inset-0 opacity-70"
          style={{
            background: color?.includes('gradient')
              ? color
              : `linear-gradient(135deg, ${color || '#10b981'}, #000000)`,
          }}
        />

        {/* Content */}
        <div className="relative p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0">
            <Layers className="w-6 h-6 text-white/80 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-white leading-none">
                NOW PLAYING
              </span>
              <span className="text-lg font-extrabold text-white tracking-tight truncate">
                {name}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <Link to="/AuraModes">
              <Button
                variant="ghost"
                size="icon"
                className="text-white/80 hover:text-white hover:bg-white/10"
                onClick={handleRestart}
              >
                <RefreshCw className="w-5 h-5" />
              </Button>
            </Link>

            <Button
              onClick={handleStopPlaying}
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
  handleStopPlaying,
}) {
  const location = useLocation();

  const isEditorPage = location.pathname.includes('/AuraModes');
  const isStudioPage = location.pathname.includes('/AuraEditor');

  const showStickyPlayer =
    currentPlayingPreset && !isEditorPage && !isStudioPage;

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
      {/* Aura shimmer overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-20 w-screen max-w-[100vw] overflow-x-hidden"
        style={{
          background:
            'radial-gradient(circle at top, #ffffff33, transparent 75%)',
        }}
      />

      <Navbar />

      <main
        className={cn(
          'z-20 relative w-screen max-w-[100vw] overflow-x-hidden',
          mainPadBottom
        )}
      >
        {children}
      </main>

      {showStickyPlayer && (
        <GlobalAudioPlayer
          currentPlayingPreset={currentPlayingPreset}
          handleStopPlaying={handleStopPlaying}
        />
      )}

      <BottomNav />
    </div>
  );
}
