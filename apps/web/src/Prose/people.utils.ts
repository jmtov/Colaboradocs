export type PersonMatch = { start: number; end: number; name: string };

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const patterns = new WeakMap<Record<string, string>, RegExp | null>();

function patternFor(people: Record<string, string>): RegExp | null {
  const cached = patterns.get(people);
  if (cached !== undefined) return cached;
  const keys = Object.keys(people)
    .sort((a, b) => b.length - a.length)
    .map(escapeRegExp);
  const pattern =
    keys.length === 0
      ? null
      : new RegExp(`(?<![\\p{L}])(${keys.join('|')})(?![\\p{L}])`, 'giu');
  patterns.set(people, pattern);
  return pattern;
}

/**
 * Encuentra en un texto los nombres de personas (`people`: cómo se escribe, en
 * minúsculas -> nombre registrado). Se enlazan todas las veces que aparecen.
 */
export function findPeople(
  text: string,
  people: Record<string, string>,
): PersonMatch[] {
  const pattern = patternFor(people);
  if (!pattern) return [];
  pattern.lastIndex = 0;
  const found: PersonMatch[] = [];
  for (const match of text.matchAll(pattern)) {
    const raw = match[1] ?? '';
    const name = people[raw.toLowerCase()];
    if (!name) continue;
    const start = match.index ?? 0;
    found.push({ start, end: start + raw.length, name });
  }
  return found;
}
