import { ConfirmSheet, useOverlay, useReview } from '@colaboradocs/review-ui';
import type { Editor } from '@tiptap/core';
import {
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
  untrack,
} from 'solid-js';
import type {
  DocumentContent,
  DocumentSection,
  DocumentSource,
} from '@/content/content.types';
import {
  goToSection,
  insertCitation,
  removeSection,
  sectionAt,
  updateSection,
} from '@/Editor/section.commands';
import { documentPath, navigate } from '@/router/router';
import {
  type AffectedBlock,
  affectedBlocks,
  renumberedSections,
} from './affected.utils';
import CitationSheet from './components/CitationSheet/CitationSheet';
import PublishSheet from './components/PublishSheet/PublishSheet';
import SectionSheet from './components/SectionSheet/SectionSheet';
import type { EditorProblem } from './EditorPage.types';
import {
  type GlossaryLinks,
  sameLinks,
  withForms,
  withoutLink,
} from './glossary.utils';
import {
  sameSections,
  withGlossary,
  withoutEmptyGlossary,
} from './section.utils';
import { citationsTo, sameSources } from './sources.utils';

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
  // Incluye siempre el glosario (aunque el documento no lo tenga); `saved` es lo que se guarda.
  const [sections, setSections] = createSignal<DocumentSection[]>([]);
  const saved = createMemo(() => withoutEmptyGlossary(sections()));
  // Los enlaces automáticos del glosario (`glossaryTerms`), también como copia de trabajo.
  const [links, setLinks] = createSignal<GlossaryLinks>({});
  // La bibliografía (`sources`), también como copia de trabajo.
  const [sources, setSources] = createSignal<DocumentSource[]>([]);
  const [revision, setRevision] = createSignal(0);
  const [stale, setStale] = createSignal(false);
  const [saving, setSaving] = createSignal(false);
  const [busy, setBusy] = createSignal(false);
  const [problem, setProblem] = createSignal<EditorProblem | null>(null);
  const [editor, setEditor] = createSignal<Editor>();
  // La sección donde está el cursor (de ahí sale el panel de la sección actual).
  const [currentId, setCurrentId] = createSignal<string>();

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
      sections: saved(),
      sources: sources(),
      ...(keep ? { glossaryTerms: written } : {}),
    };
  });

  const dirty = createMemo(() => {
    const last = base();
    if (!last) return false;
    return (
      !sameSections(last.sections, saved()) ||
      !sameSources(last.sources, sources()) ||
      !sameLinks(last.glossaryTerms ?? {}, links())
    );
  });
  const hasDraft = () => revision() > 0;

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
    setSections(withGlossary(base()?.sections ?? []));
    setLinks(base()?.glossaryTerms ?? {});
    setSources(base()?.sources ?? []);
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

  /** El editor del documento está listo: sigue al cursor para saber en qué sección está. */
  function ready(instance: Editor) {
    setEditor(instance);
    setCurrentId(sectionAt(instance));
    instance.on('transaction', () => setCurrentId(sectionAt(instance)));
  }

  /** Lo que se ve en el aviso: se recalcula cuando se deja de escribir un momento. */
  const [settled, setSettled] = createSignal<DocumentContent | null>(null);
  createEffect(() => {
    const current = content();
    const timer = setTimeout(() => setSettled(current), 400);
    onCleanup(() => clearTimeout(timer));
  });

  /** Lo que se perdería, en bloques con comentarios u OK, frente a lo publicado. */
  function lossesFor(next: DocumentContent | null): AffectedBlock[] {
    const before = published();
    if (!before || !next) return [];
    const snapshot = review.snapshot();
    return affectedBlocks(
      before,
      next,
      snapshot?.comments ?? [],
      snapshot?.approvals ?? [],
    );
  }
  const losses = createMemo(() => lossesFor(settled()));
  const renumbered = createMemo(() => {
    const before = published();
    const next = settled();
    return before && next ? renumberedSections(before, next) : [];
  });

  const inGlossary = () => currentId() === 'glosario';

  /** Abre los ajustes de una sección (estado, descripción, anexo) y aplica lo que se decida. */
  async function openSettings(sectionId: string) {
    const instance = editor();
    const section = sections().find((item) => item.id === sectionId);
    if (!instance || !section) return;
    const result = await overlay.sheet(SectionSheet, {
      section,
      canRemove: saved().length > 1,
    });
    if (!result) return;
    if ('remove' in result) await removeSectionById(sectionId);
    else updateSection(instance, sectionId, result.attrs);
  }

  /** Borra una sección, con confirmación que dice qué comentarios y OK deja atrás. */
  async function removeSectionById(sectionId: string) {
    const instance = editor();
    const section = sections().find((item) => item.id === sectionId);
    const next = content();
    if (!instance || !section || !next) return;
    const without = {
      ...next,
      sections: next.sections.filter((item) => item.id !== section.id),
    };
    const count = (list: AffectedBlock[]) =>
      list.reduce((sum, b) => sum + b.comments + b.approvals, 0);
    const lost = count(lossesFor(without)) - count(lossesFor(next));
    const ok = await confirm(
      'Eliminar la sección',
      lost > 0
        ? `Se borra «${section.title}» con todo su texto. ${lost} comentarios y OK dejan de aplicar. Deshacer (Ctrl+Z) la recupera mientras no cierres el editor.`
        : `Se borra «${section.title}» con todo su texto. Deshacer (Ctrl+Z) la recupera mientras no cierres el editor.`,
      'Eliminar',
      true,
    );
    if (ok) removeSection(instance, section.id);
  }

  function goTo(id: string) {
    const instance = editor();
    if (instance) goToSection(instance, id);
  }

  function setSourceField(
    index: number,
    field: keyof DocumentSource,
    value: string,
  ) {
    setSources((current) =>
      current.map((source, at) =>
        at === index ? { ...source, [field]: value } : source,
      ),
    );
  }

  function addSource() {
    setSources((current) => [...current, { label: '', url: '' }]);
  }

  /** Quita la última fuente; si el texto tiene citas a ella, lo dice antes. */
  async function removeLastSource() {
    const count = sources().length;
    if (count === 0) return;
    const cited = citationsTo(sections(), count, count);
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
    setSources((current) => current.slice(0, -1));
  }

  /** Elegir fuentes de la bibliografía e insertar la cita donde está el cursor. */
  async function cite() {
    const instance = editor();
    if (!instance) return;
    const numbers = await overlay.sheet(CitationSheet, {
      sources: sources(),
    });
    if (numbers) insertCitation(instance, numbers);
  }

  /** Lleva a la bibliografía y enfoca su primer campo (o, si no hay fuentes, el botón de agregar). */
  function goToSources() {
    const block = document.getElementById('bibliografia');
    block?.scrollIntoView?.({ block: 'start' });
    block?.querySelector<HTMLElement>('input, button')?.focus();
  }

  /** Cómo aparece un término del glosario en el texto (separado por comas). */
  function setGlossaryForms(term: string, text: string) {
    setLinks((current) => withForms(current, term, text));
  }

  function removeGlossaryLink(form: string) {
    setLinks((current) => withoutLink(current, form));
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
    const wasSaved = await save(toPublish);
    if (!wasSaved) {
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
    sections,
    editor,
    ready,
    currentId,
    inGlossary,
    openSettings,
    goTo,
    losses,
    renumbered,
    setSections,
    dirty,
    hasDraft,
    stale,
    saving,
    busy,
    problem,
    links,
    sources,
    setSourceField,
    addSource,
    removeLastSource,
    goToSources,
    cite,
    setGlossaryForms,
    removeGlossaryLink,
    save: () => save(),
    discard,
    publish,
    leave,
    reload: load,
  };
}

/** Lo que el editor le da a sus tarjetas de sección. */
export type EditorPageState = ReturnType<typeof useEditorPage>;
