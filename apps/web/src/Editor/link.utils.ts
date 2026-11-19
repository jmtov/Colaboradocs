import { isSafeLinkUrl } from '@colaboradocs/review-core';

/**
 * Lo que alguien escribe como enlace → una dirección que el documento admite, o
 * null. «ejemplo.com» pasa a https, un correo a mailto, y una ruta propia («/d/acta») se deja.
 */
export function normalizeLinkUrl(input: string): string | null {
  const value = input.trim();
  if (!value || /\s/.test(value)) return null;
  // Cualquier otro esquema (javascript:, data:, ftp:…) no es un dominio sin escribir.
  if (
    /^[a-z][a-z0-9+.-]*:/i.test(value) &&
    !/^(https?:|mailto:)/i.test(value)
  ) {
    return null;
  }
  let url = value;
  if (/^[^\s@/:]+@[^\s@/:]+\.[^\s@/:]+$/.test(value)) {
    url = `mailto:${value}`;
  } else if (!/^(https?:\/\/|mailto:|\/)/i.test(value)) {
    url = `https://${value}`;
  }
  return isSafeLinkUrl(url) ? url : null;
}
