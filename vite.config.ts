import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        asesor: resolve(__dirname, 'asesor-juntas.html'),
        compat: resolve(__dirname, 'compatibilidad.html'),
      },
    },
  },
});
