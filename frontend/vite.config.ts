import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',  // penting agar bisa diakses dari luar container
    port: 5173,
    proxy: {
      '/api': 'http://backend:8000'
    }
  }
})
