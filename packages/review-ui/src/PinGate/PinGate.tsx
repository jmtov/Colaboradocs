import { createSignal, type JSX, Show } from 'solid-js';
import ArrowRightIcon from '../icons/ArrowRightIcon';
import { useReview } from '../ReviewProvider/review.context';
import styles from './PinGate.module.css';

type Props = {
  /** Nombre del documento, para el título de la puerta. */
  title: string;
  hint?: string;
  children: JSX.Element;
};

/** Muestra `children` solo con sesión; si no, pide el PIN. */
export default function PinGate(props: Props) {
  const review = useReview();
  const [pin, setPin] = createSignal('');
  const [busy, setBusy] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  async function onSubmit(event: SubmitEvent) {
    event.preventDefault();
    if (busy() || !pin().trim()) return;
    setBusy(true);
    setError(null);
    const outcome = await review.login(pin());
    setBusy(false);
    if (!outcome.ok) setError(outcome.message);
  }

  return (
    <Show when={!review.session()} fallback={props.children}>
      <main class={styles.gate}>
        <form class={styles.card} onSubmit={onSubmit}>
          <span class={styles.kicker}>Acceso con PIN</span>
          <h1 class={styles.title}>{props.title}</h1>
          <p class={styles.hint}>
            {props.hint ??
              'Ingresa el PIN que recibiste para revisar el documento.'}
          </p>
          <input
            class={styles.input}
            type="text"
            inputmode="text"
            autocomplete="off"
            autocapitalize="characters"
            spellcheck={false}
            maxLength={12}
            placeholder="XXXX-XXXX"
            aria-label="PIN de acceso"
            value={pin()}
            onInput={(event) => setPin(event.currentTarget.value)}
          />
          <Show when={error() ?? review.notice()}>
            {(message) => (
              <p class={styles.error} role="alert">
                {message()}
              </p>
            )}
          </Show>
          <button
            type="submit"
            class={styles.submit}
            disabled={busy() || !pin().trim()}
          >
            {busy() ? 'Verificando…' : 'Entrar'}
            <ArrowRightIcon class={styles.icon} />
          </button>
        </form>
      </main>
    </Show>
  );
}
