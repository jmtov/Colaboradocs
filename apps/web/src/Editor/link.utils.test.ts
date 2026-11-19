import { describe, expect, it } from 'vitest';
import { normalizeLinkUrl } from './link.utils';

describe('normalizeLinkUrl', () => {
  it('deja las direcciones completas y las rutas propias', () => {
    expect(normalizeLinkUrl('https://a.co/x?y=1')).toBe('https://a.co/x?y=1');
    expect(normalizeLinkUrl('http://a.co')).toBe('http://a.co');
    expect(normalizeLinkUrl('/d/acta-2026-11-18')).toBe('/d/acta-2026-11-18');
  });

  it('agrega https a un dominio y mailto a un correo', () => {
    expect(normalizeLinkUrl('  ejemplo.com/ruta ')).toBe(
      'https://ejemplo.com/ruta',
    );
    expect(normalizeLinkUrl('ana@ejemplo.co')).toBe('mailto:ana@ejemplo.co');
  });

  it('rechaza vacío, espacios y esquemas peligrosos', () => {
    expect(normalizeLinkUrl('')).toBeNull();
    expect(normalizeLinkUrl('dos palabras')).toBeNull();
    expect(normalizeLinkUrl('javascript:alert(1)')).toBeNull();
    expect(normalizeLinkUrl('//evil.co')).toBeNull();
  });
});
