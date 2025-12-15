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

    // Stash on window for other modules (optional convenience)
    if (typeof window !== "undefined") {
      window.__AURALAB_PUBLIC_CONFIG__ = cached;
    }

    return cached;
  } catch (e) {
    cached = { supabaseUrl: "", supabaseAnonKey: "" };
    return cached;
  }
}
