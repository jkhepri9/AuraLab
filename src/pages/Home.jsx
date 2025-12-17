// src/pages/Home.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "../components/utils";
import {
  SlidersHorizontal,
  Download,
  X,
  Play,
  Pause,
  Heart,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import usePWAInstall from "../hooks/usePWAInstall";

import { db } from "@/lib/db";
import { useQuery } from "@tanstack/react-query";
import { useGlobalPlayer } from "../audio/GlobalPlayerContext";

import FEATURED_PRESETS from "../data/presets/featuredPresets";
import { fanFavoritesPresets } from "../data/presets/fanFavoritesPresets";

// ------------------------------------------------------------
// Storage keys (shared with AuraModes.jsx)
// ------------------------------------------------------------
const RECENTS_KEY = "auralab_recent_modes_v1"; // [{ id, t }]
const FAVS_KEY = "auralab_favorite_modes_v1"; // [id]

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
function canUseStorage() {
  try {
    if (typeof window === "undefined") return false;
    const k = "__t";
    window.localStorage.setItem(k, "1");
    window.localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

function readJSON(key, fallback) {
  try {
    if (!canUseStorage()) return fallback;
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

const DEFAULT_TINT =
  "linear-gradient(135deg, rgba(16,185,129,.30), rgba(0,0,0,.85))";

const buildMetaMap = (arr) => {
  const m = new Map();
  for (const p of arr || []) {
    m.set(p.id, {
      imageUrl: p.imageUrl,
      color: p.color,
      name: p.name,
      description: p.description,
      order: p.order,
    });
  }
  return m;
};

function Rail({ children }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 pr-2 scroll-smooth">
      {children}
    </div>
  );
}

function SectionHeader({ title, subtitle, right }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-3">
      <div className="min-w-0">
        <h2 className="text-lg font-bold text-white truncate">{title}</h2>
        {subtitle ? (
          <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
        ) : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

function CompactCard({ preset, href, showHeart, isFavorite, onToggleFavorite }) {
  const tint =
    typeof preset?.color === "string" && preset.color.includes("gradient")
      ? preset.color
      : preset?.color
      ? `linear-gradient(135deg, ${preset.color}, #000000)`
      : DEFAULT_TINT;

  return (
    <Link to={href} className="shrink-0">
      <div
        className={[
          "relative rounded-xl overflow-hidden border border-white/10",
          "min-w-[240px] max-w-[240px] h-[140px] cursor-pointer group",
          "bg-gradient-to-br from-slate-900 to-emerald-900",
        ].join(" ")}
        style={{
          backgroundImage: preset?.imageUrl ? `url(${preset.imageUrl})` : undefined,
          backgroundSize: preset?.imageUrl ? "cover" : undefined,
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 opacity-70" style={{ background: tint || DEFAULT_TINT }} />
        <div className="absolute inset-0 bg-black/60 group-hover:bg-black/45 transition-colors" />

        <div className="relative h-full p-3 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-white font-extrabold leading-tight truncate">
                {preset?.name || "Mode"}
              </div>
              {preset?.description ? (
                <div className="text-xs text-white/70 mt-1 line-clamp-2">
                  {preset.description}
                </div>
              ) : null}
            </div>

            {showHeart ? (
              <button
                type="button"
                className={[
                  "h-8 w-8 rounded-full flex items-center justify-center",
                  "bg-white/10 hover:bg-white/15 border border-white/10",
                ].join(" ")}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleFavorite?.(preset.id);
                }}
                title={isFavorite ? "Unfavorite" : "Favorite"}
              >
                <Heart
                  className={[
                    "w-4 h-4",
                    isFavorite ? "fill-emerald-400 text-emerald-400" : "text-white/70",
                  ].join(" ")}
                />
              </button>
            ) : null}
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-white/80">
              <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-white/10 border border-white/10">
                <Play className="w-3.5 h-3.5 fill-white text-white" />
              </span>
              Tap to play
            </div>

            <div className="text-xs font-semibold text-emerald-300 group-hover:text-emerald-200 transition-colors">
              Open →
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ------------------------------------------------------------
// Home content
// ------------------------------------------------------------
const quickModes = [
  { id: "m_deep_sleep", fallbackTitle: "Deep Sleep", fallbackSubtitle: "Downshift and shut off mental noise." },
  { id: "m_theta_gate", fallbackTitle: "Theta Gate", fallbackSubtitle: "Meditation depth and inner stillness." },
  { id: "m_focus_forge", fallbackTitle: "Focus Forge", fallbackSubtitle: "Clean focus for work and creation." },
  { id: "m_heart_coherence", fallbackTitle: "Heart Coherence", fallbackSubtitle: "Steady the rhythm of your field." },
  { id: "c_stress_relief", fallbackTitle: "Stress Relief", fallbackSubtitle: "Calm the nervous system and ease tension." },
  { id: "m_energy_ignition", fallbackTitle: "Energy Ignition", fallbackSubtitle: "Wake up the system without chaos." },
];

function pickDailyRitual() {
  try {
    const h = new Date().getHours();

    if (h >= 22 || h <= 5) {
      return {
        id: "m_deep_sleep",
        label: "Night Ritual",
        title: "Deep Sleep Wind-Down",
        subtitle: "Lower the noise floor and let the system descend.",
      };
    }

    if (h >= 6 && h <= 10) {
      return {
        id: "m_energy_ignition",
        label: "Morning Ritual",
        title: "Energy Ignition",
        subtitle: "Clean wake-up without chaos. Start your day aligned.",
      };
    }

    if (h >= 11 && h <= 15) {
      return {
        id: "m_focus_forge",
        label: "Midday Ritual",
        title: "Focus Forge",
        subtitle: "Lock in attention and stabilize cognition for output.",
      };
    }

    return {
      id: "c_stress_relief",
      label: "Evening Ritual",
      title: "Stress Relief Reset",
      subtitle: "Downshift the nervous system and soften tension.",
      };
  } catch {
    return {
      id: "m_focus_forge",
      label: "Daily Ritual",
      title: "Focus Forge",
      subtitle: "One-tap state shift.",
    };
  }
}

export default function Home() {
  const modesUrl = createPageUrl("AuraModes");
  const studioUrl = createPageUrl("AuraEditor");
  const navigate = useNavigate();

  const player = useGlobalPlayer();
  const nowPreset = player?.currentPlayingPreset || null;
  const nowIsPlaying = Boolean(player?.isPlaying);
  const togglePlayPause = player?.togglePlayPause;

  // Install banner
  const { isInstalled, isInstallable, promptInstall } = usePWAInstall();

  const featuredMetaById = useMemo(() => buildMetaMap(FEATURED_PRESETS), []);
  const fanMetaById = useMemo(() => buildMetaMap(fanFavoritesPresets), []);

  // Pull full library so Home can resolve Recents/Favorites accurately (includes custom modes)
  const { data: presets = [] } = useQuery({
    queryKey: ["presets"],
    queryFn: () => db.presets.list(),
  });

  const presetById = useMemo(() => {
    const m = new Map();
    for (const p of presets || []) m.set(p.id, p);
    return m;
  }, [presets]);

  const [installBannerDismissed, setInstallBannerDismissed] = useState(() => {
    try {
      return sessionStorage.getItem("auralab_install_banner_dismissed") === "1";
    } catch {
      return false;
    }
  });

  const showInstallBanner = useMemo(
    () => !isInstalled && !installBannerDismissed,
    [isInstalled, installBannerDismissed]
  );

  const dismissInstallBanner = () => {
    setInstallBannerDismissed(true);
    try {
      sessionStorage.setItem("auralab_install_banner_dismissed", "1");
    } catch {}
  };

  const handleInstallClick = async () => {
    if (isInstallable) {
      await promptInstall();
      dismissInstallBanner();
      return;
    }
    navigate("/Install");
  };

  const activateHref = (id) => `${modesUrl}?activate=${encodeURIComponent(id)}`;

  // Daily ritual
  const daily = useMemo(() => pickDailyRitual(), []);

  // Recents + Favorites resolved from shared keys (AuraModes writes these)
  const recentsResolved = useMemo(() => {
    const list = readJSON(RECENTS_KEY, []);
    const out = [];
    for (const item of list || []) {
      const p = presetById.get(item?.id);
      if (p) out.push({ preset: p, t: item?.t || 0 });
    }
    return out;
  }, [presetById]);

  const continuePreset = recentsResolved[0]?.preset || null;

  const favoriteIds = useMemo(() => {
    const arr = readJSON(FAVS_KEY, []);
    return new Set(Array.isArray(arr) ? arr : []);
  }, []);

  const [favSet, setFavSet] = useState(() => favoriteIds);

  useEffect(() => {
    const onFocus = () => {
      const arr = readJSON(FAVS_KEY, []);
      setFavSet(new Set(Array.isArray(arr) ? arr : []));
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const favoritesResolved = useMemo(() => {
    const out = [];
    for (const id of favSet) {
      const p = presetById.get(id);
      if (p) out.push(p);
    }
    return out.slice(0, 12);
  }, [favSet, presetById]);

  const toggleFavorite = (id) => {
    setFavSet((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);

      try {
        if (canUseStorage()) localStorage.setItem(FAVS_KEY, JSON.stringify(Array.from(next)));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Curated rails for Featured + Fan Favorites (small + horizontal)
  const featuredRail = useMemo(() => {
    return quickModes.map((x) => {
      const meta = featuredMetaById.get(x.id);
      return {
        id: x.id,
        name: meta?.name || x.fallbackTitle,
        description: meta?.description || x.fallbackSubtitle,
        imageUrl: meta?.imageUrl || null,
        color: meta?.color || DEFAULT_TINT,
      };
    });
  }, [featuredMetaById]);

  const fanRail = useMemo(() => {
    const list = Array.isArray(fanFavoritesPresets) ? [...fanFavoritesPresets] : [];
    list.sort((a, b) => (a?.order ?? 9999) - (b?.order ?? 9999));
    return list.map((p) => {
      const meta = fanMetaById.get(p.id);
      return {
        id: p.id,
        name: meta?.name || p.name,
        description: meta?.description || p.description || "",
        imageUrl: meta?.imageUrl || p.imageUrl || null,
        color: meta?.color || p.color || DEFAULT_TINT,
      };
    });
  }, [fanMetaById]);

  return (
    <div className="w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-10">
        {/* HERO */}
        <section className="relative">
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-[520px] h-[520px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative z-10"
          >
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              One tap to shift your state.
            </h1>
            <p className="mt-2 text-sm sm:text-base text-gray-400 max-w-2xl">
              Sleep deeper. Focus longer. Calm faster. Start a mode instantly—or craft your own sonic field in AuraStudio.
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
          </motion.div>
        </section>

        {/* NOW PLAYING (RESUME WITHOUT NAVIGATING) */}
        {nowPreset ? (
          <section className="space-y-3">
            <SectionHeader
              title="Now Playing"
              subtitle="Resume instantly from Home."
              right={
                <Link
                  to="/NowPlaying"
                  className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors whitespace-nowrap"
                >
                  Open player →
                </Link>
              }
            />

            <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 sm:p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-xs text-white/60 font-semibold">Current session</div>
                  <div className="mt-1 text-xl sm:text-2xl font-extrabold text-white truncate">
                    {nowPreset?.name || "Aura Session"}
                  </div>
                  {nowPreset?.description ? (
                    <div className="mt-1 text-sm text-white/70 line-clamp-2">
                      {nowPreset.description}
                    </div>
                  ) : null}
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => togglePlayPause?.()}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 bg-emerald-500 text-black font-extrabold text-sm sm:text-base shadow-lg shadow-emerald-500/20"
                  >
                    {nowIsPlaying ? (
                      <>
                        <Pause className="w-5 h-5" /> Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5 fill-black" /> Resume
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {/* CONTINUE / RECENT / FAVORITES */}
        {continuePreset ? (
          <section className="space-y-6">
            <div>
              <SectionHeader
                title="Continue"
                subtitle="Pick up exactly where you left off."
                right={
                  <Link
                    to={modesUrl}
                    className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors whitespace-nowrap"
                  >
                    Open Discover →
                  </Link>
                }
              />
              <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 sm:p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-xs text-white/60 font-semibold">Last played</div>
                    <div className="mt-1 text-xl sm:text-2xl font-extrabold text-white truncate">
                      {continuePreset.name}
                    </div>
                    {continuePreset.description ? (
                      <div className="mt-1 text-sm text-white/70 line-clamp-2">
                        {continuePreset.description}
                      </div>
                    ) : null}
                  </div>

                  <Link to={activateHref(continuePreset.id)} className="shrink-0">
                    <button className="inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 bg-emerald-500 text-black font-extrabold text-sm sm:text-base shadow-lg shadow-emerald-500/20">
                      <Play className="w-5 h-5 fill-black" /> Play
                    </button>
                  </Link>
                </div>
              </div>
            </div>

            {recentsResolved.length > 1 ? (
              <div>
                <SectionHeader title="Recent" subtitle="Fast re-entry. No browsing required." />
                <Rail>
                  {recentsResolved.slice(0, 12).map(({ preset }) => (
                    <CompactCard
                      key={preset.id}
                      preset={preset}
                      href={activateHref(preset.id)}
                      showHeart
                      isFavorite={favSet.has(preset.id)}
                      onToggleFavorite={toggleFavorite}
                    />
                  ))}
                </Rail>
              </div>
            ) : null}

            <div>
              <SectionHeader title="Favorites" subtitle="Your go-to states." />
              {favoritesResolved.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">
                  Tap the <Heart className="inline w-4 h-4 mx-1 text-white/70" /> on any mode to save it here.
                </div>
              ) : (
                <Rail>
                  {favoritesResolved.map((preset) => (
                    <CompactCard
                      key={preset.id}
                      preset={preset}
                      href={activateHref(preset.id)}
                      showHeart
                      isFavorite={favSet.has(preset.id)}
                      onToggleFavorite={toggleFavorite}
                    />
                  ))}
                </Rail>
              )}
            </div>
          </section>
        ) : null}

        {/* DAILY RITUAL */}
        <section className="space-y-3">
          <SectionHeader title="Daily Ritual" subtitle="One pick. One tap. Consistent results." />
          <Link to={activateHref(daily.id)}>
            <div className="relative rounded-3xl border border-white/10 bg-white/5 overflow-hidden p-5 group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/15 to-cyan-500/10 opacity-70" />
              <div className="absolute inset-0 bg-black/35 group-hover:bg-black/25 transition-colors" />

              <div className="relative flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-300">
                    <Sparkles className="w-4 h-4" /> {daily.label}
                  </div>
                  <div className="mt-2 text-xl sm:text-2xl font-extrabold text-white truncate">
                    {daily.title}
                  </div>
                  <div className="mt-1 text-sm text-white/70 max-w-2xl">
                    {daily.subtitle}
                  </div>
                </div>

                <div className="shrink-0">
                  <div className="inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 bg-emerald-500 text-black font-extrabold text-sm sm:text-base shadow-lg shadow-emerald-500/20">
                    <Play className="w-5 h-5 fill-black" /> Start
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </section>

        {/* FEATURED (HORIZONTAL RAIL) */}
        <section className="space-y-3">
          <SectionHeader
            title="Featured Modes"
            subtitle="Curated starts. Tap a card to play."
            right={
              <Link
                to={modesUrl}
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors whitespace-nowrap"
              >
                View all →
              </Link>
            }
          />
          <Rail>
            {featuredRail.map((p) => (
              <CompactCard key={p.id} preset={p} href={activateHref(p.id)} />
            ))}
          </Rail>
        </section>

        {/* FAN FAVORITES (HORIZONTAL RAIL) */}
        <section className="space-y-3">
          <SectionHeader
            title="Fan Favorites"
            subtitle="Community-crafted stacks built on popular sound-healing culture frequencies."
            right={
              <Link
                to={modesUrl}
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors whitespace-nowrap"
              >
                View all →
              </Link>
            }
          />
          <Rail>
            {fanRail.map((p) => (
              <CompactCard key={p.id} preset={p} href={activateHref(p.id)} />
            ))}
          </Rail>
        </section>

        {/* AURA STUDIO — SINGLE FULL-WIDTH PREMIUM CTA */}
        <section className="space-y-3">
          <SectionHeader
            title="Create with Aura Studio"
            subtitle="For builders. For power users. For people who want total control."
          />

          <Link to={studioUrl} className="block">
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 sm:p-7 group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-cyan-500/10 to-purple-500/10 opacity-80" />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
              <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-20 -left-16 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

              <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-2 text-xs font-extrabold tracking-wide">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">
                      PRO FEATURE
                    </span>
                    <span className="text-white/60">Design your own sound therapy</span>
                  </div>

                  <div className="mt-3 text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    Aura Studio
                  </div>

                  <p className="mt-2 text-sm sm:text-base text-white/75 max-w-2xl">
                    Build custom sonic environments by layering frequencies, ambience, noise, and effects—then save your
                    creations as personal modes you can reuse anytime.
                  </p>

                  <ul className="mt-4 space-y-2 text-sm text-white/75">
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5 h-5 w-5 rounded-full bg-white/10 border border-white/10 inline-flex items-center justify-center">
                        <SlidersHorizontal className="w-3.5 h-3.5 text-white/80" />
                      </span>
                      Precision controls: levels, layers, and effects shaping.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5 h-5 w-5 rounded-full bg-white/10 border border-white/10 inline-flex items-center justify-center">
                        <Sparkles className="w-3.5 h-3.5 text-white/80" />
                      </span>
                      Create signature “field architectures” and save them as modes.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5 h-5 w-5 rounded-full bg-white/10 border border-white/10 inline-flex items-center justify-center">
                        <Play className="w-3.5 h-3.5 fill-white text-white/80" />
                      </span>
                      Turn your best builds into one-tap rituals for daily use.
                    </li>
                  </ul>

                  <div className="mt-4 text-xs text-white/50">
                    Unlock Aura Studio with AuraLab Pro (premium).
                  </div>
                </div>

                <div className="shrink-0 flex flex-col gap-2">
                  <div className="inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 bg-emerald-500 text-black font-extrabold text-sm sm:text-base shadow-lg shadow-emerald-500/25">
                    <SlidersHorizontal className="w-5 h-5" /> Explore Aura Studio
                  </div>
                  <div className="text-center text-xs text-white/55">
                    See what you can build →
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </section>
      </div>
    </div>
  );
}
