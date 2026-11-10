/**
 * Convierte un documento en Markdown al JSON que lee la página.
 *
 *   npm run convert -w @juntanza/web -- documento.md --id mi-doc [--title "Título"] [--version 0.1] > documents/mi-doc.json
 *
 * Después, a mano en el JSON: `shortName`, `eyebrow`, `lead`, `sources`,
 * `glossaryTerms`, `status` y `description` de cada sección. El glosario es
 * una sección con id `glosario` hecha de <dl><dt><dd>.
 */
import { readFileSync } from 'node:fs';
import { markdownToDocument } from './markdown.utils';

const args = process.argv.slice(2);
const file = args.find(
  (arg, index) => !arg.startsWith('--') && !args[index - 1]?.startsWith('--'),
);
const flag = (name: string) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : undefined;
};
const id = flag('id');

if (!file || !id) {
  console.error(
    'Uso: convert <archivo.md> --id <id> [--title "…"] [--version 0.1]',
  );
  process.exit(1);
}

const document = markdownToDocument(readFileSync(file, 'utf8'), {
  id,
  title: flag('title'),
  version: flag('version'),
});
process.stdout.write(`${JSON.stringify(document, null, 2)}\n`);
