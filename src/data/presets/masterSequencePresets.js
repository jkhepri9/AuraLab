// src/data/presets/masterSequencePresets.js
// Master Sequence presets — AuraLab AudioEngine (oscillator/noise/synth/ambient)
//
// Cohesive ladder design:
// - Beat ladder: 1 Hz → 11 Hz (matches 1·1·1 → 11·11·11)
// - Perceived carriers step through the Solfeggio ladder: 174 → 285 → 396 → 417 → 528 → 639 → 741 → 852 → 963 → 1074 → 1174
// - Binaural construction is symmetric: L = carrier - (beat/2), R = carrier + (beat/2)

export const masterSequencePresets = [
  {
    id: "ms_111",
    name: "Master Sequence — 1·1·1",
    color: "linear-gradient(135deg, #070814, #141a2e)",
    imageUrl: "/modeimages/mastersequence/ms_01.jpg",
    description: "Gate 1: deep surrender and nervous-system release. Enter the sequence gently.",

    // ✅ Discover metadata
    goals: ["sleep", "meditate"],
    scenarios: ["night", "downshift", "reset"],
    styles: ["binaural", "noise", "synth", "nature"],
    intensity: 1,
    headphonesRecommended: true,
    durationHint: "60m",
    collection: "Master Sequence",
    tags: ["master-sequence", "solfeggio-174", "beat-1hz", "liberation"],

    layers: [
      { id: "ms_111_sub", name: "Sub Foundation (72 Hz)", type: "oscillator", frequency: 72, volume: 0.12, pan: 0, waveform: "sine", enabled: true },
      { id: "ms_111_drone", name: "Atmospheric Drone (84 Hz)", type: "synth", frequency: 84, volume: 0.05, pan: 0, waveform: "drone", enabled: true },

      // Carrier 174 Hz, beat 1 Hz
      { id: "ms_111_l", name: "Binaural L (173.5 Hz)", type: "oscillator", frequency: 173.5, volume: 0.12, pan: -1, waveform: "sine", enabled: true },
      { id: "ms_111_r", name: "Binaural R (174.5 Hz)", type: "oscillator", frequency: 174.5, volume: 0.12, pan: 1, waveform: "sine", enabled: true },

      { id: "ms_111_noise", name: "Brown Noise", type: "noise", frequency: 0, volume: 0.06, pan: 0, waveform: "brown", enabled: true },
      { id: "ms_111_amb", name: "Ambient: Wind (Soft)", type: "ambient", frequency: 0, volume: 0.10, pan: 0, waveform: "wind_soft", enabled: true, filterEnabled: true, filter: { type: "lowpass", frequency: 16000, Q: 0.7 } },

      { id: "ms_111_master", name: "Master Tone (111 Hz)", type: "oscillator", frequency: 111, volume: 0.02, pan: 0, waveform: "sine", enabled: true },
      { id: "ms_111_stabilizer", name: "Stabilizer (432 Hz)", type: "oscillator", frequency: 432, volume: 0.015, pan: 0, waveform: "sine", enabled: true },
    ],
    order: 301,
  },

  {
    id: "ms_222",
    name: "Master Sequence — 2·2·2",
    color: "linear-gradient(135deg, #070f1a, #1c2a3a)",
    imageUrl: "/modeimages/mastersequence/ms_02.jpg",
    description: "Gate 2: recovery and cellular steadiness. Rebuild the baseline cleanly.",

    // ✅ Discover metadata
    goals: ["recovery", "calm"],
    scenarios: ["downshift", "recovery", "reset"],
    styles: ["binaural", "noise", "synth", "nature"],
    intensity: 1,
    headphonesRecommended: true,
    durationHint: "45m",
    collection: "Master Sequence",
    tags: ["master-sequence", "solfeggio-285", "beat-2hz", "restoration"],

    layers: [
      { id: "ms_222_sub", name: "Sub Foundation (74 Hz)", type: "oscillator", frequency: 74, volume: 0.12, pan: 0, waveform: "sine", enabled: true },
      { id: "ms_222_drone", name: "Atmospheric Drone (88 Hz)", type: "synth", frequency: 88, volume: 0.05, pan: 0, waveform: "drone", enabled: true },

      // Carrier 285 Hz, beat 2 Hz
      { id: "ms_222_l", name: "Binaural L (284 Hz)", type: "oscillator", frequency: 284, volume: 0.12, pan: -1, waveform: "sine", enabled: true },
      { id: "ms_222_r", name: "Binaural R (286 Hz)", type: "oscillator", frequency: 286, volume: 0.12, pan: 1, waveform: "sine", enabled: true },

      { id: "ms_222_noise", name: "Brown Noise", type: "noise", frequency: 0, volume: 0.06, pan: 0, waveform: "brown", enabled: true },
      { id: "ms_222_amb", name: "Ambient: Wind (Soft)", type: "ambient", frequency: 0, volume: 0.10, pan: 0, waveform: "wind_soft", enabled: true, filterEnabled: true, filter: { type: "lowpass", frequency: 16000, Q: 0.7 } },

      { id: "ms_222_master", name: "Master Tone (222 Hz)", type: "oscillator", frequency: 222, volume: 0.02, pan: 0, waveform: "sine", enabled: true },
      { id: "ms_222_stabilizer", name: "Stabilizer (432 Hz)", type: "oscillator", frequency: 432, volume: 0.015, pan: 0, waveform: "sine", enabled: true },
    ],
    order: 302,
  },

  {
    id: "ms_333",
    name: "Master Sequence — 3·3·3",
    color: "linear-gradient(135deg, #07130a, #1f3a20)",
    imageUrl: "/modeimages/mastersequence/ms_03.jpg",
    description: "Gate 3: grounded release. Clears fear-noise and stabilizes the body-field.",

    // ✅ Discover metadata
    goals: ["calm"],
    scenarios: ["grounding", "anxiety", "reset"],
    styles: ["binaural", "noise", "synth", "nature"],
    intensity: 2,
    headphonesRecommended: true,
    durationHint: "30m",
    collection: "Master Sequence",
    tags: ["master-sequence", "solfeggio-396", "beat-3hz", "grounding"],

    layers: [
      { id: "ms_333_sub", name: "Sub Foundation (76 Hz)", type: "oscillator", frequency: 76, volume: 0.12, pan: 0, waveform: "sine", enabled: true },
      { id: "ms_333_drone", name: "Atmospheric Drone (92 Hz)", type: "synth", frequency: 92, volume: 0.05, pan: 0, waveform: "drone", enabled: true },

      // Carrier 396 Hz, beat 3 Hz
      { id: "ms_333_l", name: "Binaural L (394.5 Hz)", type: "oscillator", frequency: 394.5, volume: 0.12, pan: -1, waveform: "sine", enabled: true },
      { id: "ms_333_r", name: "Binaural R (397.5 Hz)", type: "oscillator", frequency: 397.5, volume: 0.12, pan: 1, waveform: "sine", enabled: true },

      { id: "ms_333_noise", name: "Pink Noise", type: "noise", frequency: 0, volume: 0.06, pan: 0, waveform: "pink", enabled: true },
      { id: "ms_333_amb", name: "Ambient: Wind (Soft)", type: "ambient", frequency: 0, volume: 0.10, pan: 0, waveform: "wind_soft", enabled: true, filterEnabled: true, filter: { type: "lowpass", frequency: 16000, Q: 0.7 } },

      { id: "ms_333_master", name: "Master Tone (333 Hz)", type: "oscillator", frequency: 333, volume: 0.02, pan: 0, waveform: "sine", enabled: true },
      { id: "ms_333_stabilizer", name: "Stabilizer (432 Hz)", type: "oscillator", frequency: 432, volume: 0.015, pan: 0, waveform: "sine", enabled: true },
    ],
    order: 303,
  },

  {
    id: "ms_444",
    name: "Master Sequence — 4·4·4",
    color: "linear-gradient(135deg, #120a2a, #183a6a)",
    imageUrl: "/modeimages/mastersequence/ms_04.jpg",
    description: "Gate 4: clearing and controlled change. Smooths the shift into deeper trance.",

    // ✅ Discover metadata
    goals: ["meditate", "calm"],
    scenarios: ["meditate", "change", "release"],
    styles: ["binaural", "noise", "synth", "nature"],
    intensity: 2,
    headphonesRecommended: true,
    durationHint: "30m",
    collection: "Master Sequence",
    tags: ["master-sequence", "solfeggio-417", "beat-4hz", "clearing"],

    layers: [
      { id: "ms_444_sub", name: "Sub Foundation (78 Hz)", type: "oscillator", frequency: 78, volume: 0.12, pan: 0, waveform: "sine", enabled: true },
      { id: "ms_444_drone", name: "Atmospheric Drone (96 Hz)", type: "synth", frequency: 96, volume: 0.05, pan: 0, waveform: "drone", enabled: true },

      // Carrier 417 Hz, beat 4 Hz
      { id: "ms_444_l", name: "Binaural L (415 Hz)", type: "oscillator", frequency: 415, volume: 0.12, pan: -1, waveform: "sine", enabled: true },
      { id: "ms_444_r", name: "Binaural R (419 Hz)", type: "oscillator", frequency: 419, volume: 0.12, pan: 1, waveform: "sine", enabled: true },

      { id: "ms_444_noise", name: "Pink Noise", type: "noise", frequency: 0, volume: 0.06, pan: 0, waveform: "pink", enabled: true },
      { id: "ms_444_amb", name: "Ambient: Wind (Soft)", type: "ambient", frequency: 0, volume: 0.10, pan: 0, waveform: "wind_soft", enabled: true, filterEnabled: true, filter: { type: "lowpass", frequency: 16000, Q: 0.7 } },

      { id: "ms_444_master", name: "Master Tone (444 Hz)", type: "oscillator", frequency: 444, volume: 0.02, pan: 0, waveform: "sine", enabled: true },
      { id: "ms_444_stabilizer", name: "Stabilizer (432 Hz)", type: "oscillator", frequency: 432, volume: 0.015, pan: 0, waveform: "sine", enabled: true },
    ],
    order: 304,
  },

  {
    id: "ms_555",
    name: "Master Sequence — 5·5·5",
    color: "linear-gradient(135deg, #0b1a12, #2a5a3a)",
    imageUrl: "/modeimages/mastersequence/ms_05.jpg",
    description: "Gate 5: coherence and renewal. The recode point of the sequence.",

    // ✅ Discover metadata
    goals: ["focus", "calm"],
    scenarios: ["deep-work", "coherence", "creative"],
    styles: ["binaural", "noise", "synth", "nature"],
    intensity: 3,
    headphonesRecommended: true,
    durationHint: "30m",
    collection: "Master Sequence",
    tags: ["master-sequence", "solfeggio-528", "beat-5hz", "recode"],

    layers: [
      { id: "ms_555_sub", name: "Sub Foundation (80 Hz)", type: "oscillator", frequency: 80, volume: 0.12, pan: 0, waveform: "sine", enabled: true },
      { id: "ms_555_drone", name: "Atmospheric Drone (100 Hz)", type: "synth", frequency: 100, volume: 0.05, pan: 0, waveform: "drone", enabled: true },

      // Carrier 528 Hz, beat 5 Hz
      { id: "ms_555_l", name: "Binaural L (525.5 Hz)", type: "oscillator", frequency: 525.5, volume: 0.11, pan: -1, waveform: "sine", enabled: true },
      { id: "ms_555_r", name: "Binaural R (530.5 Hz)", type: "oscillator", frequency: 530.5, volume: 0.11, pan: 1, waveform: "sine", enabled: true },

      { id: "ms_555_noise", name: "Gray Noise", type: "noise", frequency: 0, volume: 0.05, pan: 0, waveform: "gray", enabled: true },
      { id: "ms_555_amb", name: "Ambient: Wind (Soft)", type: "ambient", frequency: 0, volume: 0.10, pan: 0, waveform: "wind_soft", enabled: true, filterEnabled: true, filter: { type: "lowpass", frequency: 16000, Q: 0.7 } },

      { id: "ms_555_master", name: "Master Tone (555 Hz)", type: "oscillator", frequency: 555, volume: 0.02, pan: 0, waveform: "sine", enabled: true },
      { id: "ms_555_stabilizer", name: "Stabilizer (432 Hz)", type: "oscillator", frequency: 432, volume: 0.015, pan: 0, waveform: "sine", enabled: true },
    ],
    order: 305,
  },

  {
    id: "ms_666",
    name: "Master Sequence — 6·6·6",
    color: "linear-gradient(135deg, #101a24, #1b2a3a)",
    imageUrl: "/modeimages/mastersequence/ms_06.jpg",
    description: "Gate 6: integration and harmony. Smooth emotional blending without collapse.",

    // ✅ Discover metadata
    goals: ["calm", "focus"],
    scenarios: ["relationships", "balance", "heart"],
    styles: ["binaural", "noise", "synth", "nature"],
    intensity: 3,
    headphonesRecommended: true,
    durationHint: "30m",
    collection: "Master Sequence",
    tags: ["master-sequence", "solfeggio-639", "beat-6hz", "union"],

    layers: [
      { id: "ms_666_sub", name: "Sub Foundation (82 Hz)", type: "oscillator", frequency: 82, volume: 0.12, pan: 0, waveform: "sine", enabled: true },
      { id: "ms_666_drone", name: "Atmospheric Drone (104 Hz)", type: "synth", frequency: 104, volume: 0.05, pan: 0, waveform: "drone", enabled: true },

      // Carrier 639 Hz, beat 6 Hz
      { id: "ms_666_l", name: "Binaural L (636 Hz)", type: "oscillator", frequency: 636, volume: 0.11, pan: -1, waveform: "sine", enabled: true },
      { id: "ms_666_r", name: "Binaural R (642 Hz)", type: "oscillator", frequency: 642, volume: 0.11, pan: 1, waveform: "sine", enabled: true },

      { id: "ms_666_noise", name: "Gray Noise", type: "noise", frequency: 0, volume: 0.05, pan: 0, waveform: "gray", enabled: true },
      { id: "ms_666_amb", name: "Ambient: Wind (Soft)", type: "ambient", frequency: 0, volume: 0.10, pan: 0, waveform: "wind_soft", enabled: true, filterEnabled: true, filter: { type: "lowpass", frequency: 16000, Q: 0.7 } },

      { id: "ms_666_master", name: "Master Tone (666 Hz)", type: "oscillator", frequency: 666, volume: 0.02, pan: 0, waveform: "sine", enabled: true },
      { id: "ms_666_stabilizer", name: "Stabilizer (432 Hz)", type: "oscillator", frequency: 432, volume: 0.015, pan: 0, waveform: "sine", enabled: true },
    ],
    order: 306,
  },

  {
    id: "ms_777",
    name: "Master Sequence — 7·7·7",
    color: "linear-gradient(135deg, #041329, #0a3a5a)",
    imageUrl: "/modeimages/mastersequence/ms_07.jpg",
    description: "Gate 7: mental cleansing and insight. Precision clarity comes online.",

    // ✅ Discover metadata
    goals: ["focus", "calm"],
    scenarios: ["clarity", "study", "clean-mind"],
    styles: ["binaural", "noise", "synth", "nature"],
    intensity: 4,
    headphonesRecommended: true,
    durationHint: "30m",
    collection: "Master Sequence",
    tags: ["master-sequence", "solfeggio-741", "beat-7hz", "awakening"],

    layers: [
      { id: "ms_777_sub", name: "Sub Foundation (84 Hz)", type: "oscillator", frequency: 84, volume: 0.13, pan: 0, waveform: "sine", enabled: true },
      { id: "ms_777_drone", name: "Atmospheric Drone (108 Hz)", type: "synth", frequency: 108, volume: 0.045, pan: 0, waveform: "drone", enabled: true },

      // Carrier 741 Hz, beat 7 Hz
      { id: "ms_777_l", name: "Binaural L (737.5 Hz)", type: "oscillator", frequency: 737.5, volume: 0.10, pan: -1, waveform: "sine", enabled: true },
      { id: "ms_777_r", name: "Binaural R (744.5 Hz)", type: "oscillator", frequency: 744.5, volume: 0.10, pan: 1, waveform: "sine", enabled: true },

      { id: "ms_777_noise", name: "Blue Noise", type: "noise", frequency: 0, volume: 0.05, pan: 0, waveform: "blue", enabled: true },
      { id: "ms_777_amb", name: "Ambient: Wind (Soft)", type: "ambient", frequency: 0, volume: 0.10, pan: 0, waveform: "wind_soft", enabled: true, filterEnabled: true, filter: { type: "lowpass", frequency: 16000, Q: 0.7 } },

      { id: "ms_777_master", name: "Master Tone (777 Hz)", type: "oscillator", frequency: 777, volume: 0.02, pan: 0, waveform: "sine", enabled: true },
      { id: "ms_777_stabilizer", name: "Stabilizer (432 Hz)", type: "oscillator", frequency: 432, volume: 0.015, pan: 0, waveform: "sine", enabled: true },
    ],
    order: 307,
  },

  {
    id: "ms_888",
    name: "Master Sequence — 8·8·8",
    color: "linear-gradient(135deg, #0b1026, #1c2e5c)",
    imageUrl: "/modeimages/mastersequence/ms_08.jpg",
    description: "Gate 8: alignment and direction. Locks you into the correct inner line.",

    // ✅ Discover metadata
    goals: ["meditate", "focus"],
    scenarios: ["intuition", "alignment", "inner"],
    styles: ["binaural", "noise", "synth", "nature"],
    intensity: 4,
    headphonesRecommended: true,
    durationHint: "30m",
    collection: "Master Sequence",
    tags: ["master-sequence", "solfeggio-852", "beat-8hz", "alignment"],

    layers: [
      { id: "ms_888_sub", name: "Sub Foundation (86 Hz)", type: "oscillator", frequency: 86, volume: 0.13, pan: 0, waveform: "sine", enabled: true },
      { id: "ms_888_drone", name: "Atmospheric Drone (112 Hz)", type: "synth", frequency: 112, volume: 0.045, pan: 0, waveform: "drone", enabled: true },

      // Carrier 852 Hz, beat 8 Hz
      { id: "ms_888_l", name: "Binaural L (848 Hz)", type: "oscillator", frequency: 848, volume: 0.10, pan: -1, waveform: "sine", enabled: true },
      { id: "ms_888_r", name: "Binaural R (856 Hz)", type: "oscillator", frequency: 856, volume: 0.10, pan: 1, waveform: "sine", enabled: true },

      { id: "ms_888_noise", name: "Violet Noise", type: "noise", frequency: 0, volume: 0.045, pan: 0, waveform: "violet", enabled: true },
      { id: "ms_888_amb", name: "Ambient: Wind (Soft)", type: "ambient", frequency: 0, volume: 0.10, pan: 0, waveform: "wind_soft", enabled: true, filterEnabled: true, filter: { type: "lowpass", frequency: 16000, Q: 0.7 } },

      { id: "ms_888_master", name: "Master Tone (888 Hz)", type: "oscillator", frequency: 888, volume: 0.02, pan: 0, waveform: "sine", enabled: true },
      { id: "ms_888_stabilizer", name: "Stabilizer (432 Hz)", type: "oscillator", frequency: 432, volume: 0.015, pan: 0, waveform: "sine", enabled: true },
    ],
    order: 308,
  },

  {
    id: "ms_999",
    name: "Master Sequence — 9·9·9",
    color: "linear-gradient(135deg, #06071a, #2b0b3a)",
    imageUrl: "/modeimages/mastersequence/ms_09.jpg",
    description: "Gate 9: crown expansion. Deep stillness with high coherence and altitude.",

    // ✅ Discover metadata
    goals: ["meditate"],
    scenarios: ["deep-meditation", "transcend", "stillness"],
    styles: ["binaural", "noise", "synth", "nature"],
    intensity: 5,
    headphonesRecommended: true,
    durationHint: "30m",
    collection: "Master Sequence",
    tags: ["master-sequence", "solfeggio-963", "beat-9hz", "crown", "ascension"],

    layers: [
      { id: "ms_999_sub", name: "Sub Foundation (88 Hz)", type: "oscillator", frequency: 88, volume: 0.13, pan: 0, waveform: "sine", enabled: true },
      { id: "ms_999_drone", name: "Atmospheric Drone (116 Hz)", type: "synth", frequency: 116, volume: 0.045, pan: 0, waveform: "drone", enabled: true },

      // Carrier 963 Hz, beat 9 Hz
      { id: "ms_999_l", name: "Binaural L (958.5 Hz)", type: "oscillator", frequency: 958.5, volume: 0.09, pan: -1, waveform: "sine", enabled: true },
      { id: "ms_999_r", name: "Binaural R (967.5 Hz)", type: "oscillator", frequency: 967.5, volume: 0.09, pan: 1, waveform: "sine", enabled: true },

      { id: "ms_999_noise", name: "Cosmic Noise", type: "noise", frequency: 0, volume: 0.05, pan: 0, waveform: "cosmic", enabled: true },
      { id: "ms_999_amb", name: "Ambient: Wind (Soft)", type: "ambient", frequency: 0, volume: 0.10, pan: 0, waveform: "wind_soft", enabled: true, filterEnabled: true, filter: { type: "lowpass", frequency: 16000, Q: 0.7 } },

      { id: "ms_999_master", name: "Master Tone (999 Hz)", type: "oscillator", frequency: 999, volume: 0.02, pan: 0, waveform: "sine", enabled: true },
      { id: "ms_999_stabilizer", name: "Stabilizer (432 Hz)", type: "oscillator", frequency: 432, volume: 0.015, pan: 0, waveform: "sine", enabled: true },
    ],
    order: 309,
  },

  {
    id: "ms_101010",
    name: "Master Sequence — 10·10·10",
    color: "linear-gradient(135deg, #120b18, #2a1b3a)",
    imageUrl: "/modeimages/mastersequence/ms_10.jpg",
    description: "Gate 10: higher activation. Presence sharpens; energy rises without instability.",

    // ✅ Discover metadata
    goals: ["energy", "focus"],
    scenarios: ["activation", "presence", "upgrade"],
    styles: ["binaural", "noise", "synth", "nature"],
    intensity: 5,
    headphonesRecommended: true,
    durationHint: "30m",
    collection: "Master Sequence",
    tags: ["master-sequence", "solfeggio-1074", "beat-10hz", "stargate", "ascension"],

    layers: [
      { id: "ms_101010_sub", name: "Sub Foundation (90 Hz)", type: "oscillator", frequency: 90, volume: 0.13, pan: 0, waveform: "sine", enabled: true },
      { id: "ms_101010_drone", name: "Atmospheric Drone (120 Hz)", type: "synth", frequency: 120, volume: 0.045, pan: 0, waveform: "drone", enabled: true },

      // Carrier 1074 Hz, beat 10 Hz
      { id: "ms_101010_l", name: "Binaural L (1069 Hz)", type: "oscillator", frequency: 1069, volume: 0.09, pan: -1, waveform: "sine", enabled: true },
      { id: "ms_101010_r", name: "Binaural R (1079 Hz)", type: "oscillator", frequency: 1079, volume: 0.09, pan: 1, waveform: "sine", enabled: true },

      { id: "ms_101010_noise", name: "Gold Noise", type: "noise", frequency: 0, volume: 0.045, pan: 0, waveform: "gold", enabled: true },
      { id: "ms_101010_amb", name: "Ambient: Wind (Soft)", type: "ambient", frequency: 0, volume: 0.10, pan: 0, waveform: "wind_soft", enabled: true, filterEnabled: true, filter: { type: "lowpass", frequency: 16000, Q: 0.7 } },

      { id: "ms_101010_master", name: "Master Tone (1010 Hz)", type: "oscillator", frequency: 1010, volume: 0.02, pan: 0, waveform: "sine", enabled: true },
      { id: "ms_101010_stabilizer", name: "Stabilizer (432 Hz)", type: "oscillator", frequency: 432, volume: 0.015, pan: 0, waveform: "sine", enabled: true },
    ],
    order: 310,
  },

  {
  id: "ms_111111",
  name: "Master Sequence — 11·11·11",
  color: "linear-gradient(135deg, #0a0a12, #2a2a40)",
  imageUrl: "/modeimages/mastersequence/ms_11.jpg",
  description: "Gate 11: apex coherence. Ascension lock-in—bright, stable, and integrated.",
  goals: ["meditate", "energy"],
  scenarios: ["ascension", "apex", "integration"],
  styles: ["binaural", "noise", "synth", "nature"],
  intensity: 5,
  headphonesRecommended: true,
  durationHint: "30m",
  collection: "Master Sequence",
  tags: ["master-sequence", "solfeggio-1174", "beat-11hz", "apex", "ascension"],
  layers: [
    { id: "ms_111111_sub", name: "Sub Foundation (92 Hz)", type: "oscillator", frequency: 92, volume: 0.13, pan: 0, waveform: "sine", enabled: true },
    { id: "ms_111111_drone", name: "Atmospheric Drone (124 Hz)", type: "synth", frequency: 124, volume: 0.17, pan: 0, waveform: "drone", enabled: true },
    { id: "ms_111111_l", name: "Binaural L (1168.5 Hz)", type: "oscillator", frequency: 1168.5, volume: 0.09, pan: -1, waveform: "sine", enabled: true },
    { id: "ms_111111_r", name: "Binaural R (1179.5 Hz)", type: "oscillator", frequency: 1179.5, volume: 0.09, pan: 1, waveform: "sine", enabled: true },
    { id: "ms_111111_noise", name: "Cosmic Noise", type: "noise", frequency: 0, volume: 0.05, pan: 0, waveform: "cosmic", enabled: true },
    { id: "ms_111111_amb", name: "Ambient: Wind (Soft)", type: "ambient", frequency: 0, volume: 0.1, pan: 0, waveform: "wind_soft", enabled: true, filterEnabled: true, filter: { type: "lowpass", frequency: 16000, Q: 0.7 } },
    { id: "ms_111111_master", name: "Master Tone (1111 Hz)", type: "oscillator", frequency: 1111, volume: 0.02, pan: 0, waveform: "sine", enabled: true },
    { id: "ms_111111_stabilizer", name: "Stabilizer (432 Hz)", type: "oscillator", frequency: 432, volume: 0.015, pan: 0, waveform: "sine", enabled: true },
    { id: "9bc43dd4-ef6e-4ceb-b9c3-9618f83b5d86", type: "synth", name: "Atmospheric Drone (111 Hz)", frequency: 111, waveform: "drone", volume: 0.33, pan: 0, enabled: true, pulseRate: 0.36, pulseDepth: 0.89, phaseShift: 0, filterEnabled: true, filter: { type: "lowpass", frequency: 20000, Q: 1 } },
  ],
  order: 311,
  symbol: "✧",
  studioFx: { reverbWet: 0, delayWet: 0, delayTime: 0.5 },
},
];

export default masterSequencePresets;
