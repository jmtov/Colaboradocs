import { useOverlay } from '@colaboradocs/review-ui';
import {
  insertCitation,
  replaceCitation,
} from '@/document/editor/section.commands';
import { parseCite } from '@/document/prose/cite.utils';
import CitationSheet from '../components/CitationSheet/CitationSheet';
import SourceSheet from '../components/SourceSheet/SourceSheet';
import { citationsTo } from '../sources.utils';
import type { Confirm } from './confirm.hooks';
import type { EditorDraft } from './draft.hooks';
import type { EditorInstance } from './instance.hooks';

type Deps = { draft: EditorDraft; instance: EditorInstance; confirm: Confirm };

/** La bibliografía y las citas del texto. */
export function useSourceActions({ draft, instance, confirm }: Deps) {
  const overlay = useOverlay();

  /** Tocar una cita del texto: elegir otras fuentes y cambiarla ahí mismo. */
  async function editCitation(pos: number, text: string) {
    const editor = instance.editor();
    if (!editor) return;
    const groups = parseCite(text, draft.sources().length);
    const selected = groups.flatMap((group) =>
      group.items.map((item) => item.number),
    );
    const plain = /^\[\d+(,\s*\d+)*\]$/.test(text.trim());
    const numbers = await overlay.sheet(CitationSheet, {
      sources: draft.sources(),
      selected,
      note: plain
        ? undefined
        : `Esta cita dice «${text}»: al aplicar queda solo con los números de las fuentes.`,
    });
    if (numbers) replaceCitation(editor, pos, numbers);
  }

  /** Abre la hoja de una fuente (sin posición, una nueva al final) y aplica lo que se decida. */
  async function editSource(index?: number) {
    const current = draft.sources();
    const source = index === undefined ? undefined : current[index];
    const result = await overlay.sheet(SourceSheet, {
      number: (index ?? current.length) + 1,
      label: source?.label ?? '',
      url: source?.url ?? '',
      isNew: !source,
      canRemove: index === current.length - 1,
    });
    if (!result) return;
    if ('remove' in result) {
      await removeLastSource();
      return;
    }
    draft.setSources((list) =>
      index === undefined
        ? [...list, result]
        : list.map((item, at) => (at === index ? result : item)),
    );
  }

  /** Quita la última fuente; si el texto tiene citas a ella, lo dice antes. */
  async function removeLastSource() {
    const count = draft.sources().length;
    if (count === 0) return;
    const cited = citationsTo(draft.sections(), count, count);
    if (
      cited > 0 &&
      !(await confirm(
        'Quitar la fuente',
        `${cited === 1 ? 'Hay 1 cita' : `Hay ${cited} citas`} en el texto que remite a la fuente [${count}]. Si la quitas, esa cita queda sin fuente.`,
        'Quitar',
        true,
      ))
    ) {
      return;
    }
    draft.setSources((current) => current.slice(0, -1));
  }

  /** Elegir fuentes de la bibliografía e insertar la cita donde está el cursor. */
  async function cite() {
    const editor = instance.editor();
    if (!editor) return;
    const numbers = await overlay.sheet(CitationSheet, {
      sources: draft.sources(),
    });
    if (numbers) insertCitation(editor, numbers);
  }

  /** Lleva a la bibliografía y enfoca su primer campo (o, si no hay fuentes, el botón de agregar). */
  function goToSources() {
    const block = document.getElementById('bibliografia');
    block?.scrollIntoView?.({ block: 'start' });
    block?.querySelector<HTMLElement>('input, button')?.focus();
  }

  return { editCitation, editSource, cite, goToSources };
}
