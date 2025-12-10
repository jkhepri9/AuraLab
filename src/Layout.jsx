import React from 'react';
import Navbar from './components/Navbar'; 
import { Link, useLocation } from 'react-router-dom'; // IMPORTED useLocation
import { Button } from './components/ui/button';
import { Square, Play, RefreshCw, Layers } from 'lucide-react';
import { cn } from './lib/utils';
import { toast } from 'sonner';

// New Global Player Component
function GlobalAudioPlayer({ currentPlayingPreset, handleStopPlaying }) {
  if (!currentPlayingPreset) return null;

  const { name, color } = currentPlayingPreset;

  const handleRestart = () => {
    handleStopPlaying();
    toast.success(`Restarted ${name}. (Click Activate in Modes to resume)`);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-4">
      <div 
        className="bg-zinc-800/90 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center justify-between shadow-2xl"
        style={{ 
            background: color.includes('gradient') ? color : `linear-gradient(135deg, ${color}, #000000)`
        }}
      >
        <div className="flex items-center space-x-3">
          <Layers className="w-6 h-6 text-white/80" />
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white leading-none">NOW PLAYING</span>
            <span className="text-lg font-extrabold text-white tracking-tight">{name}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Link to editor for quick access, using current playing preset ID if available */}
          <Link to={`/AuraModes`}>
            <Button
              variant="ghost" 
              size="icon"
              className="text-white/70 hover:text-white"
            >
              <RefreshCw className="w-5 h-5" />
            </Button>
          </Link>

          <Button 
            onClick={handleStopPlaying} // Toggles stop/pause
            className="bg-white/90 text-black hover:bg-white font-bold h-10 w-24 shadow-md"
          >
            <Square className="w-4 h-4 mr-2 fill-current" /> Stop
          </Button>
        </div>
      </div>
    </div>
  );
}


export default function Layout({ children, currentPlayingPreset, handleStopPlaying }) {
  const location = useLocation(); // Hook to get current path

  // Determine if the player should be hidden (i.e., if we are in the editor view)
  const isEditorPage = location.pathname.includes('/AuraModes'); 
  const isStudioPage = location.pathname.includes('/AuraEditor');

  const showStickyPlayer = currentPlayingPreset && !isEditorPage && !isStudioPage;
  
  return (
    <div className="min-h-screen bg-zinc-950 text-white relative">
      
      {/* AURA SHIMMER OVERLAY */}
      <div className="fixed inset-0 pointer-events-none opacity-20"
           style={{ 
               background: 'radial-gradient(circle at top, #ffffff33, transparent 75%)', 
           }}
      ></div>
      
      <Navbar />
      <main className={cn("z-20 relative", showStickyPlayer ? "pb-24" : "")}> 
        {children}
      </main>
      
      {showStickyPlayer && (
        <GlobalAudioPlayer 
          currentPlayingPreset={currentPlayingPreset} 
          handleStopPlaying={handleStopPlaying} 
        />
      )}
    </div>
  );
}