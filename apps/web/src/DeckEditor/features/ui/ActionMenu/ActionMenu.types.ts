import type { JSX } from 'solid-js';

export interface MenuItem {
  label: string;
  icon?: JSX.Element;
  /** Una acción destructiva se marca en rojo. */
  danger?: boolean;
  disabled?: boolean;
  /** La opción elegida de un grupo (se marca con un visto). */
  checked?: boolean;
  /** Texto pequeño debajo de la etiqueta. */
  help?: string;
  onSelect: () => void;
}

/** Un menú es una lista de grupos; cada grupo puede llevar un título y se separa del anterior con una línea. */
export interface MenuGroup {
  title?: string;
  items: MenuItem[];
}
