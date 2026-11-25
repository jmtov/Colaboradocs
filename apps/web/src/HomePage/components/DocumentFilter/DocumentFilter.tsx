import { Show } from 'solid-js';
import CloseIcon from '@/icons/CloseIcon';
import SearchIcon from '@/icons/SearchIcon';
import SlidersIcon from '@/icons/SlidersIcon';
import styles from './DocumentFilter.module.css';

type Props = {
  query: string;
  onQuery: (query: string) => void;
  /** Hay más de un tipo de documento: tiene sentido filtrar por tipo. */
  canFilter: boolean;
  onOpenFilters: () => void;
  /** El nombre del tipo filtrado ahora, si lo hay. */
  activeKind: string | null;
  onClearKind: () => void;
};

/** Buscador de texto y botón de filtros (que abre la hoja) para la lista de documentos. */
export default function DocumentFilter(props: Props) {
  return (
    <div class={styles.filter}>
      <label class={styles.search}>
        <SearchIcon class={styles.searchIcon} />
        <input
          class={styles.input}
          type="search"
          placeholder="Buscar documentos"
          aria-label="Buscar documentos"
          autocomplete="off"
          value={props.query}
          onInput={(event) => props.onQuery(event.currentTarget.value)}
        />
        <Show when={props.query}>
          <button
            type="button"
            class={styles.clear}
            aria-label="Borrar búsqueda"
            onClick={() => props.onQuery('')}
          >
            <CloseIcon class={styles.clearIcon} />
          </button>
        </Show>
      </label>
      <Show when={props.canFilter}>
        <button
          type="button"
          class={styles.filters}
          onClick={props.onOpenFilters}
        >
          <SlidersIcon class={styles.filtersIcon} />
          Filtros
        </button>
      </Show>
      <Show when={props.activeKind}>
        {(title) => (
          <button
            type="button"
            class={styles.active}
            aria-label={`Quitar el filtro ${title()}`}
            onClick={props.onClearKind}
          >
            {title()}
            <CloseIcon class={styles.clearIcon} />
          </button>
        )}
      </Show>
    </div>
  );
}
