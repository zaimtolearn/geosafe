import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // This tells Vite to split heavy libraries into separate chunks
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('firebase')) return 'vendor-firebase';
            if (id.includes('leaflet')) return 'vendor-leaflet';
            if (id.includes('jspdf') || id.includes('html2canvas')) return 'vendor-pdf';
            return 'vendor-core'; 
          }
        }
      }
    },
    // Optional: Increases the warning limit slightly since we are building a complex map app
    chunkSizeWarningLimit: 800, 
  }
})