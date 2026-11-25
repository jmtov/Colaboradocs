import { BottomSheet, Button } from '@colaboradocs/review-ui';
import CheckIcon from 'lucide-solid/icons/check';
import CloseIcon from 'lucide-solid/icons/x';
import { useTaskFiltersSheet } from './TaskFiltersSheet.hooks';
import styles from './TaskFiltersSheet.module.css';
import type { TaskFiltersSheetProps } from './TaskFiltersSheet.types';

/** Filtros de las tareas. Los documentos se eligen en una hoja aparte (con buscador), como las personas en el editor. Resuelve con lo elegido, o sin resultado si se cierra sin aplicar. */
export default function TaskFiltersSheet(props: TaskFiltersSheetProps) {
  const sheet = useTaskFiltersSheet(props);

  return (
    <BottomSheet
      open={props.open}
      kicker="Tareas"
      title="Filtros"
      compact
      onClose={props.onClose}
    >
      <div class={styles.content}>
        <div class={styles.field}>
          <span class={styles.label}>Documentos</span>
          <button
            type="button"
            data-flat
            class={styles.pick}
            aria-label={`Documentos: ${sheet.summary()}`}
            onClick={() => void sheet.pickDocuments()}
          >
            {sheet.summary()}
          </button>
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
