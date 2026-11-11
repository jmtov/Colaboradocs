import { BottomSheet } from '@colaboradocs/review-ui';
import { createSignal, For, Show } from 'solid-js';
import styles from './PublishSheet.module.css';
import type { PublishSheetProps } from './PublishSheet.types';

const plural = (count: number, one: string, many: string) =>
  `${count} ${count === 1 ? one : many}`;

/** Última pregunta antes de publicar: la versión y qué comentarios y OK se pierden. */
export default function PublishSheet(props: PublishSheetProps) {
  const [version, setVersion] = createSignal(props.version);

  const totals = () => ({
    comments: props.affected.reduce((sum, item) => sum + item.comments, 0),
    approvals: props.affected.reduce((sum, item) => sum + item.approvals, 0),
  });

  return (
    <BottomSheet
      open={props.open}
      kicker="Borrador"
      title="Publicar cambios"
      compact
      onClose={props.onClose}
    >
      <div class={styles.content}>
        <p class={styles.text}>
          Publicar reemplaza la versión actual, que queda guardada en el
          historial. Los revisores verán el documento nuevo de inmediato.
        </p>

        <label class={styles.label}>
          Versión
          <input
            class={styles.field}
            value={version()}
            maxLength={40}
            onInput={(event) => setVersion(event.currentTarget.value)}
          />
        </label>

        <Show when={props.affected.length > 0}>
          <div class={styles.warn}>
            <strong>
              {plural(totals().comments, 'comentario', 'comentarios')} y{' '}
              {plural(totals().approvals, 'OK', 'OK')} dejarán de aplicar
            </strong>
            <p>
              Son de párrafos que cambiaron. El texto de cada comentario no se
              borra, pero ya no aparecerá junto a su párrafo.
            </p>
            <ul>
              <For each={props.affected}>
                {(item) => (
                  <li>
                    «{item.excerpt}»{' '}
                    <span class={styles.meta}>
                      {plural(item.comments, 'comentario', 'comentarios')} ·{' '}
                      {plural(item.approvals, 'OK', 'OK')}
                    </span>
                  </li>
                )}
              </For>
            </ul>
          </div>
        </Show>

        <div class={styles.row}>
          <button
            type="button"
            class={styles.button}
            onClick={() => props.close()}
          >
            Cancelar
          </button>
          <button
            type="button"
            class={`${styles.button} ${styles.primary}`}
            disabled={!version().trim()}
            onClick={() => props.close(version().trim())}
          >
            Publicar
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
