import { describe, expect, it } from 'vitest';
import { dueLabel, formatDueDate } from './task.utils';

describe('formatDueDate', () => {
  it('muestra día de la semana, día y mes, sin correrse por la zona horaria', () => {
    expect(formatDueDate('2026-11-21')).toMatch(/21/);
    expect(formatDueDate('2026-11-21').toLowerCase()).toMatch(/nov/);
    expect(formatDueDate('2026-11-21').toLowerCase()).toMatch(/s[áa]b/);
  });

  it('una fecha rota se muestra tal cual', () => {
    expect(formatDueDate('mañana')).toBe('mañana');
  });
});

describe('dueLabel', () => {
  it('solo marca las vencidas y las de hoy', () => {
    expect(dueLabel('overdue')).toBe('Vencida');
    expect(dueLabel('today')).toBe('Hoy');
    expect(dueLabel('soon')).toBeNull();
    expect(dueLabel('later')).toBeNull();
    expect(dueLabel('done')).toBeNull();
  });
});
