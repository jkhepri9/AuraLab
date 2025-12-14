import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../components/utils';
import {
  ArrowRight, Layers, SlidersHorizontal, Activity, Music, Moon, Brain, Shield,
  HeartPulse, Sparkles, Flame, Download, X,
} from 'lucide-react';
import { motion } from 'framer-motion';
import usePWAInstall from '../hooks/usePWAInstall';
import FEATURED_PRESETS from '../data/presets/featuredPresets';
import { fanFavoritesPresets } from '../data/presets/fanFavoritesPresets';

const quickModes = [
  { id: 'm_deep_sleep', title: 'Deep Sleep', subtitle: 'Downshift and shut off mental noise.', icon: Moon },
  { id: 'm_theta_gate', title: 'Theta Gate', subtitle: 'Meditation depth and inner stillness.', icon: Sparkles },
  { id: 'm_focus_forge', title: 'Focus Forge', subtitle: 'Clean focus for work and creation.', icon: Brain },
  { id: 'm_heart_coherence', title: 'Heart Coherence', subtitle: 'Steady the rhythm of your field.', icon: HeartPulse },
  { id: 'c_stress_relief', title: 'Stress Relief', subtitle: 'Calm the nervous system and ease tension.', icon: Shield },
  { id: 'm_energy_ignition', title: 'Energy Ignition', subtitle: 'Wake up the system without chaos.', icon: Flame },
];

const DEFAULT_TINT = 'linear-gradient(135deg, rgba(16,185,129,.35), rgba(0,0,0,.85))';

const buildMetaMap = (arr) => {
  const m = new Map();
  for (const p of arr || []) {
    m.set(p.id, { imageUrl: p.imageUrl, color: p.color, name: p.name, description: p.description, order: p.order });
  }
  return m;
};

const ModeCard = ({ id, title, subtitle, Icon, meta, modesUrl }) => {
  const bgImage = meta?.imageUrl || null;
  const tint = meta?.color || DEFAULT_TINT;

  return (
    <Link to={`${modesUrl}?activate=${encodeURIComponent(id)}`} className="group">
      <div className="relative p-4 rounded-3xl border border-white/10 hover:border-emerald-500/40 transition-all overflow-hidden bg-black/40">
        {bgImage && (
          <div
            className="absolute inset-0 bg-cover bg-center scale-[1.02] group-hover:scale-[1.05] transition-transform duration-500"
            style={{ backgroundImage: `url(${bgImage})` }}
          />
        )}

        <div
          className="absolute inset-0 opacity-70"
          style={{
            background:
              typeof tint === 'string' && tint.includes('gradient')
                ? tint
                : `linear-gradient(135deg, ${tint || '#10b981'}, #000000)`,
          }}
        />
        <div className="absolute inset-0 bg-black/55 group-hover:bg-black/45 transition-colors" />

        <div className="relative flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-sm flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5 text-white/90" />
            </div>
            <div className="min-w-0">
              <div className="text-white font-extrabold truncate">{title}</div>
              <div className="text-xs text-white/70 truncate">{subtitle}</div>
            </div>
          </div>

          <div className="w-9 h-9 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/15 transition-colors shrink-0">
            <ArrowRight className="w-4 h-4 text-white/80 group-hover:text-white" />
          </div>
        </div>
      </div>
    </Link>
  );
};

export default function Home() {
  const modesUrl = createPageUrl('AuraModes');
  const studioUrl = createPageUrl('AuraEditor');
  const navigate = useNavigate();
  const { canShowInstall, isInstallable, promptInstall } = usePWAInstall();

  const featuredMetaById = useMemo(() => buildMetaMap(FEATURED_PRESETS), []);
  const fanMetaById = useMemo(() => buildMetaMap(fanFavoritesPresets), []);

  const fanFavoritesCards = useMemo(() => {
    const iconById = {
      c_flowstate: Sparkles,
      c_stress_relief_ff: Shield,
      c_creative_flow: Flame,
      c_shuman_resonance: Activity,
      c_golden_ratio_focus: SlidersHorizontal,
      c_stargate_aura: Sparkles,
      c_heart: HeartPulse,
      c_rest_and_restoration: Moon,
    };

    const subtitleById = {
      c_flowstate: 'Effortless flow and steady attention.',
      c_stress_relief_ff: 'Downshift stress while staying productive.',
      c_creative_flow: 'Creative ignition without chaos.',
      c_shuman_resonance: 'Grounded focus at 7.83 Hz.',
      c_golden_ratio_focus: 'Phi/Fibonacci coherence for cognition.',
      c_stargate_aura: 'High-energy portal focus.',
      c_heart: 'Heart-led calm focus.',
      c_rest_and_restoration: 'Deep recovery and reset.',
    };

    const list = Array.isArray(fanFavoritesPresets) ? [...fanFavoritesPresets] : [];
    list.sort((a, b) => (a?.order ?? 9999) - (b?.order ?? 9999));

    return list.map((p) => ({
      id: p.id,
      title: p.name,
      subtitle: subtitleById[p.id] || p.description || '',
      icon: iconById[p.id] || Sparkles,
    }));
  }, []);

  const [installBannerDismissed, setInstallBannerDismissed] = useState(() => {
    try {
      return localStorage.getItem('auralab_install_banner_dismissed') === '1';
    } catch {
      return false;
    }
  });

  const showInstallBanner = useMemo(
    () => canShowInstall && !installBannerDismissed,
    [canShowInstall, installBannerDismissed]
  );

  const dismissInstallBanner = () => {
    setInstallBannerDismissed(true);
    try {
      localStorage.setItem('auralab_install_banner_dismissed', '1');
    } catch {}
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
              Tune Your Aura. Enter Your State.
            </h1>
            <p className="mt-2 text-sm sm:text-base text-gray-400 max-w-2xl">
              Step into curated frequency rituals for focus, calm, energy, and deep rest. One tap to align your field.
            </p>

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
                  <Layers className="w-5 h-5" /> Start a Mode <ArrowRight className="w-4 h-4" />
                </button>
              </Link>

              <Link to={studioUrl} className="min-w-0">
                <button className="w-full px-4 py-3 rounded-2xl bg-white/10 text-white font-bold text-sm sm:text-base hover:bg-white/15 border border-white/10 backdrop-blur-sm transition-all flex items-center justify-center gap-2">
                  <SlidersHorizontal className="w-5 h-5" /> Open AuraStudio
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
            {quickModes.map(({ id, title, subtitle, icon: Icon }) => (
              <ModeCard
                key={id}
                id={id}
                title={title}
                subtitle={subtitle}
                Icon={Icon}
                meta={featuredMetaById.get(id)}
                modesUrl={modesUrl}
              />
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white">Fan Favorites</h2>
              <p className="text-xs text-gray-400">
                Community-crafted focus stacks built on popular sound-healing culture frequencies.
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
            {fanFavoritesCards.map(({ id, title, subtitle, icon: Icon }) => (
              <ModeCard
                key={id}
                id={id}
                title={title}
                subtitle={subtitle}
                Icon={Icon}
                meta={fanMetaById.get(id)}
                modesUrl={modesUrl}
              />
            ))}
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
