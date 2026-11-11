import type { Accessor, Component, JSX } from 'solid-js';

/**
 * Lo que recibe el componente de una hoja abierta con `overlay.sheet`, además de
 * sus propias props. El componente dibuja su propio `BottomSheet` con `open` y
 * `onClose`, y la termina con `close(resultado)`.
 */
export interface SheetLayerProps<Result = void> {
  open: boolean;
  /** Esc, fondo o arrastre: cierra sin resultado. */
  onClose: () => void;
  close: (result?: Result) => void;
}

export interface SheetLayer {
  id: number;
  /** False desde que se pide cerrar hasta que termina la animación de salida. */
  open: Accessor<boolean>;
  // Tipos borrados: el store no sabe de cada hoja; `sheet()` las ata por fuera.
  // biome-ignore lint/suspicious/noExplicitAny: heterogéneo por diseño
  component: Component<any>;
  props: object;
  close: (result?: unknown) => void;
}

export interface OverlayApi {
  /**
   * Abre una hoja y resuelve con lo que pase a `close(resultado)`, o con
   * `undefined` si se cierra sin resultado. La hoja se monta al abrir y se
   * desmonta al cerrar: cada apertura arranca limpia. Lo reactivo se pasa como
   * getters del objeto de `props` (`{ get items() { return items(); } }`).
   */
  sheet: <Result, Props extends object>(
    component: (props: Props & SheetLayerProps<Result>) => JSX.Element,
    props: Props,
  ) => Promise<Result | undefined>;
  /** Hay alguna hoja abierta (no cuenta las que están saliendo). */
  isOpen: Accessor<boolean>;
}

export interface OverlayStore extends OverlayApi {
  layers: Accessor<SheetLayer[]>;
}
