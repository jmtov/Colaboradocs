/**
 * El desplazamiento vertical (px) de una transformación CSS calculada:
 * `matrix(a, b, c, d, tx, ty)` o `matrix3d(...)`. `none` o algo ilegible: 0.
 */
export function translateYOf(transform: string | undefined | null): number {
  if (!transform || transform === 'none') return 0;
  const inside = /\(([^)]*)\)/.exec(transform)?.[1];
  if (!inside) return 0;
  const values = inside.split(',').map((part) => Number.parseFloat(part));
  const ty = transform.startsWith('matrix3d') ? values[13] : values[5];
  return Number.isFinite(ty) ? (ty as number) : 0;
}

/**
 * Cuánto hay que desplazar la hoja para que su borde inferior coincida con el del
 * viewport visible (p. ej. con el teclado abierto en iOS).
 *
 * `measuredBottom` es lo que mide `getBoundingClientRect()`, que **ya incluye** la
 * transformación actual: la animación de entrada/salida (la hoja arranca fuera de
 * pantalla) y el desplazamiento anterior. Hay que descontarla para saber dónde
 * estaría sin transformar; si no, se «corrige» un desplazamiento que es solo
 * la animación y la hoja termina flotando a mitad de pantalla.
 */
export function sheetShift(input: {
  measuredBottom: number;
  transform: string | undefined | null;
  visibleBottom: number;
}): number {
  const naturalBottom = input.measuredBottom - translateYOf(input.transform);
  return Math.round(input.visibleBottom - naturalBottom);
}
