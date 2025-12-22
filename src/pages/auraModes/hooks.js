// src/pages/auraModes/hooks.js

import { useCallback, useEffect, useMemo, useState } from "react";
import { COLLECTIONS, GOALS } from "./constants";
import { bumpRecent as bumpRecentRaw, readJSON, RECENTS_KEY } from "./storage";
import {
  dedupeById,
  getCollection,
  getGoals,
  normalizeText,
  railSort,
  safeNum,
} from "./presetUtils";

export function useAuraModesLibrary({
  allPresets,
  favoriteIds,
  query,
  activeGoal,
  activeCollection,
  activeScenario, // ✅ NEW
  sortBy,
}) {
  // keep recents reactive (same-tab updates)
  const [recentsVersion, setRecentsVersion] = useState(0);

  const presetById = useMemo(() => {
    const map = new Map();
    for (const p of allPresets || []) map.set(p.id, p);
    return map;
  }, [allPresets]);

  const bumpRecent = useCallback((id) => {
    bumpRecentRaw(id);
    setRecentsVersion((v) => v + 1);
  }, []);

  // optional: other-tab sync
  useEffect(() => {
    const onStorage = (e) => {
      if (e?.key === RECENTS_KEY) setRecentsVersion((v) => v + 1);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const recents = useMemo(() => {
    const list = readJSON(RECENTS_KEY, []);
    const resolved = [];
    for (const item of list) {
      const p = presetById.get(item?.id);
      if (p) resolved.push({ preset: p, t: item?.t || 0 });
    }
    return resolved;
  }, [presetById, recentsVersion]);

  const continuePreset = recents[0]?.preset || null;

  const favorites = useMemo(() => {
    const list = (allPresets || []).filter((p) => favoriteIds?.has?.(p.id));
    return dedupeById(list).sort(railSort);
  }, [allPresets, favoriteIds]);

  const byCollection = useMemo(() => {
    const map = new Map();

    // Seed known collections for predictable ordering (uses legacy keys)
    for (const c of COLLECTIONS) {
      if (c.key !== "all") map.set(c.key, []);
    }

    // Group by legacy collection string stored on preset objects
    for (const p of allPresets || []) {
      const c = getCollection(p); // returns preset.collection or "Custom"
      if (!map.has(c)) map.set(c, []);
      map.get(c).push(p);
    }

    for (const [k, arr] of map.entries()) {
      map.set(k, dedupeById(arr).sort(railSort));
    }

    return map;
  }, [allPresets]);

  const byGoal = useMemo(() => {
    const map = new Map();
    for (const g of GOALS) map.set(g.key, []);
    map.set("uncategorized", []);

    for (const p of allPresets || []) {
      const goals = getGoals(p);
      if (!goals.length) {
        map.get("uncategorized").push(p);
        continue;
      }
      for (const g of goals) {
        if (!map.has(g)) map.set(g, []);
        map.get(g).push(p);
      }
    }

    for (const [k, arr] of map.entries()) map.set(k, dedupeById(arr).sort(railSort));
    return map;
  }, [allPresets]);

  // ✅ NEW: group by scenarios (from preset.scenarios)
  const byScenario = useMemo(() => {
    const map = new Map();

    for (const p of allPresets || []) {
      const scenarios = Array.isArray(p?.scenarios) ? p.scenarios : [];
      for (const s of scenarios) {
        const key = String(s || "").trim();
        if (!key) continue;
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(p);
      }
    }

    for (const [k, arr] of map.entries()) map.set(k, dedupeById(arr).sort(railSort));
    return map;
  }, [allPresets]);

  // ------------------------------------------------------------
  // ✅ Search ranking: Title matches first (then description/keywords)
  // ------------------------------------------------------------
  const getSearchScore = (p, q) => {
    if (!q) return 0;

    const name = normalizeText(p?.name || "").trim();
    const desc = normalizeText(p?.description || "").trim();
    const collection = normalizeText(getCollection(p) || "").trim();

    const tags = Array.isArray(p?.tags) ? p.tags : [];
    const scenarios = Array.isArray(p?.scenarios) ? p.scenarios : [];
    const styles = Array.isArray(p?.styles) ? p.styles : [];
    const goals = Array.isArray(p?.goals) ? p.goals : [];

    const normList = (arr) =>
      (arr || [])
        .map((x) => normalizeText(String(x || "")).trim())
        .filter(Boolean);

    const tagStr = normList(tags).join(" ");
    const scenStr = normList(scenarios).join(" ");
    const styleStr = normList(styles).join(" ");
    const goalStr = normList(goals).join(" ");

    const nameHas = name.includes(q);
    const descHas = desc.includes(q);
    const collectionHas = collection.includes(q);
    const keywordsHas =
      tagStr.includes(q) || scenStr.includes(q) || styleStr.includes(q) || goalStr.includes(q);

    if (!(nameHas || descHas || collectionHas || keywordsHas)) return 0;

    let score = 0;

    if (name === q) score = Math.max(score, 1200);
    if (name.startsWith(q)) score = Math.max(score, 1100);

    if (!score && name) {
      const words = name.split(/\s+/).filter(Boolean);
      if (words.some((w) => w.startsWith(q))) score = Math.max(score, 1000);
    }

    if (nameHas) score = Math.max(score, 900);
    if (descHas) score = Math.max(score, 700);
    if (keywordsHas) score = Math.max(score, 500);
    if (collectionHas) score = Math.max(score, 450);

    return score;
  };

  const filtered = useMemo(() => {
    const q = normalizeText(query).trim();
    let list = allPresets || [];

    if (activeCollection !== "all") {
      list = list.filter((p) => getCollection(p) === activeCollection);
    }

    if (activeGoal !== "all") {
      const set = new Set((byGoal.get(activeGoal) || []).map((p) => p.id));
      list = list.filter((p) => set.has(p.id));
    }

    if (activeScenario !== "all") {
      const set = new Set((byScenario.get(activeScenario) || []).map((p) => p.id));
      list = list.filter((p) => set.has(p.id));
    }

    const recentMap = new Map(recents.map((r) => [r.preset.id, r.t]));

    const cmpAZ = (a, b) => String(a?.name || "").localeCompare(String(b?.name || ""));
    const cmpRecent = (a, b) => (recentMap.get(b?.id) || 0) - (recentMap.get(a?.id) || 0);
    const cmpCustom = (a, b) => {
      const ao = safeNum(a?.order, 0);
      const bo = safeNum(b?.order, 0);
      if (ao !== bo) return ao - bo;
      return String(a?.name || "").localeCompare(String(b?.name || ""));
    };

    const tieBreak = sortBy === "az" ? cmpAZ : sortBy === "recent" ? cmpRecent : cmpCustom;

    if (q) {
      const scored = (list || [])
        .map((p) => ({ p, s: getSearchScore(p, q) }))
        .filter((x) => x.s > 0);

      scored.sort((A, B) => {
        if (B.s !== A.s) return B.s - A.s;
        return tieBreak(A.p, B.p);
      });

      return dedupeById(scored.map((x) => x.p));
    }

    if (sortBy === "az") {
      list = [...list].sort(cmpAZ);
    } else if (sortBy === "recent") {
      list = [...list].sort(cmpRecent);
    } else {
      list = [...list].sort(cmpCustom);
    }

    return dedupeById(list);
  }, [allPresets, query, activeGoal, activeCollection, activeScenario, sortBy, byGoal, byScenario, recents]);

  const isFiltered =
    Boolean(normalizeText(query).trim()) ||
    activeGoal !== "all" ||
    activeCollection !== "all" ||
    activeScenario !== "all";

  return {
    presetById,
    recents,
    continuePreset,
    favorites,
    byCollection,
    byGoal,
    byScenario, // ✅ NEW
    filtered,
    isFiltered,
    bumpRecent,
  };
}
