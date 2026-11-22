import type { Block, ContentSlide } from '@colaboradocs/deck-core';
import { describe, expect, it } from 'vitest';
import {
  blockSummary,
  pinnedAt,
  pinnedInFirstFreeCell,
} from './BlocksField.utils';

describe('blockSummary', () => {
  it('usa el primer texto que encuentra', () => {
    expect(blockSummary({ kind: 'card', title: 'Hola' })).toBe('Hola');
    expect(blockSummary({ kind: 'figure', value: '3000' })).toBe('3000');
  });

  it('mira dentro de personas y listas', () => {
    expect(blockSummary({ kind: 'person', person: { name: 'Ana' } })).toBe(
      'Ana',
    );
    expect(
      blockSummary({
        kind: 'list',
        items: [{ text: 'Primero' }, { text: 'x' }],
      }),
    ).toBe('Primero');
    expect(
      blockSummary({
        kind: 'timeline',
        events: [{ date: '22 nov', title: 'Día' }],
      }),
    ).toBe('Día');
  });

  it('acorta lo largo y devuelve vacío si no hay texto', () => {
    expect(blockSummary({ kind: 'note', text: 'a'.repeat(60) })).toHaveLength(
      36,
    );
    expect(blockSummary({ kind: 'chips', items: [] })).toBe('');
  });
});

describe('pinnedInFirstFreeCell', () => {
  const note: Block = { kind: 'note', text: 'x' };

  it('fija el bloque nuevo en la primera celda libre', () => {
    const slide: ContentSlide = {
      kind: 'content',
      columns: 2,
      body: [{ kind: 'heading', title: ['t'], span: 1 }],
    };
    expect(pinnedInFirstFreeCell(slide, note)).toMatchObject({
      col: 2,
      row: 1,
    });
    const full: ContentSlide = {
      ...slide,
      body: [...(slide.body ?? []), { ...note, col: 2, row: 1 }],
    };
    expect(pinnedInFirstFreeCell(full, note)).toMatchObject({ col: 1, row: 2 });
  });

  it('respeta un bloque que ya trae posición y no falla sin slide', () => {
    const placed = { ...note, col: 2, row: 3 };
    expect(pinnedInFirstFreeCell({ kind: 'content' }, placed)).toBe(placed);
    expect(pinnedInFirstFreeCell(undefined, note)).toBe(note);
  });
});

describe('pinnedAt', () => {
  it('fija el bloque en la celda elegida y lo corre si no cabe hasta el borde', () => {
    const slide: ContentSlide = { kind: 'content', columns: 3 };
    const note: Block = { kind: 'note', text: 'x' };
    expect(pinnedAt(slide, note, { col: 3, row: 2 })).toMatchObject({
      col: 3,
      row: 2,
    });
    const qr: Block = { kind: 'qr', src: 's', alt: 'a', link: 'l', span: 2 };
    expect(
      pinnedAt({ ...slide, columns: 2 }, qr, { col: 2, row: 1 }),
    ).toMatchObject({
      col: 1,
    });
    expect(
      pinnedAt(slide, { kind: 'agenda', items: [] }, { col: 3, row: 1 }),
    ).toMatchObject({ col: 1 });
  });
});
