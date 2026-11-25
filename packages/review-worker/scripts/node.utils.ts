import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { accountIdFromConfig } from './node-config.utils';

/**
 * Carpeta de la instancia (un nodo): su wrangler.jsonc, `.prod.vars`, `pins.private*`
 * y respaldos. Con `NODE_DIR` los CLI actúan sobre esa instancia en producción; sin
 * ella, sobre el directorio actual (lo de siempre).
 */
export const NODE_DIR: string | null = process.env.NODE_DIR
  ? resolve(process.env.NODE_DIR)
  : null;

/** La ruta de un archivo de la instancia: en NODE_DIR si está, si no en el directorio actual. */
export function nodePath(file: string): string {
  return NODE_DIR ? join(NODE_DIR, file) : file;
}

/** NODE_DIR es de producción: la base local no es de ningún nodo. */
export function assertNodeUsage(remote: boolean): void {
  if (NODE_DIR && !remote) {
    console.error(
      'NODE_DIR solo se usa con --remote (la base local no es de ningún nodo).',
    );
    process.exit(1);
  }
}

/** Argumentos de wrangler para apuntar a la configuración del nodo. */
export function wranglerConfigArgs(remote: boolean): string[] {
  return NODE_DIR && remote ? ['--config', nodePath('wrangler.jsonc')] : [];
}

/**
 * El entorno para wrangler. Con varias cuentas de Cloudflare en la máquina, wrangler
 * no elige en modo no interactivo: se toma la del wrangler.jsonc del nodo, salvo que
 * `CLOUDFLARE_ACCOUNT_ID` ya venga puesta.
 */
export function wranglerEnv(): NodeJS.ProcessEnv {
  const env = { ...process.env };
  const config = nodePath('wrangler.jsonc');
  if (NODE_DIR && !env.CLOUDFLARE_ACCOUNT_ID && existsSync(config)) {
    const account = accountIdFromConfig(readFileSync(config, 'utf8'));
    if (account) env.CLOUDFLARE_ACCOUNT_ID = account;
  }
  return env;
}
