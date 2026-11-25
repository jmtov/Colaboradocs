import { validateDocument } from '@colaboradocs/review-core';
import { describe, expect, it } from 'vitest';
import { blankDocument } from './newDocument.utils';

describe('blankDocument', () => {
  it('es un documento que la validación acepta, con una sola sección', () => {
    const result = validateDocument(
      blankDocument('mi-doc', 'Mi documento', '2026-11-18'),
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.sections).toHaveLength(1);
  });
});

describe('blankDocument con tipo', () => {
  it('escribe el tipo si no es «other», y nada si lo es', () => {
    expect(blankDocument('a', 'A', '2026-11-25', 'minutes').type).toBe(
      'minutes',
    );
    expect('type' in blankDocument('a', 'A', '2026-11-25', 'other')).toBe(
      false,
    );
    expect('type' in blankDocument('a', 'A', '2026-11-25')).toBe(false);
  });
});
