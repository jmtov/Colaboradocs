import { fileURLToPath } from 'node:url';
import solid from 'vite-plugin-solid';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [solid()],
  resolve: {
    // una sola copia de Solid aunque review-ui venga de otra carpeta
    dedupe: ['solid-js'],
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    // Accesible desde el celular en la misma red (http://<ip-del-mac>:5180).
    host: true,
    port: 5180,
    strictPort: true,
    // En dev el API corre en `wrangler dev` (puerto 8800 por defecto).
    proxy: { '/api': process.env.API_ORIGIN ?? 'http://localhost:8800' },
  },
  test: { environment: 'node' },
});
