import { ConfirmSheet, useOverlay, useReview } from '@colaboradocs/review-ui';
import {
  createMemo,
  createSignal,
  onCleanup,
  onMount,
  untrack,
} from 'solid-js';
import type { DocumentContent, DocumentSection } from '@/content/content.types';
import { documentPath, navigate } from '@/router/router';
import { affectedBlocks } from './affected.utils';
import PublishSheet from './components/PublishSheet/PublishSheet';
import type { EditorProblem } from './EditorPage.types';
import {
  type GlossaryLinks,
  sameLinks,
  withForms,
  withoutLink,
} from './glossary.utils';
import { joinNote, splitNote } from './note.utils';
import { newAnnex, newSection, sameSections } from './section.utils';

type Status = 'loading' | 'ready' | 'error';

const hasKeys = (value: object) => Object.keys(value).length > 0;

const today = () => new Date().toISOString().slice(0, 10);

/**
 * Estado del editor de un documento: parte del borrador si lo hay (si no, de
 * lo publicado), lleva los cambios sin guardar por sección y guarda,
 * descarta y publica. Los cambios no se pierden aunque se escriba mientras se guarda.
 */
export function useEditorPage(id: () => string) {
  const review = useReview();
  const overlay = useOverlay();

  const [status, setStatus] = createSignal<Status>('loading');
  const [loadError, setLoadError] = createSignal('');
  const [base, setBase] = createSignal<DocumentContent | null>(null);
  const [published, setPublished] = createSignal<DocumentContent | null>(null);
  // La copia de trabajo: todas las secciones tal como se están editando. `base` es lo último guardado.
  const [sections, setSections] = createSignal<DocumentSection[]>([]);
  // Los enlaces automáticos del glosario (`glossaryTerms`), también como copia de trabajo.
  const [links, setLinks] = createSignal<GlossaryLinks>({});
  const [revision, setRevision] = createSignal(0);
  const [stale, setStale] = createSignal(false);
  const [saving, setSaving] = createSignal(false);
  const [busy, setBusy] = createSignal(false);
  const [problem, setProblem] = createSignal<EditorProblem | null>(null);
  const [previewing, setPreviewing] = createSignal(false);

  const isAdmin = () =>
    (review.snapshot()?.me ?? review.session()?.reviewer)?.isAdmin === true;

  /** El documento tal como quedaría. */
  const content = createMemo<DocumentContent | null>(() => {
    const current = base();
    if (!current) return null;
    const written = links();
    // Sin enlaces y sin que los hubiera, el campo no existe (no se agrega un `{}` de la nada).
    const keep = current.glossaryTerms !== undefined || hasKeys(written);
    return {
      ...current,
      sections: sections(),
      ...(keep ? { glossaryTerms: written } : {}),
    };
  });

  // Los ids no cambian al escribir: así el editor de cada sección no se vuelve a crear.
  const sectionIds = createMemo(
    () => sections().map((section) => section.id),
    [],
    { equals: (a, b) => a.join('|') === b.join('|') },
  );

  const dirty = createMemo(() => {
    const saved = base();
    if (!saved) return false;
    return (
      !sameSections(saved.sections, sections()) ||
      !sameLinks(saved.glossaryTerms ?? {}, links())
    );
  });
  const hasDraft = () => revision() > 0;
  const hasGlossary = () =>
    sections().some((section) => section.id === 'glosario');

  async function load() {
    setStatus('loading');
    setProblem(null);
    const draft = await review.fetchDraft(id());
    if (!draft.ok) {
      setLoadError(draft.message);
      setStatus('error');
      return;
    }
    try {
      const current = await review.fetchContent(id());
      setPublished(current);
      setBase(draft.value ? draft.value.content : current);
    } catch {
      // Sin publicar todavía (un documento nuevo): se parte del borrador.
      setPublished(null);
      setBase(draft.value ? draft.value.content : null);
    }
    if (!base()) {
      setLoadError('No encontramos ese documento.');
      setStatus('error');
      return;
    }
    setSections(base()?.sections ?? []);
    setLinks(base()?.glossaryTerms ?? {});
    setRevision(draft.value ? draft.value.revision : 0);
    setStale(draft.value ? draft.value.stale : false);
    setStatus('ready');
  }

  onMount(() => void load());

  // Avisar antes de cerrar la pestaña con cambios sin guardar.
  const warn = (event: BeforeUnloadEvent) => {
    if (untrack(dirty)) event.preventDefault();
  };
  window.addEventListener('beforeunload', warn);
  onCleanup(() => window.removeEventListener('beforeunload', warn));

  type SectionField = 'title' | 'description' | 'html';

  function setSectionField(
    sectionId: string,
    field: SectionField,
    value: string,
  ) {
    // Sin descripción es «no hay», no un texto vacío: así volver a dejarla vacía no cuenta como cambio.
    const next = field === 'description' && !value.trim() ? undefined : value;
    setSections((current) =>
      current.map((section) =>
        section.id === sectionId ? { ...section, [field]: next } : section,
      ),
    );
  }

  function updateHtml(sectionId: string, change: (html: string) => string) {
    setSections((current) =>
      current.map((section) =>
        section.id === sectionId
          ? { ...section, html: change(section.html) }
          : section,
      ),
    );
  }

  /** La nota «Para qué sirve» (HTML en línea): es el primer párrafo de la sección. */
  function setSectionNote(sectionId: string, note: string) {
    updateHtml(sectionId, (html) => joinNote(note, splitNote(html).body));
  }

  /** El cuerpo de la sección: todo menos la nota. */
  function setSectionBody(sectionId: string, body: string) {
    updateHtml(sectionId, (html) => joinNote(splitNote(html).note, body));
  }

  /** Cómo aparece un término del glosario en el texto (separado por comas). */
  function setGlossaryForms(term: string, text: string) {
    setLinks((current) => withForms(current, term, text));
  }

  function removeGlossaryLink(form: string) {
    setLinks((current) => withoutLink(current, form));
  }

  /** Agrega la sección «Glosario» como anexo, si todavía no hay. */
  function addGlossary() {
    const created = newAnnex(sections(), 'glosario', 'Glosario');
    setSections((current) => [...current, created]);
    focusSection(created.id);
  }

  function focusSection(id: string) {
    requestAnimationFrame(() => {
      const card = document.getElementById(`edit-${id}`);
      card?.scrollIntoView?.({ block: 'center' });
      card?.querySelector('input')?.focus();
    });
  }

  /** Agrega una sección después de la última numerada y lleva el cursor a su título. */
  function addSection() {
    const { section, index } = newSection(sections());
    setSections((current) => [
      ...current.slice(0, index),
      section,
      ...current.slice(index),
    ]);
    focusSection(section.id);
  }

  /** Guarda `next` (por defecto, lo que hay) como borrador. Devuelve si quedó guardado. */
  async function save(next?: DocumentContent): Promise<boolean> {
    const toSave = next ?? content();
    if (!toSave || saving()) return false;
    setSaving(true);
    setProblem(null);
    const result = await review.saveDraft(toSave, revision());
    setSaving(false);
    if (!result.ok) {
      setProblem(result);
      return false;
    }
    setRevision(result.value.revision);
    setStale(result.value.stale);
    // La copia de trabajo no se toca: lo escrito mientras se guardaba sigue pendiente.
    setBase(toSave);
    return true;
  }

  async function confirm(
    title: string,
    message: string,
    confirmLabel: string,
    danger = false,
  ): Promise<boolean> {
    return (
      (await overlay.sheet(ConfirmSheet, {
        title,
        message,
        confirmLabel,
        danger,
      })) === true
    );
  }

  /** Vuelve al documento; con cambios sin guardar, pregunta. */
  async function leave() {
    if (
      dirty() &&
      !(await confirm(
        'Salir sin guardar',
        'Tienes cambios sin guardar. Si sales, se pierden.',
        'Salir',
        true,
      ))
    ) {
      return;
    }
    navigate(documentPath(id()));
  }

  async function discard() {
    if (!hasDraft() && !dirty()) {
      navigate(documentPath(id()));
      return;
    }
    const ok = await confirm(
      'Descartar el borrador',
      'Se borran los cambios del borrador y se vuelve a lo publicado. No se puede deshacer.',
      'Descartar',
      true,
    );
    if (!ok) return;
    setBusy(true);
    if (hasDraft()) {
      const result = await review.discardDraft(id());
      if (!result.ok && result.code !== 'not_found') {
        setBusy(false);
        setProblem(result);
        return;
      }
    }
    setBusy(false);
    review.flash('Borrador descartado.');
    navigate(documentPath(id()));
  }

  async function publish() {
    const current = content();
    if (!current || busy()) return;
    const comments = review.snapshot()?.comments ?? [];
    const approvals = review.snapshot()?.approvals ?? [];
    const before = published();
    const affected = before
      ? affectedBlocks(before, current, comments, approvals)
      : [];
    const version = await overlay.sheet(PublishSheet, {
      version: current.version,
      affected,
    });
    if (version === undefined) return;

    setBusy(true);
    const toPublish = { ...current, version, updated: today() };
    const saved = await save(toPublish);
    if (!saved) {
      setBusy(false);
      return;
    }
    let result = await review.publishDraft(id(), {
      expectedRevision: revision(),
    });
    if (!result.ok && result.code === 'draft_stale') {
      const force = await confirm(
        'El documento cambió',
        'Alguien reemplazó el documento publicado después de que empezaste este borrador. Si publicas, tu borrador lo pisa. ¿Publicar de todos modos?',
        'Publicar de todos modos',
        true,
      );
      if (force) {
        result = await review.publishDraft(id(), {
          expectedRevision: revision(),
          force: true,
        });
      }
    }
    setBusy(false);
    if (!result.ok) {
      setProblem(result);
      return;
    }
    review.flash('Documento publicado.');
    navigate(documentPath(id()));
  }

  return {
    status,
    loadError,
    isAdmin,
    content,
    sectionIds,
    sections,
    dirty,
    hasDraft,
    hasGlossary,
    stale,
    saving,
    busy,
    problem,
    previewing,
    setPreviewing,
    setSectionField,
    setSectionNote,
    setSectionBody,
    links,
    setGlossaryForms,
    removeGlossaryLink,
    addSection,
    addGlossary,
    save: () => save(),
    discard,
    publish,
    leave,
    reload: load,
  };
}

/** Lo que el editor le da a sus tarjetas de sección. */
export type EditorPageState = ReturnType<typeof useEditorPage>;
