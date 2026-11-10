import { describe, expect, it } from 'vitest';
import { fullyApprovedBlocks, groupApprovals } from './approvals.utils';

describe('groupApprovals', () => {
  it('agrupa por bloque sin repetir revisores', () => {
    const grouped = groupApprovals([
      { blockId: 'b1', reviewerId: 'u1' },
      { blockId: 'b1', reviewerId: 'u1' },
      { blockId: 'b1', reviewerId: 'u2' },
      { blockId: 'b2', reviewerId: 'u1' },
    ]);
    expect(grouped.get('b1')).toEqual(['u1', 'u2']);
    expect(grouped.get('b2')).toEqual(['u1']);
  });
});

describe('fullyApprovedBlocks', () => {
  const approvals = [
    { blockId: 'b1', reviewerId: 'u1' },
    { blockId: 'b1', reviewerId: 'u2' },
    { blockId: 'b2', reviewerId: 'u1' },
  ];

  it('devuelve los bloques con OK de todos los revisores', () => {
    expect(fullyApprovedBlocks(approvals, ['u1', 'u2'])).toEqual(['b1']);
  });

  it('sin revisores no hay bloques aprobados', () => {
    expect(fullyApprovedBlocks(approvals, [])).toEqual([]);
  });
});
