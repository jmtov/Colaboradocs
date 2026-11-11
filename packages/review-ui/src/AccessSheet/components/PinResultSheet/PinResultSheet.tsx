import { Show } from 'solid-js';
import BottomSheet from '../../../BottomSheet/BottomSheet';
import CheckIcon from '../../../icons/CheckIcon';
import CopyIcon from '../../../icons/CopyIcon';
import { usePinResultSheet } from './PinResultSheet.hooks';
import styles from './PinResultSheet.module.css';

/** Muestra el PIN recién creado o regenerado. Es la única vez que se ve. */
export default function PinResultSheet() {
  const sheet = usePinResultSheet();

  return (
    <BottomSheet
      open={sheet.issued() !== null}
      kicker="Accesos"
      title={`PIN de ${sheet.issued()?.reviewer.name ?? ''}`}
      compact
      onClose={sheet.close}
    >
      <Show when={sheet.issued()}>
        {(issued) => (
          <div class={styles.content}>
            <output class={styles.pin}>{issued().pin}</output>
            <p class={styles.warn}>
              Es la única vez que se muestra. Mándaselo ahora; si se pierde, hay
              que regenerarlo.
            </p>
            <div class={styles.row}>
              <button
                type="button"
                class={styles.button}
                onClick={() => void sheet.copy(issued().pin)}
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
                onClick={sheet.close}
              >
                Listo
              </button>
            </div>
          </div>
        )}
      </Show>
    </BottomSheet>
  );
}
