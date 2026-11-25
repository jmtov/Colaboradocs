import { createSignal } from 'solid-js';
import type { DocumentFilters, FiltersSheetProps } from './FiltersSheet.types';

/** El tipo elegido en la hoja (parte del que ya estaba aplicado) y cómo terminarla. */
export function useFiltersSheet(props: FiltersSheetProps) {
  const [kind, setKind] = createSignal(props.kind);
  const done = (filters: DocumentFilters) => props.close(filters);

  return {
    kind,
    setKind,
    apply: () => done({ kind: kind() }),
    clear: () => done({ kind: null }),
  };
}
