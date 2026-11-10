import { describe, expect, it } from 'vitest';
import { DEFAULT_ROLE_FIELD, formatRole } from './role.utils';

describe('formatRole', () => {
  it('sin plantilla deja el valor tal cual', () => {
    expect(formatRole(DEFAULT_ROLE_FIELD, 'La Ceja')).toBe('La Ceja');
  });

  it('aplica la plantilla', () => {
    const field = { label: 'Municipio', format: 'Representante {value}' };
    expect(formatRole(field, 'La Ceja')).toBe('Representante La Ceja');
  });
});
