/** El `account_id` de un wrangler.jsonc, o null si no lo trae. */
export function accountIdFromConfig(config: string): string | null {
  return /^\s*"account_id"\s*:\s*"([0-9a-f]{32})"/m.exec(config)?.[1] ?? null;
}

/**
 * Reescribe las rutas de un wrangler.jsonc pensado para `packages/review-worker`
 * (`src/index.ts`, `../../apps/web/dist`, `migrations`) para que valgan desde otra
 * carpeta: el código y las migraciones se ven desde `appDir`; la página compilada es la
 * `./dist` de ese nodo. `appDir` es `packages/review-worker` visto desde la del wrangler.jsonc.
 * Falla si falta alguna ruta: un reemplazo que no coincide dejaría la config rota
 * sin avisar.
 */
export function rebaseConfigPaths(config: string, appDir: string): string {
  const base = appDir.replace(/\/+$/, '');
  const replacements: [string, string][] = [
    ['"main": "src/index.ts"', `"main": "${base}/src/index.ts"`],
    // La página se compila por nodo (apps/web/vite.config.ts con NODE_DIR) y queda en su carpeta.
    ['"directory": "../../apps/web/dist"', '"directory": "./dist"'],
    [
      '"migrations_dir": "migrations"',
      `"migrations_dir": "${base}/migrations"`,
    ],
  ];
  let result = config;
  for (const [from, to] of replacements) {
    if (!result.includes(from)) {
      throw new Error(`No encuentro ${from} en el wrangler.jsonc.`);
    }
    result = result.replace(from, to);
  }
  return result;
}
