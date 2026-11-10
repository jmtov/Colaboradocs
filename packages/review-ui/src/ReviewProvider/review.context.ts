import { createContext, useContext } from 'solid-js';
import type { ReviewStore } from '../store/createReviewStore';

export const ReviewContext = createContext<ReviewStore>();

export function useReview(): ReviewStore {
  const store = useContext(ReviewContext);
  if (!store) throw new Error('useReview necesita un <ReviewProvider>.');
  return store;
}
