import { Show } from 'solid-js';
import { usePreview } from './Preview.hooks';
import styles from './Preview.module.css';

export default function Preview() {
  const preview = usePreview();
  return (
    <div class={styles.preview}>
      <iframe
        ref={preview.setFrame}
        onLoad={preview.onLoad}
        class={styles.frame}
        title="Vista previa del deck"
        sandbox="allow-scripts"
        allow="fullscreen"
      />
      <Show when={preview.error()}>
        {(message) => (
          <p class={styles.error}>No se puede dibujar: {message()}</p>
        )}
      </Show>
    </div>
  );
}
