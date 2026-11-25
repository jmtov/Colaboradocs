import type { DocumentContent } from '@colaboradocs/review-core';
import { useReview } from '@colaboradocs/review-ui';
import { createEffect, createMemo, createSignal, onCleanup } from 'solid-js';
import {
  type AffectedBlock,
  affectedBlocks,
  renumberedSections,
} from '../affected.utils';
import type { EditorDraft } from './draft.hooks';

/** Lo que los cambios le harían a la revisión: comentarios y OK que se pierden y secciones que cambian de número. */
export function useEditorImpact(draft: EditorDraft) {
  const review = useReview();

  /** Lo que se ve en el aviso: se recalcula cuando se deja de escribir un momento. */
  const [settled, setSettled] = createSignal<DocumentContent | null>(null);
  createEffect(() => {
    const current = draft.content();
    const timer = setTimeout(() => setSettled(current), 400);
    onCleanup(() => clearTimeout(timer));
  });

  /** Lo que se perdería, en bloques con comentarios u OK, frente a lo publicado. */
  function lossesFor(next: DocumentContent | null): AffectedBlock[] {
    const before = draft.published();
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
    const before = draft.published();
    const next = settled();
    return before && next ? renumberedSections(before, next) : [];
  });

  return { lossesFor, losses, renumbered };
}

export type EditorImpact = ReturnType<typeof useEditorImpact>;
