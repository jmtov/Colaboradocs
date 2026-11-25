import {
  BLOCK_SPAN,
  type BlockKind,
  type ContentSlide,
  layoutContent,
} from '@colaboradocs/deck-core';
import { Button } from '@colaboradocs/review-ui';
import { createSignal, For, onCleanup, Show } from 'solid-js';
import { deckStore } from '@/DeckEditor/features/deck/deck.store';
import type { Path } from '@/DeckEditor/features/deck/deck.utils';
import RefreshIcon from '@/icons/RefreshIcon';
import FieldSection from '../FieldSection/FieldSection';
import styles from './PositionField.module.css';
import {
  type Cell,
  cellOwners,
  describePlacement,
  selectionToPlacement,
} from './PositionField.utils';

interface PositionFieldProps {
  /** Ruta del bloque: `['slides', i, 'body', j]`. */
  path: Path;
  value: Record<string, unknown>;
}

/**
 * Dónde cae el bloque en la cuadrícula de su slide: se arrastra sobre las celdas. Muestra el
 * encabezado y los demás bloques para ver qué está ocupado. «Automática» lo deja a la primera celda libre.
 */
/** Lo que se escribe en una celda: el número de otro bloque o nada. */
function cellLabel(owner: number | null, own: number): string {
  return owner !== null && owner !== own ? String(owner + 1) : '';
}

export default function PositionField(props: PositionFieldProps) {
  const slide = () =>
    deckStore.deck.slides[props.path[1] as number] as ContentSlide | undefined;
  const index = () => props.path[3] as number;
  const kind = () => props.value.kind as BlockKind;
  const layout = () => {
    const s = slide();
    return s ? layoutContent(s) : undefined;
  };
  const pinned = () =>
    props.value.col !== undefined && props.value.row !== undefined;
  const mine = () => layout()?.blocks[index()];
  const fixedWidth = () => BLOCK_SPAN[kind()] === 'fill';

  const [anchor, setAnchor] = createSignal<Cell>();
  const [hover, setHover] = createSignal<Cell>();
  const drag = () => {
    const from = anchor();
    const to = hover();
    const s = slide();
    return from && to && s
      ? selectionToPlacement(from, to, kind(), layout()?.columns ?? 1)
      : undefined;
  };

  const commit = () => {
    const placement = drag();
    setAnchor(undefined);
    if (!placement) return;
    deckStore.patch(props.path, {
      col: placement.col,
      row: placement.row,
      span: placement.span,
      rowSpan: placement.rowSpan,
    });
  };
  const start = (cell: Cell) => {
    setAnchor(cell);
    setHover(cell);
    window.addEventListener('pointerup', commit, { once: true });
  };
  onCleanup(() => window.removeEventListener('pointerup', commit));

  const covered = (
    cell: Cell,
    at: { col: number; row: number; span: number; rowSpan: number } | undefined,
  ) =>
    !!at &&
    cell.col >= at.col &&
    cell.col < at.col + at.span &&
    cell.row >= at.row &&
    cell.row < at.row + at.rowSpan;

  return (
    <Show when={layout()}>
      {(current) => (
        <FieldSection
          title="Posición"
          actions={
            <Button
              icon={RefreshIcon}
              size="sm"
              disabled={
                !pinned() &&
                props.value.span === undefined &&
                props.value.rowSpan === undefined
              }
              onClick={() =>
                deckStore.patch(props.path, {
                  col: undefined,
                  row: undefined,
                  span: undefined,
                  rowSpan: undefined,
                })
              }
            >
              Automática
            </Button>
          }
        >
          <div
            class={styles.grid}
            style={{
              'grid-template-columns': `repeat(${current().columns}, 1fr)`,
            }}
          >
            <For each={cellOwners(current())}>
              {(line, r) => (
                <For each={line}>
                  {(owner, c) => {
                    const cell = (): Cell => ({ col: c() + 1, row: r() + 1 });
                    const isMine = () =>
                      owner === index() ||
                      (!!drag() && covered(cell(), drag()));
                    return (
                      <button
                        type="button"
                        class={styles.cell}
                        classList={{
                          [styles.mine]: isMine(),
                          [styles.other]:
                            owner !== null &&
                            owner !== index() &&
                            !covered(cell(), drag()),
                        }}
                        onPointerDown={(e) => {
                          e.preventDefault();
                          start(cell());
                        }}
                        onPointerEnter={() => anchor() && setHover(cell())}
                        aria-label={`Columna ${c() + 1}, fila ${r() + 1}`}
                      >
                        {cellLabel(owner, index())}
                      </button>
                    );
                  }}
                </For>
              )}
            </For>
          </div>
          <p class={styles.help}>
            <Show when={mine()} fallback="Sin ubicar">
              {(at) => (
                <>
                  {describePlacement(at())}
                  {pinned() ? '' : ' (automática)'}
                </>
              )}
            </Show>
            {fixedWidth() ? ' · ocupa todas las columnas' : ''}
          </p>
        </FieldSection>
      )}
    </Show>
  );
}
