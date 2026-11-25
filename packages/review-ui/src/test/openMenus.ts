/**
 * Abre los menús (`popover`) en pruebas: el contenido de un menú se monta al abrirse, y happy-dom
 * no abre popovers. Manda el mismo `beforetoggle` que manda el navegador.
 */
export function openMenus(root: ParentNode = document): void {
  for (const menu of root.querySelectorAll('[popover]')) {
    const event = new Event('beforetoggle');
    Object.assign(event, { newState: 'open', oldState: 'closed' });
    menu.dispatchEvent(event);
  }
}
