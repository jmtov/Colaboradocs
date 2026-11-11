import type { ChainedCommands, Editor } from '@tiptap/core';
import type { Component } from 'solid-js';
import { addNote, inNote } from '@/Editor/section.commands';
import BoldIcon from '@/icons/BoldIcon';
import Heading1Icon from '@/icons/Heading1Icon';
import Heading2Icon from '@/icons/Heading2Icon';
import Heading3Icon from '@/icons/Heading3Icon';
import ItalicIcon from '@/icons/ItalicIcon';
import ListIcon from '@/icons/ListIcon';
import ListOrderedIcon from '@/icons/ListOrderedIcon';
import NoteIcon from '@/icons/NoteIcon';
import SectionIcon from '@/icons/SectionIcon';

export type ToolbarItem = {
  /** El nombre del botón (lo lee el lector de pantalla). */
  label: string;
  /** Lo que dice el tooltip. */
  title: string;
  icon: Component<{ class?: string }>;
  /** Nodo o marca del editor que dice si está activo. */
  name?: string;
  attrs?: Record<string, unknown>;
  /** Para lo que no es un nodo ni una marca: dice si está activo donde está el cursor. */
  active?: (editor: Editor) => boolean;
  run: (chain: ChainedCommands) => ChainedCommands;
  /** Para lo que necesita mirar el documento: va en lugar de `run`. */
  command?: (editor: Editor) => void;
};

const ITEMS = {
  section: {
    label: 'Sección',
    icon: SectionIcon,
    title: 'Sección: este renglón empieza una sección nueva',
    name: 'sectionTitle',
    run: (chain) => chain.setNode('sectionTitle'),
  },
  bold: {
    label: 'Negrilla',
    icon: BoldIcon,
    title: 'Negrilla (Cmd/Ctrl+B)',
    name: 'bold',
    run: (chain) => chain.toggleBold(),
  },
  italic: {
    label: 'Cursiva',
    icon: ItalicIcon,
    title: 'Cursiva (Cmd/Ctrl+I)',
    name: 'italic',
    run: (chain) => chain.toggleItalic(),
  },
  h1: {
    label: 'Encabezado 1',
    icon: Heading1Icon,
    title: 'Encabezado 1: título de grupo',
    name: 'heading',
    attrs: { level: 3 },
    run: (chain) => chain.toggleHeading({ level: 3 }),
  },
  h2: {
    label: 'Encabezado 2',
    icon: Heading2Icon,
    title: 'Encabezado 2: subtítulo',
    name: 'heading',
    attrs: { level: 4 },
    run: (chain) => chain.toggleHeading({ level: 4 }),
  },
  h3: {
    label: 'Encabezado 3',
    icon: Heading3Icon,
    title: 'Encabezado 3: título menor',
    name: 'heading',
    attrs: { level: 5 },
    run: (chain) => chain.toggleHeading({ level: 5 }),
  },
  ordered: {
    label: 'Lista numerada',
    icon: ListOrderedIcon,
    title: 'Lista numerada',
    name: 'orderedList',
    run: (chain) => chain.toggleOrderedList(),
  },
  bullet: {
    label: 'Lista',
    icon: ListIcon,
    title: 'Lista con viñetas',
    name: 'bulletList',
    run: (chain) => chain.toggleBulletList(),
  },
  note: {
    label: 'Nota',
    icon: NoteIcon,
    title: 'Agregar «Para qué sirve.» al inicio de la sección',
    run: (chain) => chain,
    active: inNote,
    command: addNote,
  },
} satisfies Record<string, ToolbarItem>;

/**
 * Los botones por grupos, en este orden: estilo del texto, estructura, listas y
 * lo que se agrega al texto (la cita va al final de este último, en la barra).
 */
export const FORMAT_GROUPS: ToolbarItem[][] = [
  [ITEMS.bold, ITEMS.italic],
  [ITEMS.section, ITEMS.h1, ITEMS.h2, ITEMS.h3],
  [ITEMS.ordered, ITEMS.bullet],
  [ITEMS.note],
];
