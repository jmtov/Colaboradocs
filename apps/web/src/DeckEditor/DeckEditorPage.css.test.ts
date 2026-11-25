import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(
  join(import.meta.dirname, 'DeckEditorPage.module.css'),
  'utf8',
);

describe('scroll del editor de presentaciones', () => {
  it('la lista y el panel no pasan su scroll a la página al llegar a un extremo', () => {
    for (const name of ['list', 'panel']) {
      const rule = new RegExp(`\\.${name}\\s*\\{([^}]*)\\}`).exec(css)?.[1];
      expect(rule, name).toMatch(/overscroll-behavior:\s*contain/);
    }
  });
});
