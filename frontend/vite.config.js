import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api/v1': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/v1/, '/api'),
      },
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['framer-motion', 'react-hot-toast', 'react-query'],
          'form-vendor': ['react-hook-form'],
          'icon-vendor': ['lucide-react'],
          // Feature chunks
          'auth': ['./src/components/Login', './src/components/Register', './src/contexts/AuthContext'],
          'dashboard': ['./src/components/Dashboard', './src/components/dashboards/AdminDashboard', './src/components/dashboards/OrganizerDashboard', './src/components/dashboards/ParticipantDashboard'],
          'events': ['./src/components/Events', './src/components/EventDetails'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    minify: 'esbuild',
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'framer-motion'],
  },
})
