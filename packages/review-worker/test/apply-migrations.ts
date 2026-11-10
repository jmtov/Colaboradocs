import { applyD1Migrations, env } from 'cloudflare:test';

type TestEnv = typeof env & {
  MIGRATIONS: Parameters<typeof applyD1Migrations>[1];
};

await applyD1Migrations(env.DB, (env as TestEnv).MIGRATIONS);
