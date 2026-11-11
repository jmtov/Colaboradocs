import type { ChainedCommands, Editor } from '@tiptap/core';
import { createEffect, createSignal, onCleanup } from 'solid-js';
import type { ToolbarItem } from './EditorToolbar.constants';

/**
 * Estado de la barra: qué formato está activo donde está el cursor y si hay
 * algo que deshacer. Se recalcula en cada transacción del editor.
 */
export function useEditorToolbar(editor: () => Editor | undefined) {
  const [tick, setTick] = createSignal(0);

  createEffect(() => {
    const current = editor();
    if (!current) return;
    const bump = () => setTick((value) => value + 1);
    current.on('transaction', bump);
    onCleanup(() => current.off('transaction', bump));
  });

  function isActive(name: string, attrs?: Record<string, unknown>) {
    tick();
    return editor()?.isActive(name, attrs) ?? false;
  }

  /** Lo que activa un botón que no es un nodo ni una marca (p. ej. estar en la nota). */
  function matches(test: (editor: Editor) => boolean) {
    tick();
    const current = editor();
    return current ? test(current) : false;
  }

  function can(action: 'undo' | 'redo') {
    tick();
    const current = editor();
    if (!current) return false;
    return action === 'undo' ? current.can().undo() : current.can().redo();
  }

  function run(command: (chain: ChainedCommands) => ChainedCommands) {
    const current = editor();
    if (current) command(current.chain().focus()).run();
  }

  /** Un botón: su comando propio si lo tiene; si no, el de la cadena. */
  function press(item: ToolbarItem) {
    const current = editor();
    if (!current) return;
    if (item.command) item.command(current);
    else run(item.run);
  }

  return { isActive, matches, can, run, press };
}
