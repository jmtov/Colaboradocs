import { describe, expect, it } from 'vitest';
import type { DocumentKind, DocumentListItem } from './document.types';
import { groupDocuments } from './document-groups.utils';

const item = (
  id: string,
  tipo: DocumentKind,
  updated = '2026-11-01',
): DocumentListItem => ({
  id,
  title: id,
  description: null,
  version: '0.1',
  updated,
  tipo,
  responsable: null,
  participantes: null,
  openThreads: 0,
  comments: 0,
  approvals: 0,
  lastActivityAt: null,
});

describe('groupDocuments', () => {
  it('iniciativas arriba (por título), actas después (la más reciente primero), luego guías y otros', () => {
    const { groups, titled } = groupDocuments([
      item('otro-1', 'otro'),
      item('acta-vieja', 'acta', '2026-10-01'),
      item('ini-b', 'iniciativa'),
      item('guia-1', 'guia'),
      item('acta-nueva', 'acta', '2026-11-20'),
      item('ini-a', 'iniciativa'),
    ]);
    expect(titled).toBe(true);
    expect(groups.map((g) => g.kind)).toEqual([
      'iniciativa',
      'acta',
      'guia',
      'otro',
    ]);
    expect(groups[0]?.items.map((i) => i.id)).toEqual(['ini-a', 'ini-b']);
    expect(groups[1]?.items.map((i) => i.id)).toEqual([
      'acta-nueva',
      'acta-vieja',
    ]);
  });

  it('sin grupos vacíos, y con un solo grupo no hay encabezados', () => {
    const { groups, titled } = groupDocuments([item('a', 'otro')]);
    expect(groups).toHaveLength(1);
    expect(titled).toBe(false);
  });

  it('un tipo desconocido o ausente cae en «otro»', () => {
    const odd = {
      ...item('x', 'otro'),
      tipo: undefined,
    } as unknown as DocumentListItem;
    expect(groupDocuments([odd]).groups[0]?.kind).toBe('otro');
  });
});
