import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import solid from 'vite-plugin-solid';
import { defineConfig } from 'vitest/config';
import { pwaPlugin } from './pwa/pwa.plugin';

// Con NODE_DIR el build es el de una instancia: toma sus archivos públicos de `<NODE_DIR>/public`
// (p. ej. los que enlazan sus documentos, que se sirven sin PIN) y deja la página en
// `<NODE_DIR>/dist`, la carpeta de assets de su wrangler.jsonc. Cada instancia necesita su
// propio build. Sin NODE_DIR, el build usa `apps/web/public` y `apps/web/dist`, como siempre.
const nodeDir = process.env.NODE_DIR ? resolve(process.env.NODE_DIR) : null;

export default defineConfig({
  plugins: [solid(), pwaPlugin(nodeDir)],
  ...(nodeDir
    ? {
        publicDir: join(nodeDir, 'public'),
        build: { outDir: join(nodeDir, 'dist'), emptyOutDir: true },
      }
    : {}),
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
