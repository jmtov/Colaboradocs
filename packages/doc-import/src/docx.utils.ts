import mammoth from 'mammoth';
import {
  buildDocument,
  type ConvertOptions,
  type RawSection,
} from './convert.utils';

function plain(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Limpia el HTML de Word a lo que entiende la página: las tablas pasan a un
 * párrafo por fila, las imágenes se quitan. Devuelve los avisos.
 */
function simplify(html: string, warnings: string[]): string {
  let out = html;
  if (/<table/i.test(out)) {
    warnings.push(
      'Hay tablas: se convirtieron a un párrafo por fila, con las celdas separadas por « · ». Revísalas.',
    );
    out = out.replace(/<tr>([\s\S]*?)<\/tr>/gi, (_match, row: string) => {
      const cells = [...row.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)]
        .map((cell) => plain(cell[1] ?? ''))
        .filter(Boolean);
      return cells.length ? `<p>${cells.join(' · ')}</p>` : '';
    });
    out = out.replace(/<\/?(table|thead|tbody|tfoot)[^>]*>/gi, '');
  }
  if (/<img/i.test(out)) {
    warnings.push('Hay imágenes: no se incluyen.');
    out = out.replace(/<img[^>]*>/gi, '');
  }
  // Párrafos vacíos que deja Word.
  return out.replace(/<p>\s*<\/p>/g, '');
}

/**
 * Separa el HTML de Word en secciones. Con estilos «Título 2» en el documento,
 * `Título 1` es el título del documento y cada `Título 2` abre una sección.
 * Si no hay «Título 2» pero sí varios «Título 1», cada «Título 1» es una sección.
 */
export function htmlToDocument(html: string, options: ConvertOptions) {
  const warnings: string[] = [];
  const clean = simplify(html, warnings);
  const heading = /<h([1-6])>([\s\S]*?)<\/h\1>/gi;

  const found = [...clean.matchAll(heading)];
  const count = (level: string) => found.filter((m) => m[1] === level).length;
  const sectionLevel = count('2') > 0 ? '2' : '1';
  const titleFromH1 = sectionLevel === '2';

  let title: string | undefined;
  const sections: RawSection[] = [];
  let current: RawSection | null = null;
  let cursor = 0;
  const append = (to: number) => {
    if (current) current.html += clean.slice(cursor, to);
  };

  for (const match of found) {
    const level = match[1] ?? '';
    const start = match.index ?? 0;
    append(start);
    cursor = start + match[0].length;
    const text = plain(match[2] ?? '');
    if (level === sectionLevel) {
      if (current) sections.push(current);
      current = { title: text, html: '' };
    } else if (titleFromH1 && level === '1') {
      title ??= text;
    } else if (current) {
      // Un título más chico dentro de una sección («Título 3» y siguientes): igual nivel.
      current.html += `<h${level}>${match[2]}</h${level}>`;
    }
  }
  append(clean.length);
  if (current) sections.push(current);

  for (const section of sections) section.html = section.html.trim();

  if (sections.length === 0) {
    warnings.push(
      'No encontré títulos. En Word, usa los estilos «Título 1/2/3» (no negrita a mano): «Título 2» para cada sección.',
    );
  } else if (!titleFromH1) {
    warnings.push(
      'No hay «Título 2»: usé cada «Título 1» como sección. Pon el título del documento con --title.',
    );
  }
  return buildDocument(title, sections, options, warnings);
}

/** En Node se lee de `path`; en el navegador, de `arrayBuffer`. */
export type DocxInput = { path: string } | { arrayBuffer: ArrayBuffer };

export async function docxToDocument(
  input: DocxInput,
  options: ConvertOptions,
) {
  // Mammoth en Node lee `path` o `buffer`; en el navegador, `arrayBuffer`.
  const nodeBuffer = (
    globalThis as { Buffer?: { from(data: ArrayBuffer): unknown } }
  ).Buffer;
  const source =
    'arrayBuffer' in input && nodeBuffer
      ? { buffer: nodeBuffer.from(input.arrayBuffer) }
      : input;
  const result = await mammoth.convertToHtml(
    source as Parameters<typeof mammoth.convertToHtml>[0],
  );
  const converted = htmlToDocument(result.value, options);
  for (const message of result.messages) {
    if (message.type === 'warning' && !/Unrecognised/.test(message.message)) {
      converted.warnings.push(message.message);
    }
  }
  return converted;
}
