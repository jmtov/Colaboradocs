import type { DeckBundle } from '@colaboradocs/deck-core';
import { neutralTheme } from '@colaboradocs/themes';
import { describe, expect, it } from 'vitest';
import { buildDeckHtml, themeFontFiles } from './deck.utils';

const bundle: DeckBundle = {
  deck: {
    version: 1,
    id: 'charla',
    title: 'Charla',
    lang: 'es',
    theme: 'neutral',
    slides: [
      {
        kind: 'content',
        body: [{ kind: 'qr', src: 'assets/qr.svg', alt: 'QR', link: 'x.org' }],
      },
    ],
  },
  theme: neutralTheme,
  files: ['qr.svg'],
};

describe('themeFontFiles', () => {
  it('lista las fuentes del tema sin repetir', () => {
    expect(themeFontFiles(bundle.theme)).toEqual([
      'geist-400.woff2',
      'geist-500.woff2',
      'geist-600.woff2',
    ]);
  });
});

describe('buildDeckHtml', () => {
  it('incrusta fuentes y archivos del deck como data URIs', () => {
    const html = buildDeckHtml(bundle, {
      fonts: { 'geist-400.woff2': 'data:font/woff2;base64,AAA' },
      files: { 'qr.svg': 'data:image/svg+xml;base64,BBB' },
    });
    expect(html).toContain('url("data:font/woff2;base64,AAA")');
    expect(html).toContain('src="data:image/svg+xml;base64,BBB"');
    expect(html).not.toContain('"assets/qr.svg"');
  });

  it('lo que no se bajó queda con su ruta (no rompe)', () => {
    const html = buildDeckHtml(bundle, { fonts: {}, files: {} });
    expect(html).toContain('"assets/qr.svg"');
    expect(html).toContain('url("fonts/geist-500.woff2")');
  });
});
