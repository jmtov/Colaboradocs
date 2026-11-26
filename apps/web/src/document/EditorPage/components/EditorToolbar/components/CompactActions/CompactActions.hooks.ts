import { useOverlay } from '@colaboradocs/review-ui';
import type { Editor } from '@tiptap/core';
import AtSignIcon from 'lucide-solid/icons/at-sign';
import LinkIcon from 'lucide-solid/icons/link';
import QuoteIcon from 'lucide-solid/icons/quote';
import NoteIcon from 'lucide-solid/icons/sticky-note';
import { addNote, hasNote } from '@/document/editor/section.commands';
import {
  applyStyle,
  type BlockStyle,
  styleAt,
} from '@/document/editor/style.commands';
import OptionSheet from '../OptionSheet/OptionSheet';
import type { Option } from '../OptionSheet/OptionSheet.types';
import { STYLE_OPTIONS } from './CompactActions.constants';
import type { CompactActionsProps } from './CompactActions.types';

type InsertOption = Option & { run: () => void };

/** Las dos hojas de la barra angosta: el estilo del renglón y lo que se inserta. */
export function useCompactActions(props: CompactActionsProps) {
  const overlay = useOverlay();

  async function pickStyle() {
    const editor = props.editor;
    if (!editor) return;
    const picked = await overlay.sheet(OptionSheet, {
      kicker: 'Renglón',
      title: 'Estilo',
      options: STYLE_OPTIONS,
      selected: styleAt(editor),
    });
    if (picked) applyStyle(editor, picked as BlockStyle);
  }

  /** Lo que se puede insertar, según dónde está el cursor. */
  function insertOptions(editor: Editor): InsertOption[] {
    const options: InsertOption[] = [];
    const { onLink, onMention, onCite } = props;
    if (onLink) {
      const editing = editor.isActive('link');
      options.push({
        id: 'link',
        label: editing ? 'Editar enlace' : 'Enlace',
        description: 'Lleva a una página, un correo o un documento.',
        icon: LinkIcon,
        run: onLink,
      });
    }
    if (onMention) {
      options.push({
        id: 'mention',
        label: 'Mención',
        description: 'Una persona del espacio; al tocarla se ve su tarjeta.',
        icon: AtSignIcon,
        run: onMention,
      });
    }
    if (onCite) {
      options.push({
        id: 'cite',
        label: 'Cita',
        description: 'Una referencia de la bibliografía, en el cursor.',
        icon: QuoteIcon,
        run: onCite,
      });
    }
    const noted = hasNote(editor);
    options.push({
      id: 'note',
      label: noted ? 'Ir a la nota' : 'Nota «Para qué sirve»',
      description: noted
        ? 'La sección ya tiene una: lleva el cursor a ella.'
        : 'Va al inicio de la sección.',
      icon: NoteIcon,
      run: () => addNote(editor),
    });
    return options;
  }

  async function pickInsert() {
    const editor = props.editor;
    if (!editor) return;
    const options = insertOptions(editor);
    const picked = await overlay.sheet(OptionSheet, {
      kicker: 'En el cursor',
      title: 'Insertar',
      options,
    });
    options.find((option) => option.id === picked)?.run();
  }

  return { pickStyle, pickInsert };
}
