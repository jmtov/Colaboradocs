import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(
  new URL('./HomeTabs.module.css', import.meta.url),
  'utf8',
);

describe('HomeTabs.module.css', () => {
  it('los tabs no hacen scroll: ni overflow en la barra ni en cada tab', () => {
    // `overflow-x: auto` más el margen negativo del tab activo mostraba una barra de scroll vertical.
    expect(css).not.toMatch(/overflow/);
  });
});
