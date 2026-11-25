import { describe, expect, it } from 'vitest';
import { migrateDeck, parseDeck, serializeDeck } from './storage.utils';

const deck = {
  version: 1,
  id: 'd',
  title: 'D',
  lang: 'es',
  theme: 'neutral',
  slides: [],
};

describe('parseDeck', () => {
  it('lee un deck guardado', () => {
    expect(parseDeck(serializeDeck(deck))).toEqual(deck);
  });

  it('rechaza lo que no es un deck, sin lanzar', () => {
    expect(parseDeck(null)).toBeNull();
    expect(parseDeck('')).toBeNull();
    expect(parseDeck('{no es json')).toBeNull();
    expect(parseDeck('42')).toBeNull();
    expect(parseDeck(JSON.stringify({ ...deck, version: 2 }))).toBeNull();
    expect(parseDeck(JSON.stringify({ ...deck, slides: 'x' }))).toBeNull();
    expect(parseDeck(JSON.stringify({ id: 'd' }))).toBeNull();
  });
});

describe('migrateDeck', () => {
  const old = {
    ...deck,
    slides: [
      {
        kind: 'split',
        speakers: [{ name: 'Lina', place: 'El Peñol' }, { name: 'Otra' }],
        start: [],
        end: [
          {
            kind: 'person',
            person: { name: 'Luis', place: 'Sur' },
            role: 'Representación',
          },
        ],
      },
    ],
  };

  it('una sola persona por slide y rol en vez de municipio', () => {
    const slide = migrateDeck(old as never).slides[0] as unknown as Record<
      string,
      unknown
    >;
    expect(slide.speaker).toEqual({ name: 'Lina', role: 'El Peñol' });
    expect('speakers' in slide).toBe(false);
  });

  it('el rol suelto de un bloque persona pasa a la persona', () => {
    const slide = migrateDeck(old as never).slides[0] as unknown as {
      body: { person: unknown; role?: string }[];
    };
    expect(slide.body[0]?.person).toEqual({
      name: 'Luis',
      role: 'Representación · Sur',
    });
    expect(slide.body[0] && 'role' in slide.body[0]).toBe(false);
  });

  it('un deck con los tipos anteriores (portada, sección, pila, dos columnas, cuadrícula) pasa a slides de contenido', () => {
    const migrated = migrateDeck(old as never).slides[0] as unknown as {
      kind: string;
      columns: number;
    };
    expect(migrated.kind).toBe('content');
    expect(migrated.columns).toBe(2);
  });

  it('no toca un deck ya migrado ni modifica el original', () => {
    const fresh = {
      ...deck,
      slides: [
        { kind: 'content', titleSize: 'xl', speaker: { name: 'A', role: 'B' } },
      ],
    };
    expect(migrateDeck(fresh as never)).toEqual(fresh);
    migrateDeck(old as never);
    expect((old.slides[0] as Record<string, unknown>).speakers).toBeDefined();
  });

  it('el ítem de agenda «descanso» pasa a «resaltado»', () => {
    const agenda = {
      ...deck,
      slides: [
        {
          kind: 'content',
          body: [
            { kind: 'agenda', items: [{ title: 'Descanso', type: 'break' }] },
          ],
        },
      ],
    };
    const items = (
      migrateDeck(agenda as never).slides[0] as unknown as {
        body: { items: { type: string }[] }[];
      }
    ).body[0]?.items;
    expect(items?.[0]?.type).toBe('highlight');
  });

  it('la portada pierde el campo «papel»', () => {
    const cover = {
      ...deck,
      slides: [{ kind: 'cover', role: 'closing', title: ['a'] }],
    };
    expect('role' in (migrateDeck(cover as never).slides[0] as object)).toBe(
      false,
    );
  });

  it('parseDeck migra lo que lee', () => {
    const parsed = parseDeck(JSON.stringify(old));
    if (!parsed) throw new Error('parseDeck devolvió null');
    const slide = parsed.slides[0] as unknown as Record<string, unknown>;
    expect(slide.speaker).toEqual({ name: 'Lina', role: 'El Peñol' });
  });
});
