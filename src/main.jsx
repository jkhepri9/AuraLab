// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/auth/AuthProvider";

import { loadPublicConfig } from "@/lib/publicConfig";
import { initSupabaseFromConfig } from "@/lib/supabaseClient";

// ✅ PWA: manual SW registration (production only)
import { registerSW } from "virtual:pwa-register";

const queryClient = new QueryClient();

function setupPwaInstallCapture() {
  if (typeof window === "undefined") return;

  // Prevent duplicate listeners during HMR
  if (window.__AURALAB_PWA_CAPTURE_SETUP__ === true) return;
  window.__AURALAB_PWA_CAPTURE_SETUP__ = true;

  // Where we store the install prompt event for one-click install
  window.__AURALAB_BIP_EVENT__ = window.__AURALAB_BIP_EVENT__ || null;

  window.addEventListener("beforeinstallprompt", (e) => {
    // Required: you must preventDefault to control the prompt via your own button
    e.preventDefault();
    window.__AURALAB_BIP_EVENT__ = e;

    // Backward-compat: some parts of your app used this
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
  // Do NOT register SW in dev with your current config (devOptions.enabled: false)
  if (!import.meta.env.PROD) return;

  // Prevent double registration in rare cases (reload/HMR)
  if (typeof window !== "undefined" && window.__AURALAB_SW_REGISTERED__ === true) return;
  if (typeof window !== "undefined") window.__AURALAB_SW_REGISTERED__ = true;

  registerSW({
    immediate: true,
  });
}

function bootstrap() {
  setupPwaInstallCapture();
  setupServiceWorker();

  // ✅ Do not block first paint on network config.
  // Live background + UI should mount immediately on hard refresh.
  // Supabase has a production-safe fallback and can hydrate config later if needed.
  initSupabaseFromConfig();

  // Fire-and-forget: populates window.__AURALAB_PUBLIC_CONFIG__ for any later reads.
  // Intentionally NOT re-initializing Supabase here to avoid swapping clients after
  // AuthProvider subscriptions are established.
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
