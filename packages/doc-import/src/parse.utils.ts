import {
  type DocumentContent,
  validateDocument,
} from '@colaboradocs/review-core';
import { slugify } from './convert.utils';
import { docxToDocument } from './docx.utils';
import { markdownToDocument } from './markdown.utils';

/** Lo mínimo de un `File` del navegador (o de un archivo leído en Node). */
export type UploadFile = {
  name: string;
  text(): Promise<string>;
  arrayBuffer(): Promise<ArrayBuffer>;
};

export type UploadKind = 'markdown' | 'docx' | 'json';

export type ParsedUpload =
  | {
      ok: true;
      kind: UploadKind;
      /** Ya validado y limpio: es lo que se guardaría. */
      document: DocumentContent;
      /** Cosas del original que no se conservaron. */
      warnings: string[];
    }
  | { ok: false; errors: string[] };

function kindOf(name: string): UploadKind | null {
  const lower = name.toLowerCase();
  if (lower.endsWith('.md') || lower.endsWith('.markdown')) return 'markdown';
  if (lower.endsWith('.docx')) return 'docx';
  if (lower.endsWith('.json')) return 'json';
  return null;
}

/** `Mi Reglamento 2026.docx` -> `mi-reglamento-2026`. */
export function idFromFileName(name: string): string {
  return slugify(name.replace(/\.[^.]+$/, ''))
    .slice(0, 64)
    .replace(/-+$/g, '');
}

/**
 * Lee un archivo subido (.md, .docx o .json) y lo deja como documento válido.
 * Para .md y .docx el id sale del nombre del archivo, salvo que se indique.
 */
export async function parseUpload(
  file: UploadFile,
  options: { id?: string; title?: string } = {},
): Promise<ParsedUpload> {
  const kind = kindOf(file.name);
  if (!kind) {
    return {
      ok: false,
      errors: ['Formato no soportado: usa .md, .docx o .json.'],
    };
  }
  try {
    if (kind === 'json') {
      const parsed: unknown = JSON.parse(await file.text());
      const result = validateDocument(parsed);
      return result.ok
        ? { ok: true, kind, document: result.value, warnings: [] }
        : result;
    }
    const convertOptions = {
      id: options.id ?? (idFromFileName(file.name) || 'documento'),
      title: options.title,
    };
    const { warnings, ...draft } =
      kind === 'docx'
        ? await docxToDocument(
            { arrayBuffer: await file.arrayBuffer() },
            convertOptions,
          )
        : markdownToDocument(await file.text(), convertOptions);
    const result = validateDocument(draft);
    return result.ok
      ? { ok: true, kind, document: result.value, warnings }
      : { ok: false, errors: [...warnings, ...result.errors] };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return { ok: false, errors: [`No pude leer el archivo (${detail}).`] };
  }
}
