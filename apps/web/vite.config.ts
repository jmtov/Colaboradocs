import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';
import solid from 'vite-plugin-solid';
import { defineConfig } from 'vitest/config';

const root = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig(({ mode }) => {
  // Qué documento se compila: DOCUMENT=documents/otro.json (variable de
  // entorno o `.env.local`). Por defecto, el de ejemplo.
  const env = loadEnv(mode, root, '');
  const documentPath = resolve(
    root,
    process.env.DOCUMENT ?? env.DOCUMENT ?? 'documents/example.json',
  );
  const { title } = JSON.parse(readFileSync(documentPath, 'utf8')) as {
    title: string;
  };

  return {
    plugins: [
      solid(),
      {
        // Pone el título del documento en <title>.
        name: 'document-title',
        transformIndexHtml: (html: string) =>
          html.replace('%DOCUMENT_TITLE%', title.replace(/</g, '&lt;')),
      },
    ],
    resolve: {
      // una sola copia de Solid aunque review-ui venga de otra carpeta
      dedupe: ['solid-js'],
      alias: {
        '@document': documentPath,
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
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
  };
});
