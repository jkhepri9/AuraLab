import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      filename: 'sw.js',

      // If you want PWA active during npm run dev, set true.
      // For Codespaces, false avoids extra tunnel issues.
      devOptions: {
        enabled: false,
      },

      includeAssets: [
        'icons/apple-touch-icon-180.png',
        'icons/favicon-32.png',
        'icons/favicon-16.png',
        'icons/auralab-192.png',
        'icons/auralab-512.png',
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
          { src: '/icons/auralab-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/auralab-512.png', sizes: '512x512', type: 'image/png' }
        ]
      },

      workbox: {
        cleanupOutdatedCaches: true,
        navigateFallback: '/index.html',

        // Prevent Workbox from answering these paths as "navigation"
        navigateFallbackDenylist: [
          /^\/icons\//,
          /^\/manifest\.webmanifest$/,
          /^\/sw\.js$/,
          /^\/favicon\.ico$/,
        ],

        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'images',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30
              }
            }
          },
          {
            urlPattern: ({ request }) => request.destination === 'audio',
            handler: 'CacheFirst',
            options: {
              cacheName: 'audio',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30
              }
            }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') }
  }
})
