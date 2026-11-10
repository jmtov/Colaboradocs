import { describe, expect, it } from 'vitest';
import { markdownToDocument } from './markdown.utils';

const md = `# Mi reglamento

texto suelto que se ignora

## Introducción

Un párrafo con **negrita** y *cursiva*.

### Grupo

- uno
- dos

## Introducción

1. primero
2. segundo
`;

describe('markdownToDocument', () => {
  const doc = markdownToDocument(md, { id: 'reglamento' });

  it('toma el título del # y crea una sección por ##', () => {
    expect(doc.title).toBe('Mi reglamento');
    expect(doc.sections.map((s) => s.num)).toEqual(['1', '2']);
    expect(doc.sections[0]?.html).toContain('<strong>negrita</strong>');
    expect(doc.sections[0]?.html).toContain('<h3>Grupo</h3>');
    expect(doc.sections[0]?.html).toContain(
      '<ul><li>uno</li><li>dos</li></ul>',
    );
  });

  it('deja ids únicos aunque se repita el título', () => {
    expect(doc.sections.map((s) => s.id)).toEqual([
      'introduccion',
      'introduccion-2',
    ]);
  });

  it('--title manda sobre el #', () => {
    expect(markdownToDocument(md, { id: 'x', title: 'Otro' }).title).toBe(
      'Otro',
    );
  });
});
