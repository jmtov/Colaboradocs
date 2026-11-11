import Bold from '@tiptap/extension-bold';
import Document from '@tiptap/extension-document';
import HardBreak from '@tiptap/extension-hard-break';
import Heading from '@tiptap/extension-heading';
import Italic from '@tiptap/extension-italic';
import { BulletList, ListItem, OrderedList } from '@tiptap/extension-list';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import { UndoRedo } from '@tiptap/extensions';
import {
  Citation,
  DefinitionDescription,
  DefinitionList,
  DefinitionTerm,
} from './editor.nodes';
import { NoteStyle, SectionTitle } from './editor.sections';

/**
 * Una viñeta del formato es un solo texto (con listas anidadas debajo, si
 * hay): con dos párrafos saldría como `<li><p>…</p><p>…</p></li>`, que el
 * documento no tiene y rompe sus bloques.
 */
const SingleParagraphListItem = ListItem.extend({
  content: 'paragraph (bulletList | orderedList)*',
});

/**
 * El documento entero en un solo editor: una o más secciones, cada una con su
 * título (`sectionTitle`) y su cuerpo. Siempre empieza con un título.
 */
const SectionsDocument = Document.extend({
  content: '(sectionTitle block*)+',
});

/**
 * El schema del editor: solo lo que el formato del documento admite
 * (`p, ul, ol, li, strong, em, br, h3-h5, dl, dt, dd`) más el título de sección.
 * Lo que no está aquí no se puede escribir ni pegar.
 */
export const createExtensions = (
  options: { onSettings?: (id: string) => void } = {},
) => [
  SectionsDocument,
  SectionTitle.configure({ onSettings: options.onSettings }),
  NoteStyle,
  Paragraph,
  Text,
  Bold,
  Italic,
  HardBreak,
  Heading.configure({ levels: [3, 4, 5] }),
  BulletList,
  OrderedList,
  SingleParagraphListItem,
  DefinitionList,
  DefinitionTerm,
  DefinitionDescription,
  Citation,
  UndoRedo,
];

/** El schema sin botón de ajustes (para convertir y probar sin interfaz). */
export const editorExtensions = createExtensions();
