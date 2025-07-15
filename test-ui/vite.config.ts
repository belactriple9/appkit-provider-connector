import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 4200,
    host: true
  },
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      '@1inch/limit-order-sdk': '/home/belac/junk/limit-order-sdk/src'
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom']
  }
})
