import type { Component, JSX } from 'solid-js';
import { Show } from 'solid-js';
import styles from './Button.module.css';

type Props = {
  /** Ícono a la izquierda del texto: todo botón lleva uno. Sin texto, es un botón solo de ícono (cuadrado). */
  icon: Component<{ class?: string }>;
  /** `primary` es la acción principal de la pantalla; `danger`, la que quita algo; `ok` es el verde de los OK. */
  variant?: 'default' | 'primary' | 'danger' | 'dangerSolid' | 'ok';
  /** `md` es el de formularios y hojas; `sm`, el compacto de las barras y los menús; `xs`, el de las insignias y las acciones dentro de un texto. */
  size?: 'md' | 'sm' | 'xs';
  /** Para los que se encienden y se apagan (OK, tres puntos abiertos). */
  pressed?: boolean;
  /** Con dirección es un enlace (`<a>`): se puede abrir en otra pestaña; un clic normal llama a `onClick`, para navegar sin recargar. */
  href?: string;
  disabled?: boolean;
  /** Es el que envía el formulario donde está (`type="submit"`). */
  submit?: boolean;
  /** Que tocarlo no le quite el foco ni la selección a lo que se está escribiendo (barra del editor). */
  keepFocus?: boolean;
  ref?: HTMLButtonElement | ((element: HTMLButtonElement) => void);
  'aria-haspopup'?: boolean | 'true' | 'menu';
  'aria-expanded'?: boolean;
  /** Texto al pasar el cursor (para los de solo ícono). */
  title?: string;
  /** Obligatorio si no hay texto: es el nombre del botón. */
  'aria-label'?: string;
  /** Solo para ubicarlo en su contenedor (alineación, margen), nunca para su aspecto. */
  class?: string;
  onClick?: () => void;
  children?: JSX.Element;
};

/** El botón de la app: un solo aspecto, con ícono. Todo lo que se toca para hacer algo es uno. */
export default function Button(props: Props) {
  const Icon = props.icon;
  const classes = () =>
    `${styles.button} ${styles[props.variant ?? 'default']} ${styles[props.size ?? 'md']} ${props.class ?? ''}`;
  const content = (
    <>
      <Icon class={styles.icon} />
      <Show when={props.children !== undefined}>{props.children}</Show>
    </>
  );
  return (
    <Show
      when={props.href}
      fallback={
        <button
          ref={props.ref as (element: HTMLButtonElement) => void}
          type={props.submit ? 'submit' : 'button'}
          class={classes()}
          classList={{
            [styles.iconOnly]: props.children === undefined,
          }}
          disabled={props.disabled}
          aria-label={props['aria-label']}
          aria-pressed={props.pressed}
          aria-haspopup={props['aria-haspopup']}
          aria-expanded={props['aria-expanded']}
          title={props.title}
          // mousedown: el clic no le quita el foco (y la selección) a lo que se escribe
          onMouseDown={(event) => {
            if (props.keepFocus) event.preventDefault();
          }}
          onClick={() => props.onClick?.()}
        >
          {content}
        </button>
      }
    >
      {(href) => (
        <a
          href={href()}
          class={classes()}
          classList={{ [styles.iconOnly]: props.children === undefined }}
          aria-label={props['aria-label']}
          title={props.title}
          onClick={(event) => {
            const plain =
              event.button === 0 &&
              !event.metaKey &&
              !event.ctrlKey &&
              !event.shiftKey &&
              !event.altKey;
            if (!plain || !props.onClick) return;
            event.preventDefault();
            props.onClick();
          }}
        >
          {content}
        </a>
      )}
    </Show>
  );
}
