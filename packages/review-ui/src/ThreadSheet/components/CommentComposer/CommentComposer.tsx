import { MAX_COMMENT_LENGTH } from '@juntanza/review-core';
import { createSignal, Show } from 'solid-js';
import CloseIcon from '../../../icons/CloseIcon';
import SendIcon from '../../../icons/SendIcon';
import styles from './CommentComposer.module.css';

/** Desde cuántos caracteres se muestra el contador. */
const COUNTER_FROM = MAX_COMMENT_LENGTH - 300;

type Props = {
  placeholder: string;
  submitLabel: string;
  /** Devuelve true si se guardó: ahí se vacía el campo. */
  onSubmit: (text: string) => Promise<boolean>;
  onCancel?: () => void;
};

export default function CommentComposer(props: Props) {
  const [text, setText] = createSignal('');
  const [busy, setBusy] = createSignal(false);

  async function send() {
    const value = text().trim();
    if (!value || busy()) return;
    setBusy(true);
    const saved = await props.onSubmit(value);
    setBusy(false);
    if (saved) setText('');
  }

  return (
    <div class={styles.composer}>
      <textarea
        class={styles.field}
        placeholder={props.placeholder}
        aria-label={props.placeholder}
        maxLength={MAX_COMMENT_LENGTH}
        value={text()}
        onInput={(event) => setText(event.currentTarget.value)}
      />
      <div class={styles.row}>
        <Show when={text().length >= COUNTER_FROM}>
          <span class={styles.count}>
            {text().length}/{MAX_COMMENT_LENGTH}
          </span>
        </Show>
        <Show when={props.onCancel}>
          <button type="button" class={styles.button} onClick={props.onCancel}>
            <CloseIcon class={styles.icon} />
            Cancelar
          </button>
        </Show>
        <button
          type="button"
          class={`${styles.button} ${styles.primary}`}
          disabled={busy() || !text().trim()}
          onClick={send}
        >
          <SendIcon class={styles.icon} />
          {busy() ? 'Enviando…' : props.submitLabel}
        </button>
      </div>
    </div>
  );
}
