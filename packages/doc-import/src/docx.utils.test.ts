import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { docxToDocument, htmlToDocument } from './docx.utils';

const fixture = fileURLToPath(
  new URL('./fixtures/reglamento.docx', import.meta.url),
);

describe('docxToDocument', () => {
  it('lee un .docx: Título 1 = título, Título 2 = secciones, Título 3 = grupos', async () => {
    const doc = await docxToDocument({ path: fixture }, { id: 'reglamento' });
    expect(doc.title).toBe('Reglamento de ejemplo');
    expect(doc.sections.map((s) => s.title)).toEqual([
      'Introducción',
      'Decisiones',
    ]);
    expect(doc.sections[0]?.html).toContain('<h3>Qué es</h3>');
    expect(doc.sections[0]?.html).toContain('<p>Otro párrafo.</p>');
  });

  it('convierte las tablas en un párrafo por fila y lo avisa', async () => {
    const doc = await docxToDocument({ path: fixture }, { id: 'reglamento' });
    expect(doc.sections[1]?.html).toContain('<p>Moderación · Ana</p>');
    expect(doc.sections[1]?.html).not.toContain('<table');
    expect(doc.warnings.join(' ')).toContain('tablas');
  });
});

describe('htmlToDocument', () => {
  it('sin Título 2, cada Título 1 es una sección', () => {
    const doc = htmlToDocument('<h1>Uno</h1><p>a</p><h1>Dos</h1><p>b</p>', {
      id: 'x',
      title: 'Mi doc',
    });
    expect(doc.sections.map((s) => s.title)).toEqual(['Uno', 'Dos']);
    expect(doc.title).toBe('Mi doc');
    expect(doc.warnings.join(' ')).toContain('Título 1');
  });

  it('sin títulos avisa cómo arreglarlo', () => {
    const doc = htmlToDocument('<p>solo texto</p>', { id: 'x' });
    expect(doc.sections).toHaveLength(0);
    expect(doc.warnings.join(' ')).toContain('Título 2');
  });

  it('quita las imágenes y lo avisa', () => {
    const doc = htmlToDocument('<h2>A</h2><p>x</p><img src="data:abc">', {
      id: 'x',
    });
    expect(doc.sections[0]?.html).not.toContain('<img');
    expect(doc.warnings.join(' ')).toContain('imágenes');
  });
});
