import { ConfirmSheet, useOverlay } from '@colaboradocs/review-ui';

/** Pregunta en una hoja de confirmación; devuelve si se aceptó. */
export function useConfirm() {
  const overlay = useOverlay();
  return async function confirm(
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
  };
}

export type Confirm = ReturnType<typeof useConfirm>;
