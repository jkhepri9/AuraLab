// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/auth/AuthProvider";

import { loadPublicConfig } from "@/lib/publicConfig";
import { initSupabaseFromConfig } from "@/lib/supabaseClient";

const SW_PURGE_VERSION = "prod-purge-2"; // bump this string if you ever need to force purge again

async function purgeServiceWorkersAndCachesOnce() {
  if (typeof window === "undefined") return;

  // Only do this on the live domain
  const host = window.location.hostname;
  if (host !== "auralab.space") return;

  try {
    const key = "__AURALAB_SW_PURGED__";
    if (localStorage.getItem(key) === SW_PURGE_VERSION) return;

    // Unregister ALL service workers on this origin
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }

    // Delete ALL caches (workbox + anything else)
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }

    localStorage.setItem(key, SW_PURGE_VERSION);

    // Hard reload once so the page comes back without SW control/caches
    // (this is what makes the fix “stick” immediately)
    window.location.reload();
  } catch {
    // If anything fails, do nothing; app will still run
  }
}

function setupPwaInstallCapture() {
  if (typeof window === "undefined") return;

  // Prevent duplicate listeners during HMR
  if (window.__AURALAB_PWA_CAPTURE_SETUP__ === true) return;
  window.__AURALAB_PWA_CAPTURE_SETUP__ = true;

  window.__AURALAB_BIP_EVENT__ = window.__AURALAB_BIP_EVENT__ || null;

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    window.__AURALAB_BIP_EVENT__ = e;
    window.deferredPrompt = e;
  });

  window.addEventListener("appinstalled", () => {
    window.__AURALAB_BIP_EVENT__ = null;
    window.deferredPrompt = null;

    try {
      localStorage.setItem("auralab_pwa_installed", "1");
    } catch {}
  });
}

async function bootstrap() {
  const queryClient = new QueryClient();

  // ✅ production SW/cache purge (one-time) to kill old Workbox behavior
  await purgeServiceWorkersAndCachesOnce();

  setupPwaInstallCapture();

  // ✅ Initialize Supabase early
  initSupabaseFromConfig();

  // Fire-and-forget config load
  loadPublicConfig().catch(() => {});

  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </AuthProvider>
    </React.StrictMode>
  );
}

bootstrap();
