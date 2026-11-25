import type { ReviewerLabel } from './review.types';

export type MentionSegment =
  | { kind: 'text'; text: string }
  | { kind: 'mention'; text: string; person: ReviewerLabel };

/** Mención en curso: dónde empieza la «@» y lo escrito después. */
export type MentionQuery = { start: number; query: string };

const WORD_CHAR = /[\p{L}\p{N}_]/u;
const MAX_QUERY_LENGTH = 40;
const MAX_SUGGESTIONS = 6;

/** Minúsculas y sin tildes, para comparar «jose» con «José». */
function fold(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

/** Mayor primero: «Ana María» gana sobre «Ana» cuando el texto dice «@Ana María». */
function byNameLengthDesc(people: ReviewerLabel[]): ReviewerLabel[] {
  return [...people].sort((a, b) => b.name.length - a.name.length);
}

function matchAt(
  text: string,
  at: number,
  people: ReviewerLabel[],
): ReviewerLabel | undefined {
  const previous = text[at - 1];
  if (previous !== undefined && WORD_CHAR.test(previous)) return undefined;
  return people.find((person) => {
    const end = at + 1 + person.name.length;
    if (fold(text.slice(at + 1, end)) !== fold(person.name)) {
      return false;
    }
    const next = text[end];
    return next === undefined || !WORD_CHAR.test(next);
  });
}

/** Parte un comentario en texto y menciones a personas conocidas («@Ana López»). */
export function splitMentions(
  text: string,
  people: ReviewerLabel[],
): MentionSegment[] {
  const ordered = byNameLengthDesc(people);
  const segments: MentionSegment[] = [];
  let plain = '';
  let index = 0;
  while (index < text.length) {
    const person =
      text[index] === '@' ? matchAt(text, index, ordered) : undefined;
    if (!person) {
      plain += text[index];
      index += 1;
      continue;
    }
    if (plain) segments.push({ kind: 'text', text: plain });
    plain = '';
    const length = person.name.length + 1;
    segments.push({
      kind: 'mention',
      text: text.slice(index, index + length),
      person,
    });
    index += length;
  }
  if (plain) segments.push({ kind: 'text', text: plain });
  return segments;
}

/** La mención que se está escribiendo justo antes del cursor, o null. */
export function findMentionQuery(
  text: string,
  caret: number,
): MentionQuery | null {
  const before = text.slice(0, caret);
  const start = before.lastIndexOf('@');
  if (start < 0) return null;
  const previous = before[start - 1];
  if (previous !== undefined && !/\s/.test(previous)) return null;
  const query = before.slice(start + 1);
  if (query.length > MAX_QUERY_LENGTH || /[\n@]/.test(query)) return null;
  return { start, query };
}

/** Personas cuyo nombre coincide con lo escrito; las que empiezan igual, primero. */
export function filterPeople(
  people: ReviewerLabel[],
  query: string,
  limit = MAX_SUGGESTIONS,
): ReviewerLabel[] {
  const needle = fold(query.trim());
  const seen = new Set<string>();
  const found: { person: ReviewerLabel; starts: boolean }[] = [];
  for (const person of people) {
    const name = fold(person.name);
    const key = name;
    if (seen.has(key) || !name.includes(needle)) continue;
    seen.add(key);
    found.push({ person, starts: name.startsWith(needle) });
  }
  found.sort((a, b) => Number(b.starts) - Number(a.starts));
  return found.slice(0, limit).map((item) => item.person);
}

/** Reemplaza «@consulta» por «@Nombre » y devuelve el texto y el nuevo cursor. */
export function applyMention(
  text: string,
  mention: MentionQuery,
  caret: number,
  name: string,
): { text: string; caret: number } {
  const inserted = `@${name} `;
  return {
    text: text.slice(0, mention.start) + inserted + text.slice(caret),
    caret: mention.start + inserted.length,
  };
}
