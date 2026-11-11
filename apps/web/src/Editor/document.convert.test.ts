// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import type { DocumentSection } from '@/content/content.types';
import { htmlToSections, sectionsToHtml } from './document.convert';

const section = (
  id: string,
  num: string,
  html: string,
  extra: Partial<DocumentSection> = {},
): DocumentSection => ({
  id,
  num,
  title: `Título ${id}`,
  status: 'listo',
  html,
  ...extra,
});

describe('secciones ↔ HTML del editor', () => {
  it('ida y vuelta: las mismas secciones, con sus datos', () => {
    const list = [
      section('uno', '1', '<p>A</p>', { description: 'Qué hay aquí' }),
      section('dos', '2', '<p>B</p><ul><li>x</li></ul>', {
        status: 'pendiente',
      }),
      section('glosario', 'A', '<dl><dt>T</dt><dd>D</dd></dl>'),
    ];
    expect(htmlToSections(sectionsToHtml(list))).toEqual(list);
  });

  it('el número sale de la posición: 1, 2… y A, B… para los anexos', () => {
    const html = sectionsToHtml([
      section('a', '7', '<p>x</p>'),
      section('b', 'Z', '<p>x</p>'),
      section('c', '9', '<p>x</p>'),
      section('d', 'C', '<p>x</p>'),
    ]);
    expect(htmlToSections(html).map((item) => item.num)).toEqual([
      '1',
      'A',
      '2',
      'B',
    ]);
  });

  it('un título con comillas, &, < y > no rompe los atributos', () => {
    const tricky = section('x', '1', '<p>x</p>', {
      title: 'A & "B" <c>',
      description: 'Dice "hola" & <adiós>',
    });
    expect(htmlToSections(sectionsToHtml([tricky]))).toEqual([tricky]);
  });

  it('los párrafos vacíos no se guardan; una sección vacía queda con html vacío', () => {
    const html = sectionsToHtml([section('a', '1', '')]);
    expect(html).toContain('<p></p>');
    expect(htmlToSections(html)[0]?.html).toBe('');
    expect(
      htmlToSections(`${html}<p>Hola</p><p></p>`).map((item) => item.html),
    ).toEqual(['<p>Hola</p>']);
  });

  it('un estado desconocido pasa a borrador', () => {
    const [first] = htmlToSections('<h2 data-id="a" data-status="raro">T</h2>');
    expect(first?.status).toBe('borrador');
  });

  it('aplana las viñetas que escribe Tiptap', () => {
    const [first] = htmlToSections(
      '<h2 data-id="a">T</h2><ul><li><p>Uno</p></li></ul>',
    );
    expect(first?.html).toBe('<ul><li>Uno</li></ul>');
  });
});
