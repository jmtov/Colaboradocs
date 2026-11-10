import { describe, expect, it } from 'vitest';
import type { ReviewComment } from './review.types';
import { groupThreads, openThreadCount } from './threads.utils';

function comment(
  id: string,
  overrides: Partial<ReviewComment> = {},
): ReviewComment {
  return {
    id,
    blockId: 'b1',
    parentId: null,
    authorId: 'u1',
    authorName: 'Ana',
    authorMunicipality: null,
    text: 'hola',
    blockExcerpt: 'extracto',
    createdAt: `2026-11-04T10:00:0${id.length}Z`,
    resolved: false,
    ...overrides,
  };
}

function groupedBlock(comments: ReviewComment[], blockId: string) {
  const threads = groupThreads(comments).get(blockId);
  if (!threads) throw new Error(`sin hilos para ${blockId}`);
  return threads;
}

describe('groupThreads', () => {
  it('agrupa por bloque y cuelga las respuestas de su raíz', () => {
    const threads = groupedBlock(
      [
        comment('r', { createdAt: '2026-11-04T10:00:00Z' }),
        comment('a', { parentId: 'r', createdAt: '2026-11-04T10:01:00Z' }),
        comment('b', { parentId: 'a', createdAt: '2026-11-04T10:02:00Z' }),
      ],
      'b1',
    );
    expect(threads).toHaveLength(1);
    expect(threads[0]?.replies.map((reply) => reply.id)).toEqual(['a', 'b']);
  });

  it('separa hilos de bloques distintos', () => {
    const grouped = groupThreads([
      comment('x', { blockId: 'b1' }),
      comment('y', { blockId: 'b2' }),
    ]);
    expect([...grouped.keys()].sort()).toEqual(['b1', 'b2']);
  });

  it('descarta respuestas cuyo padre no existe', () => {
    const grouped = groupThreads([comment('huerfana', { parentId: 'nada' })]);
    expect(grouped.size).toBe(0);
  });

  it('no se cuelga con ciclos de padres', () => {
    const grouped = groupThreads([
      comment('a', { parentId: 'b' }),
      comment('b', { parentId: 'a' }),
    ]);
    expect(grouped.size).toBe(0);
  });
});

describe('openThreadCount', () => {
  it('cuenta solo los hilos sin resolver', () => {
    const threads = groupedBlock(
      [comment('a'), comment('bb', { resolved: true })],
      'b1',
    );
    expect(openThreadCount(threads)).toBe(1);
  });
});
