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
          // Admin charts — only loaded on /admin routes
          if (id.includes('recharts') || id.includes('d3-') || id.includes('victory')) {
            return 'charts';
          }
          // Framer Motion
          if (id.includes('framer-motion')) {
            return 'motion';
          }
          // Lucide icons
          if (id.includes('lucide-react')) {
            return 'icons';
          }
          // Radix UI
          if (id.includes('@radix-ui')) {
            return 'ui';
          }
          // Supabase — large, rarely changes
          if (id.includes('@supabase')) {
            return 'supabase';
          }
          // React core
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'vendor';
          }
          // React Router
          if (id.includes('react-router-dom') || id.includes('react-router/')) {
            return 'router';
          }
        }
      }
    },
    chunkSizeWarningLimit: 400,
    minify: true,
    sourcemap: false,
    assetsInlineLimit: 4096,
  },
  optimizeDeps: {
    force: false,
    include: ['react', 'react-dom', 'react-router-dom'],
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
})
