import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import PresetEditor from "@/components/presets/PresetEditor";
import { useGlobalPlayer } from "@/audio/GlobalPlayerContext";

export default function NowPlaying() {
  const navigate = useNavigate();
  const player = useGlobalPlayer();

  const preset = player.currentPlayingPreset;
  const layers = player.currentLayers;

  const sessionPreset = useMemo(() => {
    if (!preset) return null;

    // IMPORTANT:
    // Use the LIVE session layers so all user edits remain intact.
    return {
      ...preset,
      layers: layers || preset.layers || [],
    };
  }, [preset, layers]);

  if (!sessionPreset) {
    return (
      <div className="h-full w-full p-8 bg-black/80">
        <div className="max-w-3xl mx-auto rounded-2xl border border-white/10 bg-white/5 p-6">
          <h1 className="text-2xl font-extrabold text-white mb-2">No active session</h1>
          <p className="text-white/70 mb-6">
            Nothing is currently playing. Start an Aura Mode, then tap the sticky player to return here.
          </p>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            onClick={() => navigate("/AuraModes")}
          >
            Go to Aura Modes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full p-8 overflow-y-auto bg-black/80">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-extrabold text-white tracking-tight mb-6">
          Now Playing <span className="text-emerald-400">| Session</span>
        </h1>

        <PresetEditor
          // Use the preset id as key so session view stays stable
          // (but it will reflect live layer edits because they are in the global player state)
          key={`nowplaying:${sessionPreset.id || "session"}`}
          initialPreset={sessionPreset}
          onCancel={() => navigate(-1)}
          autoPlay={false} // DO NOT restart; keep current playback running
        />
      </div>
    </div>
  );
}
