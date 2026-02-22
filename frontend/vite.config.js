// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // Show full errors in terminal
    hmr: true,
    // Optional: open browser automatically
    open: true,
  },
  // Show detailed errors
  esbuild: {
    logOverride: {
      'this-is-undefined-in-esm': 'silent',
    },
  },
})