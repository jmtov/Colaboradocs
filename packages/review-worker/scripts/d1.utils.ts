import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

/** Nombre de la base D1: el de wrangler.jsonc. */
export const DATABASE = (() => {
  const config = readFileSync('wrangler.jsonc', 'utf8');
  const found = /"database_name"\s*:\s*"([^"]+)"/.exec(config)?.[1];
  if (!found) throw new Error('No encuentro database_name en wrangler.jsonc.');
  return found;
})();

export function quote(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

/** Corre SQL en la base (local, o producción con `remote`) y devuelve el JSON de wrangler. */
export function runSql(sql: string, remote: boolean): unknown {
  const output = execFileSync(
    'npx',
    [
      'wrangler',
      'd1',
      'execute',
      DATABASE,
      remote ? '--remote' : '--local',
      '--json',
      '--command',
      sql,
    ],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] },
  );
  return JSON.parse(output);
}

/** Igual, desde un archivo: sirve para SQL largo (el límite por sentencia de D1 es ~100 KB). */
export function runSqlFile(path: string, remote: boolean): void {
  execFileSync(
    'npx',
    [
      'wrangler',
      'd1',
      'execute',
      DATABASE,
      remote ? '--remote' : '--local',
      `--file=${path}`,
    ],
    { stdio: ['ignore', 'inherit', 'inherit'] },
  );
}

export function selectRows(output: unknown): Record<string, unknown>[] {
  const first = (output as { results?: Record<string, unknown>[] }[])[0];
  return first?.results ?? [];
}
