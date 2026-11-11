import type { Component } from 'solid-js';

/** Una acción del menú: texto, ícono y qué hace. */
export type ActionMenuItem = {
  label: string;
  icon: Component<{ class?: string }>;
  onSelect: () => void;
  /** Acción destructiva: va en rojo. */
  danger?: boolean;
  disabled?: boolean;
};
