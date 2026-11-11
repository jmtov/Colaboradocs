import { useHowToReview } from './HowToReview.hooks';

/**
 * Programa la guía «Cómo revisar»: se abre sola al entrar a un documento, hasta que
 * se elige «No volver a mostrar». No dibuja nada; la hoja es `HowToSheet`.
 */
export default function HowToReview() {
  useHowToReview();
  return null;
}
