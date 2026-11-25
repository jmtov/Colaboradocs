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

describe('la línea de los tabs', () => {
  it('va de lado a lado: la barra a ancho completo lleva el trazo; los tabs, el ancho y los márgenes de la página', () => {
    expect(css).toMatch(
      /\.bar \{[^}]*border-bottom:\s*var\(--border-w\) solid var\(--line\)/,
    );
    expect(css).not.toMatch(/\.bar \{[^}]*max-width/);
    expect(css).toMatch(/\.tabs \{[^}]*max-width:\s*var\(--page-max\)/);
    expect(css).toMatch(/\.tabs \{[^}]*padding-inline:\s*var\(--gutter\)/);
  });
});

describe('alineación a la izquierda', () => {
  it('el primer tab no se corre: su caja arranca en el borde izquierdo del contenido, como las tarjetas', () => {
    expect(css).not.toMatch(/first-child/);
  });
});
