import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DEFAULT_PWA, PWA_CONFIG_FILE } from './pwa.constants';
import type { IconColors, PwaConfig } from './pwa.types';

const HEX = /^#[0-9a-f]{6}$/i;
const INITIALS = /^[A-ZÁÉÍÓÚÑÜ]{1,3}$/;
const MAX_NAME = 40;
const COLOR_KEYS: (keyof IconColors)[] = ['bg', 'face', 'ink', 'shadow'];

/**
 * Valida la identidad de un nodo. Falla con un mensaje claro: un color o unas iniciales mal escritas
 * acabarían dentro de un SVG y de un HTML, y es mejor que el build se detenga que publicar un ícono roto.
 */
export function parsePwaConfig(
  value: unknown,
  source = PWA_CONFIG_FILE,
): PwaConfig {
  const fail = (reason: string): never => {
    throw new Error(`${source}: ${reason}`);
  };
  if (value === null || typeof value !== 'object')
    return fail('no es un objeto.');
  const raw = value as Record<string, unknown>;

  const name = typeof raw.name === 'string' ? raw.name.trim() : '';
  if (name === '' || name.length > MAX_NAME)
    fail(`«name» debe tener de 1 a ${MAX_NAME} caracteres.`);

  const initials =
    typeof raw.initials === 'string' ? raw.initials.trim().toUpperCase() : '';
  if (!INITIALS.test(initials))
    fail('«initials» debe tener de una a tres letras (A-Z, con tildes).');

  const rawColors = raw.colors as Record<string, unknown> | undefined;
  const colors = {} as IconColors;
  for (const key of COLOR_KEYS) {
    const color = rawColors?.[key];
    if (typeof color !== 'string' || !HEX.test(color))
      fail(`«colors.${key}» debe ser un color hexadecimal como #ff8a00.`);
    colors[key] = String(color).toLowerCase();
  }
  return { name, initials, colors };
}

/** La identidad del nodo, de `<carpeta del nodo>/pwa.json`; sin carpeta o sin archivo, la neutra de la app. */
export function readPwaConfig(nodeDir: string | null): PwaConfig {
  if (!nodeDir) return DEFAULT_PWA;
  const file = join(nodeDir, PWA_CONFIG_FILE);
  if (!existsSync(file)) return DEFAULT_PWA;
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    throw new Error(`${file}: no es un JSON válido.`);
  }
  return parsePwaConfig(parsed, file);
}
