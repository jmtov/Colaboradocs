import { describe, expect, it } from 'vitest';
import {
  formatPin,
  generatePin,
  hashPin,
  isValidPin,
  normalizePin,
} from './pin.utils';

describe('generatePin', () => {
  it('genera PIN válidos y distintos', () => {
    const pins = new Set(Array.from({ length: 50 }, generatePin));
    expect(pins.size).toBe(50);
    for (const pin of pins) expect(isValidPin(pin)).toBe(true);
  });
});

describe('normalizePin / isValidPin', () => {
  it('acepta minúsculas, espacios y guion', () => {
    expect(normalizePin(' k7q2-m9xp ')).toBe('K7Q2M9XP');
    expect(isValidPin(normalizePin(' k7q2-m9xp '))).toBe(true);
  });

  it('rechaza largo incorrecto y caracteres ambiguos', () => {
    expect(isValidPin('K7Q2M9X')).toBe(false);
    expect(isValidPin('K7Q2M9X0')).toBe(false);
    expect(isValidPin('K7Q2M9XI')).toBe(false);
  });
});

describe('formatPin', () => {
  it('separa en dos mitades', () => {
    expect(formatPin('K7Q2M9XP')).toBe('K7Q2-M9XP');
  });
});

describe('hashPin', () => {
  it('es determinista y depende del secreto', async () => {
    const a = await hashPin('K7Q2M9XP', 'secreto-1');
    expect(await hashPin('K7Q2M9XP', 'secreto-1')).toBe(a);
    expect(await hashPin('K7Q2M9XP', 'secreto-2')).not.toBe(a);
    expect(await hashPin('K7Q2M9XQ', 'secreto-1')).not.toBe(a);
  });
});
