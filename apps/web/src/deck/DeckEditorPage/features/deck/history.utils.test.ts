import { describe, expect, it } from 'vitest';
import { emptyHistory, record, redo, undo } from './history.utils';

describe('historial', () => {
  it('deshacer devuelve el estado anterior y deja el actual para rehacer', () => {
    const h = record(record(emptyHistory<string>(), 'a'), 'b');
    const u = undo(h, 'c');
    expect(u?.value).toBe('b');
    const r = u && redo(u.history, 'b');
    expect(r?.value).toBe('c');
    expect(r?.history.past).toEqual(['a', 'b']);
  });

  it('sin historia no hay nada que deshacer ni rehacer', () => {
    expect(undo(emptyHistory<string>(), 'x')).toBeNull();
    expect(redo(emptyHistory<string>(), 'x')).toBeNull();
  });

  it('un cambio nuevo borra lo que se podía rehacer', () => {
    const u = undo(record(emptyHistory<string>(), 'a'), 'b');
    expect(u && record(u.history, 'b').future).toEqual([]);
  });

  it('respeta el límite', () => {
    let h = emptyHistory<number>();
    for (let i = 0; i < 5; i++) h = record(h, i, 3);
    expect(h.past).toEqual([2, 3, 4]);
  });
});
