import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// base: './' sayesinde aynı derleme hem https://aicalc.sysarticles.com/ kökünde
// hem de https://<kullanici>.github.io/aicalc/ alt yolunda çalışır.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 700,
    target: 'es2022',
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/echarts') || id.includes('node_modules/zrender')) return 'charts';
          if (id.includes('node_modules/react')) return 'react';
        },
      },
    },
  },
});
