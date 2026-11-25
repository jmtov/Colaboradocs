import { BottomSheet, Button } from '@colaboradocs/review-ui';
import { For } from 'solid-js';
import fieldStyles from '@/FieldGroup/FieldInput.module.css';
import CheckIcon from '@/icons/CheckIcon';
import CloseIcon from '@/icons/CloseIcon';
import { useDocumentPickerSheet } from './DocumentPickerSheet.hooks';
import styles from './DocumentPickerSheet.module.css';
import type { DocumentPickerSheetProps } from './DocumentPickerSheet.types';

/** Elegir uno o varios documentos con casillas, con un buscador: sirve para muchos documentos. */
export default function DocumentPickerSheet(props: DocumentPickerSheetProps) {
  const sheet = useDocumentPickerSheet(props);

  return (
    <BottomSheet
      open={props.open}
      kicker="Tareas"
      title="Documentos"
      compact
      onClose={props.onClose}
    >
      <div class={styles.content}>
        <p class={styles.hint}>
          Marca los documentos de los que quieres ver tareas. {sheet.count()}{' '}
          {sheet.count() === 1 ? 'elegido' : 'elegidos'}.
        </p>
        <input
          class={`${fieldStyles.input} ${styles.search}`}
          type="search"
          value={sheet.query()}
          placeholder="Buscar documentos"
          aria-label="Buscar documentos"
          onInput={(event) => sheet.setQuery(event.currentTarget.value)}
        />
        <ul class={styles.list}>
          <For
            each={sheet.shown()}
            fallback={<li class={styles.empty}>Ningún documento coincide.</li>}
          >
            {(item) => (
              <li>
                <label class={styles.option}>
                  <input
                    type="checkbox"
                    class={styles.checkbox}
                    checked={sheet.isChosen(item.id)}
                    onChange={() => sheet.toggle(item.id)}
                  />
                  <span class={styles.title}>{item.title}</span>
                  <span class={styles.count}>{item.count}</span>
                </label>
              </li>
            )}
          </For>
        </ul>
        <div class={styles.row}>
          <Button icon={CloseIcon} onClick={sheet.clear}>
            Quitar todos
          </Button>
          <Button icon={CheckIcon} variant="primary" onClick={sheet.apply}>
            Aplicar
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
