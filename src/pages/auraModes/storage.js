// src/pages/auraModes/storage.js

export const RECENTS_KEY = "auralab_recent_modes_v1"; // [{ id, t }]
export const FAVS_KEY = "auralab_favorite_modes_v1"; // [id]

export function canUseStorage() {
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

export function readJSON(key, fallback) {
  try {
    if (!canUseStorage()) return fallback;
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function writeJSON(key, value) {
  try {
    if (!canUseStorage()) return;
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export function bumpRecent(id) {
  const list = readJSON(RECENTS_KEY, []);
  const next = [{ id, t: Date.now() }, ...list.filter((x) => x?.id !== id)];
  writeJSON(RECENTS_KEY, next.slice(0, 24));
  return next.slice(0, 24);
}

export function readFavs() {
  return new Set(readJSON(FAVS_KEY, []));
}

export function writeFavs(set) {
  writeJSON(FAVS_KEY, Array.from(set));
}
