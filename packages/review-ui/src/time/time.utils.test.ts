import { describe, expect, it } from 'vitest';
import { formatRelativeTime } from './time.utils';

const NOW = new Date('2026-11-04T12:00:00').getTime();

function ago(ms: number) {
  return new Date(NOW - ms).toISOString();
}

describe('formatRelativeTime', () => {
  it('describe minutos, horas y ayer', () => {
    expect(formatRelativeTime(ago(10_000), NOW)).toBe('hace un momento');
    expect(formatRelativeTime(ago(5 * 60_000), NOW)).toBe('hace 5 min');
    expect(formatRelativeTime(ago(3 * 3_600_000), NOW)).toBe('hace 3 h');
    expect(formatRelativeTime(ago(30 * 3_600_000), NOW)).toBe('ayer');
  });

  it('pasados dos días muestra la fecha', () => {
    expect(formatRelativeTime('2026-11-01T10:00:00', NOW)).toBe('1 nov');
  });

  it('tolera fechas inválidas y futuras', () => {
    expect(formatRelativeTime('no-fecha', NOW)).toBe('');
    expect(formatRelativeTime(ago(-60_000), NOW)).toBe('hace un momento');
  });
});
