/** Título con el que sale el PDF: los navegadores lo usan de nombre de archivo. */
export function printTitle(document: { title: string; version: string }) {
  return `${document.title} (v${document.version})`;
}
