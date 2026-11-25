import type {
  DocumentContent,
  DocumentSection,
} from '@colaboradocs/review-core';
import { describe, expect, it } from 'vitest';
import {
  contentFrom,
  detailsOf,
  isDirty,
  type WorkingCopy,
} from './draft.utils';

const section: DocumentSection = {
  id: 's',
  num: '1',
  title: 'S',
  status: 'listo',
  html: '<p>x</p>',
};

const base: DocumentContent = {
  id: 'd',
  title: 'Título',
  version: '1',
  updated: '2026-01-01',
  sources: [{ label: 'Fuente', url: 'https://example.com' }],
  sections: [
    { id: 's', num: '1', title: 'S', status: 'listo', html: '<p>x</p>' },
  ],
};

const copyOf = (doc: DocumentContent): WorkingCopy => ({
  details: detailsOf(doc),
  sections: doc.sections,
  sources: doc.sources,
  links: doc.glossaryTerms ?? {},
  people: doc.peopleTerms ?? {},
});

describe('detailsOf', () => {
  it('sin documento, todo vacío y de clase «otro»', () => {
    expect(detailsOf(null)).toEqual({
      title: '',
      description: '',
      type: 'other',
      date: '',
      owner: '',
      attendees: '',
    });
  });

  it('toma los datos del documento', () => {
    const doc = { ...base, description: 'Resumen', owner: 'Ana' };
    expect(detailsOf(doc)).toMatchObject({
      title: 'Título',
      description: 'Resumen',
      owner: 'Ana',
    });
  });
});

describe('contentFrom', () => {
  it('sin cambios, devuelve el mismo documento (sin campos de la nada)', () => {
    expect(contentFrom(base, copyOf(base))).toEqual(base);
  });

  it('un campo vacío no se escribe y uno con valor sí', () => {
    const copy = copyOf(base);
    copy.details = { ...copy.details, description: 'Nuevo', owner: '' };
    const next = contentFrom({ ...base, owner: 'Ana' }, copy);
    expect(next.description).toBe('Nuevo');
    expect('owner' in next).toBe(false);
  });

  it('los enlaces del glosario se escriben si ya existía el campo o si hay alguno', () => {
    const copy = copyOf(base);
    expect('glossaryTerms' in contentFrom(base, copy)).toBe(false);
    // Quitar todos los enlaces de un documento que los tenía deja el campo vacío, no el anterior.
    expect(
      contentFrom({ ...base, glossaryTerms: { cuentas: 'cuenta' } }, copy)
        .glossaryTerms,
    ).toEqual({});
    copy.links = { cuentas: 'cuenta' };
    expect(contentFrom(base, copy).glossaryTerms).toEqual({
      cuentas: 'cuenta',
    });
  });

  it('lleva las secciones y fuentes de la copia de trabajo', () => {
    const copy = copyOf(base);
    copy.sources = [];
    copy.sections = [{ ...section, title: 'Otro' }];
    const next = contentFrom(base, copy);
    expect(next.sources).toEqual([]);
    expect(next.sections[0]?.title).toBe('Otro');
  });
});

describe('isDirty', () => {
  it('sin cambios, no', () => {
    expect(isDirty(base, copyOf(base))).toBe(false);
  });

  it('cada parte de la copia de trabajo cuenta', () => {
    const edits: Array<(copy: WorkingCopy) => void> = [
      (c) => {
        c.details = { ...c.details, title: 'Otro' };
      },
      (c) => {
        c.details = { ...c.details, attendees: 'Ana' };
      },
      (c) => {
        c.sections = [{ ...section, html: '<p>y</p>' }];
      },
      (c) => {
        c.sources = [];
      },
      (c) => {
        c.links = { a: 'b' };
      },
      (c) => {
        c.people = { Ana: 'Ana Pérez' };
      },
    ];
    for (const edit of edits) {
      const copy = copyOf(base);
      edit(copy);
      expect(isDirty(base, copy)).toBe(true);
    }
  });
});
