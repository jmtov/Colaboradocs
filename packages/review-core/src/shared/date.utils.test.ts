import { describe, expect, it } from 'vitest';
import { isIsoDate, todayIso } from './date.utils';

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
