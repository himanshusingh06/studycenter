import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'https://studycenter-1wi5.onrender.com',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'https://studycenter-1wi5.onrender.com',
        changeOrigin: true,
      }
    }
  }
})
