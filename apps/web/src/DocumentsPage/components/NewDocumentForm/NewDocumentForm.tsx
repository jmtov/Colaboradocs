import { type DocumentKind, KIND_GROUPS } from '@colaboradocs/review-core';
import { Button } from '@colaboradocs/review-ui';
import { For, Show } from 'solid-js';
import { FieldGroup, FieldRow } from '@/FieldGroup/FieldGroup';
import fieldStyles from '@/FieldGroup/FieldInput.module.css';
import PlusIcon from '@/icons/PlusIcon';
import { useNewDocumentForm } from './NewDocumentForm.hooks';
import styles from './NewDocumentForm.module.css';

/** «Crear desde cero»: título e id, y se abre el editor con un borrador de una sección. */
export default function NewDocumentForm(props: { onCreated: () => void }) {
  const form = useNewDocumentForm({ onCreated: props.onCreated });

  return (
    <form
      class={styles.form}
      onSubmit={(event) => {
        event.preventDefault();
        void form.create();
      }}
    >
      <FieldGroup
        title="Crear documento"
        hint="Se abre el editor con una sección para empezar. Nadie lo ve hasta que lo publiques."
      >
        <FieldRow label="Título">
          <input
            class={fieldStyles.input}
            value={form.title()}
            maxLength={200}
            onInput={(event) => form.setTitle(event.currentTarget.value)}
          />
        </FieldRow>
        <FieldRow label="Id (va en la URL: /d/…)">
          <input
            class={fieldStyles.input}
            value={form.id()}
            maxLength={64}
            aria-invalid={form.idProblem() ? 'true' : undefined}
            onInput={(event) => form.setId(event.currentTarget.value)}
          />
        </FieldRow>
        <FieldRow label="Tipo">
          <select
            class={fieldStyles.input}
            value={form.type()}
            onChange={(event) =>
              form.setType(event.currentTarget.value as DocumentKind)
            }
          >
            <For each={KIND_GROUPS}>
              {(group) => <option value={group.kind}>{group.title}</option>}
            </For>
          </select>
        </FieldRow>
      </FieldGroup>
      <Show when={form.idProblem()}>
        <p class={styles.problem} role="alert">
          {form.idProblem()}
        </p>
      </Show>
      <Show when={form.error()}>
        <p class={styles.problem} role="alert">
          {form.error()}
        </p>
      </Show>
      <div class={styles.row}>
        <Button
          icon={PlusIcon}
          variant="primary"
          submit
          disabled={form.createDisabled()}
        >
          {form.busy() ? 'Creando…' : 'Crear'}
        </Button>
      </div>
    </form>
  );
}
