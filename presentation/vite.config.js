import { defineConfig } from 'vite'

export default defineConfig({
  base: '/presentation/',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    host: '0.0.0.0',
    port: 5182,
    fs: {
      allow: ['..'],
    },
  },
})
