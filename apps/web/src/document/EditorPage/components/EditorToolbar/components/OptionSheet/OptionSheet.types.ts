import type { SheetLayerProps } from '@colaboradocs/review-ui';
import type { Component } from 'solid-js';

export type Option<Id extends string = string> = {
  id: Id;
  label: string;
  /** Una línea que dice qué hace. */
  description: string;
  icon: Component<{ class?: string }>;
};

/** Resuelve con el id de la opción elegida; sin resultado si se cierra. */
export type OptionSheetProps = SheetLayerProps<string> & {
  kicker: string;
  title: string;
  options: Option[];
  /** La que está puesta ahora, en las hojas donde una está elegida. */
  selected?: string;
};
