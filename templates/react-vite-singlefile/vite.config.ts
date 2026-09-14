import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Default config for development server.
// Production multi-app builds are orchestrated by build-all.js.
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  base: './',
  build: {
    target: 'esnext',
    assetsInlineLimit: 100000000,
    chunkSizeWarningLimit: 100000000,
    cssCodeSplit: false,
    rollupOptions: {
      inlineDynamicImports: true,
    },
  },
});

