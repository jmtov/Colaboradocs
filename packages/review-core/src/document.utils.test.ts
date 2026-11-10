import { describe, expect, it } from 'vitest';
import {
  sanitizeSectionHtml,
  validateDocument,
  validateSpace,
} from './document.utils';

const valid = () => ({
  id: 'mi-doc',
  title: 'Mi documento',
  version: '0.1',
  updated: '2026-11-10',
  sources: [{ label: 'Acta', url: '' }],
  sections: [
    {
      id: 'intro',
      num: '1',
      title: 'Introducción',
      status: 'borrador',
      html: '<p>Hola</p>',
    },
  ],
});

describe('sanitizeSectionHtml', () => {
  it('deja las etiquetas que entiende la página, sin atributos', () => {
    expect(
      sanitizeSectionHtml(
        '<p class="x" onclick="evil()">Hola <strong style="a">tú</strong></p>',
      ),
    ).toBe('<p>Hola <strong>tú</strong></p>');
  });

  it('quita scripts, estilos y comentarios con su contenido', () => {
    expect(
      sanitizeSectionHtml(
        '<p>a</p><script>alert(1)</script><style>p{}</style><!-- x --><p>b</p>',
      ),
    ).toBe('<p>a</p><p>b</p>');
  });

  it('quita las etiquetas desconocidas pero conserva su texto', () => {
    expect(
      sanitizeSectionHtml(
        '<p><a href="javascript:x">enlace</a> <img src=x onerror=y></p>',
      ),
    ).toBe('<p>enlace </p>');
  });

  it('renombra títulos y énfasis equivalentes', () => {
    expect(sanitizeSectionHtml('<h2>T</h2><p><b>n</b><i>c</i></p>')).toBe(
      '<h3>T</h3><p><strong>n</strong><em>c</em></p>',
    );
  });
});

describe('validateDocument', () => {
  it('acepta un documento válido y deja solo los campos conocidos', () => {
    const result = validateDocument({
      ...valid(),
      roleField: { label: 'x' },
      otro: 1,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(Object.keys(result.value).sort()).toEqual([
        'id',
        'sections',
        'sources',
        'title',
        'updated',
        'version',
      ]);
    }
  });

  it('limpia el HTML de las secciones', () => {
    const doc = valid();
    (doc.sections[0] as { html: string }).html =
      '<p onclick="x">Hola</p><script>1</script>';
    const result = validateDocument(doc);
    expect(result.ok && result.value.sections[0]?.html).toBe('<p>Hola</p>');
  });

  it('rechaza lo que no es un objeto o no tiene secciones', () => {
    expect(validateDocument('hola').ok).toBe(false);
    expect(validateDocument({ ...valid(), sections: [] }).ok).toBe(false);
  });

  it('pide id válido, título, versión y fecha', () => {
    const result = validateDocument({
      ...valid(),
      id: 'Mi Doc!',
      title: '',
      version: undefined,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const all = result.errors.join(' ');
      expect(all).toContain('«id»');
      expect(all).toContain('Falta «title»');
      expect(all).toContain('Falta «version»');
    }
  });

  it('rechaza ids de sección repetidos o inválidos y estados raros', () => {
    const doc = valid();
    doc.sections.push({
      id: 'intro',
      num: '2',
      title: 'Otra',
      status: 'listo',
      html: '',
    });
    doc.sections.push({
      id: 'Mal Id',
      num: '3',
      title: 'X',
      status: 'raro' as never,
      html: '',
    });
    const result = validateDocument(doc);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const all = result.errors.join(' ');
      expect(all).toContain('repetido');
      expect(all).toContain('minúsculas');
      expect(all).toContain('status');
    }
  });

  it('solo admite fuentes con https://, http:// o ruta propia', () => {
    const doc = valid();
    doc.sources = [{ label: 'Mala', url: 'javascript:alert(1)' }];
    expect(validateDocument(doc).ok).toBe(false);
    doc.sources = [
      { label: 'A', url: 'https://example.org' },
      { label: 'B', url: '/documentos/a.pdf' },
      { label: 'C', url: '' },
    ];
    expect(validateDocument(doc).ok).toBe(true);
    doc.sources = [{ label: 'Protocolo relativo', url: '//evil.example' }];
    expect(validateDocument(doc).ok).toBe(false);
  });

  it('el botón extra tiene que apuntar a una sección que exista', () => {
    expect(
      validateDocument({
        ...valid(),
        highlightSection: { id: 'nada', label: 'Ver' },
      }).ok,
    ).toBe(false);
    expect(
      validateDocument({
        ...valid(),
        highlightSection: { id: 'intro', label: 'Ver' },
      }).ok,
    ).toBe(true);
  });

  it('normaliza los términos del glosario a minúsculas', () => {
    const result = validateDocument({
      ...valid(),
      glossaryTerms: { Quórum: 'Quórum' },
    });
    expect(result.ok && result.value.glossaryTerms).toEqual({
      quórum: 'Quórum',
    });
  });

  it('rechaza documentos demasiado grandes', () => {
    const doc = valid();
    doc.sections = Array.from({ length: 5 }, (_unused, index) => ({
      id: `s${index}`,
      num: String(index + 1),
      title: 'T',
      status: 'borrador',
      html: `<p>${'x'.repeat(250_000)}</p>`,
    }));
    const result = validateDocument(doc);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(' ')).toContain('máximo');
  });
});

describe('validateSpace', () => {
  it('pide nombre y valida la plantilla del rol', () => {
    expect(validateSpace({}).ok).toBe(false);
    expect(
      validateSpace({
        name: 'Casa',
        roleField: { label: 'Área', format: 'Equipo' },
      }).ok,
    ).toBe(false);
    const ok = validateSpace({
      name: ' Casa ',
      roleField: { label: 'Municipio', format: 'Representante {value}' },
    });
    expect(ok.ok && ok.value).toEqual({
      name: 'Casa',
      roleField: { label: 'Municipio', format: 'Representante {value}' },
    });
  });
});
