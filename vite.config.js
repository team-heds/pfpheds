import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import VueDevTools from 'vite-plugin-vue-devtools'
import { VitePWA } from 'vite-plugin-pwa';
import Components from 'unplugin-vue-components/vite'
import { PrimeVueResolver } from 'unplugin-vue-components/resolvers'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5180,
    hmr: false, // DÉSACTIVER COMPLÈTEMENT LE HMR (rechargement manuel uniquement)
    watch: {
      usePolling: false,
      ignored: [
        '**/node_modules/**', 
        '**/.git/**', 
        '**/dist/**', 
        '**/backend/**',
        '**/.env/**',
        '**/public/**'
      ]
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [
    vue(),
    VueDevTools({
      launchEditor: 'phpstorm',
    }),
    Components({
      dts: 'src/components.d.ts',
      resolvers: [PrimeVueResolver()],
    }),
    VitePWA({
      disable: process.env.NODE_ENV === 'development', // Désactiver en dev
      registerType: 'autoUpdate',
      workbox: {
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/[a-zA-Z0-9-]+\.supabase\.co\/.*$/,
            handler: 'NetworkOnly',
            options: {
              cacheName: 'supabase-api',
            },
          },
          {
            urlPattern: ({ url }) => url.origin === self.location.origin,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'static-resources',
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 24 * 60 * 60, // 1 jour
              },
            },
          },
        ],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // Limite augmentée à 10 MB pour fichiers volumineux
      },
      manifest: {
        name: 'HEdS',
        short_name: 'HEdS',
        description: 'Progressive Web App pour PFPHEDS',
        theme_color: '#0B213F',
        background_color: '#0B213F',
        display: 'standalone',
        start_url: '.',
        icons: [
          {
            src: '/assets/images/hespicto.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/assets/images/hespicto.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      devOptions: {
        enabled: false, // Désactiver PWA en développement pour éviter les conflits de cache
        suppressLogs: true
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'root': fileURLToPath(new URL('./', import.meta.url))
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('vue') && !id.includes('primevue') && !id.includes('devtools')) {
              return 'vendor'
            }
            if (id.includes('primevue') || id.includes('primeicons')) {
              return 'primevue'
            }
            if (id.includes('@supabase')) {
              return 'supabase'
            }
            if (id.includes('firebase')) {
              return 'firebase'
            }
            if (id.includes('three') || id.includes('cannon')) {
              return 'three'
            }
            if (id.includes('chart.js') || id.includes('chartjs')) {
              return 'charts'
            }
            if (id.includes('@tiptap') || id.includes('prosemirror')) {
              return 'editor'
            }
            if (id.includes('xlsx') || id.includes('jspdf') || id.includes('exceljs')) {
              return 'export-libs'
            }
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000, // Optionnel : augmente la limite d'avertissement pour les chunks
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.js'],
    include: ['tests/unit/**/*.spec.js'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html'],
      reportsDirectory: './coverage',
      include: ['src/stores/**', 'src/service/**', 'src/services/**', 'src/composables/**'],
      exclude: ['node_modules/', 'tests/', 'src/**/*.vue'],
    },
  }
})
