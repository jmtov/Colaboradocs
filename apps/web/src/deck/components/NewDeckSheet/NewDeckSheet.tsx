import { BottomSheet, Button } from '@colaboradocs/review-ui';
import { For, Show } from 'solid-js';
import CloseIcon from '@/shared/icons/CloseIcon';
import PlusIcon from '@/shared/icons/PlusIcon';
import {
  FieldGroup,
  FieldRow,
  FieldTitle,
} from '@/shared/ui/FieldGroup/FieldGroup';
import fieldStyles from '@/shared/ui/FieldGroup/FieldInput.module.css';
import FilePicker from '@/shared/ui/FilePicker/FilePicker';
import { useNewDeckSheet } from './NewDeckSheet.hooks';
import styles from './NewDeckSheet.module.css';
import type { NewDeckSheetProps } from './NewDeckSheet.types';

/**
 * Una presentación nueva: crearla desde cero (título, id y tema) o subir un JSON y partir de él.
 * En los dos casos se abre el editor para seguir; nada se ve hasta que se publique.
 */
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
        <FieldGroup
          title={
            sheet.imported() ? 'Datos de la presentación' : 'Crear presentación'
          }
          hint={
            sheet.imported()
              ? undefined
              : 'Se abre el editor. Nadie ve los cambios hasta que publiques.'
          }
        >
          <FieldRow label="Título">
            <input
              class={fieldStyles.input}
              value={sheet.title()}
              maxLength={200}
              onInput={(event) => sheet.setTitle(event.currentTarget.value)}
            />
          </FieldRow>
          <FieldRow label="Id (va en la URL: /p/…)">
            <input
              class={fieldStyles.input}
              value={sheet.id()}
              maxLength={64}
              aria-invalid={sheet.idProblem() ? 'true' : undefined}
              onInput={(event) => sheet.setId(event.currentTarget.value)}
            />
          </FieldRow>
          <Show when={(sheet.themes()?.length ?? 0) > 0}>
            <FieldRow label="Tema">
              <select
                class={fieldStyles.input}
                value={sheet.themeId()}
                onChange={(event) =>
                  sheet.setThemeId(event.currentTarget.value)
                }
              >
                <For each={sheet.themes()}>
                  {(theme) => <option value={theme.id}>{theme.name}</option>}
                </For>
              </select>
            </FieldRow>
          </Show>
        </FieldGroup>
        <Show when={sheet.idProblem()}>
          <p class={styles.problem} role="alert">
            {sheet.idProblem()}
          </p>
        </Show>
        <Show when={(sheet.themes()?.length ?? 0) === 0}>
          <p class={styles.problem} role="alert">
            No hay temas. Importa uno antes: npm run decks -- themes
            import-builtin
          </p>
        </Show>
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
        <div class={styles.row}>
          <Show when={sheet.imported()}>
            <Button icon={CloseIcon} onClick={sheet.clearImport}>
              Quitar archivo
            </Button>
          </Show>
          <Button
            icon={PlusIcon}
            variant="primary"
            submit
            disabled={sheet.createDisabled()}
          >
            {sheet.busy() ? 'Creando…' : 'Crear'}
          </Button>
        </div>
        <Show when={!sheet.imported()}>
          <FieldTitle>Subir presentación</FieldTitle>
          <FilePicker
            accept="application/json,.json"
            file={null}
            reading={false}
            hint="JSON de una presentación"
            onFile={(file) => void sheet.onFile(file)}
          />
        </Show>
      </form>
    </BottomSheet>
  );
}
