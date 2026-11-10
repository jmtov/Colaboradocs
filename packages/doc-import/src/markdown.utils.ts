import { marked } from 'marked';
import {
  buildDocument,
  type ConvertOptions,
  type RawSection,
} from './convert.utils';

/**
 * Convierte Markdown al formato del documento:
 *   `# Título` (opcional) · `## Sección` · `### Grupo` · párrafos, listas,
 *   **negrita**, *cursiva*. Cada `## ` abre una sección nueva.
 * Lo que va antes del primer `## ` se descarta (salvo el `# ` del título).
 */
export function markdownToDocument(markdown: string, options: ConvertOptions) {
  const sections: RawSection[] = [];
  let title: string | undefined;
  let current: { title: string; lines: string[] } | null = null;
  const flush = () => {
    if (!current) return;
    const html = (
      marked.parse(current.lines.join('\n'), { async: false }) as string
    )
      .replace(/\n/g, '')
      .trim();
    sections.push({ title: current.title, html });
  };

  let inFence = false;
  for (const line of markdown.split('\n')) {
    if (/^```/.test(line)) inFence = !inFence;
    const h1 = !inFence && /^# (.+)/.exec(line);
    const h2 = !inFence && /^## (.+)/.exec(line);
    if (h1) {
      title ??= h1[1]?.trim();
    } else if (h2) {
      flush();
      current = { title: h2[1]?.trim() ?? '', lines: [] };
    } else {
      current?.lines.push(line);
    }
  }
  flush();

  const warnings: string[] = [];
  if (sections.length === 0) {
    warnings.push(
      'No encontré ninguna sección: usa «## Título» para cada una.',
    );
  }
  return buildDocument(title, sections, options, warnings);
}
