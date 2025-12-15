// src/lib/publicConfig.js
let cached = null;

export async function loadPublicConfig() {
  if (cached) return cached;

  const res = await fetch("/api/public-config", { cache: "no-store" });
  const ct = res.headers.get("content-type") || "";
  const isJson = ct.includes("application/json");

  const data = isJson ? await res.json().catch(() => ({})) : {};

  cached = {
    supabaseUrl: data?.supabaseUrl || "",
    supabaseAnonKey: data?.supabaseAnonKey || "",
  };

  if (typeof window !== "undefined") {
    window.__AURALAB_PUBLIC_CONFIG__ = cached;
  }

  return cached;
}
