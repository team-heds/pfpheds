import { fileURLToPath, URL } from 'node:url'
import { realpathSync } from 'node:fs'

import { defineConfig, searchForWorkspaceRoot } from 'vite'
import vue from '@vitejs/plugin-vue'
import VueDevTools from 'vite-plugin-vue-devtools'
import { VitePWA } from 'vite-plugin-pwa';
import Components from 'unplugin-vue-components/vite'
import { PrimeVueResolver } from 'unplugin-vue-components/resolvers'
import { createShellPrecache } from './scripts/pwa/shellPrecache.mjs'

const stagingProxyTarget = process.env.VITE_STAGING_PROXY_TARGET || null
const shellPrecache = createShellPrecache()

function presentationDevAssets() {
  return {
    name: 'presentation-dev-assets',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((request, _response, next) => {
        if (request.url?.startsWith('/presentation/assets/')) {
          request.url = request.url.replace('/presentation/assets/', '/presentation/public/assets/')
        } else if (request.url?.startsWith('/presentation/picto-heds-wave.svg')) {
          request.url = request.url.replace(
            '/presentation/picto-heds-wave.svg',
            '/presentation/public/picto-heds-wave.svg',
          )
        }

        next()
      })
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  // Keep optimized dependencies local to each Git worktree. Sharing the
  // default node_modules/.vite cache makes parallel dev servers invalidate
  // one another and forces full-page reloads while navigating.
  cacheDir: '.vite-cache',
  optimizeDeps: {
    // These libraries live mostly behind lazy routes. Pre-bundle them at
    // startup so opening a page never causes Vite to restart the application.
    include: [
      'primevue/card',
      'primevue/calendar',
      'primevue/progressspinner',
      'primevue/inputnumber',
      'primevue/selectbutton',
      'primevue/divider',
      'primevue/paginator',
      'leaflet',
      'chart.js',
      'vue-chartjs',
      '@fullcalendar/core',
      '@fullcalendar/daygrid',
      '@fullcalendar/interaction',
      '@fullcalendar/timegrid',
      '@fullcalendar/vue3',
      '@tiptap/core',
      '@tiptap/starter-kit',
      '@tiptap/vue-3',
      'exceljs',
      'jspdf',
      'jspdf-autotable',
      'qrcode',
      'three',
      'xlsx',
    ],
  },
  server: {
    host: '0.0.0.0',
    port: 5180,
    strictPort: true,
    // Git worktrees can share node_modules with the main checkout. Vite resolves
    // font URLs to that real path, so explicitly allow the resolved dependency
    // directory while preserving the default workspace allow-list.
    fs: {
      allow: [
        searchForWorkspaceRoot(process.cwd()),
        realpathSync(fileURLToPath(new URL('./node_modules', import.meta.url))),
      ],
    },
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
        target: stagingProxyTarget || 'https://api2.hedsvs.ch',
        changeOrigin: true,
        secure: !stagingProxyTarget,
      },
      ...(stagingProxyTarget
        ? Object.fromEntries(
            ['/auth', '/rest', '/storage', '/functions', '/realtime'].map(prefix => [
              prefix,
              {
                target: stagingProxyTarget,
                changeOrigin: true,
                secure: false,
                ws: prefix === '/realtime',
              },
            ]),
          )
        : {}),
    },
  },
  plugins: [
    presentationDevAssets(),
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag === 'elevenlabs-convai',
        },
      },
    }),
    VueDevTools({
      launchEditor: 'phpstorm',
    }),
    Components({
      dts: 'src/components.d.ts',
      resolvers: [PrimeVueResolver()],
    }),
    shellPrecache.plugin,
    VitePWA({
      disable: process.env.NODE_ENV === 'development', // Désactiver en dev
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      injectManifest: {
        // woff2 : polices et icônes restent lisibles hors ligne.
        globPatterns: ['**/*.{js,css,html,woff2}'],
        // Seule la coque est préchargée ; les écrans sont mis en cache à leur première visite.
        manifestTransforms: [shellPrecache.transform],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10 MB
      },
      manifest: {
        name: 'HEdS',
        short_name: 'HEdS',
        description: 'Plateforme de formation pratique de la Haute Ecole de Santé : fil d’actualité, stages, documents et progression.',
        lang: 'fr',
        theme_color: '#0B213F',
        background_color: '#0B213F',
        display: 'standalone',
        // Android : l'application installée reste à la verticale.
        orientation: 'portrait',
        start_url: '.',
        // Chaque fichier a réellement la taille annoncée : Android refuse
        // l'installation quand une icône ne correspond pas à sa déclaration.
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      includeAssets: ['icons/*.png'],
      devOptions: {
        enabled: false,
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
  esbuild: {
    // Keep warnings and errors in production so incidents remain observable.
    // Debug-only statements and debugger instructions are still stripped.
    drop: process.env.NODE_ENV === 'production' ? ['debugger'] : [],
    pure: process.env.NODE_ENV === 'production' ? ['console.debug'] : [],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // PrimeVue n'est plus regroupé en un seul fichier : chaque écran ne
            // télécharge que les composants qu'il utilise (885 Ko d'un bloc auparavant).
            if (/[\\/]node_modules[\\/]primevue[\\/](config|api|utils|base|basecomponent|basedirective|usestyle|service|toast|toastservice|confirmationservice|confirmdialog|confirmpopup|dialog|dialogservice|button|ripple|tooltip|styleclass|badgedirective|portal|focustrap)[\\/]/.test(id)) {
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
            if (id.includes('xlsx')) {
              return 'xlsx'
            }
            if (id.includes('exceljs')) {
              return 'exceljs'
            }
            if (id.includes('jspdf')) {
              return 'jspdf'
            }
            if (id.includes('leaflet')) {
              return 'leaflet'
            }
            // Cœur de Vue seulement. Une règle « le nom contient vue » rangeait aussi
            // vue-chartjs et @tiptap/vue-3 ici : chaque page téléchargeait alors les
            // graphiques et l'éditeur de texte au démarrage.
            if (/[\\/]node_modules[\\/](vue|@vue|vue-router|pinia|vue-demi)[\\/]/.test(id)) {
              return 'vendor'
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
      include: ['src/stores/**', 'src/service/**', 'src/composables/**'],
      exclude: ['node_modules/', 'tests/', 'src/**/*.vue'],
    },
  }
})
