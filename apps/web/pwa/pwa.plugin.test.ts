import { describe, expect, it } from 'vitest';
import { DEFAULT_PWA, ICON_FILES } from './pwa.constants';
import { buildPwaAssets } from './pwa.plugin';

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47];
const widthOf = (png: Uint8Array) =>
  new DataView(png.buffer, png.byteOffset).getUint32(16);

describe('buildPwaAssets', () => {
  const assets = buildPwaAssets(DEFAULT_PWA);

  it('deja el manifiesto, el service worker y todos los íconos', () => {
    expect([...assets.keys()].sort()).toEqual(
      [
        'manifest.webmanifest',
        'sw.js',
        ...ICON_FILES.map((f) => f.path),
      ].sort(),
    );
  });

  it('cada ícono es un PNG del lado que dice su nombre', () => {
    for (const file of ICON_FILES) {
      const png = assets.get(file.path) as Uint8Array;
      expect([...png.slice(0, 4)], file.path).toEqual(PNG_SIGNATURE);
      expect(widthOf(png), file.path).toBe(file.size);
    }
  });

  it('el manifiesto es JSON y el service worker no guarda nada en caché', () => {
    const manifest = JSON.parse(String(assets.get('manifest.webmanifest')));
    expect(manifest.start_url).toBe('/');
    expect(String(assets.get('sw.js'))).not.toContain('caches');
  });
});
