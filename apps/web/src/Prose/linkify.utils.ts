export type LinkMatch =
  | { kind: 'term'; start: number; end: number; label: string }
  | { kind: 'section'; start: number; end: number; sectionNumber: string };

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildPattern(terms: Record<string, string>): RegExp {
  const keys = Object.keys(terms)
    .sort((a, b) => b.length - a.length)
    .map(escapeRegExp);
  return new RegExp(
    `(?<![\\p{L}])(${keys.join('|')}|sección\\s\\d)(?![\\p{L}])`,
    'giu',
  );
}

const patterns = new WeakMap<Record<string, string>, RegExp>();

function patternFor(terms: Record<string, string>): RegExp {
  let pattern = patterns.get(terms);
  if (!pattern) {
    pattern = buildPattern(terms);
    patterns.set(terms, pattern);
  }
  return pattern;
}

/**
 * Encuentra en un texto los términos del glosario (`terms`: cómo se escribe
 * -> entrada) y las referencias "sección N". Cada término se enlaza una sola
 * vez por sección: `seen` recuerda los que ya se enlazaron y se actualiza.
 */
export function findLinks(
  text: string,
  seen: Set<string>,
  options: { linkTerms: boolean } = { linkTerms: true },
  terms: Record<string, string> = {},
): LinkMatch[] {
  const pattern = patternFor(terms);
  pattern.lastIndex = 0;
  const matches: LinkMatch[] = [];
  for (const match of text.matchAll(pattern)) {
    const raw = match[1] ?? '';
    const start = match.index ?? 0;
    const end = start + raw.length;
    const lower = raw.toLowerCase();
    if (lower.startsWith('sección')) {
      matches.push({
        kind: 'section',
        start,
        end,
        sectionNumber: lower.replace(/\D/g, ''),
      });
      continue;
    }
    const label = terms[lower];
    if (!label || !options.linkTerms || seen.has(label)) continue;
    seen.add(label);
    matches.push({ kind: 'term', start, end, label });
  }
  return matches;
}
