import { Button } from '@colaboradocs/review-ui';
import { type JSX, Show } from 'solid-js';
import CloseIcon from '@/icons/CloseIcon';
import SearchIcon from '@/icons/SearchIcon';
import SlidersIcon from '@/icons/SlidersIcon';
import styles from './ListFilter.module.css';

type Props = {
  /** Lo que se muestra a la izquierda («2 de 9» con un filtro puesto); sin filtro, nada: el tab ya dice cuántos hay. */
  summary: string | null;
  placeholder: string;
  query: string;
  onQuery: (query: string) => void;
  /** Hay más de un tipo: tiene sentido el botón de filtros. Sin él, la lista solo se busca por texto. */
  canFilter?: boolean;
  onOpenFilters?: () => void;
  /** Lo que está filtrado ahora («Actas», «2 documentos»), si hay algo: sale como un botón que lo quita. */
  activeLabel?: string | null;
  onClear?: () => void;
  /** Más botones al final de la barra (una acción de la lista). */
  children?: JSX.Element;
};

/** La barra de una lista de la home: un buscador de texto y, si la lista lo pide, el botón de filtros (que abre la hoja); debajo, cuántos hay con un filtro puesto. */
export default function ListFilter(props: Props) {
  return (
    <div class={styles.root}>
      <div class={styles.toolbar}>
        <div class={styles.filter}>
          <label class={styles.search}>
            <input
              class={styles.input}
              type="search"
              placeholder={props.placeholder}
              aria-label={props.placeholder}
              autocomplete="off"
              value={props.query}
              onInput={(event) => props.onQuery(event.currentTarget.value)}
            />
            <SearchIcon class={styles.searchIcon} />
            <Show when={props.query}>
              <button
                type="button"
                data-flat
                class={styles.clear}
                aria-label="Borrar búsqueda"
                onClick={() => props.onQuery('')}
              >
                <CloseIcon class={styles.clearIcon} />
              </button>
            </Show>
          </label>
          <Show when={props.canFilter}>
            <Button icon={SlidersIcon} onClick={() => props.onOpenFilters?.()}>
              Filtros
            </Button>
          </Show>
          <Show when={props.activeLabel}>
            {(title) => (
              <Button
                icon={CloseIcon}
                variant="primary"
                aria-label={`Quitar el filtro ${title()}`}
                onClick={() => props.onClear?.()}
              >
                {title()}
              </Button>
            )}
          </Show>
          {props.children}
        </div>
      </div>
      {/* Debajo de la barra: al buscar, el campo no se mueve. Sin texto no ocupa lugar. */}
      <p class={styles.summary} aria-live="polite">
        {props.summary}
      </p>
    </div>
  );
}
