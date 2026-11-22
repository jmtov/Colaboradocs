import type { Deck, Theme } from '@colaboradocs/deck-core';
import { describe, expect, it } from 'vitest';
import { buildPreviewHtml } from './preview.utils';

const theme: Theme = {
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
  categories: [],
  tokens: {},
  fonts: [{ family: 'Demo', weight: 400, file: 'demo.woff2' }],
};

// Un deck a medias: la categoría no existe en el tema (el editor igual lo dibuja).
const half: Deck = {
  version: 1,
  id: 'd',
  title: 'D',
  lang: 'es',
  theme: 'demo',
  slides: [{ kind: 'content', category: 3, body: [] }],
};

describe('buildPreviewHtml', () => {
  const html = buildPreviewHtml(half, theme, {
    fonts: { 'demo.woff2': 'data:font/woff2;base64,AAA' },
    files: {},
  });

  it('dibuja un deck con problemas de validación', () => {
    expect(html).toContain('<section');
  });

  it('incrusta las fuentes ya bajadas', () => {
    expect(html).toContain('url("data:font/woff2;base64,AAA")');
  });

  it('activa la vista previa del motor', () => {
    expect(html).toContain('"preview":true');
  });
});
