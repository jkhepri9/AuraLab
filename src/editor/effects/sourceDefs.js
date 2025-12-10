// src/editor/effects/sourceDefs.js
// -------------------------------------------------------------
// Shared constants for SourceControls
// -------------------------------------------------------------

export const NOISE_TYPES = [
  "white",
  "pink",
  "brown",
  "violet",
  "blue",
  "gray",
  "gold",
  "silver",
  "cosmic"
];

export const SYNTH_TYPES = [
  "analog",
  "fm",
  "wavetable",
  "granular",
  "drone",
  "sub"
];

export const AMBIENT_GROUPS = {
  birds: {
    label: "Birds",
    variants: [
      { value: "birds_jungle", label: "Jungle Birds" },
      { value: "birds_park", label: "Park Birds" },
      { value: "birds_sea", label: "Sea Birds" },
    ]
  },

  crickets: {
    label: "Crickets",
    variants: [
      { value: "crickets_forest", label: "Forest Crickets" },
      { value: "crickets_lake", label: "Lake Crickets" },
      { value: "crickets_swamp", label: "Swamp Crickets" },
    ]
  },

  fire: {
    label: "Fire",
    variants: [{ value: "fire_camp", label: "Campfire" }]
  },

  ocean: {
    label: "Ocean",
    variants: [
      { value: "ocean_soft", label: "Soft Waves" },
      { value: "ocean_crash", label: "Crashing Waves" },
      { value: "ocean_deep", label: "Deep Ocean" },
    ]
  },

  rain: {
    label: "Rain",
    variants: [
      { value: "rain_light", label: "Light Rain" },
      { value: "rain_medium", label: "Medium Rain" },
      { value: "rain_heavy", label: "Heavy Rain" },
    ]
  },

  river: {
    label: "River",
    variants: [
      { value: "river_soft", label: "Gentle Stream" },
      { value: "river_rapids", label: "River Rapids" },
    ]
  },

  thunder: {
    label: "Thunder",
    variants: [
      { value: "thunder_crack", label: "Crack Thunder" },
      { value: "thunder_distant", label: "Distant Thunder" },
      { value: "thunder_rolling", label: "Rolling Thunder" },
    ]
  },

  wind: {
    label: "Wind",
    variants: [
      { value: "wind_soft", label: "Soft Wind" },
      { value: "wind_forest", label: "Forest Wind" },
      { value: "wind_strong", label: "Strong Wind" },
    ]
  }
};
