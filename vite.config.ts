import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  base: '/Pasos-Uniones-Guia/',
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        asesor: resolve(__dirname, 'asesor-juntas.html'),
        compat: resolve(__dirname, 'compatibilidad.html'),
        juntas: resolve(__dirname, 'juntas.html'),
        juntasShips: resolve(__dirname, 'juntas_ships.html'),
      },
    },
  },
});
