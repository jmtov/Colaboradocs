import type { SheetLayerProps } from '@juntanza/review-ui';

/** `target`: `{}` documento nuevo, `{ replaceId }`: reemplaza ese documento. */
export type UploadSheetProps = SheetLayerProps & {
  target: { replaceId?: string };
};

export type Problem = { message: string; details: string[] };
