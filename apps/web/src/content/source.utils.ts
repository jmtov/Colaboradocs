/** Una fuente se puede abrir si es un enlace externo (https) o un archivo que sirve este mismo sitio (/ruta). */
export function isSourceLink(url: string): boolean {
  return /^https?:\/\//.test(url) || /^\/(?!\/)/.test(url);
}
