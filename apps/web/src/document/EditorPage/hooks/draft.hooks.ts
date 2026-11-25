import type {
  DocumentContent,
  DocumentSection,
  DocumentSource,
} from '@colaboradocs/review-core';
import { useReview } from '@colaboradocs/review-ui';
import {
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
  untrack,
} from 'solid-js';
import { contentFrom, detailsOf, isDirty } from '../draft.utils';
import type { EditorProblem } from '../EditorPage.types';
import { type GlossaryLinks, parseGlossary } from '../glossary.utils';
import {
  type GlossaryState,
  joinGlossary,
  splitGlossary,
} from '../section.utils';

type Status = 'loading' | 'ready' | 'error';

/**
 * La copia de trabajo del documento: parte del borrador si lo hay (si no, de lo publicado) y lleva
 * por separado lo que se edita (secciones, glosario, enlaces, personas, fuentes, datos). `base` es
 * lo último guardado y `content` lo que se guardaría.
 */
export function useEditorDraft(id: () => string) {
  const review = useReview();

  const [status, setStatus] = createSignal<Status>('loading');
  const [loadError, setLoadError] = createSignal('');
  const [base, setBase] = createSignal<DocumentContent | null>(null);
  const [published, setPublished] = createSignal<DocumentContent | null>(null);
  // Las secciones tal como se están editando (el glosario va aparte, fuera del editor).
  const [sections, setSections] = createSignal<DocumentSection[]>([]);
  const [glossary, setGlossary] = createSignal<GlossaryState>({
    html: '',
    at: 0,
  });
  const saved = createMemo(() => joinGlossary(sections(), glossary()));
  const glossaryParts = createMemo(() => parseGlossary(glossary().html));
  // Los enlaces automáticos del glosario (`glossaryTerms`).
  const [links, setLinks] = createSignal<GlossaryLinks>({});
  // Las personas del texto (`peopleTerms`): cómo se escribe -> nombre registrado.
  const [people, setPeople] = createSignal<Record<string, string>>({});
  // La bibliografía (`sources`).
  const [sources, setSources] = createSignal<DocumentSource[]>([]);
  // El título y la descripción, y los demás datos de la tarjeta.
  const [details, setDetails] = createSignal(detailsOf(null));
  const [revision, setRevision] = createSignal(0);
  const [stale, setStale] = createSignal(false);
  const [problem, setProblem] = createSignal<EditorProblem | null>(null);

  const copy = () => ({
    details: details(),
    sections: saved(),
    sources: sources(),
    links: links(),
    people: people(),
  });

  /** El documento tal como quedaría. */
  const content = createMemo<DocumentContent | null>(() => {
    const current = base();
    return current ? contentFrom(current, copy()) : null;
  });

  const dirty = createMemo(() => {
    const last = base();
    return last ? isDirty(last, copy()) : false;
  });
  const hasDraft = () => revision() > 0;

  // La pestaña lleva el título del documento (el que se está editando, no el publicado) y,
  // al salir, vuelve al del espacio.
  const spaceTitle = document.title;
  createEffect(() => {
    const title = details().title;
    if (title) document.title = `${title} · Editando`;
  });
  onCleanup(() => {
    document.title = spaceTitle;
  });

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
    const split = splitGlossary(base()?.sections ?? []);
    setSections(split.main);
    setGlossary(split.glossary);
    setLinks(base()?.glossaryTerms ?? {});
    setPeople(base()?.peopleTerms ?? {});
    setSources(base()?.sources ?? []);
    setDetails(detailsOf(base()));
    setRevision(draft.value ? draft.value.revision : 0);
    setStale(draft.value ? draft.value.stale : false);
    setStatus('ready');
  }

  onMount(() => {
    void load();
  });

  // Avisar antes de cerrar la pestaña con cambios sin guardar.
  const warn = (event: BeforeUnloadEvent) => {
    if (untrack(dirty)) event.preventDefault();
  };
  window.addEventListener('beforeunload', warn);
  onCleanup(() => window.removeEventListener('beforeunload', warn));

  return {
    status,
    loadError,
    base,
    setBase,
    published,
    sections,
    setSections,
    glossary,
    setGlossary,
    glossaryParts,
    links,
    setLinks,
    people,
    setPeople,
    sources,
    setSources,
    details,
    setDetails,
    revision,
    setRevision,
    stale,
    setStale,
    problem,
    setProblem,
    content,
    dirty,
    hasDraft,
    reload: load,
  };
}

export type EditorDraft = ReturnType<typeof useEditorDraft>;
