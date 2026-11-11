/**
 * La versión que sigue a `version`: sube el último número («0.3» → «0.4», «1.9» → «1.10», «v2» → «v3»).
 * Si no tiene ningún número, no hay qué subir y queda igual.
 */
export function nextVersion(version: string): string {
  const match = /^(.*?)(\d+)(\D*)$/.exec(version.trim());
  if (!match) return version.trim();
  const [, head, number, tail] = match;
  return `${head}${Number(number) + 1}${tail}`;
}

const NUMBERS = /\d+/g;

/**
 * Si `candidate` es una versión posterior a `current`: compara número a número
 * («0.10» > «0.9», «1.0» > «0.9»; lo que falta cuenta como 0). Si alguna no tiene
 * números no hay orden que comparar: vale cualquiera que sea distinta.
 */
export function isLaterVersion(candidate: string, current: string): boolean {
  const a = candidate.trim().match(NUMBERS)?.map(Number);
  const b = current.trim().match(NUMBERS)?.map(Number);
  if (!a || !b)
    return candidate.trim() !== '' && candidate.trim() !== current.trim();
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const diff = (a[i] ?? 0) - (b[i] ?? 0);
    if (diff !== 0) return diff > 0;
  }
  return false;
}
