// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: '.', // Project root
  build: {
    outDir: 'dist', // Cloudflare Pages expects this directory
    sourcemap: true, // Useful for debugging
    rollupOptions: {
      input: {
        main: './index.html', // Entry point for the build
      },
    },
  },
  server: {
    port: 3000, // Local dev port
    open: true, // Open browser on dev start
    proxy: {
      '/api': {
        target: 'https://my-worker.africancontent807.workers.dev', // Your Worker URL
        changeOrigin: true,
        secure: true,
      },
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
});
