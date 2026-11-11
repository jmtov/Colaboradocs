import { For, type ParentProps } from 'solid-js';
import SheetLayerView from './components/SheetLayerView/SheetLayerView';
import { OverlayContext } from './overlay.context';
import { createOverlayStore } from './overlay.store';

/**
 * Único punto de montaje de las hojas. Quien quiera abrir una lo pide con
 * `useOverlay().sheet(...)`; no monta nada por su cuenta. Va dentro del
 * `ReviewProvider`, para que las hojas lean la revisión.
 */
export default function OverlayProvider(props: ParentProps) {
  const store = createOverlayStore();

  return (
    <OverlayContext.Provider
      value={{ sheet: store.sheet, isOpen: store.isOpen }}
    >
      {props.children}
      <For each={store.layers()}>
        {(layer) => <SheetLayerView layer={layer} />}
      </For>
    </OverlayContext.Provider>
  );
}
