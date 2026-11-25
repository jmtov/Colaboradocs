import {
  CAP_HEIGHT,
  FACE_CENTER,
  FONT_FAMILY,
  ICON_CANVAS,
  ICON_CENTER,
  INITIALS_FONT_SIZE,
  SCALE_ANY,
} from './pwa.constants';
import type { PwaConfig } from './pwa.types';

/**
 * El ícono: el bloque «físico» de la app (la cara con borde y su sombra larga, abajo a la izquierda) con
 * las iniciales del nodo. El borde de la cara es del color de la sombra, así que forman un solo cuerpo; la
 * sombra parte del borde exterior (el trazo de 10 sobresale 5 px del rectángulo) y entra bajo el trazo para
 * no dejar una línea de unión. `scale` da cuánto del lienzo ocupa el bloque.
 */
export function iconSvg(config: PwaConfig, scale = SCALE_ANY): string {
  const { bg, face, ink, shadow } = config.colors;
  const initials = config.initials;
  const size = INITIALS_FONT_SIZE[initials.length] ?? INITIALS_FONT_SIZE[3];
  const y = FACE_CENTER.y + ((size ?? 0) * CAP_HEIGHT) / 2;
  const half = ICON_CANVAS / 2;
  return [
    `<svg viewBox="0 0 ${ICON_CANVAS} ${ICON_CANVAS}" xmlns="http://www.w3.org/2000/svg">`,
    `<rect width="${ICON_CANVAS}" height="${ICON_CANVAS}" fill="${bg}"/>`,
    `<g transform="translate(${half} ${half}) scale(${scale}) translate(${-ICON_CENTER.x} ${-ICON_CENTER.y})">`,
    `<polygon points="115,195 71,239 71,481 313,481 357,437 120,432 120,200" fill="${shadow}"/>`,
    `<rect x="120" y="200" width="232" height="232" fill="${face}" stroke="${shadow}" stroke-width="10"/>`,
    `<text x="${FACE_CENTER.x}" y="${y}" text-anchor="middle" fill="${ink}" font-family="${FONT_FAMILY}" font-weight="700" font-size="${size}" letter-spacing="-0.04em">${initials}</text>`,
    '</g></svg>',
  ].join('');
}
