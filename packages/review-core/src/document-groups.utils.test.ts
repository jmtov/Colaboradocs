import { describe, expect, it } from 'vitest';
import type { DocumentKind, DocumentListItem } from './document.types';
import {
  countKinds,
  documentDate,
  filterDocuments,
  kindOf,
  sortDocuments,
  summarizePeople,
} from './document-groups.utils';

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
  date: null,
  responsable: null,
  participantes: null,
  openThreads: 0,
  comments: 0,
  approvals: 0,
  lastActivityAt: null,
});

const doc = (
  id: string,
  tipo: DocumentKind,
  extra: Partial<DocumentListItem> = {},
): DocumentListItem => ({ ...item(id, tipo), ...extra });

describe('sortDocuments', () => {
  it('iniciativas primero (por título), actas después (la más reciente primero), luego guías y otros', () => {
    const sorted = sortDocuments([
      item('otro-1', 'otro'),
      item('acta-vieja', 'acta', '2026-10-01'),
      item('ini-b', 'iniciativa'),
      item('guia-1', 'guia'),
      item('acta-nueva', 'acta', '2026-11-20'),
      item('ini-a', 'iniciativa'),
    ]);
    expect(sorted.map((i) => i.id)).toEqual([
      'ini-a',
      'ini-b',
      'acta-nueva',
      'acta-vieja',
      'guia-1',
      'otro-1',
    ]);
  });

  it('un tipo desconocido o ausente cae en «otro»', () => {
    const odd = {
      ...item('x', 'otro'),
      tipo: undefined,
    } as unknown as DocumentListItem;
    expect(kindOf(odd)).toBe('otro');
  });
});

describe('sortDocuments con fecha', () => {
  it('las actas van por la fecha de la reunión; sin ella, por `updated`', () => {
    const sorted = sortDocuments([
      doc('vieja-publicada-ayer', 'acta', {
        date: '2026-10-01',
        updated: '2026-11-24',
      }),
      doc('sin-fecha', 'acta', { updated: '2026-11-10' }),
      doc('nueva', 'acta', { date: '2026-11-20', updated: '2026-11-21' }),
    ]);
    expect(sorted.map((i) => i.id)).toEqual([
      'nueva',
      'sin-fecha',
      'vieja-publicada-ayer',
    ]);
  });

  it('documentDate usa la fecha y, sin ella, updated', () => {
    expect(documentDate(doc('a', 'acta', { date: '2026-01-02' }))).toBe(
      '2026-01-02',
    );
    expect(documentDate(doc('b', 'acta', { updated: '2026-03-04' }))).toBe(
      '2026-03-04',
    );
  });
});

describe('countKinds', () => {
  it('cuenta por tipo y omite los vacíos', () => {
    const counts = countKinds([
      item('a', 'acta'),
      item('b', 'acta'),
      item('c', 'iniciativa'),
    ]);
    expect(counts.map((c) => [c.kind, c.count])).toEqual([
      ['iniciativa', 1],
      ['acta', 2],
    ]);
  });
});

describe('filterDocuments', () => {
  const items = [
    doc('1', 'iniciativa', { title: 'Ejes y participación 2027' }),
    doc('2', 'acta', {
      title: 'Reunión de comunicaciones',
      participantes: 'Quique, Daniela Montañez',
    }),
    doc('3', 'guia', { title: 'Cómo votar', description: 'Paso a paso' }),
  ];
  const ids = (list: DocumentListItem[]) => list.map((i) => i.id);

  it('sin filtro devuelve todo', () => {
    expect(ids(filterDocuments(items, { query: '  ', kind: null }))).toEqual([
      '1',
      '2',
      '3',
    ]);
  });

  it('filtra por tipo', () => {
    expect(ids(filterDocuments(items, { query: '', kind: 'acta' }))).toEqual([
      '2',
    ]);
  });

  it('busca sin importar tildes ni mayúsculas, en título, descripción y personas', () => {
    const find = (query: string) =>
      ids(filterDocuments(items, { query, kind: null }));
    expect(find('participacion')).toEqual(['1']);
    expect(find('COMO')).toEqual(['3']);
    expect(find('paso')).toEqual(['3']);
    expect(find('montanez')).toEqual(['2']);
  });

  it('todas las palabras deben coincidir, y el nombre del tipo cuenta', () => {
    expect(
      ids(filterDocuments(items, { query: 'reunion quique', kind: null })),
    ).toEqual(['2']);
    expect(
      ids(filterDocuments(items, { query: 'reunion votar', kind: null })),
    ).toEqual([]);
    expect(ids(filterDocuments(items, { query: 'guía', kind: null }))).toEqual([
      '3',
    ]);
  });

  it('combina tipo y texto', () => {
    expect(
      ids(filterDocuments(items, { query: 'reunion', kind: 'guia' })),
    ).toEqual([]);
  });
});

describe('summarizePeople', () => {
  it('con tres o menos, los muestra todos', () => {
    expect(summarizePeople('Ana, Luis, Eva')).toEqual({
      shown: ['Ana', 'Luis', 'Eva'],
      more: 0,
    });
  });

  it('con más, muestra tres y cuenta el resto', () => {
    expect(summarizePeople('A, B, C, D, E')).toEqual({
      shown: ['A', 'B', 'C'],
      more: 2,
    });
  });

  it('ignora espacios y comas vacías', () => {
    expect(summarizePeople(' A ,, B, ')).toEqual({
      shown: ['A', 'B'],
      more: 0,
    });
  });
});
