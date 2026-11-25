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
  type: DocumentKind,
  updated = '2026-11-01',
): DocumentListItem => ({
  id,
  title: id,
  description: null,
  version: '0.1',
  updated,
  type,
  date: null,
  owner: null,
  attendees: null,
  openThreads: 0,
  comments: 0,
  approvals: 0,
  lastActivityAt: null,
});

const doc = (
  id: string,
  type: DocumentKind,
  extra: Partial<DocumentListItem> = {},
): DocumentListItem => ({ ...item(id, type), ...extra });

describe('sortDocuments', () => {
  it('iniciativas primero (por título), actas después (la más reciente primero), luego guías y otros', () => {
    const sorted = sortDocuments([
      item('otro-1', 'other'),
      item('acta-vieja', 'minutes', '2026-10-01'),
      item('ini-b', 'initiative'),
      item('guia-1', 'guide'),
      item('acta-nueva', 'minutes', '2026-11-20'),
      item('ini-a', 'initiative'),
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
      ...item('x', 'other'),
      type: undefined,
    } as unknown as DocumentListItem;
    expect(kindOf(odd)).toBe('other');
  });
});

describe('sortDocuments con fecha', () => {
  it('las actas van por la fecha de la reunión; sin ella, por `updated`', () => {
    const sorted = sortDocuments([
      doc('vieja-publicada-ayer', 'minutes', {
        date: '2026-10-01',
        updated: '2026-11-24',
      }),
      doc('sin-fecha', 'minutes', { updated: '2026-11-10' }),
      doc('nueva', 'minutes', { date: '2026-11-20', updated: '2026-11-21' }),
    ]);
    expect(sorted.map((i) => i.id)).toEqual([
      'nueva',
      'sin-fecha',
      'vieja-publicada-ayer',
    ]);
  });

  it('documentDate usa la fecha y, sin ella, updated', () => {
    expect(documentDate(doc('a', 'minutes', { date: '2026-01-02' }))).toBe(
      '2026-01-02',
    );
    expect(documentDate(doc('b', 'minutes', { updated: '2026-03-04' }))).toBe(
      '2026-03-04',
    );
  });
});

describe('countKinds', () => {
  it('cuenta por tipo y omite los vacíos', () => {
    const counts = countKinds([
      item('a', 'minutes'),
      item('b', 'minutes'),
      item('c', 'initiative'),
    ]);
    expect(counts.map((c) => [c.kind, c.count])).toEqual([
      ['initiative', 1],
      ['minutes', 2],
    ]);
  });
});

describe('filterDocuments', () => {
  const items = [
    doc('1', 'initiative', { title: 'Ejes y participación 2027' }),
    doc('2', 'minutes', {
      title: 'Reunión de comunicaciones',
      attendees: 'Quique, Daniela Montañez',
    }),
    doc('3', 'guide', { title: 'Cómo votar', description: 'Paso a paso' }),
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
    expect(ids(filterDocuments(items, { query: '', kind: 'minutes' }))).toEqual(
      ['2'],
    );
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
      ids(filterDocuments(items, { query: 'reunion', kind: 'guide' })),
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
