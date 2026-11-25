import { TOKEN_DEFAULTS } from '@colaboradocs/deck-core';
import { describe, expect, it } from 'vitest';
import { BASE_CSS } from './base.constants';

const block = (selector: string): string => {
  const start = BASE_CSS.indexOf(`\n${selector} {`);
  expect(start, `no está la regla ${selector}`).toBeGreaterThan(-1);
  return BASE_CSS.slice(start, BASE_CSS.indexOf('}', start));
};

describe('transiciones de variantes', () => {
  it('la duración es un token y la lista cubre tamaño, color y espacio', () => {
    expect(TOKEN_DEFAULTS['dur-vary']).toBeDefined();
    const vary = /--vary:([^;]+);/.exec(BASE_CSS)?.[1] ?? '';
    for (const prop of [
      'font-size',
      'color',
      'background-color',
      'border-color',
      'padding',
      'gap',
    ]) {
      expect(vary).toContain(prop);
    }
  });

  it('lo que ya tiene una transición propia (slide, entrada de bloques) suma la de variantes', () => {
    for (const selector of [
      '.slide',
      '.slide.is-active',
      '[data-r]',
      '.is-active [data-r]',
    ]) {
      expect(block(selector), selector).toContain('var(--vary)');
    }
    expect(block('.slide *')).toContain('transition: var(--vary)');
  });

  it('en impresión y con movimiento reducido no hay transición', () => {
    expect(BASE_CSS).toContain(
      '.slide, .slide * { transition: none !important; }',
    );
    expect(BASE_CSS).toMatch(
      /prefers-reduced-motion: reduce\) \{\s*:root \{ --vary: color 0s; \}/,
    );
  });
});

describe('integridad del CSS base', () => {
  it('las llaves cuadran y las reglas dentro de @media conservan las suyas', () => {
    expect(BASE_CSS.split('{').length).toBe(BASE_CSS.split('}').length);
    expect(BASE_CSS).toContain(
      '  .content { grid-template-columns: minmax(0, 1fr); }',
    );
    expect(BASE_CSS).toContain(
      '  .progress, .hud, .nav, .controls { display: none !important; }',
    );
  });
});

describe('categoría de la slide', () => {
  it('colorea el filete, no el texto', () => {
    expect(BASE_CSS).toContain(
      '.slide.has-category .rule { border-top-color: var(--c); }',
    );
    expect(BASE_CSS).not.toMatch(
      /\.has-category[^{]*\{[^}]*(?<![-\w])color: var\(--c\)/,
    );
  });
});

describe('slide con scroll cuando el contenido no cabe', () => {
  it('la slide se desplaza, sin recortar el principio: el contenido se centra con margen automático', () => {
    expect(block('.slide')).toContain('overflow-y: auto');
    expect(block('.slide')).not.toContain('justify-content: center');
    expect(block('.slide > .content')).toContain('margin-block: auto');
  });

  it('el fondo no se va con el scroll y la navegación no tapa la slide', () => {
    expect(block('.bg')).toContain('position: fixed');
    expect(block('.nav')).toContain('pointer-events: none');
  });
});
