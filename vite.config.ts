import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Reenvía /api al BE: así el celular (página /captura del QR) solo necesita
    // llegar al puerto de Vite y no hay problemas de CORS.
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
