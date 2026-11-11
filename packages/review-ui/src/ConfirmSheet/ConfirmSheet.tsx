import BottomSheet from '../BottomSheet/BottomSheet';
import type { SheetLayerProps } from '../overlay/overlay.types';
import styles from './ConfirmSheet.module.css';

type Props = SheetLayerProps<boolean> & {
  title: string;
  message: string;
  confirmLabel: string;
  /** Acción destructiva: el botón de confirmar va en rojo. */
  danger?: boolean;
};

/** Pide confirmar una acción. Resuelve `true` si se confirma y `false` si se cancela. */
export default function ConfirmSheet(props: Props) {
  return (
    <BottomSheet
      open={props.open}
      kicker="Confirmar"
      title={props.title}
      compact
      onClose={() => props.close(false)}
    >
      <div class={styles.content}>
        <p class={styles.message}>{props.message}</p>
        <div class={styles.row}>
          <button
            type="button"
            class={styles.button}
            onClick={() => props.close(false)}
          >
            Cancelar
          </button>
          <button
            type="button"
            class={`${styles.button} ${props.danger ? styles.danger : styles.primary}`}
            onClick={() => props.close(true)}
          >
            {props.confirmLabel}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
