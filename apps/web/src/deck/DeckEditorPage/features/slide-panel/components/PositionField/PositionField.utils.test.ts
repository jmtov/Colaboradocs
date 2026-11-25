import { type ContentSlide, layoutContent } from '@colaboradocs/deck-core';
import { describe, expect, it } from 'vitest';
import {
  cellOwners,
  describePlacement,
  selectionToPlacement,
} from './PositionField.utils';

describe('selectionToPlacement', () => {
  it('un clic es una celda; arrastrar la agranda, venga de donde venga', () => {
    expect(
      selectionToPlacement({ col: 2, row: 1 }, { col: 2, row: 1 }, 'note', 3),
    ).toEqual({ col: 2, row: 1, span: 1, rowSpan: 1 });
    expect(
      selectionToPlacement({ col: 3, row: 2 }, { col: 1, row: 1 }, 'note', 3),
    ).toEqual({ col: 1, row: 1, span: 3, rowSpan: 2 });
  });

  it('respeta el máximo y el mínimo de columnas del bloque', () => {
    expect(
      selectionToPlacement({ col: 1, row: 1 }, { col: 4, row: 1 }, 'qr', 4)
        .span,
    ).toBe(2);
    expect(
      selectionToPlacement({ col: 1, row: 1 }, { col: 1, row: 1 }, 'figure', 4)
        .span,
    ).toBe(1);
  });

  it('un bloque de ancho completo ocupa todas las columnas y solo se elige la fila', () => {
    expect(
      selectionToPlacement({ col: 3, row: 2 }, { col: 3, row: 2 }, 'agenda', 4),
    ).toEqual({ col: 1, row: 2, span: 4, rowSpan: 1 });
  });

  it('no se sale de la cuadrícula', () => {
    expect(
      selectionToPlacement({ col: 3, row: 1 }, { col: 3, row: 1 }, 'qr', 3).col,
    ).toBe(3);
    expect(
      selectionToPlacement({ col: 3, row: 1 }, { col: 3, row: 2 }, 'qr', 3),
    ).toMatchObject({ col: 3, span: 1 });
    expect(
      selectionToPlacement({ col: 1, row: 4 }, { col: 1, row: 4 }, 'note', 1)
        .rowSpan,
    ).toBe(1);
  });
});

describe('cellOwners', () => {
  it('marca cada bloque, con el título incluido, y lo libre', () => {
    const slide: ContentSlide = {
      kind: 'content',
      columns: 2,
      rows: 2,
      body: [
        { kind: 'heading', title: ['t'], span: 1 },
        {
          kind: 'qr',
          src: 's',
          alt: 'a',
          link: 'l',
          col: 2,
          row: 1,
          rowSpan: 2,
        },
      ],
    };
    expect(cellOwners(layoutContent(slide))).toEqual([
      [0, 1],
      [null, 1],
    ]);
  });
});

describe('describePlacement', () => {
  it('dice columna, fila y tamaño', () => {
    expect(describePlacement({ col: 2, row: 1, span: 1, rowSpan: 2 })).toBe(
      'C2·F1 · 1×2',
    );
  });
});
