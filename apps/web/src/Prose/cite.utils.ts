export type CiteItem = {
  /** Número de la fuente (1 = primera). */
  number: number;
  /** Detalles tras el número: "princ. 2 y 10", "arts. 14 y 43 del PDF". */
  details: string[];
};

export type CiteGroup = {
  /** Etiqueta opcional del grupo: "norte", "puertas abiertas". */
  label: string;
  items: CiteItem[];
};

export function citeKey(text: string): string {
  return text.replace(/\s·\s.*$/, '').replace(/^\[|\]$/g, '');
}

/**
 * Lee una cita como "[2, 3]", "[puertas abiertas: 2, 3; norte: 1, 3, 4]" o
 * "[4, princ. 2 y 10]". Descarta los números que no corresponden a una fuente.
 */
export function parseCite(text: string, sourceCount: number): CiteGroup[] {
  const groups: CiteGroup[] = [];
  for (const part of citeKey(text).split(';')) {
    const colon = part.indexOf(':');
    const label = colon > -1 ? part.slice(0, colon).trim() : '';
    const rest = colon > -1 ? part.slice(colon + 1) : part;

    const items: CiteItem[] = [];
    for (const token of rest.split(',').map((piece) => piece.trim())) {
      if (/^\d+$/.test(token)) {
        items.push({ number: Number.parseInt(token, 10), details: [] });
        continue;
      }
      const last = items[items.length - 1];
      if (token && last) last.details.push(token);
    }

    const valid = items.filter(
      (item) => item.number >= 1 && item.number <= sourceCount,
    );
    if (valid.length > 0) groups.push({ label, items: valid });
  }
  return groups;
}
