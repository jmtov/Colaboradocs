import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import type { Plugin } from 'vite';
import { iconSvg } from './icon.utils';
import { buildManifest, headTags } from './manifest.utils';
import {
  FONT_FAMILY,
  FONT_FILE,
  ICON_FILES,
  SCALE_ANY,
  SCALE_MASKABLE,
} from './pwa.constants';
import type { PwaAssets, PwaConfig } from './pwa.types';
import { readPwaConfig } from './pwa.utils';

const FONT_PATH = join(import.meta.dirname, FONT_FILE);

/**
 * El service worker mínimo: no guarda nada en caché (todo va a la red, como sin él). Existe para que
 * el navegador trate la página como instalable; guardar el shell y los datos es otra etapa.
 */
const SERVICE_WORKER = `// Sin caché: solo hace instalable la página.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
`;

const png = (svg: string, size: number): Uint8Array =>
  new Resvg(svg, {
    fitTo: { mode: 'width', value: size },
    font: {
      fontFiles: [FONT_PATH],
      loadSystemFonts: false,
      defaultFontFamily: FONT_FAMILY,
    },
  })
    .render()
    .asPng();

const CONTENT_TYPES: Record<string, string> = {
  png: 'image/png',
  js: 'text/javascript',
  webmanifest: 'application/manifest+json',
};
const contentType = (path: string) =>
  CONTENT_TYPES[path.split('.').pop() ?? ''] ?? 'application/octet-stream';

/** Todo lo que la PWA suma a la página: manifiesto, íconos y service worker. */
export function buildPwaAssets(config: PwaConfig): PwaAssets {
  const assets: PwaAssets = new Map();
  assets.set('manifest.webmanifest', JSON.stringify(buildManifest(config)));
  assets.set('sw.js', SERVICE_WORKER);
  for (const file of ICON_FILES) {
    const svg = iconSvg(config, file.maskable ? SCALE_MASKABLE : SCALE_ANY);
    assets.set(file.path, png(svg, file.size));
  }
  return assets;
}

/**
 * Vite: deja la identidad del nodo (`<NODE_DIR>/pwa.json`) en el HTML y en los archivos de la página. Sin
 * NODE_DIR o sin ese archivo usa la identidad neutra de la app. En desarrollo sirve los mismos archivos.
 */
export function pwaPlugin(nodeDir: string | null): Plugin {
  const config = readPwaConfig(nodeDir);
  let assets: PwaAssets | undefined;
  const get = () => {
    assets ??= buildPwaAssets(config);
    return assets;
  };
  return {
    name: 'colaboradocs-pwa',
    transformIndexHtml: () => [...headTags(config)],
    generateBundle() {
      for (const [fileName, source] of get())
        this.emitFile({ type: 'asset', fileName, source });
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = (req.url ?? '').split('?')[0]?.replace(/^\//, '') ?? '';
        const body = get().get(path);
        if (body === undefined) return next();
        res.setHeader('Content-Type', contentType(path));
        res.end(body);
      });
    },
  };
}
