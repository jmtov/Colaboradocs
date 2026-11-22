import {
  resolveStyle,
  styleToCss,
  validateTheme,
} from '@colaboradocs/deck-core';
import { describe, expect, it } from 'vitest';
import { BUILTIN_THEMES, neutralTheme } from './index';

describe('temas incluidos', () => {
  for (const theme of BUILTIN_THEMES) {
    it(`${theme.id} cumple el contrato`, () => {
      expect(validateTheme(theme)).toEqual([]);
    });
  }

  it('el neutro declara seis categorías', () => {
    expect(neutralTheme.categories.map((c) => c.id)).toEqual([
      'blue',
      'green',
      'purple',
      'amber',
      'pink',
      'forest',
    ]);
  });

  it('la variante cambia el acento y conserva el resto', () => {
    const s = resolveStyle(neutralTheme, 'solido');
    expect(s.colors.light.accentSurface).toBe('#2a78d6');
    expect(s.colors.light.bg).toBe('#fff');
    expect(s.colors.dark.bg).toBe('#070707');
  });

  it('una variante da CSS distinto con las mismas variables', () => {
    const a = styleToCss(resolveStyle(neutralTheme, undefined), 'light');
    const b = styleToCss(resolveStyle(neutralTheme, 'solido'), 'light');
    expect(a).not.toBe(b);
    expect(a).toContain('--cat-6: #008300;');
    expect(b).toContain('--cat-1: #2a78d6;');
  });
});
