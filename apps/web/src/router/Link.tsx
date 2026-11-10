import type { JSX } from 'solid-js';
import { navigate } from './router';

type Props = {
  href: string;
  class?: string;
  /** Se levanta al pasar el cursor (tarjetas y botones hechos con enlace). */
  lift?: boolean;
  children: JSX.Element;
};

/** Enlace interno: navega sin recargar, salvo con Cmd/Ctrl/Shift o clic medio. */
export default function Link(props: Props) {
  function onClick(event: MouseEvent) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    event.preventDefault();
    navigate(props.href);
  }
  return (
    <a
      href={props.href}
      class={props.class}
      data-lift={props.lift ? '' : undefined}
      onClick={onClick}
    >
      {props.children}
    </a>
  );
}
