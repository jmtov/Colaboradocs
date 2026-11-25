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
      sanitizeSectionHtml('<p><u>subrayado</u> <img src=x onerror=y></p>'),
    ).toBe('<p>subrayado </p>');
  });

  it('conserva solo el href de un enlace y solo si es seguro', () => {
    expect(
      sanitizeSectionHtml(
        '<p><a href="https://a.co/x?y=1&z=2" onclick="evil()" target="_blank">web</a> <a href=\'mailto:a@b.co\'>correo</a> <a href="/d/acta">ruta</a></p>',
      ),
    ).toBe(
      '<p><a href="https://a.co/x?y=1&amp;z=2">web</a> <a href="mailto:a@b.co">correo</a> <a href="/d/acta">ruta</a></p>',
    );
  });

  it('un enlace con dirección peligrosa o vacía queda como texto', () => {
    expect(
      sanitizeSectionHtml(
        '<p><a href="javascript:x">uno</a> <a href="//evil.co">dos</a> <a>tres</a> <a href="data:text/html,x">cuatro</a></p>',
      ),
    ).toBe('<p>uno dos tres cuatro</p>');
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

  it('acepta tipo, responsable y participantes, y rechaza un tipo que no existe', () => {
    const ok = validateDocument({
      ...valid(),
      type: 'initiative',
      owner: ' Ana ',
      attendees: 'Ana, Luis',
    });
    expect(ok.ok && ok.value).toMatchObject({
      type: 'initiative',
      owner: 'Ana',
      attendees: 'Ana, Luis',
    });
    const bad = validateDocument({ ...valid(), type: 'memorando' });
    expect(bad.ok).toBe(false);
    // Sin tipo (o vacío), el documento queda como estaba: no se inventa uno.
    const none = validateDocument({ ...valid(), type: '' });
    expect(none.ok && 'type' in none.value).toBe(false);
  });

  it('lee como los nombres actuales los campos escritos en español (tipo, responsable, participantes)', () => {
    const old = validateDocument({
      ...valid(),
      tipo: 'acta',
      responsable: 'Ana',
      participantes: 'Ana, Luis',
    });
    expect(old.ok && old.value).toMatchObject({
      type: 'minutes',
      owner: 'Ana',
      attendees: 'Ana, Luis',
    });
    // Si vienen los dos, vale el actual; y un valor viejo desconocido sigue siendo un error.
    const both = validateDocument({ ...valid(), tipo: 'acta', type: 'guide' });
    expect(both.ok && both.value.type).toBe('guide');
    expect(validateDocument({ ...valid(), tipo: 'memorando' }).ok).toBe(false);
    expect(validateDocument({ ...valid(), type: 'constructor' }).ok).toBe(
      false,
    );
  });

  it('acepta la fecha AAAA-MM-DD y rechaza una que no existe o con otro formato', () => {
    const ok = validateDocument({ ...valid(), date: '2026-11-24' });
    expect(ok.ok && ok.value.date).toBe('2026-11-24');
    for (const date of [
      '24-11-2026',
      '2026-02-31',
      '2026-13-01',
      'ayer',
      20261124,
    ]) {
      expect(validateDocument({ ...valid(), date }).ok).toBe(false);
    }
    // Vacía (o ausente), no se inventa una.
    const none = validateDocument({ ...valid(), date: '' });
    expect(none.ok && 'date' in none.value).toBe(false);
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

  it('normaliza las personas a minúsculas y rechaza las inválidas', () => {
    const result = validateDocument({
      ...valid(),
      peopleTerms: { 'Ana López': 'Ana María López Mora' },
    });
    expect(result.ok && result.value.peopleTerms).toEqual({
      'ana lópez': 'Ana María López Mora',
    });
    expect(
      validateDocument({ ...valid(), peopleTerms: { 'Ana López': 7 } }).ok,
    ).toBe(false);
    expect(validateDocument({ ...valid(), peopleTerms: [] }).ok).toBe(false);
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
