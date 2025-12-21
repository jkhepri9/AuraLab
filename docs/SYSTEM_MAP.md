                 ┌─────────────────────────────┐
                 │           UI Layer          │
                 │  Pages + Components (React) │
                 └──────────────┬──────────────┘
                                │
                                │ calls / controls
                                ▼
                 ┌─────────────────────────────┐
                 │      Application Layer      │
                 │  State, routing, adapters,  │
                 │  preset selection, playback │
                 └──────────────┬──────────────┘
                                │
                                │ loads / saves / transforms
                                ▼
     ┌───────────────────────────────┐    ┌───────────────────────────────┐
     │         Data Layer             │    │         Audio Layer            │
     │ presets + copy + serialization │    │ engine + loaders + graphs      │
     └──────────────┬────────────────┘    └──────────────┬────────────────┘
                    │                                     │
                    │                                     │ outputs audio + metering
                    ▼                                     ▼
         ┌───────────────────┐                 ┌─────────────────────────┐
         │  Persistence Layer │                 │  Visualizer + Analyser  │
         │ localStorage/db.js │                 │ WaveformVisualizer etc. │
         └───────────────────┘                 └─────────────────────────┘



///UI Layer///

src/pages/*
Examples: Home.jsx, AuraModes.jsx, AuraEditor.jsx, NowPlaying.jsx, etc.

src/components/*
Examples: IntroOverlay.jsx, LiveBackground.jsx, Navbar.jsx, BottomNav.jsx

Application Layer (Glue / Orchestration)

src/App.jsx, src/Layout.jsx, src/main.jsx

src/lib/*
Examples: db.js, presetSerializer.js, presetUtils.js, storage.js

///Context///

src/audio/GlobalPlayerContext.jsx

///DATA LAYER///

src/data/presets/*

featuredPresets.js

fanFavoritesPresets.js

communityPresets.js

groundedAuraPresets.js

zodiacPresets.js

index.js (barrel export)

Audio Layer

src/audio/AudioEngine.js

src/audio/AmbientLoader.js

src/audio/NoiseEngines.js

src/audio/SynthEngines.js

plus deeper engine internals:

src/audio/engine/*

src/audio/offline/* (if used for rendering/export)

///Editor (Studio / DAW-like)///

src/editor/*

effects/*

layers/*

timeline/*

transport/*

visualizer/*

//////Edit Source Items//////

src/editor/effects/SourceControls.jsx
&
sourceDefs.js

