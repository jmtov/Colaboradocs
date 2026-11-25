import { describe, expect, it } from 'vitest';
import { MAX_TASK_BATCH } from './review.constants';
import type { Task } from './tasks.types';
import {
  compareTasks,
  dueState,
  groupTasks,
  isIsoDate,
  todayIso,
  validateNewTask,
  validateNewTasks,
  validateTaskPatch,
} from './tasks.utils';

function task(overrides: Partial<Task> = {}): Task {
  return {
    id: 't',
    title: 'Hacer algo',
    documentId: null,
    documentTitle: null,
    blockId: null,
    assigneeId: 'r1',
    assigneeName: 'Ana',
    assigneeMunicipality: null,
    dueDate: '2026-11-25',
    doneAt: null,
    createdById: 'r1',
    createdByName: 'Ana',
    createdAt: '2026-11-19T10:00:00.000Z',
    ...overrides,
  };
}

describe('isIsoDate', () => {
  it('acepta fechas reales y rechaza formas o días inexistentes', () => {
    expect(isIsoDate('2026-11-22')).toBe(true);
    expect(isIsoDate('2028-02-29')).toBe(true);
    expect(isIsoDate('2026-02-30')).toBe(false);
    expect(isIsoDate('2026-13-01')).toBe(false);
    expect(isIsoDate('22/11/2026')).toBe(false);
    expect(isIsoDate(20261122)).toBe(false);
  });
});

describe('todayIso', () => {
  it('usa el día local, con ceros', () => {
    expect(todayIso(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });
});

describe('validateNewTask', () => {
  it('limpia un título y deja lo demás en su sitio', () => {
    const result = validateNewTask({
      title: '  Escribir a Abejorral ',
      dueDate: '2026-11-21',
      documentId: 'acta-2026-11-18',
      blockId: 'b-uno',
    });
    expect(result).toEqual({
      ok: true,
      value: {
        title: 'Escribir a Abejorral',
        dueDate: '2026-11-21',
        documentId: 'acta-2026-11-18',
        blockId: 'b-uno',
      },
    });
  });

  it('sin documento ni persona: tarea suelta, sin asignado explícito', () => {
    const result = validateNewTask({ title: 'x', dueDate: '2026-11-21' });
    expect(result).toEqual({
      ok: true,
      value: {
        title: 'x',
        dueDate: '2026-11-21',
        documentId: null,
        blockId: null,
      },
    });
  });

  it('rechaza título vacío o largo, fecha mala, ids malos y bloque sin documento', () => {
    for (const body of [
      { title: '  ', dueDate: '2026-11-21' },
      { title: 'x'.repeat(201), dueDate: '2026-11-21' },
      { title: 'x', dueDate: '2026-02-30' },
      { title: 'x', dueDate: '2026-11-21', documentId: 'MAL ID' },
      { title: 'x', dueDate: '2026-11-21', blockId: 'b-uno' },
      { title: 'x', dueDate: '2026-11-21', assigneeId: 5 },
    ]) {
      expect(validateNewTask(body).ok, JSON.stringify(body)).toBe(false);
    }
    expect(validateNewTask(null).ok).toBe(false);
    expect(validateNewTask([]).ok).toBe(false);
  });
});

describe('validateTaskPatch', () => {
  it('acepta asociar a un documento, un bloque o soltarlos con null', () => {
    expect(
      validateTaskPatch({ documentId: 'guia', blockId: 'intro-ab12' }),
    ).toEqual({
      ok: true,
      value: { documentId: 'guia', blockId: 'intro-ab12' },
    });
    expect(validateTaskPatch({ documentId: null })).toEqual({
      ok: true,
      value: { documentId: null },
    });
  });

  it('rechaza ids inválidos y un bloque con el documento en null', () => {
    expect(validateTaskPatch({ documentId: 'No Válido' }).ok).toBe(false);
    expect(validateTaskPatch({ blockId: 'Mal Id' }).ok).toBe(false);
    expect(
      validateTaskPatch({ documentId: null, blockId: 'intro-ab12' }).ok,
    ).toBe(false);
  });

  it('acepta cada campo y exige al menos uno', () => {
    expect(validateTaskPatch({ done: true })).toEqual({
      ok: true,
      value: { done: true },
    });
    expect(
      validateTaskPatch({ title: ' Nuevo ', dueDate: '2026-12-01' }),
    ).toEqual({ ok: true, value: { title: 'Nuevo', dueDate: '2026-12-01' } });
    expect(validateTaskPatch({}).ok).toBe(false);
  });

  it('rechaza tipos y fechas inválidos', () => {
    for (const body of [
      { done: 'si' },
      { dueDate: '2026-02-30' },
      { title: '' },
      { assigneeId: '' },
    ]) {
      expect(validateTaskPatch(body).ok, JSON.stringify(body)).toBe(false);
    }
  });
});

describe('dueState', () => {
  const today = '2026-11-20';
  it('hecha, vencida, hoy, pronto (hasta 7 días) y más adelante', () => {
    expect(dueState(task({ doneAt: '2026-11-19T10:00:00Z' }), today)).toBe(
      'done',
    );
    expect(dueState(task({ dueDate: '2026-11-19' }), today)).toBe('overdue');
    expect(dueState(task({ dueDate: '2026-11-20' }), today)).toBe('today');
    expect(dueState(task({ dueDate: '2026-11-27' }), today)).toBe('soon');
    expect(dueState(task({ dueDate: '2026-11-28' }), today)).toBe('later');
  });

  it('una vencida hecha cuenta como hecha, no como vencida', () => {
    expect(
      dueState(
        task({ dueDate: '2026-01-01', doneAt: '2026-01-02T00:00:00Z' }),
        today,
      ),
    ).toBe('done');
  });
});

describe('compareTasks', () => {
  it('pendientes por fecha antes que las hechas; las hechas, la más reciente primero', () => {
    const late = task({ id: 'late', dueDate: '2026-11-30' });
    const soon = task({ id: 'soon', dueDate: '2026-11-21' });
    const sameDayNewer = task({
      id: 'newer',
      dueDate: '2026-11-21',
      createdAt: '2026-11-20T10:00:00.000Z',
    });
    const doneOld = task({ id: 'doneOld', doneAt: '2026-11-10T00:00:00Z' });
    const doneNew = task({ id: 'doneNew', doneAt: '2026-11-15T00:00:00Z' });
    const sorted = [doneOld, late, sameDayNewer, doneNew, soon].sort(
      compareTasks,
    );
    expect(sorted.map((t) => t.id)).toEqual([
      'soon',
      'newer',
      'late',
      'doneNew',
      'doneOld',
    ]);
  });
});

describe('groupTasks', () => {
  it('reparte en vencidas, esta semana (hoy incluido), más adelante y hechas; sin grupos vacíos', () => {
    const today = '2026-11-20';
    const groups = groupTasks(
      [
        task({ id: 'later', dueDate: '2026-12-30' }),
        task({ id: 'today', dueDate: '2026-11-20' }),
        task({ id: 'old', dueDate: '2026-11-01' }),
        task({ id: 'soon', dueDate: '2026-11-25' }),
        task({ id: 'done', doneAt: '2026-11-10T00:00:00Z' }),
      ],
      today,
    );
    expect(groups.map((g) => [g.key, g.tasks.map((t) => t.id)])).toEqual([
      ['overdue', ['old']],
      ['week', ['today', 'soon']],
      ['later', ['later']],
      ['done', ['done']],
    ]);
    expect(groupTasks([task({ dueDate: '2026-12-30' })], today)).toHaveLength(
      1,
    );
    expect(groupTasks([], today)).toEqual([]);
  });
});

describe('validateNewTasks', () => {
  const ok = { title: 'Una', dueDate: '2026-12-01' };

  it('acepta una lista y limpia cada tarea', () => {
    const checked = validateNewTasks({
      tasks: [ok, { ...ok, title: ' Dos ' }],
    });
    expect(checked.ok && checked.value.map((t) => t.title)).toEqual([
      'Una',
      'Dos',
    ]);
  });

  it('rechaza lo que no es una lista con tareas o pasa del máximo', () => {
    for (const input of [null, {}, { tasks: 'x' }, { tasks: [] }]) {
      expect(validateNewTasks(input).ok).toBe(false);
    }
    const many = {
      tasks: Array.from({ length: MAX_TASK_BATCH + 1 }, () => ok),
    };
    expect(validateNewTasks(many).ok).toBe(false);
  });

  it('dice qué tarea falló', () => {
    const checked = validateNewTasks({ tasks: [ok, { title: '' }] });
    expect(
      !checked.ok && checked.errors.every((e) => e.startsWith('Tarea 2:')),
    ).toBe(true);
  });
});
