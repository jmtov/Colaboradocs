import type { PwaConfig } from './pwa.types';

/** Sin `pwa.json` en la carpeta del nodo (o sin NODE_DIR, como en desarrollo): la identidad neutra de la app. */
export const DEFAULT_PWA: PwaConfig = {
  name: 'Colaboradocs',
  initials: 'C',
  colors: {
    bg: '#070707',
    face: '#ffffff',
    ink: '#070707',
    shadow: '#8a8a8a',
  },
};

/** El archivo, dentro de la carpeta del nodo, que define su identidad. */
export const PWA_CONFIG_FILE = 'pwa.json';

/** Escala del bloque dentro del lienzo: en el ícono normal ocupa ~73 %; en el maskable, ~54 %, para caber en la zona segura (80 % central) que respeta cualquier recorte de Android. */
export const SCALE_ANY = 1.35;
export const SCALE_MASKABLE = 1;

/** El bloque con su sombra mide 286 px en un lienzo de 512; centrado en (214, 338) de ese dibujo. */
export const ICON_CANVAS = 512;
export const ICON_CENTER = { x: 214, y: 338 };

/** Centro de la cara, donde van las iniciales. */
export const FACE_CENTER = { x: 236, y: 316 };

/** Tamaño de la letra según cuántas son: una grande, tres apretadas. */
export const INITIALS_FONT_SIZE: Record<number, number> = {
  1: 190,
  2: 138,
  3: 98,
};

/** Las mayúsculas miden ~70 % del cuerpo de la letra: sirve para centrarlas en vertical. */
export const CAP_HEIGHT = 0.7;

export const FONT_FAMILY = 'Geist Mono';
export const FONT_FILE = 'fonts/GeistMono-Bold.ttf';

/** Los PNG que se generan: ruta, lado en px, si es maskable y si va en el manifiesto (los otros los piden las etiquetas del `<head>`). */
export const ICON_FILES = [
  { path: 'icons/icon-192.png', size: 192, maskable: false, manifest: true },
  { path: 'icons/icon-512.png', size: 512, maskable: false, manifest: true },
  {
    path: 'icons/icon-512-maskable.png',
    size: 512,
    maskable: true,
    manifest: true,
  },
  {
    path: 'icons/apple-touch-icon.png',
    size: 180,
    maskable: false,
    manifest: false,
  },
  { path: 'icons/favicon-32.png', size: 32, maskable: false, manifest: false },
] as const;
