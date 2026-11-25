import { describe, expect, it } from 'vitest';
import { formatReviewerLabel } from './reviewers.utils';

describe('formatReviewerLabel', () => {
  it('agrega el municipio entre paréntesis', () => {
    expect(
      formatReviewerLabel({ name: 'Ana López', municipality: 'La Ceja' }),
    ).toBe('Ana López (La Ceja)');
  });

  it('sin municipio muestra solo el nombre', () => {
    expect(formatReviewerLabel({ name: 'Ana López', municipality: null })).toBe(
      'Ana López',
    );
  });

  it('sin datos muestra «Alguien»', () => {
    expect(formatReviewerLabel(undefined)).toBe('Alguien');
  });
});
