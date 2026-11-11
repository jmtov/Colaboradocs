import type { SheetLayerProps } from '@colaboradocs/review-ui';
import type { DocumentSection } from '@/content/content.types';
import type { SectionAttrs } from '@/Editor/section.commands';

/** Lo que se decidió: los datos nuevos de la sección, o borrarla. Sin resultado si se cancela. */
export type SectionSheetResult = { attrs: SectionAttrs } | { remove: true };

export type SectionSheetProps = SheetLayerProps<SectionSheetResult> & {
  section: DocumentSection;
  /** El documento no se queda sin secciones: con una sola no se puede borrar. */
  canRemove: boolean;
};
