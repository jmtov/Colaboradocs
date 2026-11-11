import type { IssuedPin } from '@juntanza/review-core';
import { Show } from 'solid-js';
import BottomSheet from '../../../BottomSheet/BottomSheet';
import CheckIcon from '../../../icons/CheckIcon';
import CopyIcon from '../../../icons/CopyIcon';
import type { SheetLayerProps } from '../../../overlay/overlay.types';
import { usePinResultSheet } from './PinResultSheet.hooks';
import styles from './PinResultSheet.module.css';

type Props = SheetLayerProps & {
  /** El PIN entregado al crear o regenerar. */
  issued: IssuedPin;
};

/** Muestra el PIN recién creado o regenerado. Es la única vez que se ve. */
export default function PinResultSheet(props: Props) {
  const sheet = usePinResultSheet();

  return (
    <BottomSheet
      open={props.open}
      kicker="Accesos"
      title={`PIN de ${props.issued.reviewer.name}`}
      compact
      onClose={props.onClose}
    >
      <div class={styles.content}>
        <output class={styles.pin}>{props.issued.pin}</output>
        <p class={styles.warn}>
          Es la única vez que se muestra. Mándaselo ahora; si se pierde, hay que
          regenerarlo.
        </p>
        <div class={styles.row}>
          <button
            type="button"
            class={styles.button}
            onClick={() => void sheet.copy(props.issued.pin)}
          >
            <Show
              when={sheet.copied()}
              fallback={<CopyIcon class={styles.icon} />}
            >
              <CheckIcon class={styles.icon} />
            </Show>
            {sheet.copied() ? 'Copiado' : 'Copiar'}
          </button>
          <button
            type="button"
            class={`${styles.button} ${styles.primary}`}
            onClick={() => props.close()}
          >
            Listo
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
