import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://menu-card-711863627897.europe-west1.run.app',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
      '^/auth/login': {
        target: 'https://menu-card-711863627897.europe-west1.run.app',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
