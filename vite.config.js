// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: '.', // Project root
  build: {
    outDir: 'dist', // Cloudflare Pages output directory
    sourcemap: true, // For debugging
    rollupOptions: {
      input: './index.html', // Entry point is index.html
    },
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'https://my-worker.africancontent807.workers.dev',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
});