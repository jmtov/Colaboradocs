import CloseIcon from 'lucide-solid/icons/x';
import type { Component } from 'solid-js';
import Button from '../Button/Button';
import styles from './MenuConfirm.module.css';

type Props = {
  /** Qué pasa si se confirma. */
  message: string;
  confirmLabel: string;
  confirmIcon: Component<{ class?: string }>;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/** La confirmación dentro de un menú (archivar, eliminar…): el aviso y dos botones, en el menú mismo. */
export default function MenuConfirm(props: Props) {
  return (
    <>
      <p class={styles.message}>{props.message}</p>
      <div class={styles.row}>
        <Button
          icon={props.confirmIcon}
          variant="dangerSolid"
          size="sm"
          disabled={props.busy}
          onClick={props.onConfirm}
        >
          {props.confirmLabel}
        </Button>
        <Button icon={CloseIcon} size="sm" onClick={props.onCancel}>
          Cancelar
        </Button>
      </div>
    </>
  );
}
