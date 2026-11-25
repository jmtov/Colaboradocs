import { afterEach, describe, expect, it, vi } from 'vitest';
import { cloneJson } from './clone.utils';

afterEach(() => vi.unstubAllGlobals());

describe('cloneJson', () => {
  const original = { a: [1, { b: 'x' }], c: null };

  it('copia en profundidad', () => {
    const copy = cloneJson(original);
    expect(copy).toEqual(original);
    expect(copy.a).not.toBe(original.a);
  });

  it('funciona sin structuredClone (Safari viejo)', () => {
    vi.stubGlobal('structuredClone', undefined);
    const copy = cloneJson(original);
    expect(copy).toEqual(original);
    expect(copy.a[1]).not.toBe(original.a[1]);
  });
});
