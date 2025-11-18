import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'persist-zustand': path.resolve(__dirname, '../src/index.ts'),
    },
    dedupe: ['zustand'],
    preserveSymlinks: false,
  },
  optimizeDeps: {
    include: ['zustand'],
  },
  server: {
    fs: {
      allow: ['..'],
    },
  },
})

