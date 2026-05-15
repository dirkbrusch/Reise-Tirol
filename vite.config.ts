import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Wildschoenau Reise-Guide',
        short_name: 'Reise-Tirol',
        description: 'Reisedokumentation Wildschoenau / Auffach',
        theme_color: '#1f4029',
        background_color: '#1f4029',
        display: 'standalone',
        lang: 'de',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,md,webmanifest}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.open-meteo\.com\/.*/i,
            handler: 'NetworkFirst',
            options: { cacheName: 'open-meteo', networkTimeoutSeconds: 5 }
          },
          {
            urlPattern: /^https:\/\/tile\.openstreetmap\.org\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'osm-tiles', expiration: { maxEntries: 200 } }
          }
        ]
      }
    })
  ],
  resolve: { alias: { '@': resolve(__dirname, 'src') } },
  build: { outDir: 'dist', copyPublicDir: true }
});