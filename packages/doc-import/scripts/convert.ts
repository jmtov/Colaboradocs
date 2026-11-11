/**
 * Convierte un documento (Markdown o Word) al JSON que lee la página.
 *
 *   npm run convert -w @colaboradocs/doc-import -- documento.md|.docx --id mi-doc [--title "Título"] [--version 0.1] > documents/mi-doc.json
 *
 * Markdown: `# Título`, `## Sección`, `### Grupo`.
 * Word (.docx): estilos «Título 1» (título), «Título 2» (secciones), «Título 3» (grupos).
 * Los avisos salen por stderr; el JSON, por stdout.
 *
 * Después, a mano en el JSON: `shortName`, `eyebrow`, `lead`, `sources`,
 * `glossaryTerms`, `status` y `description` de cada sección. El glosario es
 * una sección con id `glosario` hecha de <dl><dt><dd>.
 */
import { readFileSync } from 'node:fs';
import { extname } from 'node:path';
import { docxToDocument } from '../src/docx.utils';
import { markdownToDocument } from '../src/markdown.utils';

const args = process.argv.slice(2);
const flag = (name: string) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : undefined;
};
const file = args.find(
  (arg, index) => !arg.startsWith('--') && !args[index - 1]?.startsWith('--'),
);
const id = flag('id');

if (!file || !id) {
  console.error(
    'Uso: convert <archivo.md|.docx> --id <id> [--title "…"] [--version 0.1]',
  );
  process.exit(1);
}

const options = { id, title: flag('title'), version: flag('version') };
const extension = extname(file).toLowerCase();
if (!['.md', '.markdown', '.docx'].includes(extension)) {
  console.error(`Formato no soportado (${extension}). Usa .md o .docx.`);
  process.exit(1);
}

const { warnings, ...document } =
  extension === '.docx'
    ? await docxToDocument({ path: file }, options)
    : markdownToDocument(readFileSync(file, 'utf8'), options);

for (const warning of warnings) console.error(`⚠ ${warning}`);
console.error(
  `${document.sections.length} secciones: ${document.sections.map((s) => s.title).join(' · ')}`,
);
process.stdout.write(`${JSON.stringify(document, null, 2)}\n`);
