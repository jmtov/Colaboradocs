import type { SheetLayerProps } from '@colaboradocs/review-ui';
import type { LinkState } from '@/Editor/link.commands';

/** Resuelve con la dirección (y el texto, si no había selección) o con `remove`; sin resultado si se cancela. */
export type LinkResult = { url: string; text: string } | { remove: true };

export type LinkSheetProps = SheetLayerProps<LinkResult> & {
  state: LinkState;
};
