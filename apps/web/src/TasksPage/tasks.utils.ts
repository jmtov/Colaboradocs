import type { TaskGroupKey } from '@colaboradocs/review-core';

/** Título de cada grupo de la lista. */
export const GROUP_TITLES: Record<TaskGroupKey, string> = {
  overdue: 'Vencidas',
  week: 'Esta semana',
  later: 'Más adelante',
  done: 'Hechas',
};
