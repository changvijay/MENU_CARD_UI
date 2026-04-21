import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://menu-card-api-yvzycdnaqq-el.a.run.app',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
      '/auth/login': {
        target: 'https://menu-card-api-yvzycdnaqq-el.a.run.app',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
