import React, { useState, useEffect, useRef } from 'react';
import {
  Play, Square, Volume2, Save, Activity,
  Waves, Sliders, Download,
  Trash2, Zap, Wind, Pause,
  SkipBack, SkipForward,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { bufferToWave } from '@/components/utils';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { db } from "@/lib/db";

// --- CONSTANTS ---

// Ambient categories & variants
const AMBIENT_GROUPS = {
  birds: {
    label: "Birds",
    variants: [
      { value: "birds_jungle", label: "Jungle Birds" },
      { value: "birds_park", label: "Park Birds" },
      { value: "birds_sea", label: "Sea Birds" },
    ],
  },

  crickets: {
    label: "Crickets",
    variants: [
      { value: "crickets_forest", label: "Forest Crickets" },
      { value: "crickets_lake", label: "Lake Crickets" },
      { value: "crickets_swamp", label: "Swamp Crickets" },
    ],
  },

  fire: {
    label: "Fire",
    variants: [
      { value: "fire_camp", label: "Campfire" }
    ],
  },

  ocean: {
    label: "Ocean",
    variants: [
      { value: "ocean_soft", label: "Soft Waves" },
      { value: "ocean_crash", label: "Crashing Waves" },
      { value: "ocean_deep", label: "Deep Ocean" },
    ],
  },

  rain: {
    label: "Rain",
    variants: [
      { value: "rain_light", label: "Light Rain" },
      { value: "rain_medium", label: "Medium Rain" },
      { value: "rain_heavy", label: "Heavy Rain" },
    ],
  },

  river: {
    label: "River",
    variants: [
      { value: "river_soft", label: "Gentle Stream" },
      { value: "river_rapids", label: "River Rapids" },
    ],
  },

  thunder: {
    label: "Thunder",
    variants: [
      { value: "thunder_crack", label: "Crack Thunder" },
      { value: "thunder_distant", label: "Distant Thunder" },
      { value: "thunder_rolling", label: "Rolling Thunder" },
    ],
  },

  wind: {
    label: "Wind",
    variants: [
      { value: "wind_soft", label: "Soft Wind" },
      { value: "wind_forest", label: "Forest Wind" },
      { value: "wind_strong", label: "Strong Wind" },
    ],
  },
};

const NOISE_TYPES = ['white', 'pink', 'brown', 'violet', 'blue', 'gray', 'gold', 'silver', 'cosmic'];
const SYNTH_TYPES = ['analog', 'fm', 'wavetable', 'granular', 'drone', 'sub'];

// ONLINE base is left blank for now (Option C)
// You can fill this later when you put audio on a CDN.
const ONLINE_AMBIENT_BASE = ""; // e.g. "https://cdn.auralab.app/audio/ambient"
const LOCAL_AMBIENT_BASE = "/audio/ambient";

// --- VISUALIZER COMPONENT ---
const WaveformVisualizer = ({ type, waveform, isPlaying, color }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const phaseRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerY = height / 2;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.beginPath();
      ctx.strokeStyle = color || '#10b981';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (isPlaying) {
        phaseRef.current += 0.15;
      }

      const amplitude = height * 0.35;
      const frequency = 0.05;

      ctx.moveTo(0, centerY);

      for (let x = 0; x < width; x++) {
        let y = centerY;
        const t = x * frequency + phaseRef.current;

        if (type === 'oscillator' || type === 'synth') {
          if (waveform === 'sine' || waveform === 'fm' || waveform === 'sub') {
            y = centerY + Math.sin(t) * amplitude;
          } else if (waveform === 'square') {
            y = centerY + (Math.sin(t) > 0 ? amplitude : -amplitude);
          } else if (waveform === 'sawtooth' || waveform === 'analog' || waveform === 'wavetable') {
            y = centerY + -amplitude + ((t % (Math.PI * 2)) / Math.PI) * amplitude;
          } else if (waveform === 'triangle' || waveform === 'drone') {
            y = centerY + (2 * amplitude / Math.PI) * Math.asin(Math.sin(t));
          } else {
            y = centerY + Math.sin(t) * amplitude * Math.sin(t * 0.5);
          }
        } else if (type === 'noise') {
          const noise = (Math.random() * 2 - 1) * amplitude * 0.8;
          y = centerY + noise;
        } else if (type === 'ambient') {
          const slowT = x * 0.02 + (phaseRef.current * 0.5);
          y =
            centerY +
            Math.sin(slowT) * amplitude * 0.6 +
            Math.cos(slowT * 2.5) * (amplitude * 0.2);
        }

        ctx.lineTo(x, y);
      }

      ctx.stroke();
      ctx.shadowBlur = 4;
      ctx.shadowColor = color || '#10b981';
      animationRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationRef.current);
  }, [type, waveform, isPlaying, color]);

  return <canvas ref={canvasRef} width={300} height={100} className="w-full h-full opacity-60" />;
};

// --- MASTER LIMITER CURVE ---
function createSoftClipCurve(amount = 2.5, samples = 2048) {
  const curve = new Float32Array(samples);
  const k = typeof amount === 'number' ? amount : 2.5;
  const n = samples;
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    curve[i] = Math.tanh(k * x) / Math.tanh(k);
  }
  return curve;
}

// --- AUDIO GENERATORS ---

function createNoiseBuffer(ctx, type) {
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  let lastOut1 = 0;
  let lastOut2 = 0;
  let lastOut3 = 0;

  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;

    switch (type) {
      case 'white':
        data[i] = white;
        break;
      case 'pink': {
        lastOut1 = 0.99886 * lastOut1 + white * 0.0555179;
        lastOut2 = 0.99332 * lastOut2 + white * 0.0750759;
        lastOut3 = 0.96900 * lastOut3 + white * 0.1538520;
        const pinkBase = lastOut1 + lastOut2 + lastOut3 + white * 0.016;
        const freshWhite = Math.random() * 2 - 1;
        const pink = pinkBase * 0.6 + freshWhite * 0.4;
        data[i] = pink * 0.2;
        break;
      }
      case 'brown': {
        const brown = (lastOut1 + (0.02 * white)) / 1.02;
        lastOut1 = brown;
        data[i] = brown * 3.5;
        break;
      }
      case 'violet': {
        const violet = (white - lastOut1);
        lastOut1 = white;
        data[i] = violet * 0.7;
        break;
      }
      case 'blue': {
        const high = white - lastOut1;
        lastOut1 = white;
        data[i] = (high * 0.5 + white * 0.5) * 0.7;
        break;
      }
      case 'gray': {
        const low = (lastOut1 + white) * 0.5;
        lastOut1 = low;
        const high = white - low;
        data[i] = (low * 0.3 + white * 0.4 + high * 0.3) * 0.8;
        break;
      }
      case 'gold': {
        const brown = (lastOut1 + 0.01 * white) / 1.01;
        lastOut1 = brown;
        const mildHigh = white * 0.15;
        data[i] = (brown * 0.85 + mildHigh) * 3.0;
        break;
      }
      case 'silver': {
        lastOut1 = 0.99886 * lastOut1 + white * 0.0555179;
        const pink = lastOut1 * 0.11;
        const high = white - pink;
        data[i] = (high * 0.8 + pink * 0.2) * 0.7;
        break;
      }
      case 'cosmic': {
        const slow = (lastOut1 + 0.005 * white) / 1.005;
        lastOut1 = slow;
        const rumble = slow * 4.0;
        data[i] = rumble;
        break;
      }
      default:
        data[i] = white;
        break;
    }
  }

  let max = 0;
  for (let i = 0; i < bufferSize; i++) {
    const v = Math.abs(data[i]);
    if (v > max) max = v;
  }
  const scale = max > 0 ? 0.9 / max : 1;
  for (let i = 0; i < bufferSize; i++) {
    data[i] *= scale;
  }

  return buffer;
}

function createSynthGraph(ctx, type, frequency, destination) {
  const masterGain = ctx.createGain();
  masterGain.gain.value = 0.7;
  masterGain.connect(destination);

  const nodes = { masterGain, oscs: [] };

  const makeOsc = (wave, freqMult = 1, gainVal = 1, detuneCents = 0) => {
    const osc = ctx.createOscillator();
    osc.type = wave;
    osc.frequency.value = Math.max(0.1, (frequency || 432) * freqMult);
    osc.detune.value = detuneCents;
    const g = ctx.createGain();
    g.gain.value = gainVal;
    osc.connect(g);
    g.connect(masterGain);
    osc.start();
    nodes.oscs.push(osc);
  };

  const synthType = (type || 'analog').toLowerCase();

  if (synthType === 'analog') {
    makeOsc('sawtooth', 1, 0.4, -6);
    makeOsc('sawtooth', 1, 0.4, +6);
    makeOsc('triangle', 0.5, 0.25);
  } else if (synthType === 'fm') {
    const carrier = ctx.createOscillator();
    carrier.type = 'sine';
    carrier.frequency.value = frequency || 432;

    const modulator = ctx.createOscillator();
    modulator.type = 'sine';
    modulator.frequency.value = (frequency || 432) * 2;

    const modGain = ctx.createGain();
    modGain.gain.value = (frequency || 432) * 0.4;

    modulator.connect(modGain);
    modGain.connect(carrier.frequency);

    const outGain = ctx.createGain();
    outGain.gain.value = 0.7;
    carrier.connect(outGain);
    outGain.connect(masterGain);

    carrier.start();
    modulator.start();
    nodes.oscs.push(carrier, modulator);
  } else if (synthType === 'wavetable') {
    const saw = ctx.createOscillator();
    const square = ctx.createOscillator();
    const tri = ctx.createOscillator();

    saw.type = 'sawtooth';
    square.type = 'square';
    tri.type = 'triangle';

    saw.frequency.value = frequency || 432;
    square.frequency.value = frequency || 432;
    tri.frequency.value = (frequency || 432) * 0.5;

    const gSaw = ctx.createGain();
    const gSquare = ctx.createGain();
    const gTri = ctx.createGain();

    gSaw.gain.value = 0.45;
    gSquare.gain.value = 0.3;
    gTri.gain.value = 0.3;

    saw.connect(gSaw);
    square.connect(gSquare);
    tri.connect(gTri);

    gSaw.connect(masterGain);
    gSquare.connect(masterGain);
    gTri.connect(masterGain);

    saw.start();
    square.start();
    tri.start();

    nodes.oscs.push(saw, square, tri);
  } else if (synthType === 'granular') {
    for (let i = 0; i < 4; i++) {
      const detune = (Math.random() * 30) - 15;
      makeOsc('sine', 1 + (i * 0.01), 0.2, detune);
    }
  } else if (synthType === 'drone') {
    makeOsc('sine', 0.5, 0.35, -3);
    makeOsc('sine', 0.5, 0.35, +3);
    makeOsc('triangle', 1, 0.2);
  } else if (synthType === 'sub') {
    const baseFreq = frequency || 80;
    const subOsc = ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.value = baseFreq;

    const sub2 = ctx.createOscillator();
    sub2.type = 'sine';
    sub2.frequency.value = baseFreq / 2;

    const g1 = ctx.createGain();
    const g2 = ctx.createGain();
    g1.gain.value = 0.6;
    g2.gain.value = 0.4;

    subOsc.connect(g1);
    sub2.connect(g2);

    const mergeGain = ctx.createGain();
    mergeGain.gain.value = 1.0;
    g1.connect(mergeGain);
    g2.connect(mergeGain);
    mergeGain.connect(masterGain);

    subOsc.start();
    sub2.start();

    nodes.oscs.push(subOsc, sub2);
  } else {
    makeOsc('triangle', 1, 0.7);
  }

  return nodes;
}

function createImpulseResponse(ctx, duration = 2, decay = 2) {
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * duration;
  const impulse = ctx.createBuffer(2, length, sampleRate);
  const left = impulse.getChannelData(0);
  const right = impulse.getChannelData(1);

  for (let i = 0; i < length; i++) {
    left[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    right[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
  }
  return impulse;
}

// Try multiple URLs (online then local) and return first that decodes
async function loadFirstAvailable(ctx, urls, buffersCache) {
  for (const url of urls) {
    if (!url) continue;
    const key = `amb:${url}`;
    if (buffersCache.has(key)) return buffersCache.get(key);
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const arrayBuffer = await res.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      buffersCache.set(key, audioBuffer);
      return audioBuffer;
    } catch (e) {
      console.warn('Failed to load ambient url', url, e);
      continue;
    }
  }
  return null;
}

// Ambient: waveform like "ocean_soft", "rain_heavy", etc.
async function createAmbientGraph(ctx, waveform, destination, buffersCache) {
  const masterGain = ctx.createGain();
  masterGain.gain.value = 0.45;
  masterGain.connect(destination);
  const nodes = { masterGain, sources: [] };

  const raw = (waveform || 'ocean_soft').toLowerCase();
  const [category, variant = 'soft'] = raw.split('_');

  const urls = [];
  if (ONLINE_AMBIENT_BASE) {
    urls.push(`${ONLINE_AMBIENT_BASE}/${category}/${variant}.wav`);
  }
  urls.push(`${LOCAL_AMBIENT_BASE}/${category}/${variant}.wav`);

  const buffer = await loadFirstAvailable(ctx, urls, buffersCache);

  if (buffer) {
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    // Gentle shaping per category to keep them smooth
    if (category === 'ocean') {
      filter.type = 'lowpass';
      filter.frequency.value = variant === 'crash' ? 1800 : 800;
      gain.gain.value = variant === 'deep' ? 0.5 : 0.4;
    } else if (category === 'rain') {
      filter.type = 'highpass';
      filter.frequency.value =
        variant === 'light' ? 1800 : variant === 'medium' ? 1400 : 1000;
      gain.gain.value =
        variant === 'light' ? 0.35 : variant === 'medium' ? 0.4 : 0.5;
    } else if (category === 'thunder') {
      filter.type = 'lowpass';
      filter.frequency.value =
        variant === 'crack' ? 600 : variant === 'rolling' ? 350 : 250;
      gain.gain.value = 0.4;
    } else if (category === 'wind') {
      filter.type = 'bandpass';
      filter.frequency.value =
        variant === 'gentle' ? 300 : variant === 'forest' ? 450 : 600;
      filter.Q.value = 1;
      gain.gain.value = 0.4;
    } else if (category === 'river') {
      filter.type = 'bandpass';
      filter.frequency.value =
        variant === 'soft' ? 700 : variant === 'medium' ? 900 : 1200;
      filter.Q.value = 1.1;
      gain.gain.value = 0.35;
    } else if (category === 'fire') {
      filter.type = 'bandpass';
      filter.frequency.value =
        variant === 'soft' ? 1400 : variant === 'camp' ? 1600 : 2000;
      filter.Q.value = 1.3;
      gain.gain.value = 0.35;
    } else if (category === 'cave') {
      filter.type = 'bandpass';
      filter.frequency.value =
        variant === 'light' ? 1800 : variant === 'medium' ? 2000 : 2200;
      filter.Q.value = 2.5;
      gain.gain.value = 0.3;
    } else {
      filter.type = 'bandpass';
      filter.frequency.value = 1000;
      gain.gain.value = 0.35;
    }

    src.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    // Soft fade-in to avoid pops
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(gain.gain.value, now + 0.03);

    src.start(0);
    nodes.sources.push(src);
    return nodes;
  }

  // Fallback: synthetic pink-ish ambience
  const fallbackType =
    category === 'ocean' ? 'pink' :
    category === 'rain' ? 'blue' :
    category === 'thunder' ? 'brown' :
    category === 'wind' ? 'gray' :
    category === 'river' ? 'pink' :
    category === 'fire' ? 'silver' :
    category === 'cave' ? 'gold' :
    'pink';

  const buf = createNoiseBuffer(ctx, fallbackType);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = true;

  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  filter.type = 'bandpass';
  filter.frequency.value = 800;
  gain.gain.value = 0.35;

  src.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);

  const now = ctx.currentTime;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(gain.gain.value, now + 0.03);

  src.start();
  nodes.sources.push(src);
  return nodes;
}

// --- MAIN COMPONENT ---

export default function AuraEditor() {
  const [layers, setLayers] = useState([]);
  const [selectedLayerId, setSelectedLayerId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(1200);
  const [reverbWet, setReverbWet] = useState(0);
  const [delayWet, setDelayWet] = useState(0);
  const [delayTime, setDelayTime] = useState(0.5);
  const [projectName, setProjectName] = useState('New Aura Session');
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isInspectorCollapsed, setIsInspectorCollapsed] = useState(false);
  const [editingLayerName, setEditingLayerName] = useState(null);

  // Collapsible sections in Effects panel
  const [sectionOpen, setSectionOpen] = useState({
    source: true,
    filter: true,
    pulse: true,
    mix: true,
    fx: true,
  });

  // Collapsible ambient groups
  const [ambientOpen, setAmbientOpen] = useState(() => {
    const obj = {};
    Object.keys(AMBIENT_GROUPS).forEach((k) => {
      obj[k] = k === 'ocean'; // open Ocean by default
    });
    return obj;
  });

  const toggleSection = (key) =>
    setSectionOpen((prev) => ({ ...prev, [key]: !prev[key] }));

  const toggleAmbientGroup = (key) =>
    setAmbientOpen((prev) => ({ ...prev, [key]: !prev[key] }));

  const audioContextRef = useRef(null);
  const masterNodeRef = useRef(null);
  const nodesRef = useRef(new Map());
  const animationFrameRef = useRef(null);
  const startTimeRef = useRef(0);
  const reverbNodeRef = useRef(null);
  const delayNodeRef = useRef(null);
  const timelineScrollRef = useRef(null);
  const audioBuffersRef = useRef(new Map());
  const navigate = useNavigate();

  // Init AudioContext, master bus & FX
  useEffect(() => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    audioContextRef.current = ctx;

    const masterIn = ctx.createGain();
    masterIn.gain.value = 0.7;
    const shaper = ctx.createWaveShaper();
    shaper.curve = createSoftClipCurve(2.5);
    const masterOut = ctx.createGain();
    masterOut.gain.value = 0.9;

    masterIn.connect(shaper);
    shaper.connect(masterOut);
    masterOut.connect(ctx.destination);
    masterNodeRef.current = { input: masterIn, shaper, output: masterOut };

    const convolver = ctx.createConvolver();
    convolver.buffer = createImpulseResponse(ctx);
    const reverbDry = ctx.createGain();
    const reverbWetGain = ctx.createGain();
    reverbDry.gain.value = 1;
    reverbWetGain.gain.value = 0;

    const delayNode = ctx.createDelay(5.0);
    delayNode.delayTime.value = 0.5;
    const delayFeedback = ctx.createGain();
    delayFeedback.gain.value = 0.3;
    const delayDry = ctx.createGain();
    const delayWetGain = ctx.createGain();
    delayDry.gain.value = 1;
    delayWetGain.gain.value = 0;

    delayNode.connect(delayFeedback);
    delayFeedback.connect(delayNode);
    delayNode.connect(delayWetGain);

    reverbDry.connect(masterIn);
    reverbWetGain.connect(masterIn);
    delayDry.connect(masterIn);
    delayWetGain.connect(masterIn);

    reverbNodeRef.current = { convolver, dry: reverbDry, wet: reverbWetGain };
    delayNodeRef.current = { delay: delayNode, feedback: delayFeedback, dry: delayDry, wet: delayWetGain };

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      ctx.close();
    };
  }, []);

  // Transport timer
  useEffect(() => {
    const ctx = audioContextRef.current;
    if (!ctx) return;

    if (isPlaying) {
      startTimeRef.current = ctx.currentTime - currentTime;
      const update = () => {
        const now = ctx.currentTime - startTimeRef.current;
        setCurrentTime(now % duration);
        animationFrameRef.current = requestAnimationFrame(update);
      };
      animationFrameRef.current = requestAnimationFrame(update);
    } else {
      cancelAnimationFrame(animationFrameRef.current);
    }
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [isPlaying, duration]);

  // Audio Graph (with pure-oscillator mode)
  useEffect(() => {
    const ctx = audioContextRef.current;
    if (!ctx || !reverbNodeRef.current || !delayNodeRef.current || !masterNodeRef.current) return;

    if (!isPlaying) {
      nodesRef.current.forEach((node) => {
        try {
          node.source?.stop();
          node.oscs?.forEach(o => o.stop());
          node.ambientNodes?.sources?.forEach(s => s.stop());
          node.gain?.disconnect();
          node.pureGain?.disconnect();
        } catch (e) {}
      });
      nodesRef.current.clear();
      return;
    }

    const setupLayer = async (layer) => {
      if (!layer.enabled) {
        const existing = nodesRef.current.get(layer.id);
        if (existing?.gain) existing.gain.gain.value = 0;
        if (existing?.pureGain) existing.pureGain.gain.value = 0;
        return;
      }

      const isOsc = layer.type === 'oscillator';
      const pureMode =
        isOsc &&
        !layer.filterEnabled &&
        (layer.pulseRate ?? 0) === 0 &&
        (layer.pulseDepth ?? 0) === 0 &&
        (layer.phaseShift ?? 0) === 0 &&
        (layer.pan ?? 0) === 0;

      let nodeGroup = nodesRef.current.get(layer.id);

      if (!nodeGroup || (nodeGroup.mode === 'pure') !== pureMode) {
        if (nodeGroup) {
          try {
            nodeGroup.source?.stop();
            nodeGroup.oscs?.forEach(o => o.stop());
            nodeGroup.ambientNodes?.sources?.forEach(s => s.stop());
            nodeGroup.gain?.disconnect();
            nodeGroup.pureGain?.disconnect();
          } catch (e) {}
        }

        if (pureMode) {
          const pureGain = ctx.createGain();
          pureGain.gain.value = layer.volume ?? 0.5;
          const osc = ctx.createOscillator();
          osc.type = layer.waveform || 'sine';
          osc.frequency.value = layer.frequency || 432;

          // pure direct path
          osc.connect(pureGain);
          pureGain.connect(ctx.destination);

          const now = ctx.currentTime;
          const targetVol = layer.volume ?? 0.5;
          pureGain.gain.setValueAtTime(0, now);
          pureGain.gain.linearRampToValueAtTime(targetVol, now + 0.03);

          osc.start();
          nodeGroup = {
            mode: 'pure',
            source: osc,
            pureGain,
            layerId: layer.id
          };
          nodesRef.current.set(layer.id, nodeGroup);
          return;
        } else {
          const splitter = ctx.createChannelSplitter(2);
          const merger = ctx.createChannelMerger(2);
          const leftGain = ctx.createGain();
          const rightGain = ctx.createGain();

          const gain = ctx.createGain();
          const filter = ctx.createBiquadFilter();
          const lfo = ctx.createOscillator();
          const lfoGain = ctx.createGain();
          const pulseGain = ctx.createGain();

          pulseGain.connect(gain);
          gain.connect(splitter);
          splitter.connect(leftGain, 0);
          splitter.connect(rightGain, 0);
          leftGain.connect(merger, 0, 0);
          rightGain.connect(merger, 0, 1);

          merger.connect(reverbNodeRef.current.dry);
          merger.connect(reverbNodeRef.current.convolver);
          reverbNodeRef.current.convolver.connect(reverbNodeRef.current.wet);
          merger.connect(delayNodeRef.current.dry);
          merger.connect(delayNodeRef.current.delay);

          lfo.connect(lfoGain);
          lfoGain.connect(pulseGain.gain);
          lfo.start();

          let sourceNode = null;
          let synthNodes = null;
          let ambientNodes = null;

          if (layer.type === 'oscillator') {
            const src = ctx.createOscillator();
            src.type = layer.waveform || 'sine';
            src.frequency.value = layer.frequency || 432;
            if (layer.filterEnabled) {
              src.connect(filter);
              filter.connect(pulseGain);
            } else {
              src.connect(pulseGain);
            }
            src.start();
            sourceNode = src;
          } else if (layer.type === 'noise') {
            const buffer = createNoiseBuffer(ctx, layer.waveform || 'white');
            const src = ctx.createBufferSource();
            src.buffer = buffer;
            src.loop = true;
            src.connect(filter);
            filter.connect(pulseGain);
            src.start();
            sourceNode = src;
          } else if (layer.type === 'synth') {
            synthNodes = createSynthGraph(ctx, layer.waveform, layer.frequency || 432, filter);
            filter.connect(pulseGain);
          } else if (layer.type === 'ambient') {
            ambientNodes = await createAmbientGraph(ctx, layer.waveform, filter, audioBuffersRef.current);
            filter.connect(pulseGain);
          }

          nodeGroup = {
            mode: 'processed',
            source: sourceNode,
            synthNodes,
            ambientNodes,
            oscs: synthNodes?.oscs,
            filter,
            gain,
            lfo,
            lfoGain,
            pulseGain,
            splitter,
            merger,
            leftGain,
            rightGain,
            layerId: layer.id
          };

          const volFactor =
            layer.type === 'noise' ? 0.6 :
            layer.type === 'ambient' ? 0.65 :
            1;
          const targetVol = (layer.volume ?? 0.5) * volFactor;
          const now = ctx.currentTime;
          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(targetVol, now + 0.03);

          nodesRef.current.set(layer.id, nodeGroup);
        }
      }

      const now = ctx.currentTime;

      if (nodeGroup.mode === 'pure') {
        if (nodeGroup.source && isOsc) {
          nodeGroup.source.frequency.setTargetAtTime(layer.frequency || 432, now, 0.05);
          nodeGroup.source.type = layer.waveform || 'sine';
        }
        if (nodeGroup.pureGain) {
          const targetVol = layer.volume ?? 0.5;
          nodeGroup.pureGain.gain.setTargetAtTime(targetVol, now, 0.05);
        }
        return;
      }

      const volFactor =
        layer.type === 'noise' ? 0.6 :
        layer.type === 'ambient' ? 0.65 :
        1;
      const targetVol = (layer.volume ?? 0.5) * volFactor;
      nodeGroup.gain.gain.setTargetAtTime(targetVol, now, 0.05);

      const phaseRad = (layer.phaseShift / 360) * Math.PI;
      const leftAmp = Math.cos(phaseRad);
      const rightAmp = Math.sin(phaseRad);
      nodeGroup.leftGain.gain.setTargetAtTime((1 + leftAmp) / 2, now, 0.05);
      nodeGroup.rightGain.gain.setTargetAtTime((1 + rightAmp) / 2, now, 0.05);

      const panL = layer.pan < 0 ? 1 : 1 - layer.pan;
      const panR = layer.pan > 0 ? 1 : 1 + layer.pan;
      nodeGroup.leftGain.gain.value *= panL;
      nodeGroup.rightGain.gain.value *= panR;

      if (layer.type === 'oscillator' && nodeGroup.source) {
        nodeGroup.source.frequency.setTargetAtTime(layer.frequency, now, 0.05);
        if (nodeGroup.source.type !== layer.waveform) {
          nodeGroup.source.type = layer.waveform;
        }
      }

      if (layer.filter && (!isOsc || layer.filterEnabled)) {
        nodeGroup.filter.type = layer.filter.type || 'lowpass';
        nodeGroup.filter.frequency.setTargetAtTime(layer.filter.frequency || 20000, now, 0.05);
        nodeGroup.filter.Q.value = layer.filter.Q || 1;
      }

      if (layer.pulseRate > 0 && layer.pulseDepth > 0) {
        nodeGroup.lfo.frequency.setTargetAtTime(layer.pulseRate, now, 0.05);
        nodeGroup.lfoGain.gain.setTargetAtTime(layer.pulseDepth * 0.5, now, 0.05);
        nodeGroup.pulseGain.gain.setTargetAtTime(1 - layer.pulseDepth * 0.5, now, 0.05);
      } else {
        nodeGroup.lfoGain.gain.setTargetAtTime(0, now, 0.05);
        nodeGroup.pulseGain.gain.setTargetAtTime(1, now, 0.05);
      }
    };

    layers.forEach((l) => {
      setupLayer(l);
    });

    nodesRef.current.forEach((node, id) => {
      if (!layers.find((l) => l.id === id)) {
        try {
          node.source?.stop();
          node.oscs?.forEach(o => o.stop());
          node.ambientNodes?.sources?.forEach(s => s.stop());
          node.gain?.disconnect();
          node.pureGain?.disconnect();
        } catch (e) {}
        nodesRef.current.delete(id);
      }
    });
  }, [layers, isPlaying]);

  // FX Updates
  useEffect(() => {
    const ctx = audioContextRef.current;
    if (!ctx || !reverbNodeRef.current) return;
    const t = ctx.currentTime;
    reverbNodeRef.current.dry.gain.setTargetAtTime(1 - reverbWet, t, 0.05);
    reverbNodeRef.current.wet.gain.setTargetAtTime(reverbWet, t, 0.05);
  }, [reverbWet]);

  useEffect(() => {
    const ctx = audioContextRef.current;
    if (!ctx || !delayNodeRef.current) return;
    const t = ctx.currentTime;
    delayNodeRef.current.dry.gain.setTargetAtTime(1 - delayWet, t, 0.05);
    delayNodeRef.current.wet.gain.setTargetAtTime(delayWet, t, 0.05);
    delayNodeRef.current.delay.delayTime.setTargetAtTime(delayTime, t, 0.05);
  }, [delayWet, delayTime]);

  const addLayer = (type) => {
    const isOsc = type === 'oscillator';
    const newLayer = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      name: type === 'oscillator' ? 'Frequency' : `New ${type}`,
      frequency: 432,
      waveform:
        type === 'synth'
          ? 'analog'
          : type === 'ambient'
          ? 'ocean_soft'
          : type === 'noise'
          ? 'white'
          : 'sine',
      volume: 0.5,
      pan: 0,
      enabled: true,
      pulseRate: 0,
      pulseDepth: 0,
      detune: 1,
      phaseShift: 0,
      filterEnabled: !isOsc,
      filter: { type: 'lowpass', frequency: 20000, Q: 1 }
    };
    if (type === 'noise') newLayer.frequency = 0;
    setLayers([...layers, newLayer]);
    setSelectedLayerId(newLayer.id);
  };

  const updateLayer = (id, updates) => {
    setLayers(layers.map((l) => (l.id === id ? { ...l, ...updates } : l)));
  };

  const deleteLayer = (id) => {
    setLayers(layers.filter((l) => l.id !== id));
    if (selectedLayerId === id) setSelectedLayerId(null);
  };

  const handleSaveProject = async () => {
    setIsSaving(true);
    try {
      await db.presets.create({
        name: projectName,
        description: 'Created in AuraEditor',
        color: 'linear-gradient(135deg, #0f172a, #10b981)',
        layers: layers.map((l) => ({
          type: l.type,
          frequency: l.frequency,
          waveform: l.waveform,
          volume: l.volume,
          pan: l.pan,
          enabled: l.enabled,
          pulseRate: l.pulseRate,
          pulseDepth: l.pulseDepth,
          detune: l.detune,
          phaseShift: l.phaseShift,
          filter: l.filter,
          filterEnabled: l.filterEnabled
        }))
      });
      toast.success('Project saved to Aura Modes!');
      setTimeout(() => navigate('/AuraModes'), 1500);
    } catch (error) {
      toast.error('Failed to save project');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportWAV = async () => {
    setIsExporting(true);
    try {
      const exportDuration = Math.min(currentTime + 60, duration);
      const offlineCtx = new OfflineAudioContext(2, exportDuration * 44100, 44100);

      for (const layer of layers) {
        if (!layer.enabled) continue;
        const volFactor =
          layer.type === 'noise' ? 0.6 :
          layer.type === 'ambient' ? 0.65 :
          1;
        const gain = offlineCtx.createGain();
        gain.gain.value = (layer.volume ?? 0.5) * volFactor;
        gain.connect(offlineCtx.destination);

        if (layer.type === 'oscillator') {
          const osc = offlineCtx.createOscillator();
          osc.type = layer.waveform;
          osc.frequency.value = layer.frequency;
          osc.connect(gain);
          osc.start(0);
        } else if (layer.type === 'noise') {
          const buffer = createNoiseBuffer(offlineCtx, layer.waveform);
          const src = offlineCtx.createBufferSource();
          src.buffer = buffer;
          src.loop = true;
          src.connect(gain);
          src.start(0);
        }
      }

      const renderedBuffer = await offlineCtx.startRendering();
      const wavBlob = bufferToWave(renderedBuffer, renderedBuffer.length);
      const url = URL.createObjectURL(wavBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectName.replace(/\s+/g, '_')}.wav`;
      a.click();
      toast.success('Audio exported!');
    } catch (error) {
      toast.error('Export failed');
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  const selectedLayer = layers.find((l) => l.id === selectedLayerId);

  const num = (v) => (typeof v === 'number' && !isNaN(v) ? v : 0);

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col bg-[#0a0a0a] overflow-hidden">
      {/* Top Bar */}
      <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-[#0a0a0a]/50 backdrop-blur-xl shrink-0 z-20">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-emerald-400" /> AuraEditor
          </h1>
          <Input
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="w-48 h-8 text-sm bg-white/5 border-white/10"
            placeholder="Project Name"
          />
          <div className="h-6 w-px bg-white/10 mx-2"></div>
          <div className="flex items-center gap-1 bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d] rounded-lg p-2 border border-white/10 shadow-lg">
            <Button
              size="sm"
              variant="ghost"
              className="h-9 w-9 hover:bg-white/10 p-0"
              onClick={() => setCurrentTime(Math.max(0, currentTime - 10))}
            >
              <SkipBack className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className={cn(
                'h-10 w-10 rounded-full hover:bg-white/10 p-0 transition-all',
                isPlaying && 'bg-emerald-500/20 text-emerald-400'
              )}
              onClick={() => {
                setIsPlaying(!isPlaying);
              }}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-9 w-9 hover:bg-white/10 p-0 text-red-400/70 hover:text-red-400"
              onClick={() => {
                setIsPlaying(false);
                setCurrentTime(0);
              }}
            >
              <Square className="w-3.5 h-3.5 fill-current" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-9 w-9 hover:bg-white/10 p-0"
              onClick={() => setCurrentTime(Math.min(duration, currentTime + 10))}
            >
              <SkipForward className="w-4 h-4" />
            </Button>
            <div className="h-6 w-px bg-white/10 mx-1"></div>
            <div className="px-3 font-mono text-xs text-emerald-400 min-w-[140px] text-center">
              {new Date(currentTime * 1000).toISOString().substr(11, 8)} /{' '}
              {new Date(duration * 1000).toISOString().substr(11, 8)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-white/10 text-gray-400 hover:text-white"
            onClick={handleExportWAV}
            disabled={isExporting || layers.length === 0}
          >
            <Download className="w-4 h-4" /> {isExporting ? 'Exporting...' : 'Export WAV'}
          </Button>
          <Button
            className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-black"
            onClick={handleSaveProject}
            disabled={isSaving || layers.length === 0}
          >
            <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save Project'}
          </Button>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Library Panel (Left) */}
        <div className="w-64 border-r border-white/10 flex flex-col bg-[#0d0d0d]">
          <div className="p-4 border-b border-white/10">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              Library
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="justify-start text-xs border-white/10 h-9"
                onClick={() => addLayer('oscillator')}
              >
                <Activity className="w-3 h-3 mr-1.5 text-emerald-400" />{' '}
                <span className="text-white">Frequency</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="justify-start text-xs border-white/10 h-9"
                onClick={() => addLayer('noise')}
              >
                <Waves className="w-3 h-3 mr-1.5 text-purple-400" />{' '}
                <span className="text-white">Noise</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="justify-start text-xs border-white/10 h-9"
                onClick={() => addLayer('synth')}
              >
                <Zap className="w-3 h-3 mr-1.5 text-yellow-400" />{' '}
                <span className="text-white">Synths</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="justify-start text-xs border-white/10 h-9"
                onClick={() => addLayer('ambient')}
              >
                <Wind className="w-3 h-3 mr-1.5 text-blue-400" />{' '}
                <span className="text-white">Ambient</span>
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {layers.map((layer) => (
              <div
                key={layer.id}
                onClick={() => setSelectedLayerId(layer.id)}
                className={cn(
                  'p-2 rounded-lg border transition-all cursor-pointer group relative',
                  selectedLayerId === layer.id
                    ? 'bg-white/10 border-emerald-500/50'
                    : 'bg-black/20 border-white/5 hover:bg-white/5'
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  {editingLayerName === layer.id ? (
                    <Input
                      value={layer.name}
                      onChange={(e) =>
                        updateLayer(layer.id, { name: e.target.value })
                      }
                      onBlur={() => setEditingLayerName(null)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') setEditingLayerName(null);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="h-6 text-sm bg-white/10 border-white/20 px-2"
                      autoFocus
                    />
                  ) : (
                    <span
                      className="text-sm font-medium truncate max-w-[120px] cursor-text hover:text-emerald-400"
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setEditingLayerName(layer.id);
                      }}
                    >
                      {layer.name}
                    </span>
                  )}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-5 w-5"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateLayer(layer.id, { enabled: !layer.enabled });
                      }}
                    >
                      <Activity
                        className={cn(
                          'w-3 h-3',
                          layer.enabled ? 'text-emerald-400' : 'text-gray-600'
                        )}
                      />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-5 w-5 hover:text-red-400"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteLayer(layer.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500"
                      style={{ width: `${(layer.volume ?? 0.5) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline (Center) */}
        <div className="flex-1 bg-[#080808] relative overflow-hidden flex flex-col">
          <div
            ref={timelineScrollRef}
            className="h-12 border-b border-white/10 bg-[#0a0a0a] overflow-hidden"
          >
            <div className="relative h-full" style={{ width: '100%' }}>
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 border-l border-white/5 text-[10px] text-gray-600 pl-1 pt-1"
                  style={{ left: `${i * 5}%` }}
                >
                  {i * 60}s
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2 relative overflow-x-auto">
            <div className="relative min-w-full" style={{ width: `${duration * 10}px` }}>
              <div
                className="absolute top-0 bottom-0 w-px bg-red-500 z-10 pointer-events-none"
                style={{ left: `${currentTime * 10}px` }}
              ></div>

              {layers.map((layer) => {
                let color = '#10b981';
                if (layer.type === 'noise') color = '#c084fc';
                if (layer.type === 'synth') color = '#facc15';
                if (layer.type === 'ambient') color = '#60a5fa';

                return (
                  <div
                    key={layer.id}
                    className="h-24 bg-white/5 border border-white/10 rounded-lg relative group overflow-hidden mb-2"
                  >
                    <div className="absolute inset-0">
                      <WaveformVisualizer
                        type={layer.type}
                        waveform={layer.waveform}
                        isPlaying={isPlaying && layer.enabled}
                        color={color}
                      />
                    </div>
                    <div className="absolute top-2 left-2 text-xs font-bold text-white/50 z-10 drop-shadow-md">
                      {layer.name}
                    </div>
                  </div>
                );
              })}

              {layers.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-gray-600 mt-20">
                  <Activity className="w-12 h-12 mb-4 opacity-20" />
                  <p>Add a layer to start building your aura.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Effects Panel (Right) */}
        <div
          className={cn(
            'border-l border-white/10 bg-[#0d0d0d] flex flex-col overflow-y-auto transition-all duration-300',
            isInspectorCollapsed ? 'w-12' : 'w-80'
          )}
        >
          <div className="h-12 border-b border-white/10 flex items-center justify-between px-3 shrink-0">
            {!isInspectorCollapsed && (
              <span className="text-xs font-bold text-gray-500 uppercase">
                Effects
              </span>
            )}
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => setIsInspectorCollapsed(!isInspectorCollapsed)}
            >
              {isInspectorCollapsed ? (
                <ChevronLeft className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </Button>
          </div>

          {!isInspectorCollapsed &&
            (selectedLayer ? (
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">
                    {selectedLayer.name}
                  </h3>
                  <div className="flex gap-2 items-center">
                    <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30 uppercase">
                      {selectedLayer.type}
                    </span>
                  </div>
                </div>

                {/* SOURCE */}
                <div className="space-y-3 border-t border-white/10 pt-4">
                  <button
                    type="button"
                    onClick={() => toggleSection('source')}
                    className="w-full flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider"
                  >
                    <span className="flex items-center gap-2">
                      <Zap className="w-3 h-3" /> Source
                    </span>
                    {sectionOpen.source ? (
                      <ChevronUpMini />
                    ) : (
                      <ChevronDownMini />
                    )}
                  </button>

                  {sectionOpen.source && (
                    <>
                      {(selectedLayer.type === 'oscillator' ||
                        selectedLayer.type === 'synth') && (
                        <div className="space-y-3 mt-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">Frequency</span>
                            <Input
                              type="number"
                              value={num(selectedLayer.frequency)}
                              onChange={(e) => {
                                const v = parseFloat(e.target.value);
                                if (isNaN(v)) return;
                                updateLayer(selectedLayer.id, { frequency: v });
                              }}
                              className="w-24 h-7 text-right text-xs"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Slider
                              value={[num(selectedLayer.frequency)]}
                              min={0.1}
                              max={1000}
                              step={0.1}
                              onValueChange={(v) =>
                                updateLayer(selectedLayer.id, { frequency: v[0] })
                              }
                              className="flex-1"
                            />
                          </div>

                          <div className="flex justify-between items-center pt-2">
                            <span className="text-sm text-gray-400">Type</span>
                            <Select
                              value={selectedLayer.waveform}
                              onValueChange={(v) =>
                                updateLayer(selectedLayer.id, { waveform: v })
                              }
                            >
                              <SelectTrigger className="w-36 h-7 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {selectedLayer.type === 'oscillator' ? (
                                  <>
                                    <SelectItem value="sine">Sine</SelectItem>
                                    <SelectItem value="square">Square</SelectItem>
                                    <SelectItem value="sawtooth">Sawtooth</SelectItem>
                                    <SelectItem value="triangle">Triangle</SelectItem>
                                  </>
                                ) : (
                                  <>
                                    {SYNTH_TYPES.map((t) => (
                                      <SelectItem key={t} value={t}>
                                        {t.charAt(0).toUpperCase() + t.slice(1)}
                                      </SelectItem>
                                    ))}
                                  </>
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}

                      {selectedLayer.type === 'noise' && (
                        <div className="space-y-3 mt-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">Noise Type</span>
                            <Select
                              value={selectedLayer.waveform}
                              onValueChange={(v) =>
                                updateLayer(selectedLayer.id, { waveform: v })
                              }
                            >
                              <SelectTrigger className="w-36 h-7 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {NOISE_TYPES.map((t) => (
                                  <SelectItem key={t} value={t}>
                                    {t.charAt(0).toUpperCase() + t.slice(1)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}

                      {selectedLayer.type === 'ambient' && (
                        <div className="space-y-2 mt-2">
                          <span className="text-sm text-gray-400">
                            Ambient Category
                          </span>
                          <div className="space-y-1 rounded-md border border-white/10 bg-black/20 p-1">
                            {Object.entries(AMBIENT_GROUPS).map(([key, group]) => {
                              const open = ambientOpen[key];
                              return (
                                <div key={key} className="rounded-md">
                                  <button
                                    type="button"
                                    onClick={() => toggleAmbientGroup(key)}
                                    className="w-full flex items-center justify-between px-2 py-1 text-xs text-gray-200 hover:bg-white/5 rounded-md"
                                  >
                                    <span>{group.label}</span>
                                    {open ? (
                                      <ChevronUpMini />
                                    ) : (
                                      <ChevronDownMini />
                                    )}
                                  </button>
                                  {open && (
                                    <div className="pl-3 pb-1 pt-1 space-y-1">
                                      {group.variants.map((v) => {
                                        const isActive =
                                          selectedLayer.waveform === v.value;
                                        return (
                                          <button
                                            key={v.value}
                                            type="button"
                                            onClick={() =>
                                              updateLayer(selectedLayer.id, {
                                                waveform: v.value,
                                              })
                                            }
                                            className={cn(
                                              'w-full text-left text-xs px-2 py-1 rounded-md',
                                              isActive
                                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                                : 'text-gray-300 hover:bg-white/5'
                                            )}
                                          >
                                            {v.label}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Filter */}
                <div className="space-y-3 border-t border-white/10 pt-4">
                  <button
                    type="button"
                    onClick={() => toggleSection('filter')}
                    className="w-full flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider"
                  >
                    <span className="flex items-center gap-2">
                      <Wind className="w-3 h-3" /> Filter
                    </span>
                    {sectionOpen.filter ? (
                      <ChevronUpMini />
                    ) : (
                      <ChevronDownMini />
                    )}
                  </button>

                  {sectionOpen.filter && (
                    <>
                      <div className="flex items-center justify-between mt-1">
                        {selectedLayer.type === 'oscillator' && (
                          <button
                            className={cn(
                              "px-2 py-0.5 rounded text-[10px] border",
                              selectedLayer.filterEnabled
                                ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                                : "bg-black/40 border-white/10 text-gray-400"
                            )}
                            onClick={() =>
                              updateLayer(selectedLayer.id, {
                                filterEnabled: !selectedLayer.filterEnabled
                              })
                            }
                          >
                            Filter: {selectedLayer.filterEnabled ? "On" : "Off"}
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <div className="space-y-2">
                          <span className="text-xs text-gray-400">Cutoff</span>
                          <div className="flex items-center gap-2">
                            <Slider
                              value={[num(selectedLayer.filter?.frequency || 20000)]}
                              min={20}
                              max={20000}
                              step={10}
                              onValueChange={(v) =>
                                updateLayer(selectedLayer.id, {
                                  filter: {
                                    ...(selectedLayer.filter || {}),
                                    frequency: v[0]
                                  }
                                })
                              }
                              className="flex-1"
                            />
                            <Input
                              type="number"
                              value={num(selectedLayer.filter?.frequency || 20000)}
                              min={20}
                              max={20000}
                              onChange={(e) => {
                                const v = parseFloat(e.target.value);
                                if (isNaN(v)) return;
                                const clamped = Math.min(20000, Math.max(20, v));
                                updateLayer(selectedLayer.id, {
                                  filter: {
                                    ...(selectedLayer.filter || {}),
                                    frequency: clamped
                                  }
                                });
                              }}
                              className="w-16 h-7 text-xs text-right"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <span className="text-xs text-gray-400">Resonance</span>
                          <div className="flex items-center gap-2">
                            <Slider
                              value={[num(selectedLayer.filter?.Q || 1)]}
                              min={0.1}
                              max={20}
                              step={0.1}
                              onValueChange={(v) =>
                                updateLayer(selectedLayer.id, {
                                  filter: {
                                    ...(selectedLayer.filter || {}),
                                    Q: v[0]
                                  }
                                })
                              }
                              className="flex-1"
                            />
                            <Input
                              type="number"
                              value={num(selectedLayer.filter?.Q || 1).toFixed(1)}
                              min={0.1}
                              max={20}
                              step={0.1}
                              onChange={(e) => {
                                const v = parseFloat(e.target.value);
                                if (isNaN(v)) return;
                                const clamped = Math.min(20, Math.max(0.1, v));
                                updateLayer(selectedLayer.id, {
                                  filter: {
                                    ...(selectedLayer.filter || {}),
                                    Q: clamped
                                  }
                                });
                              }}
                              className="w-16 h-7 text-xs text-right"
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Pulse */}
                <div className="space-y-3 border-t border-white/10 pt-4">
                  <button
                    type="button"
                    onClick={() => toggleSection('pulse')}
                    className="w-full flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider"
                  >
                    <span className="flex items-center gap-2">
                      <Activity className="w-3 h-3" /> Pulse (LFO)
                    </span>
                    {sectionOpen.pulse ? (
                      <ChevronUpMini />
                    ) : (
                      <ChevronDownMini />
                    )}
                  </button>

                  {sectionOpen.pulse && (
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div className="space-y-2">
                        <span className="text-xs text-gray-400">Rate (Hz)</span>
                        <div className="flex items-center gap-2">
                          <Slider
                            value={[num(selectedLayer.pulseRate)]}
                            min={0}
                            max={20}
                            step={0.1}
                            onValueChange={(v) =>
                              updateLayer(selectedLayer.id, { pulseRate: v[0] })
                            }
                            className="flex-1"
                          />
                          <Input
                            type="number"
                            value={num(selectedLayer.pulseRate).toFixed(1)}
                            min={0}
                            max={20}
                            step={0.1}
                            onChange={(e) => {
                              const v = parseFloat(e.target.value);
                              if (isNaN(v)) return;
                              const clamped = Math.min(20, Math.max(0, v));
                              updateLayer(selectedLayer.id, { pulseRate: clamped });
                            }}
                            className="w-12 h-6 text-xs px-1 text-right"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <span className="text-xs text-gray-400">Depth</span>
                        <div className="flex items-center gap-2">
                          <Slider
                            value={[num(selectedLayer.pulseDepth)]}
                            min={0}
                            max={1}
                            step={0.01}
                            onValueChange={(v) =>
                              updateLayer(selectedLayer.id, { pulseDepth: v[0] })
                            }
                            className="flex-1"
                          />
                          <Input
                            type="number"
                            value={num(selectedLayer.pulseDepth).toFixed(2)}
                            min={0}
                            max={1}
                            step={0.01}
                            onChange={(e) => {
                              const v = parseFloat(e.target.value);
                              if (isNaN(v)) return;
                              const clamped = Math.min(1, Math.max(0, v));
                              updateLayer(selectedLayer.id, { pulseDepth: clamped });
                            }}
                            className="w-12 h-6 text-xs px-1 text-right"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Mix */}
                <div className="space-y-3 border-t border-white/10 pt-4">
                  <button
                    type="button"
                    onClick={() => toggleSection('mix')}
                    className="w-full flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider"
                  >
                    <span className="flex items-center gap-2">
                      <Volume2 className="w-3 h-3" /> Mix
                    </span>
                    {sectionOpen.mix ? (
                      <ChevronUpMini />
                    ) : (
                      <ChevronDownMini />
                    )}
                  </button>

                  {sectionOpen.mix && (
                    <div className="space-y-4 mt-2">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-400">Volume</span>
                          <span className="text-xs font-mono">
                            {Math.round((selectedLayer.volume ?? 0.5) * 100)}%
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Slider
                            value={[num(selectedLayer.volume ?? 0.5)]}
                            min={0}
                            max={1}
                            step={0.01}
                            onValueChange={(v) =>
                              updateLayer(selectedLayer.id, { volume: v[0] })
                            }
                            className="flex-1"
                          />
                          <Input
                            type="number"
                            value={num(selectedLayer.volume ?? 0.5).toFixed(2)}
                            min={0}
                            max={1}
                            step={0.01}
                            onChange={(e) => {
                              const v = parseFloat(e.target.value);
                              if (isNaN(v)) return;
                              const clamped = Math.min(1, Math.max(0, v));
                              updateLayer(selectedLayer.id, { volume: clamped });
                            }}
                            className="w-16 h-7 text-xs text-right"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-400">Pan</span>
                          <span className="text-xs font-mono">
                            {selectedLayer.pan}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Slider
                            value={[num(selectedLayer.pan)]}
                            min={-1}
                            max={1}
                            step={0.01}
                            onValueChange={(v) =>
                              updateLayer(selectedLayer.id, { pan: v[0] })
                            }
                            className="flex-1"
                          />
                          <Input
                            type="number"
                            value={num(selectedLayer.pan).toFixed(2)}
                            min={-1}
                            max={1}
                            step={0.01}
                            onChange={(e) => {
                              const v = parseFloat(e.target.value);
                              if (isNaN(v)) return;
                              const clamped = Math.min(1, Math.max(-1, v));
                              updateLayer(selectedLayer.id, { pan: clamped });
                            }}
                            className="w-16 h-7 text-xs text-right"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-400">
                            Binaural Phase
                          </span>
                          <span className="text-xs font-mono">
                            {selectedLayer.phaseShift}°
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Slider
                            value={[num(selectedLayer.phaseShift)]}
                            min={0}
                            max={360}
                            step={1}
                            onValueChange={(v) =>
                              updateLayer(selectedLayer.id, { phaseShift: v[0] })
                            }
                            className="flex-1"
                          />
                          <Input
                            type="number"
                            value={num(selectedLayer.phaseShift).toFixed(0)}
                            min={0}
                            max={360}
                            step={1}
                            onChange={(e) => {
                              const v = parseInt(e.target.value, 10);
                              if (isNaN(v)) return;
                              const clamped = Math.min(360, Math.max(0, v));
                              updateLayer(selectedLayer.id, {
                                phaseShift: clamped
                              });
                            }}
                            className="w-16 h-7 text-xs text-right"
                          />
                        </div>
                        <p className="text-[10px] text-gray-600">
                          0°=Left, 90°=Center, 180°=Right
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* FX */}
                <div className="space-y-3 border-t border-white/10 pt-4 pb-4">
                  <button
                    type="button"
                    onClick={() => toggleSection('fx')}
                    className="w-full flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider"
                  >
                    <span className="flex items-center gap-2">
                      <Waves className="w-3 h-3" /> Effects
                    </span>
                    {sectionOpen.fx ? (
                      <ChevronUpMini />
                    ) : (
                      <ChevronDownMini />
                    )}
                  </button>

                  {sectionOpen.fx && (
                    <div className="space-y-4 mt-2">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-400">Reverb</span>
                          <span className="text-xs font-mono">
                            {Math.round(reverbWet * 100)}%
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Slider
                            value={[num(reverbWet)]}
                            min={0}
                            max={1}
                            step={0.01}
                            onValueChange={(v) => setReverbWet(v[0])}
                            className="flex-1"
                          />
                          <Input
                            type="number"
                            value={num(reverbWet).toFixed(2)}
                            min={0}
                            max={1}
                            step={0.01}
                            onChange={(e) => {
                              const v = parseFloat(e.target.value);
                              if (isNaN(v)) return;
                              const clamped = Math.min(1, Math.max(0, v));
                              setReverbWet(clamped);
                            }}
                            className="w-16 h-7 text-xs text-right"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-400">Delay</span>
                          <span className="text-xs font-mono">
                            {Math.round(delayWet * 100)}%
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Slider
                            value={[num(delayWet)]}
                            min={0}
                            max={1}
                            step={0.01}
                            onValueChange={(v) => setDelayWet(v[0])}
                            className="flex-1"
                          />
                          <Input
                            type="number"
                            value={num(delayWet).toFixed(2)}
                            min={0}
                            max={1}
                            step={0.01}
                            onChange={(e) => {
                              const v = parseFloat(e.target.value);
                              if (isNaN(v)) return;
                              const clamped = Math.min(1, Math.max(0, v));
                              setDelayWet(clamped);
                            }}
                            className="w-16 h-7 text-xs text-right"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-400">Delay Time</span>
                          <span className="text-xs font-mono">
                            {delayTime.toFixed(2)}s
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Slider
                            value={[num(delayTime)]}
                            min={0.01}
                            max={2}
                            step={0.01}
                            onValueChange={(v) => setDelayTime(v[0])}
                            className="flex-1"
                          />
                          <Input
                            type="number"
                            value={num(delayTime).toFixed(2)}
                            min={0.01}
                            max={2}
                            step={0.01}
                            onChange={(e) => {
                              const v = parseFloat(e.target.value);
                              if (isNaN(v)) return;
                              const clamped = Math.min(2, Math.max(0.01, v));
                              setDelayTime(clamped);
                            }}
                            className="w-16 h-7 text-xs text-right"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-600 p-8 textcenter">
                <Sliders className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-sm">
                  Select a layer to edit its properties, or add a new one from the
                  library.
                </p>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

// Tiny inline chevrons for section headers
function ChevronUpMini() {
  return <ChevronUpIcon className="w-3 h-3 text-gray-400" />;
}
function ChevronDownMini() {
  return <ChevronDownIcon className="w-3 h-3 text-gray-400" />;
}

// Reuse lucide's chevrons via aliases
function ChevronUpIcon(props) {
  return <ChevronLeft {...props} className={cn(props.className, "rotate-90")} />;
}
function ChevronDownIcon(props) {
  return <ChevronLeft {...props} className={cn(props.className, "-rotate-90")} />;
}