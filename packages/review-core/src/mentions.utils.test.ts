import { describe, expect, it } from 'vitest';
import {
  applyMention,
  filterPeople,
  findMentionQuery,
  splitMentions,
} from './mentions.utils';

const ana = { name: 'Ana López', municipality: 'La Ceja' };
const anaMaria = { name: 'Ana López Mora', municipality: 'Guarne' };
const jose = { name: 'José Barrera', municipality: 'San Rafael' };
const sin = { name: 'Luis', municipality: null };
const people = [ana, anaMaria, jose, sin];

describe('splitMentions', () => {
  it('separa texto y mención', () => {
    expect(splitMentions('Hola @Ana López, mira esto', people)).toEqual([
      { kind: 'text', text: 'Hola ' },
      { kind: 'mention', text: '@Ana López', person: ana },
      { kind: 'text', text: ', mira esto' },
    ]);
  });

  it('prefiere el nombre más largo', () => {
    const segments = splitMentions('@Ana López Mora opina', people);
    expect(segments[0]).toEqual({
      kind: 'mention',
      text: '@Ana López Mora',
      person: anaMaria,
    });
  });

  it('ignora mayúsculas y conserva lo escrito', () => {
    const segments = splitMentions('@jose barrera', people);
    expect(segments).toEqual([
      { kind: 'mention', text: '@jose barrera', person: jose },
    ]);
  });

  it('una @ sin persona conocida queda como texto', () => {
    expect(splitMentions('Escribe a @Nadie hoy', people)).toEqual([
      { kind: 'text', text: 'Escribe a @Nadie hoy' },
    ]);
  });

  it('no parte un nombre más largo que no está en la lista', () => {
    expect(splitMentions('@Luisa vino', people)).toEqual([
      { kind: 'text', text: '@Luisa vino' },
    ]);
  });

  it('un correo no cuenta como mención', () => {
    expect(splitMentions('luis@Luis.com', people)).toEqual([
      { kind: 'text', text: 'luis@Luis.com' },
    ]);
  });

  it('sin menciones devuelve un solo texto; vacío, nada', () => {
    expect(splitMentions('Sin nada', people)).toEqual([
      { kind: 'text', text: 'Sin nada' },
    ]);
    expect(splitMentions('', people)).toEqual([]);
  });
});

describe('findMentionQuery', () => {
  it('encuentra lo escrito tras la @ antes del cursor', () => {
    expect(findMentionQuery('Hola @An', 8)).toEqual({ start: 5, query: 'An' });
  });

  it('la @ sola abre la lista con consulta vacía', () => {
    expect(findMentionQuery('@', 1)).toEqual({ start: 0, query: '' });
  });

  it('una @ pegada a una palabra (correo) no abre nada', () => {
    expect(findMentionQuery('luis@gm', 7)).toBeNull();
  });

  it('un salto de línea cierra la mención', () => {
    expect(findMentionQuery('@Ana\nsigue', 10)).toBeNull();
  });

  it('sin @ o con el cursor antes de ella no hay mención', () => {
    expect(findMentionQuery('Hola', 4)).toBeNull();
    expect(findMentionQuery('Hola @Ana', 3)).toBeNull();
  });
});

describe('filterPeople', () => {
  it('ignora tildes y mayúsculas', () => {
    expect(filterPeople(people, 'jose')).toEqual([jose]);
  });

  it('pone primero a quien empieza igual', () => {
    expect(filterPeople([jose, ana], 'a')[0]).toBe(ana);
  });

  it('consulta vacía lista a todas, con tope de seis', () => {
    const many = Array.from({ length: 9 }, (_, i) => ({
      name: `Persona ${i}`,
      municipality: null,
    }));
    expect(filterPeople(many, '')).toHaveLength(6);
  });

  it('no repite nombres iguales', () => {
    expect(filterPeople([ana, { ...ana, municipality: 'X' }], 'ana')).toEqual([
      ana,
    ]);
  });
});

describe('applyMention', () => {
  it('reemplaza la consulta por el nombre y deja el cursor después', () => {
    expect(
      applyMention('Hola @An mira', { start: 5, query: 'An' }, 8, 'Ana López'),
    ).toEqual({ text: 'Hola @Ana López  mira', caret: 16 });
  });
});
