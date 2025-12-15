// src/lib/publicConfig.js
let cached = null;

export async function loadPublicConfig() {
  if (cached) return cached;

  try {
    const res = await fetch("/api/public-config", { cache: "no-store" });
    const data = await res.json();

    cached = {
      supabaseUrl: data?.supabaseUrl || "",
      supabaseAnonKey: data?.supabaseAnonKey || "",
    };

    if (typeof window !== "undefined") {
      window.__AURALAB_PUBLIC_CONFIG__ = cached;
    }

    return cached;
  } catch {
    cached = { supabaseUrl: "", supabaseAnonKey: "" };
    return cached;
  }
}
