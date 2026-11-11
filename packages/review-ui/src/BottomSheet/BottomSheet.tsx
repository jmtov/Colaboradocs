import { type JSX, Show } from 'solid-js';
import CloseIcon from '../icons/CloseIcon';
import { useBottomSheet } from './BottomSheet.hooks';
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

/**
 * Hoja inferior sobre `<dialog>`: capa superior, foco atrapado y Escape.
 * Entra y sale deslizándose desde abajo (la duración y la curva están en el CSS):
 * al abrir se muestra el diálogo y un instante después se marca `data-state="open"`,
 * que dispara la transición; al cerrar se marca `data-state="closing"` y el diálogo
 * (con su contenido) sigue abierto hasta que termina de salir.
 */
export default function BottomSheet(props: Props) {
  const sheet = useBottomSheet({
    open: () => props.open,
    onClose: () => props.onClose(),
  });

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: Escape ya cierra el <dialog>
    <dialog
      ref={sheet.setDialog}
      class={styles.sheet}
      aria-labelledby={sheet.titleId}
      onClick={sheet.onBackdropClick}
      onTransitionEnd={sheet.onTransitionEnd}
      // Escape: no se cierra el diálogo por su cuenta, sino por `open`, para que salga animado.
      on:cancel={sheet.onCancel}
      onClose={sheet.onNativeClose}
    >
      <Show when={sheet.rendered()}>
        <div class={styles.inner}>
          <div class={styles.head}>
            <span class={styles.kicker}>{props.kicker}</span>
            <button
              type="button"
              class={styles.close}
              onClick={sheet.onCloseClick}
            >
              <CloseIcon class={styles.icon} />
              Cerrar
            </button>
          </div>
          <h2
            id={sheet.titleId}
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
