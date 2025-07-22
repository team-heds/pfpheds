// vite.config.js
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "file:///C:/Users/antoine.quarroz/Desktop/LabDev/pfpheds/node_modules/vite/dist/node/index.js";
import vue from "file:///C:/Users/antoine.quarroz/Desktop/LabDev/pfpheds/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import VueDevTools from "file:///C:/Users/antoine.quarroz/Desktop/LabDev/pfpheds/node_modules/vite-plugin-vue-devtools/dist/vite.mjs";
import { VitePWA } from "file:///C:/Users/antoine.quarroz/Desktop/LabDev/pfpheds/node_modules/vite-plugin-pwa/dist/index.js";
var __vite_injected_original_import_meta_url = "file:///C:/Users/antoine.quarroz/Desktop/LabDev/pfpheds/vite.config.js";
var vite_config_default = defineConfig({
  server: {
    host: "0.0.0.0",
    port: 5177
  },
  plugins: [
    vue(),
    VueDevTools({
      launchEditor: "phpstorm"
    }),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin === self.location.origin,
            handler: "CacheFirst",
            options: {
              cacheName: "static-resources",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 30 * 24 * 60 * 60
                // 30 jours
              }
            }
          }
        ],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024
        // Limite augmentée à 5 Mo
      },
      manifest: {
        name: "HEdS",
        short_name: "HEdS",
        description: "Progressive Web App pour PFPHEDS",
        theme_color: "#0B213F",
        background_color: "#0B213F",
        display: "standalone",
        start_url: ".",
        icons: [
          {
            src: "/assets/images/hespicto.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "/assets/images/hespicto.png",
            sizes: "512x512",
            type: "image/png"
          }
        ]
      },
      includeAssets: ["favicon.ico", "robots.txt", "apple-touch-icon.png"],
      devOptions: {
        enabled: true
      }
    })
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", __vite_injected_original_import_meta_url)),
      "root": fileURLToPath(new URL("./", __vite_injected_original_import_meta_url))
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["vue", "vue-router"]
          // Par exemple, regrouper les dépendances tierces
        }
      }
    },
    chunkSizeWarningLimit: 1e3
    // Optionnel : augmente la limite d'avertissement pour les chunks
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxhbnRvaW5lLnF1YXJyb3pcXFxcRGVza3RvcFxcXFxMYWJEZXZcXFxccGZwaGVkc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcYW50b2luZS5xdWFycm96XFxcXERlc2t0b3BcXFxcTGFiRGV2XFxcXHBmcGhlZHNcXFxcdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL2FudG9pbmUucXVhcnJvei9EZXNrdG9wL0xhYkRldi9wZnBoZWRzL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZmlsZVVSTFRvUGF0aCwgVVJMIH0gZnJvbSAnbm9kZTp1cmwnXG5cbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnXG5pbXBvcnQgdnVlIGZyb20gJ0B2aXRlanMvcGx1Z2luLXZ1ZSdcbmltcG9ydCBWdWVEZXZUb29scyBmcm9tICd2aXRlLXBsdWdpbi12dWUtZGV2dG9vbHMnXG5pbXBvcnQgeyBWaXRlUFdBIH0gZnJvbSAndml0ZS1wbHVnaW4tcHdhJztcblxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHNlcnZlcjoge1xuICAgIGhvc3Q6ICcwLjAuMC4wJyxcbiAgICBwb3J0OiA1MTc3LFxuICB9LFxuICBwbHVnaW5zOiBbXG4gICAgdnVlKCksXG4gICAgVnVlRGV2VG9vbHMoe1xuICAgICAgbGF1bmNoRWRpdG9yOiAncGhwc3Rvcm0nLFxuICAgIH0pLFxuICAgIFZpdGVQV0Eoe1xuICAgICAgcmVnaXN0ZXJUeXBlOiAnYXV0b1VwZGF0ZScsXG4gICAgICB3b3JrYm94OiB7XG4gICAgICAgIHJ1bnRpbWVDYWNoaW5nOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgdXJsUGF0dGVybjogKHsgdXJsIH0pID0+IHVybC5vcmlnaW4gPT09IHNlbGYubG9jYXRpb24ub3JpZ2luLFxuICAgICAgICAgICAgaGFuZGxlcjogJ0NhY2hlRmlyc3QnLFxuICAgICAgICAgICAgb3B0aW9uczoge1xuICAgICAgICAgICAgICBjYWNoZU5hbWU6ICdzdGF0aWMtcmVzb3VyY2VzJyxcbiAgICAgICAgICAgICAgZXhwaXJhdGlvbjoge1xuICAgICAgICAgICAgICAgIG1heEVudHJpZXM6IDUwLFxuICAgICAgICAgICAgICAgIG1heEFnZVNlY29uZHM6IDMwICogMjQgKiA2MCAqIDYwLCAvLyAzMCBqb3Vyc1xuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgICBtYXhpbXVtRmlsZVNpemVUb0NhY2hlSW5CeXRlczogNSAqIDEwMjQgKiAxMDI0LCAvLyBMaW1pdGUgYXVnbWVudFx1MDBFOWUgXHUwMEUwIDUgTW9cbiAgICAgIH0sXG4gICAgICBtYW5pZmVzdDoge1xuICAgICAgICBuYW1lOiAnSEVkUycsXG4gICAgICAgIHNob3J0X25hbWU6ICdIRWRTJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdQcm9ncmVzc2l2ZSBXZWIgQXBwIHBvdXIgUEZQSEVEUycsXG4gICAgICAgIHRoZW1lX2NvbG9yOiAnIzBCMjEzRicsXG4gICAgICAgIGJhY2tncm91bmRfY29sb3I6ICcjMEIyMTNGJyxcbiAgICAgICAgZGlzcGxheTogJ3N0YW5kYWxvbmUnLFxuICAgICAgICBzdGFydF91cmw6ICcuJyxcbiAgICAgICAgaWNvbnM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBzcmM6ICcvYXNzZXRzL2ltYWdlcy9oZXNwaWN0by5wbmcnLFxuICAgICAgICAgICAgc2l6ZXM6ICcxOTJ4MTkyJyxcbiAgICAgICAgICAgIHR5cGU6ICdpbWFnZS9wbmcnLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgc3JjOiAnL2Fzc2V0cy9pbWFnZXMvaGVzcGljdG8ucG5nJyxcbiAgICAgICAgICAgIHNpemVzOiAnNTEyeDUxMicsXG4gICAgICAgICAgICB0eXBlOiAnaW1hZ2UvcG5nJyxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgfSxcbiAgICAgIGluY2x1ZGVBc3NldHM6IFsnZmF2aWNvbi5pY28nLCAncm9ib3RzLnR4dCcsICdhcHBsZS10b3VjaC1pY29uLnBuZyddLFxuICAgICAgZGV2T3B0aW9uczoge1xuICAgICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgfSxcbiAgICB9KSxcbiAgXSxcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICAnQCc6IGZpbGVVUkxUb1BhdGgobmV3IFVSTCgnLi9zcmMnLCBpbXBvcnQubWV0YS51cmwpKSxcbiAgICAgICdyb290JzogZmlsZVVSTFRvUGF0aChuZXcgVVJMKCcuLycsIGltcG9ydC5tZXRhLnVybCkpXG4gICAgfVxuICB9LFxuICBidWlsZDoge1xuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIG91dHB1dDoge1xuICAgICAgICBtYW51YWxDaHVua3M6IHtcbiAgICAgICAgICB2ZW5kb3I6IFsndnVlJywgJ3Z1ZS1yb3V0ZXInXSwgLy8gUGFyIGV4ZW1wbGUsIHJlZ3JvdXBlciBsZXMgZFx1MDBFOXBlbmRhbmNlcyB0aWVyY2VzXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0sXG4gICAgY2h1bmtTaXplV2FybmluZ0xpbWl0OiAxMDAwLCAvLyBPcHRpb25uZWwgOiBhdWdtZW50ZSBsYSBsaW1pdGUgZCdhdmVydGlzc2VtZW50IHBvdXIgbGVzIGNodW5rc1xuICB9LFxufSlcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBMlUsU0FBUyxlQUFlLFdBQVc7QUFFOVcsU0FBUyxvQkFBb0I7QUFDN0IsT0FBTyxTQUFTO0FBQ2hCLE9BQU8saUJBQWlCO0FBQ3hCLFNBQVMsZUFBZTtBQUx5TCxJQUFNLDJDQUEyQztBQVFsUSxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsRUFDUjtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsSUFBSTtBQUFBLElBQ0osWUFBWTtBQUFBLE1BQ1YsY0FBYztBQUFBLElBQ2hCLENBQUM7QUFBQSxJQUNELFFBQVE7QUFBQSxNQUNOLGNBQWM7QUFBQSxNQUNkLFNBQVM7QUFBQSxRQUNQLGdCQUFnQjtBQUFBLFVBQ2Q7QUFBQSxZQUNFLFlBQVksQ0FBQyxFQUFFLElBQUksTUFBTSxJQUFJLFdBQVcsS0FBSyxTQUFTO0FBQUEsWUFDdEQsU0FBUztBQUFBLFlBQ1QsU0FBUztBQUFBLGNBQ1AsV0FBVztBQUFBLGNBQ1gsWUFBWTtBQUFBLGdCQUNWLFlBQVk7QUFBQSxnQkFDWixlQUFlLEtBQUssS0FBSyxLQUFLO0FBQUE7QUFBQSxjQUNoQztBQUFBLFlBQ0Y7QUFBQSxVQUNGO0FBQUEsUUFDRjtBQUFBLFFBQ0EsK0JBQStCLElBQUksT0FBTztBQUFBO0FBQUEsTUFDNUM7QUFBQSxNQUNBLFVBQVU7QUFBQSxRQUNSLE1BQU07QUFBQSxRQUNOLFlBQVk7QUFBQSxRQUNaLGFBQWE7QUFBQSxRQUNiLGFBQWE7QUFBQSxRQUNiLGtCQUFrQjtBQUFBLFFBQ2xCLFNBQVM7QUFBQSxRQUNULFdBQVc7QUFBQSxRQUNYLE9BQU87QUFBQSxVQUNMO0FBQUEsWUFDRSxLQUFLO0FBQUEsWUFDTCxPQUFPO0FBQUEsWUFDUCxNQUFNO0FBQUEsVUFDUjtBQUFBLFVBQ0E7QUFBQSxZQUNFLEtBQUs7QUFBQSxZQUNMLE9BQU87QUFBQSxZQUNQLE1BQU07QUFBQSxVQUNSO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFBQSxNQUNBLGVBQWUsQ0FBQyxlQUFlLGNBQWMsc0JBQXNCO0FBQUEsTUFDbkUsWUFBWTtBQUFBLFFBQ1YsU0FBUztBQUFBLE1BQ1g7QUFBQSxJQUNGLENBQUM7QUFBQSxFQUNIO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLGNBQWMsSUFBSSxJQUFJLFNBQVMsd0NBQWUsQ0FBQztBQUFBLE1BQ3BELFFBQVEsY0FBYyxJQUFJLElBQUksTUFBTSx3Q0FBZSxDQUFDO0FBQUEsSUFDdEQ7QUFBQSxFQUNGO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDTCxlQUFlO0FBQUEsTUFDYixRQUFRO0FBQUEsUUFDTixjQUFjO0FBQUEsVUFDWixRQUFRLENBQUMsT0FBTyxZQUFZO0FBQUE7QUFBQSxRQUM5QjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsSUFDQSx1QkFBdUI7QUFBQTtBQUFBLEVBQ3pCO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
