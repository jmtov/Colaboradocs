// @vitest-environment happy-dom
import type { BlockApproval, ReviewComment } from '@colaboradocs/review-core';
import { describe, expect, it } from 'vitest';
import type { DocumentContent } from '@/content/content.types';
import { buildProse } from '@/Prose/buildProse';
import { affectedBlocks } from './affected.utils';

function doc(html: string): DocumentContent {
  return {
    id: 'd',
    title: 'D',
    version: '1',
    updated: '2026-01-01',
    sources: [],
    sections: [{ id: 's', num: '1', title: 'S', status: 'listo', html }],
  };
}

const idOf = (html: string, index: number) =>
  [
    ...buildProse(html, { sectionId: 's', reviewable: true }).querySelectorAll(
      '[data-block-id]',
    ),
  ][index]?.getAttribute('data-block-id') ?? '';

function comment(blockId: string, text: string | null = 'hola'): ReviewComment {
  return {
    id: `c-${blockId}-${text}`,
    blockId,
    parentId: null,
    authorId: 'r',
    authorName: 'Ana',
    authorMunicipality: null,
    text,
    blockExcerpt: 'x',
    createdAt: '2026-01-01',
    resolved: false,
  };
}

const ok = (blockId: string): BlockApproval => ({
  blockId,
  reviewerId: 'r',
  createdAt: '2026-01-01',
});

const before = '<p>Uno</p><p>Dos</p><p>Tres</p>';

describe('affectedBlocks', () => {
  it('sin cambios no se pierde nada', () => {
    const a = idOf(before, 0);
    expect(
      affectedBlocks(doc(before), doc(before), [comment(a)], [ok(a)]),
    ).toEqual([]);
  });

  it('editar un párrafo pierde sus comentarios y OK, y lo dice con el texto original', () => {
    const [uno, dos] = [idOf(before, 0), idOf(before, 1)];
    const edited = '<p>Uno cambiado</p><p>Dos</p><p>Tres</p>';
    const result = affectedBlocks(
      doc(before),
      doc(edited),
      [comment(uno), comment(uno, 'otra'), comment(dos)],
      [ok(uno)],
    );
    expect(result).toEqual([
      { blockId: uno, excerpt: 'Uno', comments: 2, approvals: 1 },
    ]);
  });

  it('un OK solo, sin comentarios, también cuenta', () => {
    const tres = idOf(before, 2);
    const result = affectedBlocks(
      doc(before),
      doc('<p>Uno</p><p>Dos</p>'),
      [],
      [ok(tres)],
    );
    expect(result).toEqual([
      { blockId: tres, excerpt: 'Tres', comments: 0, approvals: 1 },
    ]);
  });

  it('un comentario borrado no cuenta, ni lo que ya estaba huérfano', () => {
    const uno = idOf(before, 0);
    const edited = '<p>Otro</p><p>Dos</p><p>Tres</p>';
    expect(
      affectedBlocks(
        doc(before),
        doc(edited),
        [comment(uno, null), comment('s-ya-no-existia')],
        [],
      ),
    ).toEqual([]);
  });

  it('mover un párrafo no lo pierde: el id sale del texto', () => {
    const uno = idOf(before, 0);
    const moved = '<p>Dos</p><p>Tres</p><p>Uno</p>';
    expect(
      affectedBlocks(doc(before), doc(moved), [comment(uno)], [ok(uno)]),
    ).toEqual([]);
  });
});
