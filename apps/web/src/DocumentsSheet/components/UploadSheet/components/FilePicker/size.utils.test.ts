import { describe, expect, it } from 'vitest';
import { formatSize } from './size.utils';

describe('formatSize', () => {
  it('bytes, KB y MB con coma decimal', () => {
    expect(formatSize(0)).toBe('0 B');
    expect(formatSize(512)).toBe('512 B');
    expect(formatSize(2048)).toBe('2,0 KB');
    expect(formatSize(31539)).toBe('31 KB');
    expect(formatSize(1_258_291)).toBe('1,2 MB');
  });

  it('un valor inválido no devuelve nada', () => {
    expect(formatSize(-1)).toBe('');
    expect(formatSize(Number.NaN)).toBe('');
  });
});
