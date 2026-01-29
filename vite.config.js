import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/",

  plugins: [
    react(),

    VitePWA({
      // ✅ CRITICAL: do not inject/register a service worker at all
      injectRegister: false,

      // you can keep these (manifest generation still works)
      registerType: "autoUpdate",
      filename: "sw.js",

      devOptions: {
        enabled: false,
      },

      includeAssets: [
        "icons/apple-touch-icon-180.png",
        "icons/favicon-32.png",
        "icons/favicon-16.png",
        "icons/auralab-192.png",
        "icons/auralab-512.png",
        "icons/auralab-192-maskable.png",
        "icons/auralab-512-maskable.png",
      ],

      manifest: {
        name: "AuraLab",
        short_name: "AuraLab",
        description:
          "The world's first Aura-Design Studio for your mind, energy and environment.",
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: "#09090b",
        theme_color: "#09090b",
        icons: [
          {
            src: "/icons/auralab-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/auralab-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/auralab-192-maskable.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "/icons/auralab-512-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },

      // ✅ remove runtimeCaching entirely (Workbox should not be involved)
      // (Leaving this out prevents your images from getting “handled” by SW logic)
    }),
  ],

  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
