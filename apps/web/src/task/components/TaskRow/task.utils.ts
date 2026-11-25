import type { DueState } from '@colaboradocs/review-core';

/** «vie, 21 nov» a partir de AAAA-MM-DD (el día no se corre por la zona horaria). */
export function formatDueDate(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number);
  if (!year || !month || !day) return iso;
  return new Date(year, month - 1, day).toLocaleDateString('es', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

/** La etiqueta de estado junto a la fecha; las que no urgen no llevan. */
export function dueLabel(state: DueState): string | null {
  switch (state) {
    case 'overdue':
      return 'Vencida';
    case 'today':
      return 'Hoy';
    default:
      return null;
  }
}
