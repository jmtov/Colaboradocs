import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { TAB_ORDER } from './HomePage.constants';

const css = readFileSync(
  join(import.meta.dirname, 'HomePage.module.css'),
  'utf8',
);

describe('transición del contenido de los tabs', () => {
  it('sale con desvanecido y deslizamiento, y entra desde el lado contrario sin transición', () => {
    expect(css).toMatch(
      /\[data-phase="leaving"\][^{]*\{[^}]*opacity:\s*0[^}]*translateX\(calc\(var\(--tab-shift\) \* -1\)\)/,
    );
    expect(css).toMatch(
      /\[data-phase="entering"\][^{]*\{[^}]*translateX\(var\(--tab-shift\)\)[^}]*transition:\s*none/,
    );
  });

  it('hacia la izquierda invierte el desplazamiento, y «reducir movimiento» la deja en 0', () => {
    expect(css).toMatch(/\[data-dir="back"\][^{]*\{[^}]*--tab-shift:\s*-/);
    expect(css).toMatch(
      /prefers-reduced-motion: reduce[^{]*\{[^}]*transition-duration:\s*0s/,
    );
  });

  it('los tabs van en orden: documentos, presentaciones, tareas', () => {
    expect(TAB_ORDER.documents).toBeLessThan(TAB_ORDER.decks);
    expect(TAB_ORDER.decks).toBeLessThan(TAB_ORDER.tasks);
  });
});
