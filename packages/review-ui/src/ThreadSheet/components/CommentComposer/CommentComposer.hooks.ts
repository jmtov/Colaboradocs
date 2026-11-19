import {
  applyMention,
  filterPeople,
  findMentionQuery,
  type ReviewerLabel,
} from '@colaboradocs/review-core';
import { createMemo, createSignal } from 'solid-js';
import { useReview } from '../../../ReviewProvider/review.context';

/** Escribir «@» en un comentario abre la lista de personas; elegir una la inserta. */
export function useMentionPicker(
  text: () => string,
  setText: (value: string) => void,
) {
  const review = useReview();
  const [caret, setCaret] = createSignal(0);
  const [active, setActive] = createSignal(0);
  const [dismissedAt, setDismissedAt] = createSignal<number | null>(null);
  let field: HTMLTextAreaElement | undefined;

  const people = (): ReviewerLabel[] =>
    Object.values(review.snapshot()?.reviewers ?? {});
  const mention = createMemo(() => findMentionQuery(text(), caret()));
  const suggestions = createMemo(() => {
    const current = mention();
    if (!current || dismissedAt() === current.start) return [];
    return filterPeople(people(), current.query);
  });

  function track(element: HTMLTextAreaElement) {
    field = element;
    setCaret(element.selectionStart);
  }

  function onInput(element: HTMLTextAreaElement) {
    setText(element.value);
    setActive(0);
    track(element);
  }

  function pick(person: ReviewerLabel) {
    const current = mention();
    if (!current) return;
    const next = applyMention(text(), current, caret(), person.name);
    setText(next.text);
    setCaret(next.caret);
    // Sin esto, «@José Barrera » seguiría contando como una mención a medias.
    setDismissedAt(current.start);
    queueMicrotask(() => {
      field?.focus();
      field?.setSelectionRange(next.caret, next.caret);
    });
  }

  /** Devuelve true si la tecla se usó para la lista (hay que frenar su efecto). */
  function onKeyDown(event: KeyboardEvent): boolean {
    const options = suggestions();
    if (options.length === 0) return false;
    if (event.key === 'ArrowDown') {
      setActive((active() + 1) % options.length);
      return true;
    }
    if (event.key === 'ArrowUp') {
      setActive((active() - 1 + options.length) % options.length);
      return true;
    }
    if (event.key === 'Enter' || event.key === 'Tab') {
      const chosen = options[active()];
      if (chosen) pick(chosen);
      return true;
    }
    if (event.key === 'Escape') {
      setDismissedAt(mention()?.start ?? null);
      return true;
    }
    return false;
  }

  return { suggestions, active, onInput, track, pick, onKeyDown };
}
