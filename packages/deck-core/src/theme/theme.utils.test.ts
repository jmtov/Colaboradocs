import { describe, expect, it } from 'vitest';
import { TOKEN_DEFAULTS } from './theme.constants';
import type { Theme } from './theme.types';
import {
  resolveStyle,
  slideStyleAttr,
  styleToCss,
  validateTheme,
} from './theme.utils';

const base: Theme = {
  id: 'demo',
  name: 'Demo',
  baseMode: 'light',
  colors: {
    light: {
      bg: '#fff',
      ink: '#000',
      accent: '#000',
      accentSurface: '#f80',
      onAccent: '#000',
    },
    dark: {
      bg: '#000',
      ink: '#fff',
      accent: '#fff',
      accentSurface: '#f80',
      onAccent: '#000',
    },
  },
  categories: [
    { id: 'a', name: 'A', light: '#111', dark: '#eee' },
    { id: 'b', name: 'B', light: '#222', dark: '#ddd', print: '#333' },
  ],
  tokens: { 'title-weight': '800' },
  fonts: [{ family: 'Demo', weight: 400, file: 'demo-400.woff2' }],
  variants: {
    evento: {
      name: 'Evento',
      tokens: { 'title-weight': '700', 'rule-w': '4rem' },
    },
  },
};

describe('resolveStyle', () => {
  it('aplica las capas en orden: tema, variante, deck', () => {
    const s = resolveStyle(base, 'evento', { tokens: { 'rule-w': '2rem' } });
    expect(s.tokens['title-weight']).toBe('700');
    expect(s.tokens['rule-w']).toBe('2rem');
    expect(s.tokens.h1).toBe(TOKEN_DEFAULTS.h1);
  });

  it('sin variante usa el tema tal cual', () => {
    expect(resolveStyle(base, undefined).tokens['title-weight']).toBe('800');
  });

  it('una capa con categorías reemplaza la lista completa', () => {
    const s = resolveStyle(base, undefined, {
      categories: [{ id: 'z', name: 'Z', light: '#999', dark: '#666' }],
    });
    expect(s.categories.map((c) => c.id)).toEqual(['z']);
  });

  it('un color de deck sobrescribe solo el modo indicado', () => {
    const s = resolveStyle(base, undefined, {
      colors: { dark: { bg: '#111' } },
    });
    expect(s.colors.dark.bg).toBe('#111');
    expect(s.colors.light.bg).toBe('#fff');
  });
});

describe('styleToCss', () => {
  const css = styleToCss(resolveStyle(base, undefined), 'light');

  it('el modo base va en :root y el contrario en data-theme', () => {
    expect(css).toContain(':root { --font-sans');
    expect(css).toContain(':root[data-theme="dark"] { --bg: #000;');
  });

  it('numera las categorías desde 1 y usa `print` solo en impresión', () => {
    expect(css).toContain('--cat-1: #111;');
    expect(css).toContain('--cat-2: #222;');
    const print = css.slice(css.indexOf('@media print'));
    expect(print).toContain('--cat-1: #111;');
    expect(print).toContain('--cat-2: #333;');
  });

  it('deriva muted y líneas de bg e ink si el tema no las fija', () => {
    expect(css).toContain(
      '--muted: color-mix(in srgb, var(--ink) 62%, var(--bg));',
    );
  });

  it('la impresión siempre usa los colores claros', () => {
    const print = css.slice(css.indexOf('@media print'));
    expect(print).toContain('--bg: #fff;');
  });

  it('con base oscura, la impresión sigue siendo clara', () => {
    const dark = styleToCss(
      resolveStyle({ ...base, baseMode: 'dark' }, undefined),
      'dark',
    );
    expect(dark.split('\n')[0]).toContain('--bg: #000;');
    expect(dark.slice(dark.indexOf('@media print'))).toContain('--bg: #fff;');
  });
});

describe('slideStyleAttr', () => {
  it('escribe los tokens y la categoría como variables', () => {
    expect(slideStyleAttr({ tokens: { h1: '3rem' } }, 1)).toBe(
      '--h1: 3rem; --c: var(--cat-2);',
    );
  });

  it('ignora lo que no es un token conocido', () => {
    const style = { tokens: { 'no-existe': 'x' } } as unknown as Parameters<
      typeof slideStyleAttr
    >[0];
    expect(slideStyleAttr(style)).toBe('');
  });
});

describe('validateTheme', () => {
  it('un tema completo no tiene problemas', () => {
    expect(validateTheme(base)).toEqual([]);
  });

  it('exige el modo oscuro', () => {
    const noDark = {
      ...base,
      colors: { light: base.colors.light },
    } as unknown as Theme;
    expect(validateTheme(noDark).some((i) => i.path === 'colors.dark')).toBe(
      true,
    );
  });

  it('exige los colores obligatorios de cada modo', () => {
    const t = {
      ...base,
      colors: {
        ...base.colors,
        light: { ...base.colors.light, accentSurface: '' },
      },
    };
    expect(validateTheme(t).map((i) => i.path)).toContain(
      'colors.light.accentSurface',
    );
  });

  it('limita las categorías a 10 y no admite ids repetidos', () => {
    const many = Array.from({ length: 11 }, (_, i) => ({
      id: `c${i}`,
      name: 'x',
      light: '#1',
      dark: '#2',
    }));
    expect(
      validateTheme({ ...base, categories: many }).some(
        (i) => i.path === 'categories',
      ),
    ).toBe(true);
    const dup = [base.categories[0], base.categories[0]];
    expect(
      validateTheme({ ...base, categories: dup }).some((i) =>
        i.message.startsWith('Id repetido'),
      ),
    ).toBe(true);
  });

  it('marca los tokens desconocidos, también en variantes', () => {
    const bad = {
      ...base,
      tokens: { 'title-weigth': '800' },
      variants: { v: { name: 'V', tokens: { nope: '1' } } },
    } as unknown as Theme;
    const paths = validateTheme(bad).map((i) => i.path);
    expect(paths).toContain('tokens.title-weigth');
    expect(paths).toContain('variants.v.tokens.nope');
  });
});
