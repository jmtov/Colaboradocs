import { type JSX, Show } from 'solid-js';
import Button from '../Button/Button';
import ArrowRightIcon from '../icons/ArrowRightIcon';
import { usePinGate } from './PinGate.hooks';
import styles from './PinGate.module.css';

type Props = {
  /** Nombre del documento, para el título de la puerta. */
  title: string;
  hint?: string;
  children: JSX.Element;
};

/** Muestra `children` solo con sesión; si no, pide el PIN. */
export default function PinGate(props: Props) {
  const gate = usePinGate();

  return (
    <Show when={gate.needsPin()} fallback={props.children}>
      <main class={styles.gate}>
        <form class={styles.card} onSubmit={gate.onSubmit}>
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
            value={gate.pin()}
            onInput={gate.onPinInput}
          />
          <Show when={gate.message()}>
            {(message) => (
              <p class={styles.error} role="alert">
                {message()}
              </p>
            )}
          </Show>
          <Button
            icon={ArrowRightIcon}
            variant="primary"
            submit
            disabled={gate.submitDisabled()}
          >
            {gate.busy() ? 'Verificando…' : 'Entrar'}
          </Button>
        </form>
      </main>
    </Show>
  );
}
