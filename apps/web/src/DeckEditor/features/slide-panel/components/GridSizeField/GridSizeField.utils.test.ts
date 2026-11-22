import { describe, expect, it } from 'vitest';
import { describeGrid, GRID_SIDE, isShaded } from './GridSizeField.utils';

describe('GridSizeField.utils', () => {
  it('el selector es de 4 × 4', () => {
    expect(GRID_SIDE).toBe(4);
  });

  it('sombrea desde la esquina de arriba a la izquierda hasta el tamaño', () => {
    expect(isShaded(1, 1, 3, 2)).toBe(true);
    expect(isShaded(3, 2, 3, 2)).toBe(true);
    expect(isShaded(4, 1, 3, 2)).toBe(false);
    expect(isShaded(1, 3, 3, 2)).toBe(false);
  });

  it('describe el tamaño', () => {
    expect(describeGrid(3, 2)).toBe('3 × 2');
  });
});
