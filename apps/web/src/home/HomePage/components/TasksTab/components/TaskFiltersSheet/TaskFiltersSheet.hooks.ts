import { useOverlay } from '@colaboradocs/review-ui';
import { createSignal } from 'solid-js';
import DocumentPickerSheet from '../DocumentPickerSheet/DocumentPickerSheet';
import type { TaskFiltersSheetProps } from './TaskFiltersSheet.types';

/** Los documentos elegidos en la hoja (parten de los que ya estaban aplicados) y cómo terminarla. */
export function useTaskFiltersSheet(props: TaskFiltersSheetProps) {
  const overlay = useOverlay();
  const [documentIds, setDocumentIds] = createSignal(props.documentIds);

  return {
    /** Lo que dice la fila: «Todos», el título del documento o «3 documentos». */
    summary: () => {
      const chosen = documentIds();
      if (chosen.length === 0) return 'Todos';
      if (chosen.length > 1) return `${chosen.length} documentos`;
      return (
        props.documents.find((item) => item.id === chosen[0])?.title ??
        '1 documento'
      );
    },
    pickDocuments: async () => {
      const result = await overlay.sheet(DocumentPickerSheet, {
        documents: props.documents,
        selected: documentIds(),
      });
      if (result) setDocumentIds(result);
    },
    apply: () => props.close({ documentIds: documentIds() }),
    clear: () => props.close({ documentIds: [] }),
  };
}
