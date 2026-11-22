import { createSignal } from 'solid-js';

/** Ajustes de cómo se ve la vista previa (no se guardan en el deck). */
const [showCells, setShowCells] = createSignal(false);
/** El bloque (índice en `body`) sobre el que está el cursor, en la lista o en la vista previa. */
const [hoverBlock, setHoverBlock] = createSignal<number | null>(null);
/** Una celda pulsada en la vista previa pide abrir la edición de ese bloque. `id` distingue pulsaciones repetidas. */
const [openRequest, setOpenRequest] = createSignal<{
  slide: number;
  block: number;
  id: number;
} | null>(null);

/** Un «+» pulsado en la vista previa pide agregar un bloque en esa celda. */
const [addRequest, setAddRequest] = createSignal<{
  slide: number;
  col: number;
  row: number;
  id: number;
} | null>(null);

export const viewStore = {
  /** Dibuja un borde rojo suave en columnas, filas y celdas. */
  showCells,
  toggleCells: () => setShowCells((on) => !on),
  addRequest,
  requestAdd: (slide: number, col: number, row: number) =>
    setAddRequest({ slide, col, row, id: Date.now() }),
  hoverBlock,
  setHoverBlock,
  openRequest,
  requestOpen: (slide: number, block: number) =>
    setOpenRequest({ slide, block, id: Date.now() }),
};
