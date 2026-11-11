import { excerptOf, groupThreads } from '@juntanza/review-core';
import { createMemo } from 'solid-js';
import { useReview } from '../ReviewProvider/review.context';

type ThreadSheetOptions = {
  blockId: () => string;
  blockText: () => string;
};

export function useThreadSheet(options: ThreadSheetOptions) {
  const review = useReview();
  const threads = createMemo(
    () =>
      groupThreads(review.snapshot()?.comments ?? []).get(options.blockId()) ??
      [],
  );
  const excerpt = () => excerptOf(options.blockText());

  function submitComment(text: string) {
    return review.addComment({
      blockId: options.blockId(),
      parentId: null,
      text,
      blockExcerpt: excerpt(),
    });
  }

  return { threads, excerpt, submitComment };
}
