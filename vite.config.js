import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/",

  plugins: [
    react(),

    VitePWA({
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

      workbox: {
        cleanupOutdatedCaches: true,
        navigateFallback: "/index.html",

        // ✅ Never treat these as SPA navigations
        navigateFallbackDenylist: [
          /^\/icons\//,
          /^\/manifest\.webmanifest$/,
          /^\/sw\.js$/,
          /^\/favicon\.ico$/,
          /^\/modeimages\//,
          /^\/live\//,
          /^\/audio\//,
          /^\/api\//,
        ],

        runtimeCaching: [
          {
            urlPattern: ({ request, url }) =>
              request.destination === "image" &&
              (url.pathname.startsWith("/modeimages/") ||
                url.pathname.startsWith("/live/")),
            handler: "CacheFirst",
            options: {
              cacheName: "static-images",
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: {
                statuses: [200],
              },
            },
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/audio/"),
            handler: "CacheFirst",
            options: {
              cacheName: "audio",
              expiration: {
                maxEntries: 24,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: {
                statuses: [200],
              },
            },
          },
        ],
      },
    }),
  ],

  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
