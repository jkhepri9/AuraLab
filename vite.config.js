import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',

      // IMPORTANT: lets you validate PWA behavior during `npm run dev`
      devOptions: {
        enabled: true,
      },

      // Ensures predictable SW path for cache headers + debugging
      filename: 'sw.js',

      includeAssets: [
        'icons/apple-touch-icon.png',
        'icons/favicon-32.png',
        'icons/favicon-16.png',
        'icons/pwa-192.png',
        'icons/pwa-512.png',
      ],

      manifest: {
        name: 'AuraLab',
        short_name: 'AuraLab',
        description:
          "The world's first Aura-Design Studio for your mind, energy and environment.",
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#09090b',
        theme_color: '#09090b',
        icons: [
          { src: '/icons/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/pwa-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },

      workbox: {
        // Keeps React Router deep links working offline
        navigateFallback: '/index.html',

        // Good baseline to avoid bloated precache with large audio libraries
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],

        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'images',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
          {
            // Offline choice B: cache audio after it’s played once (runtime cache)
            urlPattern: ({ request }) => request.destination === 'audio',
            handler: 'CacheFirst',
            options: {
              cacheName: 'audio',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
