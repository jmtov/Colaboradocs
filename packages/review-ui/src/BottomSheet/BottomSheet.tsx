import {
  createEffect,
  createUniqueId,
  type JSX,
  onCleanup,
  Show,
} from 'solid-js';
import CloseIcon from '../icons/CloseIcon';
import styles from './BottomSheet.module.css';

type Props = {
  open: boolean;
  title: string;
  /** Etiqueta pequeña sobre el título ("Glosario", "Fuentes"…). */
  kicker?: string;
  /** Título pequeño, para hojas cuyo contenido es lo importante. */
  compact?: boolean;
  onClose: () => void;
  children: JSX.Element;
};

/** Hoja inferior sobre `<dialog>`: capa superior, foco atrapado y Escape gratis. */
export default function BottomSheet(props: Props) {
  let dialog!: HTMLDialogElement;
  const titleId = createUniqueId();

  createEffect(() => {
    if (props.open && !dialog.open) dialog.showModal();
    if (!props.open && dialog.open) dialog.close();
  });
  onCleanup(() => {
    if (dialog.open) dialog.close();
  });

  // Con el teclado abierto, el <dialog> (fijo al viewport de diseño) puede quedar
  // lejos del borde del teclado. En vez de suponer dónde termina el viewport de
  // diseño (en iOS no coincide con innerHeight), se mide dónde está la hoja sin
  // desplazar y se lleva su borde inferior al borde inferior del viewport visible.
  createEffect(() => {
    const viewport = window.visualViewport;
    if (!props.open || !viewport) return;
    const align = () => {
      dialog.style.setProperty('--sheet-shift', '0px');
      const visibleBottom = viewport.offsetTop + viewport.height;
      const shift = Math.round(
        visibleBottom - dialog.getBoundingClientRect().bottom,
      );
      const maxHeight = Math.round(
        Math.min(window.innerHeight * 0.8, viewport.height * 0.9),
      );
      dialog.style.setProperty('--sheet-shift', `${shift}px`);
      dialog.style.setProperty('--sheet-max-height', `${maxHeight}px`);
    };
    align();
    viewport.addEventListener('resize', align);
    viewport.addEventListener('scroll', align);
    onCleanup(() => {
      viewport.removeEventListener('resize', align);
      viewport.removeEventListener('scroll', align);
      dialog.style.removeProperty('--sheet-shift');
      dialog.style.removeProperty('--sheet-max-height');
    });
  });

  function onClick(event: MouseEvent) {
    // Un clic sobre el fondo oscuro llega con el propio <dialog> como destino.
    if (event.target === dialog) props.onClose();
  }

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: Escape ya cierra el <dialog>
    <dialog
      ref={dialog}
      class={styles.sheet}
      aria-labelledby={titleId}
      onClick={onClick}
      onClose={() => props.onClose()}
    >
      <Show when={props.open}>
        <div class={styles.inner}>
          <div class={styles.head}>
            <span class={styles.kicker}>{props.kicker}</span>
            <button type="button" class={styles.close} onClick={props.onClose}>
              <CloseIcon class={styles.icon} />
              Cerrar
            </button>
          </div>
          <h2
            id={titleId}
            class={styles.title}
            classList={{ [styles.compact]: props.compact }}
          >
            {props.title}
          </h2>
          {props.children}
        </div>
      </Show>
    </dialog>
  );
}
