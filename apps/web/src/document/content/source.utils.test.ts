import { describe, expect, it } from 'vitest';
import { isSourceLink } from './source.utils';

describe('isSourceLink', () => {
  it('acepta enlaces externos y archivos del propio sitio', () => {
    expect(isSourceLink('https://example.org/a')).toBe(true);
    expect(isSourceLink('http://example.org/a')).toBe(true);
    expect(isSourceLink('/documentos/estatutos.pdf')).toBe(true);
  });

  it('rechaza lo vacío, lo relativo y los esquemas peligrosos', () => {
    expect(isSourceLink('')).toBe(false);
    expect(isSourceLink('documentos/a.pdf')).toBe(false);
    expect(isSourceLink('//evil.example/a')).toBe(false);
    expect(isSourceLink('javascript:alert(1)')).toBe(false);
  });
});
