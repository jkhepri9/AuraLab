// src/hooks/useProAccess.js
// Centralized "Pro" access check.
// Today: reads Supabase `subscriptions` table (if configured) + supports a local override.
// Tomorrow: you can swap this to Stripe customer portal / JWT claims, etc.

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/auth/AuthProvider";
import { getIsSupabaseConfigured, getSupabase } from "@/lib/supabaseClient";

const PRO_OVERRIDE_KEY = "auralab_pro_override"; // set to "1" for dev/testing

function readOverride() {
  try {
    return localStorage.getItem(PRO_OVERRIDE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeOverride(v) {
  try {
    localStorage.setItem(PRO_OVERRIDE_KEY, v ? "1" : "0");
  } catch {
    // ignore
  }
}

export function useProAccess() {
  const { user } = useAuth();
  const configured = getIsSupabaseConfigured();
  const supabase = getSupabase();

  const userId = user?.id || null;

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const [override, setOverride] = useState(() => readOverride());

  const refresh = useCallback(async () => {
    setError(null);

    // Local override wins (useful while billing is still being wired).
    const o = readOverride();
    setOverride(o);
    if (o) {
      setStatus("active");
      setLoading(false);
      return;
    }

    // If billing/auth isn't configured, treat as not Pro.
    if (!configured || !supabase || !userId) {
      setStatus(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error: qErr } = await supabase
        .from("subscriptions")
        .select("status, current_period_end")
        .eq("user_id", userId)
        .maybeSingle();

      if (qErr) throw qErr;
      setStatus(data?.status ?? null);
    } catch (e) {
      console.warn("[useProAccess] subscription read error", e);
      setError(e);
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, [configured, supabase, userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isPro = useMemo(() => {
    if (override) return true;
    // Stripe-style statuses (common): active, trialing.
    return status === "active" || status === "trialing";
  }, [override, status]);

  const setProOverride = useCallback((v) => {
    writeOverride(Boolean(v));
    setOverride(Boolean(v));
  }, []);

  return {
    isPro,
    status,
    loading,
    error,
    refresh,
    setProOverride,
  };
}
