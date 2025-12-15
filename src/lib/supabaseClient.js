// src/lib/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

/**
 * ✅ Production-safe fallback
 * Supabase anon key is public by design (safe for frontend).
 * This prevents "not configured" in production even if Vercel env injection fails.
 */
const FALLBACK_SUPABASE_URL = "https://oditikwnckhbybycntqk.supabase.co";
const FALLBACK_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kaXRpa3duY2toYnlieWNudHFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MTA1OTQsImV4cCI6MjA4MTM4NjU5NH0.1BRClO6Ja8qcYZKCrDti36J-mKGeYLJihAErvYPTFKE";

export let supabase = null;
export let isSupabaseConfigured = false;

let _initAttempted = false;

function readFromViteEnv() {
  return {
    supabaseUrl: import.meta.env?.VITE_SUPABASE_URL || "",
    supabaseAnonKey: import.meta.env?.VITE_SUPABASE_ANON_KEY || "",
  };
}

function readFromWindowConfig() {
  if (typeof window === "undefined") return { supabaseUrl: "", supabaseAnonKey: "" };
  const cfg = window.__AURALAB_PUBLIC_CONFIG__ || null;
  return {
    supabaseUrl: cfg?.supabaseUrl || "",
    supabaseAnonKey: cfg?.supabaseAnonKey || "",
  };
}

export function initSupabaseFromConfig(cfg) {
  _initAttempted = true;

  const fromCfg = {
    supabaseUrl: cfg?.supabaseUrl || "",
    supabaseAnonKey: cfg?.supabaseAnonKey || "",
  };

  const fromWindow = readFromWindowConfig();
  const fromEnv = readFromViteEnv();

  const supabaseUrl =
    fromCfg.supabaseUrl ||
    fromWindow.supabaseUrl ||
    fromEnv.supabaseUrl ||
    FALLBACK_SUPABASE_URL;

  const supabaseAnonKey =
    fromCfg.supabaseAnonKey ||
    fromWindow.supabaseAnonKey ||
    fromEnv.supabaseAnonKey ||
    FALLBACK_SUPABASE_ANON_KEY;

  const ok = Boolean(supabaseUrl && supabaseAnonKey);

  if (!ok) {
    supabase = null;
    isSupabaseConfigured = false;
    console.warn("[Supabase] Missing URL/anon key. Auth disabled.");
    return { supabase: null, isSupabaseConfigured: false };
  }

  supabase = createClient(supabaseUrl, supabaseAnonKey);
  isSupabaseConfigured = true;
  return { supabase, isSupabaseConfigured: true };
}

export function getSupabase() {
  if (supabase) return supabase;
  if (!_initAttempted) initSupabaseFromConfig();
  return supabase;
}

export function getIsSupabaseConfigured() {
  if (!_initAttempted) initSupabaseFromConfig();
  return isSupabaseConfigured;
}
