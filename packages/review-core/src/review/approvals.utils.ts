import type { BlockApproval } from './review.types';

/** Revisores que dieron OK, por bloque. */
export function groupApprovals(
  approvals: BlockApproval[],
): Map<string, string[]> {
  const byBlock = new Map<string, string[]>();
  for (const { blockId, reviewerId } of approvals) {
    const list = byBlock.get(blockId) ?? [];
    if (!list.includes(reviewerId)) list.push(reviewerId);
    byBlock.set(blockId, list);
  }
  return byBlock;
}

/** Quién dio OK a un bloque y cuándo, del más antiguo al más reciente. */
export function approversOf(
  approvals: BlockApproval[],
  blockId: string,
): { reviewerId: string; createdAt: string }[] {
  return approvals
    .filter((approval) => approval.blockId === blockId)
    .map(({ reviewerId, createdAt }) => ({ reviewerId, createdAt }))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** Bloques con OK de todos los revisores dados (o de ninguno si no hay). */
export function fullyApprovedBlocks(
  approvals: BlockApproval[],
  reviewerIds: string[],
): string[] {
  if (reviewerIds.length === 0) return [];
  const byBlock = groupApprovals(approvals);
  return [...byBlock.entries()]
    .filter(([, ids]) => reviewerIds.every((id) => ids.includes(id)))
    .map(([blockId]) => blockId);
}
