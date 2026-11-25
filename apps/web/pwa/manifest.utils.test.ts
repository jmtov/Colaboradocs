import { describe, expect, it } from 'vitest';
import { buildManifest, headTags } from './manifest.utils';
import type { PwaConfig } from './pwa.types';

const config: PwaConfig = {
  name: 'PH Rionegro Docs',
  initials: 'PHR',
  colors: { bg: '#ff8a00', face: '#fffce3', ink: '#1a1a1a', shadow: '#1a1a1a' },
};

describe('buildManifest', () => {
  const manifest = buildManifest(config);

  it('es una app independiente que arranca en la raíz', () => {
    expect(manifest).toMatchObject({
      name: 'PH Rionegro Docs',
      short_name: 'PH Rionegro Docs',
      start_url: '/',
      scope: '/',
      display: 'standalone',
    });
  });

  it('la barra y la pantalla de arranque siguen el fondo del ícono', () => {
    expect(manifest.theme_color).toBe('#ff8a00');
    expect(manifest.background_color).toBe('#ff8a00');
  });

  it('trae 192 y 512 normales y un 512 maskable', () => {
    expect(manifest.icons.map((i) => `${i.sizes} ${i.purpose}`)).toEqual([
      '192x192 any',
      '512x512 any',
      '512x512 maskable',
    ]);
  });
});

describe('headTags', () => {
  const tags = headTags(config);
  const attr = (tag: string, key: string, value: string) =>
    tags.find(
      (t) =>
        t.tag === tag && (t.attrs as Record<string, string>)[key] === value,
    );

  it('enlaza el manifiesto, el color de la barra y los íconos', () => {
    expect(attr('link', 'rel', 'manifest')?.attrs).toMatchObject({
      href: '/manifest.webmanifest',
    });
    expect(attr('meta', 'name', 'theme-color')?.attrs).toMatchObject({
      content: '#ff8a00',
    });
    expect(attr('link', 'rel', 'apple-touch-icon')).toBeDefined();
  });

  it('iOS: abre sin la barra del navegador y con el nombre del nodo', () => {
    expect(
      attr('meta', 'name', 'apple-mobile-web-app-capable')?.attrs,
    ).toMatchObject({ content: 'yes' });
    expect(
      attr('meta', 'name', 'apple-mobile-web-app-title')?.attrs,
    ).toMatchObject({ content: 'PH Rionegro Docs' });
  });

  it('escapa el nombre: no puede cerrar el atributo', () => {
    const evil = headTags({ ...config, name: 'A"><script>' });
    const title = evil.find(
      (t) =>
        (t.attrs as Record<string, string>).name ===
        'apple-mobile-web-app-title',
    );
    if (!title) throw new Error('falta el título de iOS');
    expect((title.attrs as Record<string, string>).content).toBe(
      'A&quot;&gt;&lt;script&gt;',
    );
  });
});
