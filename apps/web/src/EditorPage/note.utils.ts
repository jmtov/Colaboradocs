/**
 * La nota «Para qué sirve» es el primer párrafo de una sección:
 * `<p><strong>Para qué sirve.</strong> texto…</p>`. El editor la muestra como
 * un campo aparte y deja el resto en el cuerpo; estas dos funciones las separan
 * y las vuelven a juntar sin cambiar el HTML de lo que ya existe.
 */

const NOTE =
  /^<p><strong>Para qué sirve[.:]?<\/strong>\s?((?:(?!<\/?p>)[\s\S])*)<\/p>/;
const PREFIX = '<strong>Para qué sirve.</strong>';

/** La nota (su HTML en línea, sin el «Para qué sirve.») y el resto de la sección. */
export function splitNote(html: string): { note: string; body: string } {
  const match = NOTE.exec(html);
  if (!match) return { note: '', body: html };
  return { note: match[1] ?? '', body: html.slice(match[0].length) };
}

/** Une la nota con el cuerpo. Sin nota, la sección no lleva ese párrafo. */
export function joinNote(note: string, body: string): string {
  const inline = note.trim();
  return inline ? `<p>${PREFIX} ${inline}</p>${body}` : body;
}

/** El HTML en línea de lo que escribe el editor de la nota (`<p>…</p>` o vacío). */
export function noteInline(editorHtml: string): string {
  const match = /^<p>([\s\S]*)<\/p>$/.exec(editorHtml.trim());
  const inline = match ? (match[1] ?? '') : editorHtml;
  return inline === '<br>' ? '' : inline;
}
