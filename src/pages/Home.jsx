import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../components/utils';
import {
  ArrowRight,
  Layers,
  SlidersHorizontal,
  Activity,
  Music,
  Moon,
  Brain,
  Shield,
  HeartPulse,
  Sparkles,
  Flame,
  Download,
  X,
} from 'lucide-react';
import { motion } from 'framer-motion';
import usePWAInstall from '../hooks/usePWAInstall';

const quickModes = [
  { id: 'm_deep_sleep', title: 'Deep Sleep', subtitle: 'Downshift and shut off mental noise.', icon: Moon },
  { id: 'm_theta_gate', title: 'Theta Gate', subtitle: 'Meditation depth and inner stillness.', icon: Sparkles },
  { id: 'm_focus_forge', title: 'Focus Forge', subtitle: 'Clean focus for work and creation.', icon: Brain },
  { id: 'm_heart_coherence', title: 'Heart Coherence', subtitle: 'Steady the rhythm of your field.', icon: HeartPulse },
  { id: 'm_shielded_calm', title: 'Shielded Calm', subtitle: 'Smooth the edges and stabilize.', icon: Shield },
  { id: 'm_energy_ignition', title: 'Energy Ignition', subtitle: 'Wake up the system without chaos.', icon: Flame },
];

export default function Home() {
  const modesUrl = createPageUrl('AuraModes');
  const studioUrl = createPageUrl('AuraEditor');
  const navigate = useNavigate();
  const { canShowInstall, isInstallable, promptInstall } = usePWAInstall();

  const [installBannerDismissed, setInstallBannerDismissed] = useState(() => {
    try {
      return localStorage.getItem('auralab_install_banner_dismissed') === '1';
    } catch {
      return false;
    }
  });

  const showInstallBanner = useMemo(() => {
    return canShowInstall && !installBannerDismissed;
  }, [canShowInstall, installBannerDismissed]);

  const dismissInstallBanner = () => {
    setInstallBannerDismissed(true);
    try {
      localStorage.setItem('auralab_install_banner_dismissed', '1');
    } catch {
      // ignore
    }
  };

  const handleInstallClick = async () => {
    if (isInstallable) {
      await promptInstall();
      dismissInstallBanner();
      return;
    }
    navigate('/Install');
  };

  return (
    <div className="w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-10">
        <section className="relative">
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-[520px] h-[520px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative z-10"
          >
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Choose a Mode. Start Now.
            </h1>
            <p className="mt-2 text-sm sm:text-base text-gray-400 max-w-2xl">
              Sleep, focus, calm, energy — one tap to enter a state. Studio is here when you want full control.
            </p>

            {/* One-time Home install banner */}
            {showInstallBanner && (
              <div className="mt-4 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                      Install AuraLab for faster launch
                    </div>
                    <div className="mt-1 text-xs sm:text-sm text-gray-400 max-w-2xl">
                      Add AuraLab to your device for a cleaner, app-like experience.
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={dismissInstallBanner}
                    aria-label="Dismiss"
                    className="shrink-0 rounded-2xl p-2 text-gray-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-4 flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={handleInstallClick}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 bg-emerald-500 text-black font-extrabold text-sm sm:text-base shadow-lg shadow-emerald-500/20"
                  >
                    <Download className="w-5 h-5" /> Install
                  </button>

                  <Link to="/Install" className="inline-flex">
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-2xl px-4 py-3 bg-white/10 text-white font-bold text-sm sm:text-base hover:bg-white/15 border border-white/10 transition-all"
                    >
                      Install help
                    </button>
                  </Link>
                </div>
              </div>
            )}

            <div className="mt-5 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:gap-3">
              <Link to={modesUrl} className="min-w-0">
                <button className="w-full px-4 py-3 rounded-2xl bg-white text-black font-bold text-sm sm:text-base hover:scale-[1.02] transition-transform flex items-center justify-center gap-2">
                  <Layers className="w-5 h-5" /> Start a Mode
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>

              <Link to={studioUrl} className="min-w-0">
                <button className="w-full px-4 py-3 rounded-2xl bg-white/10 text-white font-bold text-sm sm:text-base hover:bg-white/15 border border-white/10 backdrop-blur-sm transition-all flex items-center justify-center gap-2">
                  <SlidersHorizontal className="w-5 h-5" /> Open Studio
                </button>
              </Link>

              <Link to={createPageUrl('AuraGenerator')} className="min-w-0">
                <button className="w-full px-4 py-3 rounded-2xl bg-zinc-900/60 text-white font-semibold text-sm hover:bg-zinc-900 border border-white/10 transition-all flex items-center justify-center gap-2">
                  <Activity className="w-5 h-5" /> Generator
                </button>
              </Link>

              <Link to={createPageUrl('AuraConverter')} className="min-w-0">
                <button className="w-full px-4 py-3 rounded-2xl bg-zinc-900/60 text-white font-semibold text-sm hover:bg-zinc-900 border border-white/10 transition-all flex items-center justify-center gap-2">
                  <Music className="w-5 h-5" /> Converter
                </button>
              </Link>
            </div>
          </motion.div>
        </section>

        <section className="space-y-3">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white">Featured Modes</h2>
              <p className="text-xs text-gray-400">
                Tap a card to start immediately. Headphones recommended for binaural modes.
              </p>
            </div>
            <Link
              to={modesUrl}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors whitespace-nowrap"
            >
              View all
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {quickModes.map((m) => {
              const Icon = m.icon;
              return (
                <Link key={m.id} to={`${modesUrl}?activate=${encodeURIComponent(m.id)}`} className="group">
                  <div className="p-4 rounded-3xl bg-gradient-to-br from-gray-900 to-black border border-white/10 hover:border-emerald-500/40 transition-colors overflow-hidden">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                          <Icon className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-white font-bold truncate">{m.title}</div>
                          <div className="text-xs text-gray-400 truncate">{m.subtitle}</div>
                        </div>
                      </div>

                      <div className="w-9 h-9 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors shrink-0">
                        <ArrowRight className="w-4 h-4 text-white/70 group-hover:text-white" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="grid md:grid-cols-3 gap-3">
          <Link to={modesUrl} className="group md:col-span-1">
            <div className="h-full p-5 rounded-3xl bg-gradient-to-br from-gray-900 to-black border border-white/10 hover:border-amber-500/40 transition-colors">
              <div className="text-white font-bold">Aura Modes</div>
              <div className="mt-1 text-xs text-gray-400">
                Curated presets built for states: sleep, focus, calm, energy.
              </div>
              <div className="mt-3 text-xs font-semibold text-amber-400 group-hover:text-amber-300 transition-colors">
                Open Modes →
              </div>
            </div>
          </Link>

          <Link to={studioUrl} className="group md:col-span-2">
            <div className="h-full p-5 rounded-3xl bg-gradient-to-br from-gray-900 to-black border border-white/10 hover:border-emerald-500/40 transition-colors">
              <div className="text-white font-bold">Aura Studio</div>
              <div className="mt-1 text-xs text-gray-400">
                Layer synth, noise, ambience, effects — build and save your own field architecture.
              </div>
              <div className="mt-3 text-xs font-semibold text-emerald-400 group-hover:text-emerald-300 transition-colors">
                Open Studio →
              </div>
            </div>
          </Link>
        </section>
      </div>
    </div>
  );
}
