/** Un JSON dentro de `<script>` no puede cerrar la etiqueta: se escapa `<`. */
export function escapeForScript(json: string): string {
  return json.replace(/</g, '\\u003c');
}
