// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/auth/AuthProvider";

import { loadPublicConfig } from "@/lib/publicConfig";
import { initSupabaseFromConfig } from "@/lib/supabaseClient";

import { registerSW } from "virtual:pwa-register";

const SW_PURGE_VERSION = "sw-purge-1"; // bump this if you need to force purge again

async function purgeOldServiceWorkerAndCachesOnce() {
  if (typeof window === "undefined") return;

  try {
    const key = "__AURALAB_SW_PURGED__";
    if (localStorage.getItem(key) === SW_PURGE_VERSION) return;

    // Unregister service workers
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }

    // Clear caches (workbox etc.)
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }

    localStorage.setItem(key, SW_PURGE_VERSION);
  } catch {
    // ignore
  }
}

function setupPwaInstallCapture() {
  if (typeof window === "undefined") return;

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

function setupServiceWorker() {
  if (!import.meta.env.PROD) return;

  if (typeof window !== "undefined" && window.__AURALAB_SW_REGISTERED__ === true)
    return;
  if (typeof window !== "undefined") window.__AURALAB_SW_REGISTERED__ = true;

  registerSW({ immediate: true });
}

async function bootstrap() {
  const queryClient = new QueryClient();

  // ✅ critical: make sure we are not running an old SW config after OAuth reload
  await purgeOldServiceWorkerAndCachesOnce();

  setupPwaInstallCapture();
  setupServiceWorker();

  initSupabaseFromConfig();
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
