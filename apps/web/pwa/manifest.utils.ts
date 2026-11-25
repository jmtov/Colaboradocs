import { ICON_FILES } from './pwa.constants';
import type { PwaConfig } from './pwa.types';

/** El manifiesto de la app instalable. `theme_color` y `background_color` son el fondo del ícono: la barra del sistema y la pantalla de arranque lo continúan. */
export function buildManifest(config: PwaConfig) {
  return {
    id: '/',
    name: config.name,
    short_name: config.name,
    description: 'Revisión de documentos y presentaciones',
    lang: 'es',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: config.colors.bg,
    theme_color: config.colors.bg,
    icons: ICON_FILES.filter((file) => file.manifest).map((file) => ({
      src: `/${file.path}`,
      sizes: `${file.size}x${file.size}`,
      type: 'image/png',
      purpose: file.maskable ? 'maskable' : 'any',
    })),
  };
}

const escapeAttr = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

/** Las etiquetas del `<head>`: manifiesto, color de la barra, íconos y lo que iOS necesita (no lee el manifiesto para todo). */
export function headTags(config: PwaConfig) {
  const name = escapeAttr(config.name);
  const color = escapeAttr(config.colors.bg);
  return [
    { tag: 'link', attrs: { rel: 'manifest', href: '/manifest.webmanifest' } },
    { tag: 'meta', attrs: { name: 'theme-color', content: color } },
    {
      tag: 'link',
      attrs: {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        href: '/icons/favicon-32.png',
      },
    },
    {
      tag: 'link',
      attrs: { rel: 'apple-touch-icon', href: '/icons/apple-touch-icon.png' },
    },
    { tag: 'meta', attrs: { name: 'mobile-web-app-capable', content: 'yes' } },
    {
      tag: 'meta',
      attrs: { name: 'apple-mobile-web-app-capable', content: 'yes' },
    },
    {
      tag: 'meta',
      attrs: { name: 'apple-mobile-web-app-title', content: name },
    },
    {
      tag: 'meta',
      attrs: {
        name: 'apple-mobile-web-app-status-bar-style',
        content: 'default',
      },
    },
  ] as const;
}
