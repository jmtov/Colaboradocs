import {
  type ContentSlide,
  layoutContent,
  tidyGrid,
} from '@colaboradocs/deck-core';
import { createSignal, For } from 'solid-js';
import { deckStore } from '@/DeckEditor/features/deck/deck.store';
import type { Path } from '@/DeckEditor/features/deck/deck.utils';
import FieldSection from '../FieldSection/FieldSection';
import styles from './GridSizeField.module.css';
import { describeGrid, GRID_SIDE, isShaded } from './GridSizeField.utils';

interface GridSizeFieldProps {
  /** Ruta de la slide: `['slides', i]`. */
  path: Path;
}

const SIDE = Array.from({ length: GRID_SIDE }, (_, i) => i + 1);

/**
 * El tamaño de la cuadrícula de la slide en un selector de 4 × 4: se pulsa la celda de la esquina
 * de abajo a la derecha. Las filas pueden quedar automáticas (las que hagan falta).
 */
export default function GridSizeField(props: GridSizeFieldProps) {
  const slide = () =>
    deckStore.deck.slides[props.path[1] as number] as ContentSlide | undefined;
  const columns = () => slide()?.columns ?? 1;
  // las filas que se dibujan: las pedidas o, si no se han fijado, las que usan los bloques
  const rows = () => {
    const s = slide();
    return s ? layoutContent(s).rows : 1;
  };
  const [hover, setHover] = createSignal<{ col: number; row: number }>();
  const shown = () => hover() ?? { col: columns(), row: rows() };

  const choose = (col: number, row: number) =>
    deckStore.patch(props.path, { columns: col, rows: row });
  const tidy = () => {
    const s = slide();
    return s ? tidyGrid(s) : null;
  };
  const compact = () => {
    const result = tidy();
    if (!result) return;
    deckStore.patch(props.path, {
      columns: result.columns,
      rows: result.rows,
      body: result.body,
    });
  };

  return (
    <FieldSection
      title="Cuadrícula"
      actions={
        <button
          type="button"
          class="btn"
          disabled={tidy() === null}
          onClick={compact}
          title="Quita las columnas y filas que no tienen ningún bloque"
        >
          Compactar
        </button>
      }
    >
      <fieldset
        class={styles.grid}
        aria-label="Tamaño de la cuadrícula"
        onMouseLeave={() => setHover(undefined)}
      >
        <For each={SIDE}>
          {(row) => (
            <For each={SIDE}>
              {(col) => (
                <button
                  type="button"
                  class={styles.cell}
                  classList={{
                    [styles.on]: isShaded(col, row, shown().col, shown().row),
                  }}
                  onMouseEnter={() => setHover({ col, row })}
                  onClick={() => choose(col, row)}
                  aria-label={`${col} columnas, ${row} filas`}
                />
              )}
            </For>
          )}
        </For>
      </fieldset>
      <p class={styles.help}>{describeGrid(shown().col, shown().row)}</p>
    </FieldSection>
  );
}
