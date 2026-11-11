import { describe, expect, it } from 'vitest';
import { printTitle } from './print.utils';

describe('printTitle', () => {
  it('lleva el título y la versión del documento', () => {
    expect(printTitle({ title: 'Reglamento', version: '0.2' })).toBe(
      'Reglamento (v0.2)',
    );
  });
});
