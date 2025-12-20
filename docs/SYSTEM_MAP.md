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
