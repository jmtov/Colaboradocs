import type { IssuedPin } from '@colaboradocs/review-core';
import { Show } from 'solid-js';
import BottomSheet from '../../../BottomSheet/BottomSheet';
import Button from '../../../Button/Button';
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
          <Button
            icon={sheet.copied() ? CheckIcon : CopyIcon}
            onClick={() => void sheet.copy(props.issued.pin)}
          >
            {sheet.copied() ? 'Copiado' : 'Copiar'}
          </Button>
          <Button
            icon={CheckIcon}
            variant="primary"
            onClick={() => props.close()}
          >
            Listo
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
