import { useOverlay, useReview } from '@colaboradocs/review-ui';
import UploadSheet from '@/DocumentsPage/components/UploadSheet/UploadSheet';

/** Estado y acciones de la home: si quien mira es admin, si hay conexión y subir un documento nuevo. */
export function useHomePage() {
  const review = useReview();
  const overlay = useOverlay();

  const isAdmin = () =>
    (review.snapshot()?.me ?? review.session()?.reviewer)?.isAdmin === true;

  return {
    isAdmin,
    offline: () => review.status() === 'error',
    openUpload: () => void overlay.sheet(UploadSheet, { target: {} }),
  };
}
