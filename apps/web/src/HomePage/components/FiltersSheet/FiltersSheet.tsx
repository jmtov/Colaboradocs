import { BottomSheet, Button } from '@colaboradocs/review-ui';
import { For } from 'solid-js';
import CheckIcon from '@/icons/CheckIcon';
import CloseIcon from '@/icons/CloseIcon';
import { useFiltersSheet } from './FiltersSheet.hooks';
import styles from './FiltersSheet.module.css';
import type { FiltersSheetProps } from './FiltersSheet.types';

/** Filtros de la lista de documentos. Resuelve con lo elegido, o sin resultado si se cierra sin aplicar. */
export default function FiltersSheet(props: FiltersSheetProps) {
  const sheet = useFiltersSheet(props);
  const total = () => props.kinds.reduce((sum, entry) => sum + entry.count, 0);

  return (
    <BottomSheet
      open={props.open}
      kicker="Documentos"
      title="Filtros"
      compact
      onClose={props.onClose}
    >
      <div class={styles.content}>
        {/* biome-ignore lint/a11y/useSemanticElements: fieldset arrastra estilos de formulario que no queremos */}
        <div class={styles.group} role="group" aria-label="Tipo de documento">
          <span class={styles.label}>Tipo</span>
          <div class={styles.options}>
            <button
              type="button"
              class={styles.option}
              classList={{ [styles.on]: sheet.kind() === null }}
              aria-pressed={sheet.kind() === null}
              onClick={() => sheet.setKind(null)}
            >
              Todos
              <span class={styles.count}>{total()}</span>
            </button>
            <For each={props.kinds}>
              {(entry) => (
                <button
                  type="button"
                  class={styles.option}
                  classList={{ [styles.on]: sheet.kind() === entry.kind }}
                  aria-pressed={sheet.kind() === entry.kind}
                  onClick={() => sheet.setKind(entry.kind)}
                >
                  {entry.title}
                  <span class={styles.count}>{entry.count}</span>
                </button>
              )}
            </For>
          </div>
        </div>
        <div class={styles.row}>
          <Button icon={CloseIcon} onClick={sheet.clear}>
            Quitar filtros
          </Button>
          <Button icon={CheckIcon} variant="primary" onClick={sheet.apply}>
            Aplicar
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
