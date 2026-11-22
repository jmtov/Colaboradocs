import { validateDeck } from '@colaboradocs/deck-core';
import { neutralTheme } from '@colaboradocs/themes';
import { describe, expect, it } from 'vitest';
import { blankDeck } from './newDeck.utils';

describe('blankDeck', () => {
  it('es un deck que el servidor acepta (válido contra su tema)', () => {
    const deck = blankDeck('mi-charla', 'Mi charla', 'neutral');
    expect(validateDeck(deck, neutralTheme)).toEqual([]);
    expect(deck).toMatchObject({
      id: 'mi-charla',
      title: 'Mi charla',
      theme: 'neutral',
    });
    expect(deck.slides).toHaveLength(1);
  });
});
