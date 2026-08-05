import { defineConfig } from 'vite'
import { resolve } from 'node:path'

export default defineConfig({
  base: '/presentation/',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        agentsIaDeveloppement: resolve(import.meta.dirname, 'agents-ia-developpement/index.html'),
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5182,
    fs: {
      allow: ['..'],
    },
  },
})
