import { useReview } from '@colaboradocs/review-ui';
import { useConfirm } from './hooks/confirm.hooks';
import { useEditorDraft } from './hooks/draft.hooks';
import { useGlossaryActions } from './hooks/glossary.hooks';
import { useEditorImpact } from './hooks/impact.hooks';
import { useEditorInstance } from './hooks/instance.hooks';
import { usePeopleActions } from './hooks/people.hooks';
import { usePersist } from './hooks/persist.hooks';
import { useSectionActions } from './hooks/sections.hooks';
import { useSourceActions } from './hooks/sources.hooks';

/**
 * Estado del editor de un documento: junta la copia de trabajo (`hooks/draft`), el editor Tiptap,
 * lo que cambia para la revisión y las acciones de cada parte (secciones, fuentes, personas,
 * glosario, guardar y publicar). Cada una vive en `hooks/`.
 */
export function useEditorPage(id: () => string) {
  const review = useReview();
  const draft = useEditorDraft(id);
  const instance = useEditorInstance();
  const impact = useEditorImpact(draft);
  const confirm = useConfirm();
  const sectionActions = useSectionActions({
    draft,
    instance,
    impact,
    confirm,
  });
  const sourceActions = useSourceActions({ draft, instance, confirm });
  const peopleActions = usePeopleActions({ draft, instance });
  const glossaryActions = useGlossaryActions({ draft });
  const persist = usePersist({ id, draft, confirm });

  const isAdmin = () =>
    (review.snapshot()?.me ?? review.session()?.reviewer)?.isAdmin === true;

  return {
    status: draft.status,
    loadError: draft.loadError,
    isAdmin,
    content: draft.content,
    sections: draft.sections,
    editor: instance.editor,
    ready: instance.ready,
    currentId: instance.currentId,
    openSettings: sectionActions.openSettings,
    goTo: instance.goTo,
    losses: impact.losses,
    renumbered: impact.renumbered,
    setSections: draft.setSections,
    dirty: draft.dirty,
    hasDraft: draft.hasDraft,
    stale: draft.stale,
    saving: persist.saving,
    busy: persist.busy,
    problem: draft.problem,
    links: draft.links,
    sources: draft.sources,
    editSource: sourceActions.editSource,
    details: draft.details,
    setDetails: draft.setDetails,
    pickPeople: peopleActions.pickPeople,
    editCitation: sourceActions.editCitation,
    goToSources: sourceActions.goToSources,
    goToGlossary: glossaryActions.goToGlossary,
    cite: sourceActions.cite,
    link: instance.link,
    mention: peopleActions.mention,
    editPerson: peopleActions.editPerson,
    people: draft.people,
    editTerm: glossaryActions.editTerm,
    glossaryParts: draft.glossaryParts,
    glossary: draft.glossary,
    removeGlossaryLink: glossaryActions.removeGlossaryLink,
    save: persist.save,
    discard: persist.discard,
    publish: persist.publish,
    leave: persist.leave,
    reload: draft.reload,
  };
}

/** Lo que el editor le da a sus tarjetas de sección. */
export type EditorPageState = ReturnType<typeof useEditorPage>;
