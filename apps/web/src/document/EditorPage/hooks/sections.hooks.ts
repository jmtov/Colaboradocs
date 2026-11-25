import { useOverlay } from '@colaboradocs/review-ui';
import {
  removeSection,
  updateSection,
} from '@/document/editor/section.commands';
import type { AffectedBlock } from '../affected.utils';
import SectionSheet from '../components/SectionSheet/SectionSheet';
import type { Confirm } from './confirm.hooks';
import type { EditorDraft } from './draft.hooks';
import type { EditorImpact } from './impact.hooks';
import type { EditorInstance } from './instance.hooks';

type Deps = {
  draft: EditorDraft;
  instance: EditorInstance;
  impact: EditorImpact;
  confirm: Confirm;
};

/** Los ajustes de una sección y su borrado. */
export function useSectionActions({ draft, instance, impact, confirm }: Deps) {
  const overlay = useOverlay();

  /** Abre los ajustes de una sección (estado, descripción, anexo) y aplica lo que se decida. */
  async function openSettings(sectionId: string) {
    const editor = instance.editor();
    const section = draft.sections().find((item) => item.id === sectionId);
    if (!editor || !section) return;
    const result = await overlay.sheet(SectionSheet, {
      section,
      canRemove: draft.sections().length > 1,
    });
    if (!result) return;
    if ('remove' in result) await removeSectionById(sectionId);
    else updateSection(editor, sectionId, result.attrs);
  }

  /** Borra una sección, con confirmación que dice qué comentarios y OK deja atrás. */
  async function removeSectionById(sectionId: string) {
    const editor = instance.editor();
    const section = draft.sections().find((item) => item.id === sectionId);
    const next = draft.content();
    if (!editor || !section || !next) return;
    const without = {
      ...next,
      sections: next.sections.filter((item) => item.id !== section.id),
    };
    const count = (list: AffectedBlock[]) =>
      list.reduce((sum, b) => sum + b.comments + b.approvals, 0);
    const lost =
      count(impact.lossesFor(without)) - count(impact.lossesFor(next));
    const ok = await confirm(
      'Eliminar la sección',
      lost > 0
        ? `Se borra «${section.title}» con todo su texto. ${lost} comentarios y OK dejan de aplicar. Deshacer (Ctrl+Z) la recupera mientras no cierres el editor.`
        : `Se borra «${section.title}» con todo su texto. Deshacer (Ctrl+Z) la recupera mientras no cierres el editor.`,
      'Eliminar',
      true,
    );
    if (ok) removeSection(editor, section.id);
  }

  return { openSettings };
}
