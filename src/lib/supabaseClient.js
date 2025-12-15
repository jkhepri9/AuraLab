// src/lib/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

// Live exports (ESM live bindings). Importers will see updates after init.
export let supabase = null;
export let isSupabaseConfigured = false;

let _warned = false;
let _initAttempted = false;

function readFromViteEnv() {
  const url = import.meta.env?.VITE_SUPABASE_URL || "";
  const anon = import.meta.env?.VITE_SUPABASE_ANON_KEY || "";
  return { supabaseUrl: url, supabaseAnonKey: anon };
}

function readFromWindowConfig() {
  if (typeof window === "undefined") return { supabaseUrl: "", supabaseAnonKey: "" };
  const cfg = window.__AURALAB_PUBLIC_CONFIG__ || null;
  return {
    supabaseUrl: cfg?.supabaseUrl || "",
    supabaseAnonKey: cfg?.supabaseAnonKey || "",
  };
}

function warnOnce() {
  if (_warned) return;
  _warned = true;
  console.warn(
    "[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. " +
      "Auth/subscriptions are disabled until configured."
  );
}

/**
 * Initialize Supabase from an explicit config object (optional).
 * If cfg is not provided, it will try window public config first, then Vite env.
 */
export function initSupabaseFromConfig(cfg) {
  _initAttempted = true;

  const fromCfg = {
    supabaseUrl: cfg?.supabaseUrl || "",
    supabaseAnonKey: cfg?.supabaseAnonKey || "",
  };

  const fromWindow = readFromWindowConfig();
  const fromEnv = readFromViteEnv();

  const supabaseUrl = fromCfg.supabaseUrl || fromWindow.supabaseUrl || fromEnv.supabaseUrl || "";
  const supabaseAnonKey =
    fromCfg.supabaseAnonKey || fromWindow.supabaseAnonKey || fromEnv.supabaseAnonKey || "";

  const ok = Boolean(supabaseUrl && supabaseAnonKey);

  if (!ok) {
    supabase = null;
    isSupabaseConfigured = false;
    warnOnce();
    return { supabase: null, isSupabaseConfigured: false };
  }

  supabase = createClient(supabaseUrl, supabaseAnonKey);
  isSupabaseConfigured = true;
  return { supabase, isSupabaseConfigured: true };
}

/**
 * Safe getter that lazily initializes once (from window/env) if you forgot to init in main.jsx.
 */
export function getSupabase() {
  if (supabase) return supabase;
  if (!_initAttempted) initSupabaseFromConfig();
  return supabase;
}

/**
 * Safe boolean that won’t throw.
 */
export function getIsSupabaseConfigured() {
  if (!_initAttempted) initSupabaseFromConfig();
  return isSupabaseConfigured;
}
