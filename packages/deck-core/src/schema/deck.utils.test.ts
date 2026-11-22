import { describe, expect, it } from 'vitest';
import type { Theme } from '../theme/theme.types';
import type { Block, Deck, Slide } from './deck.types';
import { validateDeck } from './deck.utils';

const theme: Theme = {
  id: 'demo',
  name: 'Demo',
  baseMode: 'light',
  colors: {
    light: {
      bg: '#fff',
      ink: '#000',
      accent: '#000',
      accentSurface: '#f80',
      onAccent: '#000',
    },
    dark: {
      bg: '#000',
      ink: '#fff',
      accent: '#fff',
      accentSurface: '#f80',
      onAccent: '#000',
    },
  },
  categories: [
    { id: 'a', name: 'A', light: '#111', dark: '#eee' },
    { id: 'b', name: 'B', light: '#222', dark: '#ddd' },
  ],
  tokens: {},
  fonts: [{ family: 'Demo', weight: 400, file: 'demo-400.woff2' }],
  variants: { evento: { name: 'Evento' } },
};

const deckWith = (...slides: Slide[]): Deck => ({
  version: 1,
  id: 'd',
  title: 'D',
  lang: 'es',
  theme: 'demo',
  slides,
});

describe('validateDeck', () => {
  it('un deck válido no tiene problemas', () => {
    const deck = deckWith(
      {
        kind: 'content',
        body: [
          {
            kind: 'heading',
            title: ['Hola'],
            titleSize: 'xl',
            subtitle: 'Texto',
          },
        ],
      },
      {
        kind: 'content',
        columns: 3,
        body: [{ kind: 'card', title: 'Uno', category: 1 }],
      },
    );
    expect(validateDeck(deck, theme)).toEqual([]);
  });

  it('rechaza una categoría fuera de las del tema', () => {
    const deck = deckWith({ kind: 'content', category: 2, body: [] });
    expect(validateDeck(deck, theme).map((i) => i.path)).toEqual([
      'slides[0].category',
    ]);
  });

  it('la categoría se valida contra la lista que deja la variante o el deck', () => {
    const deck: Deck = {
      ...deckWith({ kind: 'content', category: 2, body: [] }),
      style: {
        categories: [
          ...theme.categories,
          { id: 'c', name: 'C', light: '#3', dark: '#4' },
        ],
      },
    };
    expect(validateDeck(deck, theme)).toEqual([]);
  });

  it('una cuenta regresiva sin zona horaria es un error', () => {
    const deck = deckWith({
      kind: 'content',
      body: [
        { kind: 'countdown', target: '2026-11-22T10:00:00', label: 'Falta' },
      ],
    });
    expect(validateDeck(deck, theme)[0]?.path).toBe('slides[0].body[0].target');
  });

  it('con zona horaria es válida', () => {
    const deck = deckWith({
      kind: 'content',
      body: [
        {
          kind: 'countdown',
          target: '2026-11-22T10:00:00-05:00',
          label: 'Falta',
        },
      ],
    });
    expect(validateDeck(deck, theme)).toEqual([]);
  });

  it('detecta tipos desconocidos de slide y de bloque', () => {
    const slide = { kind: 'nada' } as unknown as Slide;
    const block = {
      kind: 'content',
      body: [{ kind: 'nada' }],
    } as unknown as Slide;
    const paths = validateDeck(deckWith(slide, block), theme).map(
      (i) => i.path,
    );
    expect(paths).toContain('slides[0].kind');
    expect(paths).toContain('slides[1].body[0].kind');
  });

  it('los bloques deben caber en la cuadrícula: cuatro filas y sin pisarse', () => {
    const note = { kind: 'note', text: 'x' } as const;
    const heading: Block = { kind: 'heading', title: ['t'] };
    const tooMany = deckWith({
      kind: 'content',
      body: [heading, note, note, note, note],
    });
    expect(validateDeck(tooMany, theme)[0]?.message).toMatch(/se sale/);
    const wide = deckWith({
      kind: 'content',
      columns: 2,
      body: [heading, note, note, note, note],
    });
    expect(validateDeck(wide, theme)).toEqual([]);
    const overlap = deckWith({
      kind: 'content',
      body: [
        { ...note, col: 1, row: 1 },
        { ...note, col: 1, row: 1 },
      ],
    });
    expect(validateDeck(overlap, theme)[0]?.message).toMatch(/celdas de otro/);
  });

  it('el ancho de un bloque debe estar en su rango', () => {
    const deck = deckWith({
      kind: 'content',
      columns: 2,
      body: [{ kind: 'qr', src: 's', alt: 'a', link: 'l', span: 4 }],
    });
    const paths = validateDeck(deck, theme).map((i) => i.path);
    expect(paths).toContain('slides[0].body[0].span');
  });

  it('el título solo puede aparecer una vez por slide', () => {
    const heading: Block = { kind: 'heading', title: ['t'] };
    const deck = deckWith({ kind: 'content', body: [heading, heading] });
    expect(validateDeck(deck, theme).map((i) => i.path)).toEqual([
      'slides[0].body[1]',
    ]);
  });

  it('exige que el tema y la variante existan', () => {
    const deck: Deck = { ...deckWith(), theme: 'otro', variant: 'no-hay' };
    expect(validateDeck(deck, theme).map((i) => i.path)).toEqual([
      'theme',
      'variant',
    ]);
  });

  it('no admite ids de slide repetidos ni minutos no positivos', () => {
    const deck = deckWith(
      {
        kind: 'content',
        id: 'x',
        body: [],
        eyebrow: { text: 'a', minutes: 0 },
      },
      { kind: 'content', id: 'x', body: [] },
    );
    const paths = validateDeck(deck, theme).map((i) => i.path);
    expect(paths).toContain('slides[1].id');
    expect(paths).toContain('slides[0].eyebrow.minutes');
  });
});

describe('validateDeck · fondo de la slide', () => {
  const layer = {
    src: 'assets/fondo.webp',
    ratio: '1000 / 1063',
    width: 90,
    x: 86,
    y: 80,
  };
  const paths = (background: unknown[]) =>
    validateDeck(
      deckWith({
        kind: 'content',
        body: [],
        background,
      } as unknown as Slide),
      theme,
    ).map((i) => i.path);

  it('una capa completa es válida', () => {
    expect(
      paths([layer, { ...layer, mode: 'silhouette', tint: 'bg', opacity: 70 }]),
    ).toEqual([]);
  });

  it('señala cada campo malo con su ruta', () => {
    expect(
      paths([
        {
          src: 'assets/mi fondo (1).png',
          ratio: '1;color:red',
          width: 0,
          x: '50',
          y: 1,
          mode: 'otro',
          tint: 'rojo',
          opacity: 120,
        },
      ]),
    ).toEqual([
      'slides[0].background[0].src',
      'slides[0].background[0].ratio',
      'slides[0].background[0].width',
      'slides[0].background[0].x',
      'slides[0].background[0].mode',
      'slides[0].background[0].tint',
      'slides[0].background[0].opacity',
    ]);
  });
});
