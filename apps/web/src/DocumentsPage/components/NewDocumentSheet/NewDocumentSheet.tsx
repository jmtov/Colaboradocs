import { BottomSheet, Button } from '@colaboradocs/review-ui';
import { Show } from 'solid-js';
import CloseIcon from '@/icons/CloseIcon';
import PlusIcon from '@/icons/PlusIcon';
import { useNewDocumentSheet } from './NewDocumentSheet.hooks';
import styles from './NewDocumentSheet.module.css';
import type { NewDocumentSheetProps } from './NewDocumentSheet.types';

/** Crear un documento desde cero: título e id, y se abre el editor con un borrador de una sección. */
export default function NewDocumentSheet(props: NewDocumentSheetProps) {
  const sheet = useNewDocumentSheet({ close: () => props.close() });

  return (
    <BottomSheet
      open={props.open}
      kicker="Documentos"
      title="Nuevo documento"
      compact
      onClose={props.onClose}
    >
      <form
        class={styles.content}
        onSubmit={(event) => {
          event.preventDefault();
          void sheet.create();
        }}
      >
        <label class={styles.label}>
          Título
          <input
            class={styles.field}
            value={sheet.title()}
            maxLength={200}
            onInput={(event) => sheet.setTitle(event.currentTarget.value)}
          />
        </label>
        <label class={styles.label}>
          Id (va en la URL: /d/…)
          <input
            class={styles.field}
            value={sheet.id()}
            maxLength={64}
            aria-invalid={sheet.idProblem() ? 'true' : undefined}
            onInput={(event) => sheet.setId(event.currentTarget.value)}
          />
        </label>
        <Show when={sheet.idProblem()}>
          <p class={styles.problem} role="alert">
            {sheet.idProblem()}
          </p>
        </Show>
        <Show when={sheet.error()}>
          <p class={styles.problem} role="alert">
            {sheet.error()}
          </p>
        </Show>
        <p class={styles.hint}>
          Se abre el editor con una sección para empezar. Nadie lo ve hasta que
          lo publiques.
        </p>
        <div class={styles.row}>
          <Button icon={CloseIcon} onClick={sheet.close}>
            Cancelar
          </Button>
          <Button
            icon={PlusIcon}
            variant="primary"
            submit
            disabled={sheet.createDisabled()}
          >
            {sheet.busy() ? 'Creando…' : 'Crear'}
          </Button>
        </div>
      </form>
    </BottomSheet>
  );
}
