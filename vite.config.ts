import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/Rooted-FamilyTree/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['rooted.svg'],
      manifest: {
        name: 'Rooted Family Tree',
        short_name: 'Rooted',
        description: 'A quiet, personal space to map your family tree.',
        theme_color: '#f2eee4',
        background_color: '#f2eee4',
        display: 'standalone',
        start_url: './',
        scope: './',
        icons: [
          { src: 'rooted.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
      workbox: {
        navigateFallback: 'index.html',
        globPatterns: ['**/*.{js,css,html,svg,ico,png,woff2}'],
      },
    }),
  ],
});
