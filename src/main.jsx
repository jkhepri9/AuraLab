// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/auth/AuthProvider";

import { loadPublicConfig } from "@/lib/publicConfig";
import { initSupabaseFromConfig } from "@/lib/supabaseClient";

const queryClient = new QueryClient();

/**
 * Optional: keep install prompt handling (NO PWA service worker)
 * This does NOT break anything and is safe in production.
 */
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

function bootstrap() {
  setupPwaInstallCapture();

  // Initialize backend/config safely
  initSupabaseFromConfig();

  // Non-blocking config load
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