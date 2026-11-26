import type { Editor } from '@tiptap/core';
import type { BlockStyle } from '@/document/editor/style.commands';

export type CompactActionsProps = {
  editor: Editor | undefined;
  /** El estilo donde está el cursor. */
  current: BlockStyle;
  onLink?: () => void;
  onMention?: () => void;
  onCite?: () => void;
  /** Solo para ubicarlo en la barra. */
  class?: string;
};
