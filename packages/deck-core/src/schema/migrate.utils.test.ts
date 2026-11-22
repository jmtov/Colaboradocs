import { describe, expect, it } from 'vitest';
import { migrateSlide } from './migrate.utils';

type Block = Record<string, unknown>;
const body = (slide: Record<string, unknown>) => slide.body as Block[];

describe('migrateSlide', () => {
  it('no toca una slide que ya está al día', () => {
    const slide = {
      kind: 'content',
      body: [{ kind: 'heading', title: ['a'] }],
    };
    expect(migrateSlide(slide)).toBe(slide);
  });

  it('el título, el subtítulo y su tamaño pasan a un bloque «heading» en la esquina', () => {
    expect(
      migrateSlide({
        kind: 'content',
        title: ['a'],
        titleSize: 'xl',
        subtitle: 'b',
        body: [{ kind: 'note', text: 'x' }],
      }),
    ).toEqual({
      kind: 'content',
      body: [
        {
          kind: 'heading',
          title: ['a'],
          titleSize: 'xl',
          subtitle: 'b',
          col: 1,
          row: 1,
        },
        { kind: 'note', text: 'x' },
      ],
    });
  });

  it('las columnas del encabezado pasan a ser el ancho del título', () => {
    const out = migrateSlide({
      kind: 'content',
      title: ['a'],
      headerSpan: 1,
      body: [],
    });
    expect(body(out)[0]).toMatchObject({ kind: 'heading', span: 1 });
    expect('headerSpan' in out).toBe(false);
  });

  it('una slide sin título no gana un bloque de título', () => {
    expect(migrateSlide({ kind: 'content', body: [] })).toEqual({
      kind: 'content',
      body: [],
    });
  });

  it('una slide de componente registrado pasa a un bloque «custom» bajo el título', () => {
    const out = migrateSlide({
      kind: 'custom',
      component: 'hand-raise',
      props: { text: 'Hola' },
      title: ['¿Alguna pregunta?'],
      eyebrow: { text: 'x' },
    });
    expect(out.kind).toBe('content');
    expect(out.eyebrow).toEqual({ text: 'x' });
    expect(body(out).map((b) => b.kind)).toEqual(['heading', 'custom']);
    expect(body(out)[1]).toEqual({
      kind: 'custom',
      component: 'hand-raise',
      props: { text: 'Hola' },
    });
  });

  it('cover: el lede es el subtítulo y el título es grande', () => {
    const out = migrateSlide({
      kind: 'cover',
      title: ['a'],
      lede: 'b',
      body: [],
    });
    expect(body(out)[0]).toMatchObject({
      kind: 'heading',
      title: ['a'],
      titleSize: 'xl',
      subtitle: 'b',
    });
  });

  it('section: el número pasa a la línea superior', () => {
    const out = migrateSlide({
      kind: 'section',
      figure: '02',
      title: ['t'],
      eyebrow: { text: 'Bloque' },
    });
    expect(out.eyebrow).toEqual({ text: 'Bloque', index: '02' });
    expect(body(out)[0]).toMatchObject({ titleSize: 'xl' });
  });

  it('split: lo de la izquierda va bajo el título y lo de la derecha ocupa la otra columna', () => {
    const out = migrateSlide({
      kind: 'split',
      title: ['t'],
      start: [
        { kind: 'lede', text: 'sub' },
        { kind: 'list', items: [] },
      ],
      end: [{ kind: 'qr' }, { kind: 'person' }],
    });
    expect(out).toMatchObject({ columns: 2, rows: 2 });
    expect(body(out)).toEqual([
      {
        kind: 'heading',
        title: ['t'],
        subtitle: 'sub',
        col: 1,
        row: 1,
        span: 1,
      },
      { kind: 'list', items: [], col: 1, row: 2 },
      { kind: 'qr', col: 2, row: 1 },
      { kind: 'person', col: 2, row: 2, rowSpan: 1 },
    ]);
  });

  it('un contenido con flow «de arriba a abajo» pasa a posiciones y pierde el flujo', () => {
    const out = migrateSlide({
      kind: 'content',
      columns: 2,
      flow: 'column',
      headerSpan: 1,
      title: ['t'],
      body: [{ kind: 'note' }, { kind: 'qr', newColumn: true }],
    });
    expect('flow' in out).toBe(false);
    expect(body(out).slice(1)).toEqual([
      { kind: 'note', col: 1, row: 2 },
      { kind: 'qr', col: 2, row: 1 },
    ]);
  });

  it('grid: las columnas se conservan y el pie va al final de los bloques', () => {
    const out = migrateSlide({
      kind: 'grid',
      columns: 3,
      items: [{ kind: 'card' }],
      footer: [{ kind: 'notice' }],
    });
    expect(out.columns).toBe(3);
    expect(body(out).map((b) => b.kind)).toEqual(['card', 'notice']);
  });

  it('un segundo lede queda como nota', () => {
    const out = migrateSlide({
      kind: 'stack',
      body: [
        { kind: 'lede', text: 'a' },
        { kind: 'lede', text: 'b' },
      ],
    });
    expect(body(out).map((b) => b.kind)).toEqual(['heading', 'note']);
    expect(body(out)[0]).toMatchObject({ title: [], subtitle: 'a' });
  });
});
