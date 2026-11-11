import {
  type BlockApproval,
  excerptOf,
  type ReviewComment,
} from '@colaboradocs/review-core';
import type { DocumentContent } from '@/content/content.types';
import { buildProse } from '@/Prose/buildProse';

/** Un bloque publicado que ya no existirá tal cual y que tiene comentarios u OK. */
export type AffectedBlock = {
  blockId: string;
  /** Primeras palabras del bloque publicado. */
  excerpt: string;
  /** Comentarios (sin contar los borrados) y OK que dejarían de aplicar. */
  comments: number;
  approvals: number;
};

/** Id y texto de cada bloque revisable de un documento, tal como los ve la página. */
function blocksOf(content: DocumentContent): Map<string, string> {
  const blocks = new Map<string, string>();
  for (const section of content.sections) {
    const root = buildProse(section.html, {
      sectionId: section.id,
      reviewable: true,
    });
    for (const element of root.querySelectorAll('[data-block-id]')) {
      const id = element.getAttribute('data-block-id');
      if (id) blocks.set(id, element.textContent ?? '');
    }
  }
  return blocks;
}

/**
 * Qué comentarios y OK dejarían de aplicar si `draft` reemplazara a
 * `published`: los de bloques que existen hoy y ya no existirán (el id sale
 * del texto, así que editarlo cambia el id). No cuenta lo que ya estaba huérfano.
 */
export function affectedBlocks(
  published: DocumentContent,
  draft: DocumentContent,
  comments: ReviewComment[],
  approvals: BlockApproval[],
): AffectedBlock[] {
  const before = blocksOf(published);
  const after = blocksOf(draft);
  const lost = (blockId: string) => before.has(blockId) && !after.has(blockId);

  const byBlock = new Map<string, AffectedBlock>();
  const entry = (blockId: string): AffectedBlock => {
    const found = byBlock.get(blockId);
    if (found) return found;
    const created = {
      blockId,
      excerpt: excerptOf(before.get(blockId) ?? ''),
      comments: 0,
      approvals: 0,
    };
    byBlock.set(blockId, created);
    return created;
  };

  for (const comment of comments) {
    if (comment.text !== null && lost(comment.blockId)) {
      entry(comment.blockId).comments += 1;
    }
  }
  for (const approval of approvals) {
    if (lost(approval.blockId)) entry(approval.blockId).approvals += 1;
  }
  return [...byBlock.values()];
}
