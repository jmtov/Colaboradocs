import type { SheetLayerProps } from '@colaboradocs/review-ui';
import type { AffectedBlock } from '../../affected.utils';

/** Resuelve con la versión a publicar, o sin resultado si se cancela. */
export type PublishSheetProps = SheetLayerProps<string> & {
  version: string;
  /** Bloques con comentarios u OK que dejarían de aplicar. */
  affected: AffectedBlock[];
};
