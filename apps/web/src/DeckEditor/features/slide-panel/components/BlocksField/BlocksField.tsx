import {
  BLOCK_DESCRIPTORS,
  BLOCK_KINDS,
  type BlockKind,
  type ContentSlide,
  defaultBlock,
  type Field,
  SINGLE_BLOCK_KINDS,
} from '@colaboradocs/deck-core';
import { createEffect, createSignal, For, on, Show } from 'solid-js';
import { deckStore } from '@/DeckEditor/features/deck/deck.store';
import {
  issuesOfBlock,
  type Path,
} from '@/DeckEditor/features/deck/deck.utils';
import { viewStore } from '@/DeckEditor/features/preview/view.store';
import ActionMenu from '@/DeckEditor/features/ui/ActionMenu/ActionMenu';
import type { MenuGroup } from '@/DeckEditor/features/ui/ActionMenu/ActionMenu.types';
import BottomSheet from '@/DeckEditor/features/ui/BottomSheet/BottomSheet';
import EditIcon from '@/DeckEditor/features/ui/icons/EditIcon';
import PlusIcon from '@/DeckEditor/features/ui/icons/PlusIcon';
import TrashIcon from '@/DeckEditor/features/ui/icons/TrashIcon';
import WarningDot from '@/DeckEditor/features/ui/WarningDot/WarningDot';
import FieldForm from '../FieldForm/FieldForm';
import FieldSection from '../FieldSection/FieldSection';
import styles from './BlocksField.module.css';
import {
  blockSummary,
  pinnedAt,
  pinnedInFirstFreeCell,
} from './BlocksField.utils';

interface BlocksFieldProps {
  field: Extract<Field, { type: 'blocks' }>;
  value: Record<string, unknown>[] | undefined;
  path: Path;
}

/**
 * Los bloques de la slide, uno por línea (editar, eliminar). El lugar de cada uno lo dice su
 * posición en la cuadrícula, no el orden de la lista. Editar abre sus campos en una hoja inferior;
 * pulsar una celda en la vista previa (con «Ver celdas») abre la de ese bloque.
 */
export default function BlocksField(props: BlocksFieldProps) {
  const blocks = () => props.value ?? [];
  const slideIndex = () => props.path[1] as number;
  const [editing, setEditing] = createSignal<number | null>(null);
  const descriptor = (block: Record<string, unknown>) =>
    BLOCK_DESCRIPTORS[block.kind as BlockKind];
  const problems = (index: number) =>
    issuesOfBlock(deckStore.issues(), slideIndex(), index);
  // algunos bloques solo pueden estar una vez por slide
  const taken = (kind: BlockKind) =>
    SINGLE_BLOCK_KINDS.includes(kind) && blocks().some((b) => b.kind === kind);
  const nameOf = (block: Record<string, unknown>) =>
    descriptor(block)?.label ?? String(block.kind);

  // otra slide u otro bloque quitado desde fuera: la hoja no apunta a nada
  createEffect(
    on(
      () => props.path.join('.'),
      () => setEditing(null),
    ),
  );
  createEffect(() => {
    const at = editing();
    if (at !== null && at >= blocks().length) setEditing(null);
  });
  // un «+» pulsado en la vista previa ofrece los tipos de bloque para esa celda
  const [adding, setAdding] = createSignal<{ col: number; row: number } | null>(
    null,
  );
  createEffect(
    on(
      () => viewStore.addRequest(),
      (request) => {
        if (request && request.slide === slideIndex())
          setAdding({ col: request.col, row: request.row });
      },
      { defer: true },
    ),
  );
  createEffect(
    on(
      () => props.path.join('.'),
      () => setAdding(null),
    ),
  );
  const addHere = (kind: BlockKind) => {
    const cell = adding();
    setAdding(null);
    if (cell) add(kind, cell);
  };

  // una celda pulsada en la vista previa abre la edición de su bloque
  createEffect(
    on(
      () => viewStore.openRequest(),
      (request) => {
        if (
          request &&
          request.slide === slideIndex() &&
          blocks()[request.block]
        )
          setEditing(request.block);
      },
      { defer: true },
    ),
  );

  const add = (kind: BlockKind, cell?: { col: number; row: number }) => {
    const index = blocks().length;
    const slide = deckStore.deck.slides[slideIndex()] as
      | ContentSlide
      | undefined;
    const fresh = defaultBlock(kind);
    const block = cell
      ? pinnedAt(slide, fresh, cell)
      : pinnedInFirstFreeCell(slide, fresh);
    if (props.value) deckStore.insert(props.path, index, block);
    else deckStore.set(props.path, [block]);
    setEditing(index);
  };
  const remove = (index: number) => {
    deckStore.remove([...props.path, index]);
    const at = editing();
    if (at === index) setEditing(null);
    else if (at !== null && at > index) setEditing(at - 1);
  };

  const addMenu = (): MenuGroup[] => [
    {
      items: BLOCK_KINDS.map((kind) => ({
        label: BLOCK_DESCRIPTORS[kind].label,
        help: taken(kind) ? 'Ya está en la slide' : undefined,
        disabled: taken(kind),
        onSelect: () => add(kind),
      })),
    },
  ];

  // el contenido de la hoja no se vacía al cerrar: así se ve completo mientras sale
  const [shownAt, setShownAt] = createSignal(0);
  createEffect(() => {
    const at = editing();
    if (at !== null) setShownAt(at);
  });
  const current = () => blocks()[shownAt()];

  return (
    <FieldSection title={`${props.field.label} (${blocks().length})`}>
      <ul class={styles.blocks}>
        <For each={blocks()}>
          {(block, i) => (
            <li
              class={styles.row}
              classList={{
                [styles.active]:
                  editing() === i() || viewStore.hoverBlock() === i(),
              }}
              onMouseEnter={() => viewStore.setHoverBlock(i())}
              onMouseLeave={() => viewStore.setHoverBlock(null)}
            >
              <button
                type="button"
                class={styles.label}
                onClick={() => setEditing(i())}
              >
                <span class={styles.name}>
                  {nameOf(block)}
                  <Show when={problems(i()).length > 0}>
                    <WarningDot
                      messages={problems(i()).map((issue) => issue.message)}
                    />
                  </Show>
                </span>
                <span class={styles.summary}>{blockSummary(block)}</span>
              </button>
              <button
                type="button"
                class="btn"
                onClick={() => setEditing(i())}
                title="Editar"
                aria-label="Editar"
              >
                <EditIcon />
              </button>
              <button
                type="button"
                class="btn danger"
                onClick={() => remove(i())}
                title="Eliminar"
                aria-label="Eliminar"
              >
                <TrashIcon />
              </button>
            </li>
          )}
        </For>
      </ul>
      <ActionMenu
        class={styles.addButton}
        label="Agregar bloque"
        trigger={
          <>
            <PlusIcon /> Agregar bloque
          </>
        }
        groups={addMenu()}
      />
      <BottomSheet
        open={adding() !== null}
        title={`Agregar bloque en C${adding()?.col ?? ''}·F${adding()?.row ?? ''}`}
        onClose={() => setAdding(null)}
      >
        <ul class={styles.kinds}>
          <For each={BLOCK_KINDS}>
            {(kind) => (
              <li>
                <button
                  type="button"
                  class={styles.kind}
                  disabled={taken(kind)}
                  onClick={() => addHere(kind)}
                >
                  {BLOCK_DESCRIPTORS[kind].label}
                  <Show when={taken(kind)}>
                    <small>Ya está en la slide</small>
                  </Show>
                </button>
              </li>
            )}
          </For>
        </ul>
      </BottomSheet>
      <BottomSheet
        open={editing() !== null}
        title={current() ? nameOf(current() as Record<string, unknown>) : ''}
        onClose={() => setEditing(null)}
        actions={
          <button
            type="button"
            class="btn danger"
            onClick={() => {
              const at = editing();
              if (at !== null) remove(at);
            }}
            title="Eliminar este bloque"
          >
            <TrashIcon /> Eliminar
          </button>
        }
      >
        {(() => {
          const at = shownAt();
          const block = current();
          if (!block) return null;
          return (
            <FieldForm
              fields={descriptor(block)?.fields ?? []}
              value={block}
              path={[...props.path, at]}
              untitled={`Opciones de ${nameOf(block)}`}
            />
          );
        })()}
      </BottomSheet>
    </FieldSection>
  );
}
