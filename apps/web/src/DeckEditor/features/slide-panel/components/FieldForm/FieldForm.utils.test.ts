import type { Field } from '@colaboradocs/deck-core';
import { describe, expect, it } from 'vitest';
import { groupFields, toDisplayValue, toStoredValue } from './FieldForm.utils';

const text = (required?: boolean): Field => ({
  key: 'k',
  label: 'K',
  type: 'text',
  required,
});

describe('toStoredValue', () => {
  it('un texto opcional vacío no se guarda; uno obligatorio sí (vacío)', () => {
    expect(toStoredValue(text(), '')).toBeUndefined();
    expect(toStoredValue(text(true), '')).toBe('');
    expect(toStoredValue(text(), 'hola')).toBe('hola');
  });

  it('los números son números y vacío o inválido no se guarda', () => {
    const n: Field = { key: 'n', label: 'N', type: 'number' };
    expect(toStoredValue(n, '12')).toBe(12);
    expect(toStoredValue(n, '')).toBeUndefined();
    expect(toStoredValue(n, 'x')).toBeUndefined();
  });

  it('un select numérico guarda un número; vacío, nada', () => {
    const s: Field = {
      key: 's',
      label: 'S',
      type: 'select',
      options: [{ value: '3', label: '3' }],
      numeric: true,
    };
    expect(toStoredValue(s, '3')).toBe(3);
    expect(toStoredValue(s, '')).toBeUndefined();
    expect(toStoredValue({ ...s, numeric: false }, '3')).toBe('3');
  });

  it('un booleano con «sí» por omisión guarda solo el «no»', () => {
    const field: Field = {
      key: 'g',
      label: 'G',
      type: 'boolean',
      default: true,
    };
    expect(toStoredValue(field, true)).toBeUndefined();
    expect(toStoredValue(field, false)).toBe(false);
  });

  it('el booleano solo guarda true; la categoría, un índice', () => {
    expect(toStoredValue({ key: 'b', label: 'B', type: 'boolean' }, true)).toBe(
      true,
    );
    expect(
      toStoredValue({ key: 'b', label: 'B', type: 'boolean' }, false),
    ).toBeUndefined();
    expect(toStoredValue({ key: 'c', label: 'C', type: 'category' }, '2')).toBe(
      2,
    );
    expect(
      toStoredValue({ key: 'c', label: 'C', type: 'category' }, ''),
    ).toBeUndefined();
  });

  it('las líneas del título se parten por saltos de línea', () => {
    expect(
      toStoredValue({ key: 't', label: 'T', type: 'lines' }, 'uno\ndos'),
    ).toEqual(['uno', 'dos']);
  });
});

describe('toDisplayValue', () => {
  it('muestra vacío para lo que falta y une las líneas', () => {
    expect(toDisplayValue(text(), undefined)).toBe('');
    expect(toDisplayValue(text(), 5)).toBe('5');
    expect(
      toDisplayValue({ key: 't', label: 'T', type: 'lines' }, ['a', 'b']),
    ).toBe('a\nb');
  });
});

describe('groupFields', () => {
  const f = (key: string, type: Field['type'], group?: string) =>
    ({ key, label: key, type, group }) as Field;
  const describeGroups = (fields: Field[]) =>
    groupFields(fields).map((g) =>
      g.kind === 'rows'
        ? `${g.title ?? '-'}:${g.fields.map((x) => x.key).join('+')}`
        : `sección ${g.field.key}`,
    );

  it('junta los campos de un valor consecutivos del mismo grupo y separa cada sección', () => {
    expect(
      describeGroups([
        f('a', 'text'),
        f('b', 'select'),
        f('c', 'list'),
        f('d', 'boolean'),
        f('e', 'blocks'),
        f('g', 'object'),
      ]),
    ).toEqual(['-:a+b', 'sección c', '-:d', 'sección e', 'sección g']);
  });

  it('un cambio de grupo abre otra tarjeta, con su título', () => {
    expect(
      describeGroups([
        f('a', 'text', 'Contenido principal'),
        f('b', 'lines', 'Contenido principal'),
        f('c', 'select', 'Estilo'),
        f('d', 'number', 'Estilo'),
        f('n', 'longtext', 'Notas'),
      ]),
    ).toEqual(['Contenido principal:a+b', 'Estilo:c+d', 'Notas:n']);
  });

  it('las personas y los objetos son secciones; las líneas del título, una fila', () => {
    expect(
      groupFields([f('t', 'lines'), f('p', 'people')]).map((g) => g.kind),
    ).toEqual(['rows', 'section']);
  });

  it('sin campos no hay grupos', () => {
    expect(groupFields([])).toEqual([]);
  });
});
