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

function setupPwaInstallCapture() {
  if (typeof window === "undefined") return;

  // Prevent duplicate listeners during HMR
  if (window.__AURALAB_PWA_CAPTURE_SETUP__ === true) return;
  window.__AURALAB_PWA_CAPTURE_SETUP__ = true;

  // Where we store the install prompt event for one-click install
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

  if (typeof window !== "undefined" && window.__AURALAB_SW_REGISTERED__ === true) return;
  if (typeof window !== "undefined") window.__AURALAB_SW_REGISTERED__ = true;

  registerSW({
    immediate: true,
  });
}

function bootstrap() {
  const queryClient = new QueryClient();

  setupPwaInstallCapture();
  setupServiceWorker();

  // ✅ Initialize Supabase early and keep the instance
  initSupabaseFromConfig();

  // Fire-and-forget config load (as you already designed it)
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
