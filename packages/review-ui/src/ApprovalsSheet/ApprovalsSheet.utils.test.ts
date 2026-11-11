import { describe, expect, it } from 'vitest';
import { formatApprovalTime } from './ApprovalsSheet.utils';

describe('formatApprovalTime', () => {
  it('lleva fecha y hora', () => {
    const text = formatApprovalTime('2026-11-10T15:42:00.000Z');
    expect(text).toContain('2026');
    expect(text).toMatch(/\d{1,2}:\d{2}/);
  });

  it('una fecha inválida da texto vacío, no «Invalid Date»', () => {
    expect(formatApprovalTime('no es fecha')).toBe('');
  });
});
