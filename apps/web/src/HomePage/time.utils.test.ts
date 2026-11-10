import { describe, expect, it } from 'vitest';
import { timeAgo } from './time.utils';

const NOW = new Date('2026-11-10T12:00:00Z').getTime();

describe('timeAgo', () => {
  it('usa la unidad más grande que cabe', () => {
    expect(timeAgo('2026-11-10T09:00:00Z', NOW)).toBe('hace 3 horas');
    expect(timeAgo('2026-11-10T11:50:00Z', NOW)).toBe('hace 10 minutos');
    expect(timeAgo('2026-11-07T12:00:00Z', NOW)).toBe('hace 3 días');
  });

  it('ayer y justo ahora', () => {
    expect(timeAgo('2026-11-09T12:00:00Z', NOW)).toBe('ayer');
    expect(timeAgo('2026-11-10T11:59:40Z', NOW)).toBe('justo ahora');
  });

  it('con una fecha inválida no devuelve nada', () => {
    expect(timeAgo('no-es-fecha', NOW)).toBe('');
  });
});
