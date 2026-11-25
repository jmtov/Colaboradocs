import { useOverlay } from '@colaboradocs/review-ui';
import TermSheet from '../components/TermSheet/TermSheet';
import {
  buildGlossary,
  formsOf,
  plainDefinition,
  withForms,
  withoutLink,
} from '../glossary.utils';
import type { EditorDraft } from './draft.hooks';

/** Los términos del glosario y sus enlaces automáticos. */
export function useGlossaryActions({ draft }: { draft: EditorDraft }) {
  const overlay = useOverlay();

  /** Abre la hoja de un término (sin posición, uno nuevo) y aplica lo que se decida. */
  async function editTerm(index?: number) {
    const parts = draft.glossaryParts();
    const entry = index === undefined ? undefined : parts.entries[index];
    const result = await overlay.sheet(TermSheet, {
      term: entry?.term ?? '',
      definition: entry?.definition ?? '',
      forms: entry ? formsOf(draft.links(), entry.term).join(', ') : '',
      isNew: !entry,
    });
    if (!result) return;
    const entries = [...parts.entries];
    if ('remove' in result) {
      if (index !== undefined) entries.splice(index, 1);
    } else {
      // Lo que no se tocó conserva su formato; lo reescrito queda en texto plano.
      const changed = !entry || entry.definition !== result.definition;
      const next = {
        term: result.term,
        definition: result.definition,
        defs: changed ? [plainDefinition(result.definition)] : entry.defs,
      };
      if (index === undefined) entries.push(next);
      else entries[index] = next;
    }
    draft.setGlossary((current) => ({
      ...current,
      html: buildGlossary(parts.rest, entries),
    }));
    draft.setLinks((current) => {
      const old = entry?.term;
      const next = Object.fromEntries(
        Object.entries(current).filter(([, term]) => term !== old),
      );
      return 'remove' in result
        ? next
        : { ...next, ...withForms({}, result.term, result.forms) };
    });
  }

  function goToGlossary() {
    document
      .getElementById('glosario-lista')
      ?.scrollIntoView?.({ block: 'start' });
  }

  function removeGlossaryLink(form: string) {
    draft.setLinks((current) => withoutLink(current, form));
  }

  return { editTerm, goToGlossary, removeGlossaryLink };
}
