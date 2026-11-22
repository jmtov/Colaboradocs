import { ICONS } from './icons.constants';

/** SVG en línea de un icono del registro; un nombre desconocido es un error (no deja un hueco mudo). */
export function icon(name: string): string {
  const inner = ICONS[name];
  if (inner === undefined) throw new Error(`Icono desconocido: «${name}».`);
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
}
