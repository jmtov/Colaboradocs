import { marked } from 'marked';

type Section = {
  id: string;
  num: string;
  title: string;
  status: 'borrador';
  html: string;
};

export type ConvertOptions = { id: string; title?: string; version?: string };

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Convierte Markdown al formato del documento:
 *   `# Título` (opcional) · `## Sección` · `### Grupo` · párrafos, listas,
 *   **negrita**, *cursiva*. Cada `## ` abre una sección nueva.
 * Lo que va antes del primer `## ` se descarta (salvo el `# ` del título).
 */
export function markdownToDocument(markdown: string, options: ConvertOptions) {
  const sections: Section[] = [];
  const used = new Set<string>();
  let title = options.title;
  let current: { title: string; lines: string[] } | null = null;
  const flush = () => {
    if (!current) return;
    const base = slugify(current.title) || `seccion-${sections.length + 1}`;
    let id = base;
    for (let n = 2; used.has(id); n += 1) id = `${base}-${n}`;
    used.add(id);
    const html = (
      marked.parse(current.lines.join('\n'), { async: false }) as string
    )
      .replace(/\n/g, '')
      .trim();
    sections.push({
      id,
      num: String(sections.length + 1),
      title: current.title,
      status: 'borrador',
      html,
    });
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

  return {
    id: options.id,
    title: title ?? options.id,
    version: options.version ?? '0.1',
    updated: new Date().toISOString().slice(0, 10),
    sources: [] as { label: string; url: string }[],
    sections,
  };
}
