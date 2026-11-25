import { createSignal, type JSX, Show } from 'solid-js';
import styles from './MenuPanel.module.css';

type Props = {
  /** La ref del elemento: el hook del menú la usa para abrirlo y cerrarlo. */
  ref?: (element: HTMLDivElement) => void;
  onToggle?: (event: ToggleEvent) => void;
  /** Más ancho, para menús con descripciones largas. */
  wide?: boolean;
  children: JSX.Element;
};

/**
 * La caja de un menú: popover nativo (capa superior, Esc, tocar fuera). Todos los menús de la app van en una.
 * Su contenido se monta al abrirse y se desmonta al cerrarse: una lista con un menú por fila no deja
 * cientos de opciones en el DOM sin usar. Se monta en `beforetoggle` (antes de pintarse) y también en
 * `toggle`, que es el único que manda el polyfill de Safari viejo.
 */
export default function MenuPanel(props: Props) {
  const [mounted, setMounted] = createSignal(false);
  return (
    <div
      ref={props.ref}
      popover
      class={styles.menu}
      classList={{ [styles.wide]: props.wide }}
      on:beforetoggle={(event) => {
        if (event.newState === 'open') setMounted(true);
      }}
      on:toggle={(event) => {
        setMounted(event.newState === 'open');
        props.onToggle?.(event);
      }}
    >
      <Show when={mounted()}>{props.children}</Show>
    </div>
  );
}
