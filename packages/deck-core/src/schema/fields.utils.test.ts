import { describe, expect, it } from 'vitest';
import type { Theme } from '../theme/theme.types';
import { BLOCK_KINDS, SLIDE_KINDS } from './deck.constants';
import type { Block, ContentSlide, Deck, Slide } from './deck.types';
import { slideTitle, validateDeck } from './deck.utils';
import {
  BLOCK_DESCRIPTORS,
  MANY_ITEMS,
  SLIDE_DESCRIPTORS,
  STYLE_GROUP,
} from './fields.constants';
import type { Field, TestCaseId } from './fields.types';
import {
  applyTestCase,
  defaultBlock,
  defaultSlide,
  defaultValue,
  fullSample,
  partsOf,
} from './fields.utils';

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
  categories: [{ id: 'a', name: 'A', light: '#111', dark: '#eee' }],
  tokens: {},
  fonts: [{ family: 'Demo', weight: 400, file: 'demo.woff2' }],
};

const deckWith = (...slides: Slide[]): Deck => ({
  version: 1,
  id: 'd',
  title: 'D',
  lang: 'es',
  theme: 'demo',
  slides,
});
const issues = (...slides: Slide[]) => validateDeck(deckWith(...slides), theme);

/** Una slide de contenido con el bloque dentro, tal como la deja el editor. */
function slideHolding(block: Block): Slide {
  return { ...(defaultSlide('content') as ContentSlide), body: [block] };
}

const everyBlockSlide = () =>
  BLOCK_KINDS.map((kind) => slideHolding(defaultBlock(kind)));

function keysOf(fields: Field[]): string[] {
  return fields.map((f) => f.key);
}

describe('descriptores', () => {
  it('hay uno por cada tipo de slide y de bloque', () => {
    expect(Object.keys(SLIDE_DESCRIPTORS).sort()).toEqual(
      [...SLIDE_KINDS].sort(),
    );
    expect(Object.keys(BLOCK_DESCRIPTORS).sort()).toEqual(
      [...BLOCK_KINDS].sort(),
    );
  });

  it('las claves no se repiten dentro de un elemento', () => {
    for (const d of [
      ...Object.values(SLIDE_DESCRIPTORS),
      ...Object.values(BLOCK_DESCRIPTORS),
    ]) {
      expect(new Set(keysOf(d.fields)).size).toBe(d.fields.length);
    }
  });

  it('un select tiene opciones y, si es numérico, sus valores son números', () => {
    const selects: Extract<Field, { type: 'select' }>[] = [];
    const visit = (fields: Field[]) => {
      for (const f of fields) {
        if (f.type === 'select') selects.push(f);
        if (f.type === 'object' || f.type === 'list') visit(f.fields);
      }
    };
    for (const d of [
      ...Object.values(SLIDE_DESCRIPTORS),
      ...Object.values(BLOCK_DESCRIPTORS),
    ])
      visit(d.fields);
    expect(selects.length).toBeGreaterThan(5);
    for (const s of selects) {
      expect(s.options.length).toBeGreaterThan(0);
      if (s.numeric)
        for (const o of s.options)
          expect(Number.isNaN(Number(o.value))).toBe(false);
    }
  });
});

describe('orden de los campos de una slide', () => {
  it('el estilo va primero y al final quién habla y las notas', () => {
    for (const kind of SLIDE_KINDS) {
      const fields = SLIDE_DESCRIPTORS[kind].fields;
      expect(fields[0]?.group, kind).toBe(STYLE_GROUP);
      expect(
        fields.slice(-2).map((f) => f.key),
        kind,
      ).toEqual(['speaker', 'notes']);
    }
  });

  it('la línea superior va antes que los bloques, y la cuadrícula antes que todo el contenido', () => {
    const keys = SLIDE_DESCRIPTORS.content.fields.map((f) => f.key);
    expect(keys.indexOf('gridSize')).toBeLessThan(keys.indexOf('eyebrow'));
    expect(keys.indexOf('eyebrow')).toBeLessThan(keys.indexOf('body'));
  });
});

describe('partes del panel', () => {
  it('toda slide va de general a contenido y a otros datos, sin repetir partes', () => {
    for (const kind of SLIDE_KINDS) {
      expect(
        partsOf(SLIDE_DESCRIPTORS[kind].fields).map((p) => p.part),
        kind,
      ).toEqual(['general', 'content', 'other']);
    }
  });

  it('el estilo es general, las notas son otros datos y el pie de página (quién habla) es contenido', () => {
    const [general, content, other] = partsOf(SLIDE_DESCRIPTORS.content.fields);
    expect(general?.fields.every((f) => f.group === STYLE_GROUP)).toBe(true);
    expect(content?.fields.map((f) => f.key)).toEqual([
      'eyebrow',
      'body',
      'speaker',
    ]);
    expect(other?.fields.map((f) => f.key)).toEqual(['notes']);
  });
});

describe('valores nuevos', () => {
  it('un bloque nuevo de cada tipo es válido', () => {
    for (const kind of BLOCK_KINDS) {
      const block = defaultBlock(kind);
      const slide = slideHolding(block);
      const found = issues(slide).filter((i) => !i.path.includes('component'));
      expect(found, kind).toEqual([]);
    }
  });

  it('una slide nueva de cada tipo es válida y trae título', () => {
    for (const kind of SLIDE_KINDS) {
      const slide = defaultSlide();
      expect(slideTitle(slide), kind).not.toEqual([]);
      expect(issues(slide), kind).toEqual([]);
    }
  });

  it('solo trae lo obligatorio, con una copia de las muestras (no las comparte)', () => {
    const a = defaultBlock('list') as Extract<Block, { kind: 'list' }>;
    const b = defaultBlock('list') as Extract<Block, { kind: 'list' }>;
    a.items.push({ text: 'otro' });
    expect(b.items).toHaveLength(3);
    expect(Object.keys(defaultBlock('note')).sort()).toEqual(['kind', 'text']);
  });

  it('un select numérico se guarda como número', () => {
    const grid = defaultSlide('grid') as ContentSlide;
    expect(grid.columns).toBe(3);
  });

  it('defaultValue ignora lo opcional', () => {
    expect(defaultValue(BLOCK_DESCRIPTORS.card.fields)).toEqual({
      title: 'Título de la tarjeta',
    });
  });
});

describe('fullSample', () => {
  it('llena todos los campos con textos únicos por ruta', () => {
    const sample = fullSample(BLOCK_DESCRIPTORS.card.fields, 'card');
    expect(sample.title).toBe('«card.title»');
    expect(sample.footer).toBe('«card.footer»');
    expect((sample.sources as { text: string }[])[1]?.text).toBe(
      '«card.sources.1.text»',
    );
  });
});

describe('casos de prueba', () => {
  const base = (): Slide => ({
    kind: 'content',
    eyebrow: {
      index: '02',
      text: 'Tema de la slide',
      minutes: 8,
      mode: 'inform',
    },
    body: [
      { kind: 'heading', title: ['Lista numerada'] },
      { kind: 'note', text: 'Una frase de apoyo para esta slide.' },
      {
        kind: 'list',
        ordered: true,
        items: [
          { text: 'Primer punto', detail: 'Con un detalle', icon: 'info' },
          { text: 'Segundo punto' },
        ],
      },
      {
        kind: 'agenda',
        items: [{ time: '10:00', title: 'Bienvenida', minutes: 10 }],
      },
    ],
  });
  const cases: TestCaseId[] = ['short', 'long', 'many', 'minimal'];
  const list = (s: Slide) =>
    ((s as Extract<Slide, { kind: 'content' }>).body ?? [])[2] as Extract<
      Block,
      { kind: 'list' }
    >;

  it('todos los casos dejan la slide válida, en cada tipo de slide', () => {
    for (const id of cases) {
      expect(issues(applyTestCase(base(), id)), id).toEqual([]);
      for (const kind of SLIDE_KINDS)
        expect(
          issues(applyTestCase(defaultSlide(kind), id)),
          `${kind} ${id}`,
        ).toEqual([]);
      for (const slide of everyBlockSlide()) {
        expect(
          issues(applyTestCase(slide, id)).filter(
            (i) => !i.path.includes('component'),
          ),
          `${slide.kind} con bloque, ${id}`,
        ).toEqual([]);
      }
    }
  });

  it('no modifica la slide original', () => {
    const original = base();
    applyTestCase(original, 'long');
    expect(original).toEqual(base());
  });

  it('largo alarga los textos y el título, pero deja intactos los formatos (hora, minutos)', () => {
    const out = applyTestCase(base(), 'long') as Extract<
      Slide,
      { kind: 'content' }
    >;
    expect(slideTitle(out)).toHaveLength(3);
    expect(String(slideTitle(out)[0]).length).toBeGreaterThanOrEqual(28);
    expect(
      ((out.body ?? [])[1] as { text: string }).text.length,
    ).toBeGreaterThan(100);
    expect(list(out).items[0]?.text.length).toBeGreaterThanOrEqual(90);
    expect(out.eyebrow?.index).toBe('02');
    expect(
      ((out.body ?? [])[3] as Extract<Block, { kind: 'agenda' }>).items[0]
        ?.time,
    ).toBe('10:00');
  });

  it('corto deja una palabra por texto', () => {
    const out = applyTestCase(base(), 'short') as Extract<
      Slide,
      { kind: 'content' }
    >;
    expect(slideTitle(out)).toEqual(['Lista']);
    expect(((out.body ?? [])[1] as { text: string }).text).toBe('Una');
    expect(list(out).items[0]?.detail).toBe('Con');
  });

  it('muchos lleva las listas a diez elementos', () => {
    const out = applyTestCase(base(), 'many');
    expect(list(out).items).toHaveLength(MANY_ITEMS);
  });

  it('muchos llena la cuadrícula, sin pasarse de cuatro filas', () => {
    const grid: Slide = {
      kind: 'content',
      columns: 3,
      body: [defaultBlock('card')],
    };
    expect((applyTestCase(grid, 'many') as ContentSlide).body).toHaveLength(12);
  });

  it('mínimo quita lo opcional, deja un solo punto y conserva el título', () => {
    const out = applyTestCase(base(), 'minimal') as Extract<
      Slide,
      { kind: 'content' }
    >;
    expect(out.eyebrow).toBeUndefined();
    expect(slideTitle(out)).toEqual(['Lista numerada']);
    expect(list(out).items).toHaveLength(1);
    expect(list(out).items[0]).toEqual({ text: 'Primer punto' });
    expect(list(out).ordered).toBeUndefined();
  });
});

describe('opciones de un bloque', () => {
  it('«llenar el espacio» va con las primeras opciones, antes de cualquier sección', () => {
    for (const kind of ['card', 'person', 'notice'] as const) {
      const fields = BLOCK_DESCRIPTORS[kind].fields;
      const grow = fields.findIndex((f) => f.key === 'grow');
      const section = fields.findIndex((f) =>
        ['object', 'list', 'people', 'blocks', 'position'].includes(f.type),
      );
      expect(grow, kind).toBeGreaterThanOrEqual(0);
      expect(grow, kind).toBeLessThan(section);
    }
  });
});
