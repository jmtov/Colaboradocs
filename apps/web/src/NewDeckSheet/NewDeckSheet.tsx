import { BottomSheet, Button } from '@colaboradocs/review-ui';
import { For, Show } from 'solid-js';
import CloseIcon from '@/icons/CloseIcon';
import PlusIcon from '@/icons/PlusIcon';
import { useNewDeckSheet } from './NewDeckSheet.hooks';
import styles from './NewDeckSheet.module.css';
import type { NewDeckSheetProps } from './NewDeckSheet.types';

/** Crear una presentación desde cero o a partir de un JSON: se abre el editor para seguir. */
export default function NewDeckSheet(props: NewDeckSheetProps) {
  const sheet = useNewDeckSheet({ close: () => props.close() });

  return (
    <BottomSheet
      open={props.open}
      kicker="Presentaciones"
      title="Nueva presentación"
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
          Id (va en la URL: /p/…)
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
        <Show
          when={(sheet.themes()?.length ?? 0) > 0}
          fallback={
            <p class={styles.problem} role="alert">
              No hay temas. Importa uno antes: npm run decks -- themes
              import-builtin
            </p>
          }
        >
          <label class={styles.label}>
            Tema
            <select
              class={styles.field}
              value={sheet.themeId()}
              onChange={(event) => sheet.setThemeId(event.currentTarget.value)}
            >
              <For each={sheet.themes()}>
                {(theme) => <option value={theme.id}>{theme.name}</option>}
              </For>
            </select>
          </label>
        </Show>
        <label class={styles.label}>
          O parte de un JSON (opcional)
          <input
            class={styles.field}
            type="file"
            accept="application/json,.json"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              if (file) void sheet.onFile(file);
            }}
          />
        </label>
        <Show when={sheet.imported()}>
          {(file) => (
            <p class={styles.hint}>
              {file().name}: {file().slides.length} slides. Queda como borrador:
              se valida al publicar.
            </p>
          )}
        </Show>
        <Show when={sheet.error()}>
          <p class={styles.problem} role="alert">
            {sheet.error()}
          </p>
        </Show>
        <p class={styles.hint}>
          Se abre el editor. Nadie ve los cambios hasta que publiques.
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
