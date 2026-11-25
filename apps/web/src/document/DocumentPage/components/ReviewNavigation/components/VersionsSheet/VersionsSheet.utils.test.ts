import { describe, expect, it } from 'vitest';
import { describeVersion } from './VersionsSheet.utils';

describe('describeVersion', () => {
  it('la actual: publicada, con fecha y quién', () => {
    const text = describeVersion({
      version: '0.2',
      at: '2026-11-10T12:00:00.000Z',
      by: { name: 'Ana', municipality: 'Rionegro' },
      current: true,
    });
    expect(text).toMatch(/^Publicada el .*2026/);
    expect(text).toContain('Ana');
  });

  it('una anterior: reemplazada; sin autor no inventa uno', () => {
    const text = describeVersion({
      version: '0.1',
      at: '2026-11-09T12:00:00.000Z',
      by: null,
      current: false,
    });
    expect(text.startsWith('Reemplazada el')).toBe(true);
    expect(text).not.toContain('·');
  });
});
