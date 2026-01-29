// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/auth/AuthProvider";

import { loadPublicConfig } from "@/lib/publicConfig";
import { initSupabaseFromConfig } from "@/lib/supabaseClient";

const PURGE_VERSION = "purge-auralab-4"; // bump this if you ever need to force purge again

async function purgeSWAndCachesOnce() {
  if (typeof window === "undefined") return;

  const host = window.location.hostname;
  const isProd =
    host === "auralab.space" || host === "www.auralab.space";

  if (!isProd) return;

  try {
    const key = "__AURALAB_PURGE_DONE__";
    if (localStorage.getItem(key) === PURGE_VERSION) return;

    // Unregister ALL service workers on this origin
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister().catch(() => {})));
    }

    // Delete ALL caches
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k).catch(() => {})));
    }

    localStorage.setItem(key, PURGE_VERSION);

    // Reload once clean
    window.location.reload();
  } catch {
    // don't brick the app if something fails
  }
}

async function bootstrap() {
  const queryClient = new QueryClient();

  await purgeSWAndCachesOnce();

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
