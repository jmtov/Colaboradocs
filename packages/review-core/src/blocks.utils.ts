import { EXCERPT_LENGTH } from './review.constants';

export type BlockInput = {
  sectionId: string;
  text: string;
};

/** Colapsa espacios y saltos de línea para que el id no dependa del formato. */
export function normalizeBlockText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/** djb2 en base 36. Estable entre navegadores y entre despliegues. */
export function hashText(text: string): string {
  let hash = 5381;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) + hash + text.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(36);
}

/**
 * Id estable de cada bloque: sección + hash del texto (+ número de aparición
 * si el mismo texto se repite en la sección). Cambia si se edita el texto, a
 * propósito: un comentario u OK ya no aplica a un párrafo distinto.
 * Devuelve null para los bloques sin texto.
 */
export function assignBlockIds(blocks: BlockInput[]): (string | null)[] {
  const seen = new Map<string, number>();
  return blocks.map(({ sectionId, text }) => {
    const normalized = normalizeBlockText(text);
    if (!normalized) return null;
    const base = `${sectionId}-${hashText(normalized)}`;
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    return count > 1 ? `${base}-${count}` : base;
  });
}

export function excerptOf(text: string): string {
  const normalized = normalizeBlockText(text);
  if (normalized.length <= EXCERPT_LENGTH) return normalized;
  return `${normalized.slice(0, EXCERPT_LENGTH - 1)}…`;
}
