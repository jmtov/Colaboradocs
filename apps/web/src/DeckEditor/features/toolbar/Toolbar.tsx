import { For, Show } from 'solid-js';
import { deckStore } from '@/DeckEditor/features/deck/deck.store';
import { viewStore } from '@/DeckEditor/features/preview/view.store';
import type { EditorActions } from '../../DeckEditorPage.hooks';
import { useDeckFiles } from './Toolbar.hooks';
import styles from './Toolbar.module.css';

type Props = { actions: EditorActions };

const SAVE_LABELS = {
  idle: '',
  saving: 'Guardando…',
  saved: 'Borrador guardado',
  error: 'No se pudo guardar',
} as const;

export default function Toolbar(props: Props) {
  const files = useDeckFiles();
  const theme = () => deckStore.theme();
  const variants = () => Object.entries(theme()?.variants ?? {});
  return (
    <div class={styles.bar}>
      <button
        type="button"
        class="btn"
        onClick={props.actions.back}
        title="Volver al inicio"
      >
        ← Inicio
      </button>
      <strong class={styles.title}>{deckStore.deck.title}</strong>
      <label class={styles.field}>
        Tema
        <select
          class="input"
          value={deckStore.deck.theme}
          onChange={(e) => deckStore.setTheme(e.currentTarget.value)}
        >
          <For each={deckStore.themes()}>
            {(t) => <option value={t.id}>{t.name}</option>}
          </For>
        </select>
      </label>
      <label class={styles.field}>
        Variante
        <select
          class="input"
          value={deckStore.deck.variant ?? ''}
          onChange={(e) =>
            deckStore.setVariant(e.currentTarget.value || undefined)
          }
        >
          <option value="">Sin variante</option>
          <For each={variants()}>
            {([id, v]) => <option value={id}>{v.name}</option>}
          </For>
        </select>
      </label>
      <button
        type="button"
        class="btn"
        classList={{ [styles.on]: viewStore.showCells() }}
        aria-pressed={viewStore.showCells()}
        onClick={() => viewStore.toggleCells()}
        title="Dibuja columnas, filas y celdas en la vista previa"
      >
        Ver celdas
      </button>
      <span class={styles.spacer} />
      <Show when={deckStore.issues().length > 0}>
        <span
          class={styles.issues}
          title={deckStore
            .issues()
            .map((i) => `${i.path}: ${i.message}`)
            .join('\n')}
        >
          {deckStore.issues().length}{' '}
          {deckStore.issues().length === 1 ? 'problema' : 'problemas'}
        </span>
      </Show>
      <span class={styles.message} role="status">
        {props.actions.error() ?? SAVE_LABELS[props.actions.saveState()]}
      </span>
      <button
        type="button"
        class="btn"
        disabled={deckStore.history().past.length === 0}
        onClick={() => deckStore.undo()}
        title="Deshacer (Cmd+Z)"
      >
        Deshacer
      </button>
      <button
        type="button"
        class="btn"
        disabled={deckStore.history().future.length === 0}
        onClick={() => deckStore.redo()}
        title="Rehacer (Cmd+Mayús+Z)"
      >
        Rehacer
      </button>
      <button
        type="button"
        class="btn"
        onClick={() => files.importInput()?.click()}
      >
        Importar
      </button>
      <button type="button" class="btn" onClick={files.exportDeck}>
        Exportar
      </button>
      <button
        type="button"
        class="btn danger"
        onClick={props.actions.discard}
        title="Vuelve a lo último publicado"
      >
        Descartar cambios
      </button>
      <button
        type="button"
        class="btn on"
        disabled={props.actions.publishing()}
        onClick={props.actions.publish}
      >
        Publicar
      </button>
      <input
        ref={files.setImportInput}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={files.onImport}
      />
      <Show when={files.message()}>
        {(text) => <span class={styles.message}>{text()}</span>}
      </Show>
    </div>
  );
}
