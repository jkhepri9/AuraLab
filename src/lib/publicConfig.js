// src/lib/publicConfig.js
let cached = null;

export async function loadPublicConfig() {
  if (cached) return cached;

  const tryFetch = async (url) => {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  };

  try {
    // Call the .cjs endpoint explicitly
    const data = await tryFetch("/api/public-config.cjs");

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
