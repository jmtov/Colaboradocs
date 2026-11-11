import { BottomSheet, Button } from '@colaboradocs/review-ui';
import { createSignal, For, Show } from 'solid-js';
import { FieldGroup, FieldRow } from '@/FieldGroup/FieldGroup';
import fieldStyles from '@/FieldGroup/FieldInput.module.css';
import CloseIcon from '@/icons/CloseIcon';
import UploadIcon from '@/icons/UploadIcon';
import { isLaterVersion } from '../../version.utils';
import styles from './PublishSheet.module.css';
import type { PublishSheetProps } from './PublishSheet.types';

const plural = (count: number, one: string, many: string) =>
  `${count} ${count === 1 ? one : many}`;

/** Última pregunta antes de publicar: la versión actual, la nueva y qué comentarios y OK se pierden. */
export default function PublishSheet(props: PublishSheetProps) {
  const [version, setVersion] = createSignal(props.version);
  const valid = () =>
    props.published === null
      ? version().trim() !== ''
      : isLaterVersion(version(), props.published);

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
        <FieldGroup title="Versión">
          <Show when={props.published}>
            {(published) => (
              <FieldRow label="Actual">
                <input class={fieldStyles.input} value={published()} disabled />
              </FieldRow>
            )}
          </Show>
          <FieldRow label="Nueva">
            <input
              class={fieldStyles.input}
              value={version()}
              maxLength={40}
              aria-invalid={!valid()}
              onInput={(event) => setVersion(event.currentTarget.value)}
            />
          </FieldRow>
        </FieldGroup>
        <Show when={!valid() && version().trim() !== ''}>
          <p class={styles.error} role="alert">
            Tiene que ser posterior a la actual ({props.published}).
          </p>
        </Show>

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
          <Button icon={CloseIcon} onClick={() => props.close()}>
            Cancelar
          </Button>
          <Button
            icon={UploadIcon}
            variant="primary"
            disabled={!valid()}
            onClick={() => props.close(version().trim())}
          >
            Publicar
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
