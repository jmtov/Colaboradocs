// Qué hojas hay abiertas y en qué orden. Sin JSX: quien las dibuja es OverlayHost.
import { createSignal } from 'solid-js';
import { CLOSE_MS } from './overlay.constants';
import type { OverlayStore, SheetLayer } from './overlay.types';

export function createOverlayStore(): OverlayStore {
  const [layers, setLayers] = createSignal<SheetLayer[]>([]);
  let nextId = 0;

  const sheet: OverlayStore['sheet'] = (component, props) =>
    new Promise((resolve) => {
      const [open, setOpen] = createSignal(true);
      const close = (result?: unknown) => {
        if (!open()) return;
        resolve(result as never);
        // Deja de estar abierta ya (arranca su salida) y se desmonta al terminar.
        setOpen(false);
        setTimeout(
          () =>
            setLayers((current) => current.filter((item) => item !== layer)),
          CLOSE_MS,
        );
      };
      const layer: SheetLayer = {
        id: nextId++,
        component,
        props,
        open,
        close,
      };
      setLayers((current) => [...current, layer]);
    });

  const isOpen = () => layers().some((layer) => layer.open());

  return { layers, sheet, isOpen };
}
