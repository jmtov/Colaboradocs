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

describe('degradado al pie de la slide', () => {
  it('es del color de fondo de la slide, no atrapa clics y no sale al imprimir', () => {
    const fade = block('.slide::after');
    expect(fade).toContain('position: fixed');
    expect(fade).toContain('var(--bg)');
    expect(fade).toContain('pointer-events: none');
    expect(BASE_CSS).toContain(
      '.slide::before, .slide::after { display: none !important; }',
    );
  });
});

describe('pie de la slide', () => {
  it('el speaker va fijo a la pantalla (junto al contador) y en papel se ancla a su página', () => {
    expect(block('.speaker')).toContain('position: fixed');
    expect(BASE_CSS).toContain(
      '.speaker, .eyebrow { position: absolute !important; }',
    );
  });
});

describe('cabecera de la slide', () => {
  it('el eyebrow va fijo arriba y el contenido se desvanece bajo él', () => {
    expect(block('.eyebrow')).toContain('position: fixed');
    expect(block('.slide::before')).toContain('var(--bg)');
    expect(block('.slide::before')).toContain('pointer-events: none');
  });
});

describe('eyebrow que no cabe', () => {
  it('el texto toma el resto de la línea, el tiempo no se parte y pasa a la línea de abajo si falta sitio', () => {
    expect(block('.eyebrow')).toContain('flex-wrap: wrap');
    expect(block('.eyebrow')).toContain('right: var(--pad-x)');
    expect(block('.eyebrow .t')).toContain('white-space: nowrap');
    expect(block('.mq')).toContain('flex: 1 1 8ch');
    expect(block('.mq')).toContain('overflow: hidden');
  });

  it('con «reducir movimiento» y al imprimir, el texto se parte en líneas en vez de deslizarse', () => {
    expect(BASE_CSS).toMatch(
      /prefers-reduced-motion: reduce\) \{[^@]*\.mq-text \{ white-space: normal; \}/,
    );
    expect(BASE_CSS).toContain(
      '.mq-copy { display: none; } .mq-text { white-space: normal; }',
    );
  });
});

describe('speaker que no cabe', () => {
  it('toma el ancho entre el contador y el borde, sin partirse, y su texto se desliza', () => {
    expect(block('.speaker')).toContain('right: var(--pad-x)');
    expect(block('.speaker')).toContain('display: flex');
    expect(block('.speaker svg')).toContain('flex: none');
    // la misma altura que el contador: con el mismo `bottom`, texto y contador quedan en la misma línea
    expect(block('.speaker')).toContain('height: 1em');
    expect(block('.mq')).toContain('padding-block');
  });
});

describe('alineación del texto deslizante', () => {
  it('la pista es flex de bloque: en línea desalinearía el texto respecto a sus vecinos', () => {
    expect(block('.mq-track')).toContain('display: flex');
    expect(block('.mq-track')).not.toContain('inline-flex');
  });
});
