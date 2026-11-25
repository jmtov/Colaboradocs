/**
 * Monta tu propia copia en Cloudflare (una vez). Necesita `wrangler login`.
 *
 *   npm run setup -w @colaboradocs/review-worker -- [nombre]
 *
 * Hace: crea la base D1, escribe wrangler.jsonc, aplica las migraciones,
 * genera TOKEN_SECRET (queda en .prod.vars y se sube como secreto del Worker).
 * Carga además el documento de ejemplo (documents/example.json).
 *
 * Con NODE_DIR=<carpeta> la instancia queda fuera del repo: wrangler.jsonc (con las
 * rutas al código reescritas) y .prod.vars se escriben en esa carpeta. Con varias
 * cuentas de Cloudflare, pasa CLOUDFLARE_ACCOUNT_ID.
 */
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { relative } from 'node:path';
import {
  NODE_DIR,
  nodePath,
  wranglerConfigArgs,
  wranglerEnv,
} from './node.utils';
import { rebaseConfigPaths } from './node-config.utils';

const name = process.argv[2] ?? 'doc-review';
if (!/^[a-z0-9][a-z0-9-]{0,62}$/.test(name)) {
  console.error('El nombre va en minúsculas, números y guiones.');
  process.exit(1);
}
if (existsSync(nodePath('wrangler.jsonc'))) {
  console.error(
    `Ya existe ${nodePath('wrangler.jsonc')}: borra ese archivo si quieres empezar de cero.`,
  );
  process.exit(1);
}

const wrangler = (args: string[], input?: string) =>
  execFileSync('npx', ['wrangler', ...args], {
    encoding: 'utf8',
    input,
    stdio: ['pipe', 'pipe', 'inherit'],
    env: wranglerEnv(),
  });
// Los comandos que leen el wrangler.jsonc apuntan al del nodo, si hay NODE_DIR.
const config = wranglerConfigArgs(true);

console.log(`Creando la base D1 «${name}»…`);
const created = wrangler(['d1', 'create', name]);
const databaseId = /database_id["\s:=]+"([0-9a-f-]{36})"/i.exec(created)?.[1];
if (!databaseId) {
  console.error(
    `No pude leer el database_id de la respuesta de wrangler:\n${created}`,
  );
  process.exit(1);
}

let wranglerJsonc = readFileSync('wrangler.example.jsonc', 'utf8')
  .replaceAll('"doc-review"', `"${name}"`)
  .replace('REEMPLAZAR', databaseId);
if (NODE_DIR) {
  mkdirSync(NODE_DIR, { recursive: true });
  // El código sigue en este repo: las rutas se reescriben vistas desde la carpeta del nodo.
  wranglerJsonc = rebaseConfigPaths(
    wranglerJsonc,
    relative(NODE_DIR, process.cwd()).split('\\').join('/'),
  );
}
writeFileSync(nodePath('wrangler.jsonc'), wranglerJsonc);

console.log('Aplicando migraciones…');
console.log(
  wrangler(['d1', 'migrations', 'apply', name, '--remote', ...config]),
);

const secret = randomBytes(32).toString('hex');
writeFileSync(nodePath('.prod.vars'), `TOKEN_SECRET=${secret}\n`, {
  mode: 0o600,
});
console.log('Compilando la página…');
execFileSync('npm', ['run', 'build'], { cwd: '../..', stdio: 'inherit' });
// Primero hay que desplegar una vez para que exista el Worker al que va el secreto.
console.log('Desplegando el Worker para poder guardar el secreto…');
console.log(wrangler(['deploy', ...config]));
wrangler(['secret', 'put', 'TOKEN_SECRET', ...config], `${secret}\n`);

console.log('Cargando el documento de ejemplo…');
execFileSync(
  'npx',
  [
    'tsx',
    'scripts/documents.ts',
    'import',
    '../../documents/example.json',
    '--remote',
  ],
  {
    stdio: 'inherit',
  },
);

console.log(`
Listo. Falta:
  1. Respaldar ${nodePath('.prod.vars')} FUERA del repo (sin él no se pueden crear PIN).
  2. Crear PIN:  npm run pins -w @colaboradocs/review-worker -- add "Tu nombre" --admin --remote
  3. Entra con ese PIN y sube tus documentos desde el menú ⋮ → «Documentos» (Word, Markdown o JSON).
     El de ejemplo se puede archivar desde ahí.
  4. Ponle nombre al espacio:  npm run documents -w @colaboradocs/review-worker -- space --name "Mi equipo" --remote
`);
