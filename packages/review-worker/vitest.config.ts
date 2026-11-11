import { fileURLToPath } from 'node:url';
import { cloudflareTest, readD1Migrations } from '@cloudflare/vitest-plugin';
import { defineConfig } from 'vitest/config';

export default defineConfig(async () => {
  const migrations = await readD1Migrations('./migrations');
  return {
    plugins: [
      cloudflareTest({
        main: './src/index.ts',
        miniflare: {
          compatibilityDate: '2026-07-01',
          d1Databases: ['DB'],
          bindings: {
            TOKEN_SECRET: 'secreto-de-prueba',
            MIGRATIONS: migrations,
          },
        },
      }),
    ],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    test: { setupFiles: ['./test/apply-migrations.ts'] },
  };
});
