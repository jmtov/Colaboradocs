import { createSignal } from 'solid-js';
import { useReview } from '../../../ReviewProvider/review.context';

/** Estado y acciones de la hoja que muestra el PIN recién entregado. */
export function usePinResultSheet() {
  const review = useReview();
  const access = review.access;
  const [copied, setCopied] = createSignal(false);

  async function copy(pin: string) {
    try {
      await navigator.clipboard.writeText(pin);
      setCopied(true);
    } catch {
      review.flash('No se pudo copiar. Selecciónalo y cópialo a mano.');
    }
  }

  function close() {
    setCopied(false);
    access.clearIssued();
  }

  return {
    issued: access.issued,
    copied,
    copy,
    close,
  };
}
