export interface History<T> {
  past: T[];
  future: T[];
}

export const emptyHistory = <T>(): History<T> => ({ past: [], future: [] });

/** Guarda `snapshot` (el estado antes del cambio); un cambio nuevo borra lo que se podía rehacer. */
export function record<T>(
  history: History<T>,
  snapshot: T,
  limit = 100,
): History<T> {
  return { past: [...history.past, snapshot].slice(-limit), future: [] };
}

export function undo<T>(
  history: History<T>,
  present: T,
): { history: History<T>; value: T } | null {
  const value = history.past.at(-1);
  if (value === undefined) return null;
  return {
    value,
    history: {
      past: history.past.slice(0, -1),
      future: [present, ...history.future],
    },
  };
}

export function redo<T>(
  history: History<T>,
  present: T,
): { history: History<T>; value: T } | null {
  const value = history.future[0];
  if (value === undefined) return null;
  return {
    value,
    history: {
      past: [...history.past, present],
      future: history.future.slice(1),
    },
  };
}
