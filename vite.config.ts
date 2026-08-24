import { fileURLToPath, URL } from 'node:url'

// Third-party Imports
import { defineConfig } from 'vite'

import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  base: process.env.BASEPATH ?? '/',
  server: {
    port: 3000
  }
})