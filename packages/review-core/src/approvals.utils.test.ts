import { describe, expect, it } from 'vitest';
import {
  approversOf,
  fullyApprovedBlocks,
  groupApprovals,
} from './approvals.utils';

const AT = '2026-11-10T10:00:00.000Z';

describe('groupApprovals', () => {
  it('agrupa por bloque sin repetir revisores', () => {
    const grouped = groupApprovals([
      { blockId: 'b1', reviewerId: 'u1', createdAt: AT },
      { blockId: 'b1', reviewerId: 'u1', createdAt: AT },
      { blockId: 'b1', reviewerId: 'u2', createdAt: AT },
      { blockId: 'b2', reviewerId: 'u1', createdAt: AT },
    ]);
    expect(grouped.get('b1')).toEqual(['u1', 'u2']);
    expect(grouped.get('b2')).toEqual(['u1']);
  });
});

describe('fullyApprovedBlocks', () => {
  const approvals = [
    { blockId: 'b1', reviewerId: 'u1', createdAt: AT },
    { blockId: 'b1', reviewerId: 'u2', createdAt: AT },
    { blockId: 'b2', reviewerId: 'u1', createdAt: AT },
  ];

  it('devuelve los bloques con OK de todos los revisores', () => {
    expect(fullyApprovedBlocks(approvals, ['u1', 'u2'])).toEqual(['b1']);
  });

  it('sin revisores no hay bloques aprobados', () => {
    expect(fullyApprovedBlocks(approvals, [])).toEqual([]);
  });
});

describe('approversOf', () => {
  const approvals = [
    { blockId: 'b1', reviewerId: 'u2', createdAt: '2026-11-10T12:00:00.000Z' },
    { blockId: 'b2', reviewerId: 'u1', createdAt: '2026-11-10T08:00:00.000Z' },
    { blockId: 'b1', reviewerId: 'u1', createdAt: '2026-11-10T09:00:00.000Z' },
  ];

  it('lista quién dio OK a ese bloque y cuándo, del más antiguo al más reciente', () => {
    expect(approversOf(approvals, 'b1')).toEqual([
      { reviewerId: 'u1', createdAt: '2026-11-10T09:00:00.000Z' },
      { reviewerId: 'u2', createdAt: '2026-11-10T12:00:00.000Z' },
    ]);
  });

  it('un bloque sin OK da una lista vacía', () => {
    expect(approversOf(approvals, 'nada')).toEqual([]);
  });
});
