import { type Deck, migrateSlide } from '@colaboradocs/deck-core';

/** Un deck leído de texto (un archivo importado), o `null` si no tiene la forma de un deck. */
/**
 * Pasa un deck guardado con el esquema anterior al actual: `speakers` (lista) es `speaker` (una
 * persona) `place` es `role` el ítem de agenda `break` es `highlight` y la portada ya no tiene `role`; los tipos `cover/section/stack/split/grid` son slides de contenido; el `role` suelto de un bloque `person` se une al de la persona.
 */
export function migrateDeck(deck: Deck): Deck {
  const visit = (node: unknown): void => {
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (node === null || typeof node !== 'object') return;
    const obj = node as Record<string, unknown>;
    // primero lo de adentro: `place` pasa a `role` antes de unir el rol del bloque persona
    for (const value of Object.values(obj)) visit(value);
    if (obj.type === 'break') obj.type = 'highlight';
    if (obj.kind === 'cover') delete obj.role;
    if (Array.isArray(obj.speakers)) {
      if (obj.speakers[0] !== undefined && obj.speaker === undefined)
        obj.speaker = obj.speakers[0];
      delete obj.speakers;
    }
    if (typeof obj.name === 'string' && 'place' in obj) {
      obj.role = obj.role ?? obj.place;
      delete obj.place;
    }
    if (
      obj.kind === 'person' &&
      typeof obj.role === 'string' &&
      obj.person &&
      typeof obj.person === 'object'
    ) {
      const person = obj.person as Record<string, unknown>;
      person.role = [obj.role, person.role].filter(Boolean).join(' · ');
      delete obj.role;
    }
  };
  const copy = structuredClone(deck);
  visit(copy);
  copy.slides = copy.slides.map(
    (slide) =>
      migrateSlide(
        slide as unknown as Record<string, unknown>,
      ) as unknown as Deck['slides'][number],
  );
  return copy;
}

export function parseDeck(text: string | null | undefined): Deck | null {
  if (!text) return null;
  try {
    const value: unknown = JSON.parse(text);
    if (value === null || typeof value !== 'object') return null;
    const deck = value as Partial<Deck>;
    const ok =
      deck.version === 1 &&
      typeof deck.theme === 'string' &&
      typeof deck.id === 'string' &&
      Array.isArray(deck.slides);
    return ok ? migrateDeck(deck as Deck) : null;
  } catch {
    return null;
  }
}

export const serializeDeck = (deck: Deck): string =>
  JSON.stringify(deck, null, 2);
