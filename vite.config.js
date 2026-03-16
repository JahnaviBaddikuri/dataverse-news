// vite.config.js  —  UPDATED
//
// CHANGE: Added server.proxy so the Vite dev server forwards
// /api/* requests to the backend at http://localhost:3001
// This means you can also use /api/... without CORS issues in dev.
//
// The VITE_BACKEND_URL env var still works — this proxy is just
// a convenience so you don't have to set it manually in some setups.

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // Forward /api requests to the Express backend
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
