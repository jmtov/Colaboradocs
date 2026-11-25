import type { Component } from 'solid-js';

/** Una acción del menú: texto, ícono, una descripción si hace falta y qué hace. */
export type ActionMenuItem = {
  label: string;
  /** Una línea que explica qué hace, debajo de la etiqueta. */
  description?: string;
  icon?: Component<{ class?: string }>;
  onSelect: () => void;
  /** Acción destructiva: va en rojo. */
  danger?: boolean;
  disabled?: boolean;
  /** Para opciones que se encienden y se apagan: con un valor, la opción lleva un visto cuando está activa. */
  checked?: boolean;
};

/** Un grupo de acciones; los grupos de un menú se separan con una línea y pueden llevar un título. */
export type ActionMenuGroup = {
  title?: string;
  items: ActionMenuItem[];
};
