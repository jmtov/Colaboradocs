import { describe, expect, it } from 'vitest';
import { isLaterVersion, nextVersion } from './version.utils';

describe('nextVersion', () => {
  it('sube el último número', () => {
    expect(nextVersion('0.3')).toBe('0.4');
    expect(nextVersion('1.9')).toBe('1.10');
    expect(nextVersion('v2')).toBe('v3');
    expect(nextVersion('2')).toBe('3');
  });

  it('sin números, queda igual', () => {
    expect(nextVersion('borrador')).toBe('borrador');
  });
});

describe('isLaterVersion', () => {
  it('compara número a número', () => {
    expect(isLaterVersion('0.4', '0.3')).toBe(true);
    expect(isLaterVersion('0.10', '0.9')).toBe(true);
    expect(isLaterVersion('1.0', '0.9')).toBe(true);
    expect(isLaterVersion('1', '0.9')).toBe(true);
  });

  it('una igual o anterior no sirve', () => {
    expect(isLaterVersion('0.3', '0.3')).toBe(false);
    expect(isLaterVersion('0.3.0', '0.3')).toBe(false);
    expect(isLaterVersion('0.2', '0.3')).toBe(false);
    expect(isLaterVersion('0.9', '0.10')).toBe(false);
  });

  it('sin números, vale una distinta y no vacía', () => {
    expect(isLaterVersion('final', 'borrador')).toBe(true);
    expect(isLaterVersion('borrador', 'borrador')).toBe(false);
    expect(isLaterVersion('  ', 'borrador')).toBe(false);
  });
});
