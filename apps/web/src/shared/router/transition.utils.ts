/** Duración de la transición de un elemento según el CSS, en ms (0 con «reducir movimiento» o sin elemento). */
export function transitionMs(element: HTMLElement | undefined): number {
  if (!element) return 0;
  const first =
    window
      .getComputedStyle(element)
      .transitionDuration?.split(',')[0]
      ?.trim() ?? '';
  const seconds = first.endsWith('ms')
    ? Number.parseFloat(first) / 1000
    : Number.parseFloat(first);
  return Number.isFinite(seconds) ? seconds * 1000 : 0;
}
