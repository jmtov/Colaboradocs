const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
};

/** Escapa texto para HTML (contenido y atributos). */
export function esc(text: string): string {
  return text.replace(/[&<>"]/g, (c) => ESCAPES[c] ?? c);
}

export type AttrValue = string | number | boolean | undefined;

/** Atributos como texto: omite `undefined` y `false`; `true` deja solo el nombre. */
export function attrs(map: Record<string, AttrValue>): string {
  return Object.entries(map)
    .filter(([, value]) => value !== undefined && value !== false)
    .map(([name, value]) =>
      value === true ? ` ${name}` : ` ${name}="${esc(String(value))}"`,
    )
    .join('');
}

export function el(
  name: string,
  attributes: Record<string, AttrValue>,
  inner = '',
): string {
  return `<${name}${attrs(attributes)}>${inner}</${name}>`;
}

/** Une clases ignorando las vacías (`classList.add('')` rompe en Safari). */
export function cx(...classes: (string | false | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
