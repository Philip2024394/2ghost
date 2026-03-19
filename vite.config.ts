import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: 'es2015',
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Split heavy libraries into separate chunks
          if (id.includes('framer-motion')) {
            return 'motion';
          }
          if (id.includes('lucide-react')) {
            return 'icons';
          }
          if (id.includes('@radix-ui')) {
            return 'ui';
          }
          if (id.includes('react') || id.includes('react-dom')) {
            return 'vendor';
          }
          if (id.includes('react-router-dom')) {
            return 'router';
          }
        }
      }
    },
    chunkSizeWarningLimit: 300,
    minify: 'esbuild',
    sourcemap: false,
    assetsInlineLimit: 4096
  },
  optimizeDeps: {
    force: false,
    include: ['react', 'react-dom', 'react-router-dom']
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production')
  },
  esbuild: {
    target: 'es2015'
  }
})