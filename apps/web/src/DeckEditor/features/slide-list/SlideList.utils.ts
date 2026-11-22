import { type Slide, slideTitle } from '@colaboradocs/deck-core';

/** Cómo se llama una slide en la lista: su título o el texto de su línea superior. */
export function slideLabel(slide: Slide): string {
  const title = slideTitle(slide).join(' ').trim();
  return title || slide.eyebrow?.text || 'Sin título';
}

/** Cómo está dispuesta una slide, en pocas palabras: «2 columnas × 2 filas». */
export function slideSummary(slide: Slide): string {
  const columns = slide.columns ?? 1;
  const columnsText = columns === 1 ? '1 columna' : `${columns} columnas`;
  const rows = slide.rows ?? 1;
  return rows > 1 ? `${columnsText} × ${rows} filas` : columnsText;
}
