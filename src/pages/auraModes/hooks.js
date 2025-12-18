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
    for (const c of COLLECTIONS) {
      if (c.key !== "all") map.set(c.key, []);
    }
    for (const p of allPresets || []) {
      const c = getCollection(p);
      if (!map.has(c)) map.set(c, []);
      map.get(c).push(p);
    }
    for (const [k, arr] of map.entries()) map.set(k, dedupeById(arr).sort(railSort));
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

    if (q) {
      list = list.filter((p) => {
        const meta = [
          p.name,
          p.description,
          getCollection(p),
          ...(Array.isArray(p.tags) ? p.tags : []),
          ...(Array.isArray(p.scenarios) ? p.scenarios : []),
          ...(Array.isArray(p.styles) ? p.styles : []),
          ...(Array.isArray(p.goals) ? p.goals : []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return meta.includes(q);
      });
    }

    if (sortBy === "az") {
      list = [...list].sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
    } else if (sortBy === "recent") {
      const recentMap = new Map(recents.map((r) => [r.preset.id, r.t]));
      list = [...list].sort((a, b) => (recentMap.get(b.id) || 0) - (recentMap.get(a.id) || 0));
    } else {
      list = [...list].sort((a, b) => {
        const ao = safeNum(a?.order, 0);
        const bo = safeNum(b?.order, 0);
        if (ao !== bo) return ao - bo;
        return String(a?.name || "").localeCompare(String(b?.name || ""));
      });
    }

    return dedupeById(list);
  }, [allPresets, query, activeGoal, activeCollection, sortBy, byGoal, recents]);

  const isFiltered =
    Boolean(normalizeText(query).trim()) || activeGoal !== "all" || activeCollection !== "all";

  return {
    presetById,
    recents,
    continuePreset,
    favorites,
    byCollection,
    byGoal,
    filtered,
    isFiltered,
    bumpRecent,
  };
}
