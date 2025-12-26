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

// ✅ Capacitor native detection (prevents SW/PWA behavior inside native shells)
import { Capacitor } from "@capacitor/core";

// ✅ Native auth return bridge
import { setupNativeAuthBridge } from "@/auth/nativeAuthBridge";

const queryClient = new QueryClient();

function isNativeShell() {
  try {
    return Capacitor?.isNativePlatform?.() === true;
  } catch {
    return false;
  }
}

function setupPwaInstallCapture() {
  if (typeof window === "undefined") return;

  // ✅ Do not run PWA install prompt capture in native shells
  if (isNativeShell()) return;

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
  // ✅ Do not register SW in native shells (common source of caching issues)
  if (isNativeShell()) return;

  if (!import.meta.env.PROD) return;

  if (typeof window !== "undefined" && window.__AURALAB_SW_REGISTERED__ === true) return;
  if (typeof window !== "undefined") window.__AURALAB_SW_REGISTERED__ = true;

  registerSW({
    immediate: true,
  });
}

function bootstrap() {
  setupPwaInstallCapture();
  setupServiceWorker();

  // ✅ Initialize Supabase early and keep the instance
  const { supabase } = initSupabaseFromConfig();

  // ✅ If in native shell, handle OAuth return-to-app callbacks
  if (isNativeShell() && supabase) {
    setupNativeAuthBridge({
      supabase,
      onAuthed: () => {
        // Optional: you can route here if you want.
        // Keep it empty if AuthProvider already handles auth state + routing.
      },
    });
  }

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
