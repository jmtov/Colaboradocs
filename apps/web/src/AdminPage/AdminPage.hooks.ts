import { useReview } from '@juntanza/review-ui';

/** Quién mira la página de administración: solo los admins ven su contenido. */
export function useAdminPage() {
  const review = useReview();

  return {
    isAdmin: () =>
      (review.snapshot()?.me ?? review.session()?.reviewer)?.isAdmin === true,
    offline: () => review.status() === 'error',
  };
}
