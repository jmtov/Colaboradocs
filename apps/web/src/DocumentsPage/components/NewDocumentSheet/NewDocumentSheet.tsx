import { BottomSheet } from '@colaboradocs/review-ui';
import NewDocumentForm from '../NewDocumentForm/NewDocumentForm';
import type { NewDocumentSheetProps } from './NewDocumentSheet.types';

/** Crear un documento desde cero (la hoja de la página de documentos); la home lo ofrece dentro de «Subir documento». */
export default function NewDocumentSheet(props: NewDocumentSheetProps) {
  return (
    <BottomSheet
      open={props.open}
      kicker="Documentos"
      title="Nuevo documento"
      compact
      onClose={props.onClose}
    >
      <NewDocumentForm onCreated={() => props.close()} />
    </BottomSheet>
  );
}
