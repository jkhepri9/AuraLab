// src/pages/auraModes/presetUtils.js

import { PRESET_COLLECTIONS } from "@/data/presets";

export function normalizeText(s) {
  return String(s || "").toLowerCase();
}

function normalizeCollectionLabel(s) {
  return String(s || "")
    .replace(/\u00A0/g, " ")   // NBSP -> space
    .replace(/\s+/g, " ")     // collapse whitespace
    .trim()
    .toLowerCase();
}

// Map any legacyLabel OR displayedLabel -> canonical legacyLabel
const COLLECTION_CANON = (() => {
  const map = new Map();

  for (const c of PRESET_COLLECTIONS || []) {
    const legacy = String(c?.legacyLabel || "").trim();
    const display = String(c?.displayedLabel || "").trim();

    if (legacy) map.set(normalizeCollectionLabel(legacy), legacy);
    if (display) map.set(normalizeCollectionLabel(display), legacy);
  }

  // Always allow Custom
  map.set(normalizeCollectionLabel("Custom"), "Custom");

  return map;
})();

// Back-compat: many presets still store marketing labels in preset.collection.
// ✅ Canonicalizes to registry legacyLabel so rails render consistently across devices.
export function getCollection(preset) {
  const raw = preset?.collection;
  const cleaned = normalizeCollectionLabel(raw);

  const canon = COLLECTION_CANON.get(cleaned);
  return canon || (String(raw || "").trim() || "Custom");
}

export function getGoals(preset) {
  if (Array.isArray(preset?.goals) && preset.goals.length) {
    return preset.goals.map((g) => String(g).toLowerCase());
  }
  if (preset?.goal) return [String(preset.goal).toLowerCase()];
  return [];
}

// Treat Zodiac as built-in content (non-DB) so we never try to rename/reorder/delete/update it in db.
// Robust to future normalized presets (collectionKey) AND current legacy labels.
export function isZodiacPreset(preset) {
  const id = String(preset?.id || "");
  const legacyCol = String(preset?.collection || "");
  const colKey = String(preset?.collectionKey || "");
  return legacyCol === "Zodiac" || colKey === "zodiac" || id.startsWith("z_");
}

export function safeNum(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function durationToMinutes(d) {
  const s = String(d || "").trim().toLowerCase();
  const m = s.match(/^(\d+)\s*m$/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

// Discover-style sort for rails.
export function railSort(a, b) {
  const ai = safeNum(a?.intensity, 0);
  const bi = safeNum(b?.intensity, 0);
  if (bi !== ai) return bi - ai;

  const ad = durationToMinutes(a?.durationHint);
  const bd = durationToMinutes(b?.durationHint);
  if (ad != null && bd != null && ad !== bd) return ad - bd;
  if (ad != null && bd == null) return -1;
  if (ad == null && bd != null) return 1;

  const ao = safeNum(a?.order, 0);
  const bo = safeNum(b?.order, 0);
  if (ao !== bo) return ao - bo;

  return String(a?.name || "").localeCompare(String(b?.name || ""));
}

// De-dupe a list by id while preserving first occurrence order.
export function dedupeById(list) {
  const seen = new Set();
  const out = [];
  for (const p of list || []) {
    if (!p?.id) continue;
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    out.push(p);
  }
  return out;
}
