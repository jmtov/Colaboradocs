import { approversOf, formatReviewerLabel } from '@colaboradocs/review-core';
import { useReview } from '../ReviewProvider/review.context';
import { formatApprovalTime } from './ApprovalsSheet.utils';

/** Quién dio OK a un bloque y cuándo; se actualiza con la revisión. */
export function useApprovalsSheet(blockId: () => string) {
  const review = useReview();

  const rows = () => {
    const snapshot = review.snapshot();
    if (!snapshot) return [];
    return approversOf(snapshot.approvals, blockId()).map((approver) => ({
      id: approver.reviewerId,
      who: formatReviewerLabel(snapshot.reviewers[approver.reviewerId]),
      iso: approver.createdAt,
      when: formatApprovalTime(approver.createdAt),
    }));
  };

  return { rows };
}
