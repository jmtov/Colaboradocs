// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import type { DocumentContent } from '@/content/content.types';
import example from '../../../../documents/example.json';
import { buildProse } from './buildProse';

const content = example as DocumentContent;
const terms = content.glossaryTerms ?? {};

function section(id: string) {
  const found = content.sections.find((item) => item.id === id);
  if (!found) throw new Error(`falta la sección ${id}`);
  return found;
}

describe('buildProse', () => {
  it('marca como bloques los párrafos, viñetas y definiciones, salvo las notas', () => {
    const root = buildProse(
      '<p><strong>Para qué sirve.</strong> Nota.</p><p>Texto</p><ul><li>Uno</li><li>Dos</li></ul>',
      { sectionId: 's', reviewable: true },
    );
    const blocks = root.querySelectorAll('[data-block-id]');
    expect(blocks).toHaveLength(3);
    expect(root.textContent).toContain('Nota.');
  });

  it('da ids distintos a bloques con el mismo texto', () => {
    const root = buildProse('<ul><li>Igual</li><li>Igual</li></ul>', {
      sectionId: 's',
      reviewable: true,
    });
    const ids = [...root.querySelectorAll<HTMLElement>('[data-block-id]')].map(
      (element) => element.dataset.blockId,
    );
    expect(new Set(ids).size).toBe(2);
  });

  it('sin reviewable no hay bloques, ids ni enlaces', () => {
    const root = buildProse(
      '<h3>Título</h3><p>Se requiere consenso. <em>[1]</em></p>',
      {
        sectionId: 's',
        reviewable: false,
      },
    );
    expect(root.querySelector('[data-block-id]')).toBeNull();
    expect(root.querySelector('[data-outline-level]')).toBeNull();
    expect(root.querySelector('[data-term]')).toBeNull();
    expect(root.querySelector('[data-cite]')).toBeNull();
  });

  it('enlaza citas, términos y secciones, pero no dentro de títulos', () => {
    const root = buildProse(
      '<h3>El consenso</h3><p>Se decide por consenso, ver sección 2. <em>[2, 3]</em></p>',
      { sectionId: 's', reviewable: true, glossaryTerms: terms },
    );
    expect(root.querySelectorAll('[data-term]')).toHaveLength(1);
    expect(root.querySelector<HTMLElement>('[data-term]')?.dataset.term).toBe(
      'Consenso',
    );
    expect(
      root.querySelector<HTMLElement>('[data-section]')?.dataset.section,
    ).toBe('2');
    expect(root.querySelector<HTMLElement>('[data-cite]')?.dataset.cite).toBe(
      '[2, 3]',
    );
    expect(root.querySelector('h3 [data-term]')).toBeNull();
  });

  it('numera el índice con h3 y h4, y deja fuera los h5', () => {
    const root = buildProse(
      '<h3>Uno</h3><h4>Sub</h4><h5>Etiqueta</h5><p><strong>No</strong> es subtítulo</p>',
      { sectionId: 's', reviewable: true },
    );
    const levels = [
      ...root.querySelectorAll<HTMLElement>('[data-outline-level]'),
    ].map((element) => [element.dataset.outlineLevel, element.id]);
    expect(levels).toEqual([
      ['2', 's--0'],
      ['3', 's--1'],
    ]);
  });
});

describe('enlaces en el texto', () => {
  it('un enlace web se abre en otra pestaña y uno propio, en la misma', () => {
    const root = buildProse(
      '<p><a href="https://a.co/x">web</a> <a href="/d/acta">ruta</a></p>',
      { sectionId: 's', reviewable: true },
    );
    const [web, own] = root.querySelectorAll('a');
    expect(web?.getAttribute('href')).toBe('https://a.co/x');
    expect(web?.target).toBe('_blank');
    expect(web?.rel).toContain('noopener');
    expect(own?.getAttribute('href')).toBe('/d/acta');
    expect(own?.target).toBe('');
  });

  it('una dirección peligrosa no crea enlace, solo deja el texto', () => {
    const root = buildProse('<p><a href="javascript:alert(1)">x</a></p>', {
      sectionId: 's',
      reviewable: true,
    });
    expect(root.querySelector('a')).toBeNull();
    expect(root.textContent).toBe('x');
  });

  it('no enlaza glosario ni personas dentro de un enlace', () => {
    const root = buildProse('<p><a href="/x">Ana López</a></p>', {
      sectionId: 's',
      reviewable: true,
      peopleTerms: { 'ana lópez': 'Ana López' },
    });
    expect(root.querySelector('[data-person]')).toBeNull();
  });
});

describe('personas en el texto', () => {
  const peopleTerms = { 'ana lópez': 'Ana María López Mora' };

  it('envuelve el nombre en un botón con el nombre registrado, en cada aparición', () => {
    const root = buildProse(
      '<p>Lleva Ana López.</p><ul><li>Apoya Ana López.</li></ul>',
      { sectionId: 's', reviewable: true, peopleTerms },
    );
    const links = root.querySelectorAll<HTMLElement>('[data-person]');
    expect(links).toHaveLength(2);
    expect(links[0]?.dataset.person).toBe('Ana María López Mora');
    expect(links[0]?.textContent).toBe('Ana López');
    expect(root.textContent).toBe('Lleva Ana López.Apoya Ana López.');
  });

  it('no enlaza en títulos ni en la copia de solo lectura', () => {
    const heading = buildProse('<h3>Ana López</h3>', {
      sectionId: 's',
      reviewable: true,
      peopleTerms,
    });
    expect(heading.querySelector('[data-person]')).toBeNull();
    const readOnly = buildProse('<p>Ana López</p>', {
      sectionId: 's',
      reviewable: false,
      peopleTerms,
    });
    expect(readOnly.querySelector('[data-person]')).toBeNull();
  });

  it('sin peopleTerms no enlaza nada', () => {
    const root = buildProse('<p>Ana López</p>', {
      sectionId: 's',
      reviewable: true,
    });
    expect(root.querySelector('[data-person]')).toBeNull();
  });
});

describe('el documento de ejemplo', () => {
  const roots = content.sections.map((item) =>
    buildProse(item.html, {
      sectionId: item.id,
      reviewable: true,
      glossaryTerms: terms,
    }),
  );
  const allBlocks = roots.flatMap((root) => [
    ...root.querySelectorAll<HTMLElement>('[data-block-id]'),
  ]);

  it('produce bloques con ids únicos y válidos para el servidor', () => {
    const ids = allBlocks.map((element) => element.dataset.blockId ?? '');
    expect(ids.length).toBeGreaterThan(5);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9-]{1,100}$/);
  });

  it('conserva todo el texto de cada sección', () => {
    content.sections.forEach((item, index) => {
      const parsed = new DOMParser().parseFromString(
        `<body>${item.html}</body>`,
        'text/html',
      );
      expect(roots[index]?.textContent).toBe(parsed.body.textContent);
    });
  });

  it('el glosario no enlaza términos y las demás secciones sí', () => {
    const glossary = buildProse(section('glosario').html, {
      sectionId: 'glosario',
      reviewable: true,
      glossaryTerms: terms,
    });
    expect(glossary.querySelector('[data-term]')).toBeNull();
    expect(
      glossary.querySelectorAll('dt[data-glossary-term]').length,
    ).toBeGreaterThan(1);
    const conduct =
      roots[content.sections.findIndex((item) => item.id === 'decisiones')];
    expect(conduct?.querySelectorAll('[data-term]').length).toBeGreaterThan(0);
  });
});
