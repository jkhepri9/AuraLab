// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/auth/AuthProvider";

import { loadPublicConfig } from "@/lib/publicConfig";
import { initSupabaseFromConfig } from "@/lib/supabaseClient";

// ✅ IMPORTANT: create queryClient BEFORE using it
const queryClient = new QueryClient();

// ✅ Optional PWA register (won’t crash if plugin is missing)
(async () => {
  try {
    const mod = await import("virtual:pwa-register");
    const registerSW = mod?.registerSW;
    if (typeof registerSW === "function") registerSW({ immediate: true });
  } catch {}
})();

async function bootstrap() {
  // Load public config from server (works in prod + preview + dev)
  const cfg = await loadPublicConfig();
  initSupabaseFromConfig(cfg);

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
