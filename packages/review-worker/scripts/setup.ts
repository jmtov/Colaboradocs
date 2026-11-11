/**
 * Monta tu propia copia en Cloudflare (una vez). Necesita `wrangler login`.
 *
 *   npm run setup -w @colaboradocs/review-worker -- [nombre]
 *
 * Hace: crea la base D1, escribe wrangler.jsonc, aplica las migraciones,
 * genera TOKEN_SECRET (queda en .prod.vars y se sube como secreto del Worker).
 * Carga además el documento de ejemplo (documents/example.json).
 */
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const name = process.argv[2] ?? 'doc-review';
if (!/^[a-z0-9][a-z0-9-]{0,62}$/.test(name)) {
  console.error('El nombre va en minúsculas, números y guiones.');
  process.exit(1);
}
if (existsSync('wrangler.jsonc')) {
  console.error(
    'Ya existe wrangler.jsonc: borra ese archivo si quieres empezar de cero.',
  );
  process.exit(1);
}

const wrangler = (args: string[], input?: string) =>
  execFileSync('npx', ['wrangler', ...args], {
    encoding: 'utf8',
    input,
    stdio: ['pipe', 'pipe', 'inherit'],
  });

console.log(`Creando la base D1 «${name}»…`);
const created = wrangler(['d1', 'create', name]);
const databaseId = /database_id["\s:=]+"([0-9a-f-]{36})"/i.exec(created)?.[1];
if (!databaseId) {
  console.error(
    `No pude leer el database_id de la respuesta de wrangler:\n${created}`,
  );
  process.exit(1);
}

const config = readFileSync('wrangler.example.jsonc', 'utf8')
  .replaceAll('"doc-review"', `"${name}"`)
  .replace('REEMPLAZAR', databaseId);
writeFileSync('wrangler.jsonc', config);

console.log('Aplicando migraciones…');
console.log(wrangler(['d1', 'migrations', 'apply', name, '--remote']));

const secret = randomBytes(32).toString('hex');
writeFileSync('.prod.vars', `TOKEN_SECRET=${secret}\n`);
console.log('Compilando la página…');
execFileSync('npm', ['run', 'build'], { cwd: '../..', stdio: 'inherit' });
// Primero hay que desplegar una vez para que exista el Worker al que va el secreto.
console.log('Desplegando el Worker para poder guardar el secreto…');
console.log(wrangler(['deploy']));
wrangler(['secret', 'put', 'TOKEN_SECRET'], `${secret}\n`);

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
  1. Respaldar packages/review-worker/.prod.vars FUERA del repo (sin él no se pueden crear PIN).
  2. Crear PIN:  npm run pins -w @colaboradocs/review-worker -- add "Tu nombre" --admin --remote
  3. Entra con ese PIN y sube tus documentos desde el menú ⋮ → «Documentos» (Word, Markdown o JSON).
     El de ejemplo se puede archivar desde ahí.
  4. Ponle nombre al espacio:  npm run documents -w @colaboradocs/review-worker -- space --name "Mi equipo" --remote
`);
