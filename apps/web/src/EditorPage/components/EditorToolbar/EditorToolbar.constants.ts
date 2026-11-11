import type { ChainedCommands, Editor } from '@tiptap/core';
import type { Component } from 'solid-js';
import { addNote, addTerm, inNote } from '@/Editor/section.commands';
import BoldIcon from '@/icons/BoldIcon';
import DefinitionIcon from '@/icons/DefinitionIcon';
import Heading1Icon from '@/icons/Heading1Icon';
import Heading2Icon from '@/icons/Heading2Icon';
import Heading3Icon from '@/icons/Heading3Icon';
import ItalicIcon from '@/icons/ItalicIcon';
import ListIcon from '@/icons/ListIcon';
import ListOrderedIcon from '@/icons/ListOrderedIcon';
import NoteIcon from '@/icons/NoteIcon';
import PlusIcon from '@/icons/PlusIcon';
import SectionIcon from '@/icons/SectionIcon';
import TermIcon from '@/icons/TermIcon';

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

export type ToolbarVariant = 'section' | 'glossary';

export const FORMAT_ITEMS: ToolbarItem[] = [
  {
    label: 'Sección',
    icon: SectionIcon,
    title: 'Sección: este renglón empieza una sección nueva',
    name: 'sectionTitle',
    run: (chain) => chain.setNode('sectionTitle'),
  },
  {
    label: 'Negrilla',
    icon: BoldIcon,
    title: 'Negrilla (Cmd/Ctrl+B)',
    name: 'bold',
    run: (chain) => chain.toggleBold(),
  },
  {
    label: 'Cursiva',
    icon: ItalicIcon,
    title: 'Cursiva (Cmd/Ctrl+I)',
    name: 'italic',
    run: (chain) => chain.toggleItalic(),
  },
  {
    label: 'Encabezado 1',
    icon: Heading1Icon,
    title: 'Encabezado 1: título de grupo',
    name: 'heading',
    attrs: { level: 3 },
    run: (chain) => chain.toggleHeading({ level: 3 }),
  },
  {
    label: 'Encabezado 2',
    icon: Heading2Icon,
    title: 'Encabezado 2: subtítulo',
    name: 'heading',
    attrs: { level: 4 },
    run: (chain) => chain.toggleHeading({ level: 4 }),
  },
  {
    label: 'Encabezado 3',
    icon: Heading3Icon,
    title: 'Encabezado 3: título menor',
    name: 'heading',
    attrs: { level: 5 },
    run: (chain) => chain.toggleHeading({ level: 5 }),
  },
  {
    label: 'Lista numerada',
    icon: ListOrderedIcon,
    title: 'Lista numerada',
    name: 'orderedList',
    run: (chain) => chain.toggleOrderedList(),
  },
  {
    label: 'Lista',
    icon: ListIcon,
    title: 'Lista con viñetas',
    name: 'bulletList',
    run: (chain) => chain.toggleBulletList(),
  },
  {
    label: 'Nota',
    icon: NoteIcon,
    title: 'Agregar «Para qué sirve.» al inicio de la sección',
    run: (chain) => chain,
    active: inNote,
    command: addNote,
  },
];

const GLOSSARY_ITEMS: ToolbarItem[] = [
  {
    label: 'Término',
    icon: TermIcon,
    title: 'Término: este renglón es un término',
    name: 'definitionTerm',
    run: (chain) => chain.setNode('definitionTerm'),
  },
  {
    label: 'Definición',
    icon: DefinitionIcon,
    title: 'Definición: este renglón es la definición',
    name: 'definitionDescription',
    run: (chain) => chain.setNode('definitionDescription'),
  },
  {
    label: '+ Término',
    icon: PlusIcon,
    title: 'Agregar un término al final del glosario',
    run: (chain) => chain,
    command: addTerm,
  },
];

/** Qué botones lleva la barra: los de siempre y, dentro de la sección glosario, los de términos. */
export const ITEMS_BY_VARIANT: Record<ToolbarVariant, ToolbarItem[]> = {
  section: FORMAT_ITEMS,
  glossary: [...FORMAT_ITEMS, ...GLOSSARY_ITEMS],
};
