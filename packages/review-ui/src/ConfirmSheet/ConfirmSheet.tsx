import BottomSheet from '../BottomSheet/BottomSheet';
import Button from '../Button/Button';
import CheckIcon from '../icons/CheckIcon';
import CloseIcon from '../icons/CloseIcon';
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
          <Button icon={CloseIcon} onClick={() => props.close(false)}>
            Cancelar
          </Button>
          <Button
            icon={CheckIcon}
            variant={props.danger ? 'dangerSolid' : 'primary'}
            onClick={() => props.close(true)}
          >
            {props.confirmLabel}
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
