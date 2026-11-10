import { createSignal, Show } from 'solid-js';
import BottomSheet from '../BottomSheet/BottomSheet';
import CheckIcon from '../icons/CheckIcon';
import CopyIcon from '../icons/CopyIcon';
import { useReview } from '../ReviewProvider/review.context';
import styles from './PinResultSheet.module.css';

/** Muestra el PIN recién creado o regenerado. Es la única vez que se ve. */
export default function PinResultSheet() {
  const review = useReview();
  const access = review.access;
  const [copied, setCopied] = createSignal(false);

  async function copy(pin: string) {
    try {
      await navigator.clipboard.writeText(pin);
      setCopied(true);
    } catch {
      review.flash('No se pudo copiar. Selecciónalo y cópialo a mano.');
    }
  }

  function close() {
    setCopied(false);
    access.clearIssued();
  }

  return (
    <BottomSheet
      open={access.issued() !== null}
      kicker="Accesos"
      title={`PIN de ${access.issued()?.reviewer.name ?? ''}`}
      compact
      onClose={close}
    >
      <Show when={access.issued()}>
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
                onClick={() => void copy(issued().pin)}
              >
                <Show
                  when={copied()}
                  fallback={<CopyIcon class={styles.icon} />}
                >
                  <CheckIcon class={styles.icon} />
                </Show>
                {copied() ? 'Copiado' : 'Copiar'}
              </button>
              <button
                type="button"
                class={`${styles.button} ${styles.primary}`}
                onClick={close}
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
