import { describe, expect, it } from 'vitest';
import type { DocumentSection } from '@/content/content.types';
import { newSection, sameSections, sectionIdFrom } from './section.utils';

const section = (id: string, num: string, html = ''): DocumentSection => ({
  id,
  num,
  title: id,
  status: 'listo',
  html,
});

describe('sectionIdFrom', () => {
  it('minúsculas, sin tildes y con guiones', () => {
    expect(sectionIdFrom('Nueva sección', [])).toBe('nueva-seccion');
    expect(sectionIdFrom('  ¿Cómo decidimos?  ', [])).toBe('como-decidimos');
  });

  it('si ya existe, agrega un número', () => {
    expect(sectionIdFrom('Intro', ['intro'])).toBe('intro-2');
    expect(sectionIdFrom('Intro', ['intro', 'intro-2'])).toBe('intro-3');
  });

  it('un título sin letras ni números da un id válido y nunca pasa de 60', () => {
    expect(sectionIdFrom('???', [])).toBe('seccion');
    expect(sectionIdFrom('a'.repeat(100), []).length).toBeLessThanOrEqual(56);
    expect(
      sectionIdFrom('a'.repeat(100), ['a'.repeat(56)]).length,
    ).toBeLessThanOrEqual(60);
  });
});

describe('newSection', () => {
  it('va después de la última numerada y antes de los anexos, con el número siguiente', () => {
    const list = [
      section('a', '1'),
      section('b', '2'),
      section('glosario', 'A'),
    ];
    const { section: created, index } = newSection(list);
    expect(index).toBe(2);
    expect(created.num).toBe('3');
    expect(created.id).toBe('nueva-seccion');
    expect(created.status).toBe('borrador');
  });

  it('sin secciones numeradas, la primera es la 1 y va al principio', () => {
    expect(newSection([]).index).toBe(0);
    expect(newSection([]).section.num).toBe('1');
    const onlyAnnex = newSection([section('glosario', 'A')]);
    expect(onlyAnnex.index).toBe(0);
    expect(onlyAnnex.section.num).toBe('1');
  });

  it('no repite el id si ya hay una «Nueva sección»', () => {
    const list = [section('nueva-seccion', '1')];
    expect(newSection(list).section.id).toBe('nueva-seccion-2');
    expect(newSection(list).section.num).toBe('2');
  });

  it('usa el mayor número aunque falten huecos', () => {
    const list = [section('a', '1'), section('b', '5')];
    expect(newSection(list).section.num).toBe('6');
  });
});

describe('sameSections', () => {
  it('iguales si todo coincide, distintas si cambia algo o el orden', () => {
    const a = [section('a', '1', '<p>x</p>'), section('b', '2')];
    expect(
      sameSections(a, [section('a', '1', '<p>x</p>'), section('b', '2')]),
    ).toBe(true);
    expect(
      sameSections(a, [section('a', '1', '<p>y</p>'), section('b', '2')]),
    ).toBe(false);
    expect(
      sameSections(a, [a[1] as DocumentSection, a[0] as DocumentSection]),
    ).toBe(false);
    expect(sameSections(a, [a[0] as DocumentSection])).toBe(false);
  });
});
