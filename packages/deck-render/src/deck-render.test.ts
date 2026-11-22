import {
  BLOCK_DESCRIPTORS,
  BLOCK_KINDS,
  type Block,
  type Deck,
  fullSample,
  migrateSlide,
  SLIDE_DESCRIPTORS,
  SLIDE_KINDS,
  type Slide,
  type Theme,
} from '@colaboradocs/deck-core';
import { describe, expect, it } from 'vitest';
import { mergeRegistries, renderDeck, renderSlides } from './index';

const theme: Theme = {
  id: 'demo',
  name: 'Demo',
  baseMode: 'light',
  colors: {
    light: {
      bg: '#fff',
      ink: '#000',
      accent: '#000',
      accentSurface: '#f80',
      onAccent: '#000',
    },
    dark: {
      bg: '#000',
      ink: '#fff',
      accent: '#fff',
      accentSurface: '#f80',
      onAccent: '#000',
    },
  },
  categories: [{ id: 'a', name: 'A', light: '#111', dark: '#eee' }],
  tokens: {},
  fonts: [{ family: 'Demo', weight: '200 800', file: 'demo.woff2' }],
};

/**
 * Un deck de prueba. Las slides se pueden escribir con `title`, `titleSize`, `subtitle` y
 * `headerSpan` en la slide: `migrateSlide` los pasa al bloque `heading`, como en un deck guardado.
 */
const deck = (...slides: object[]): Deck => ({
  version: 1,
  id: 'd',
  title: 'Demo <1>',
  lang: 'es',
  theme: 'demo',
  slides: slides.map(
    (slide) =>
      migrateSlide(slide as Record<string, unknown>) as unknown as Slide,
  ),
});

describe('renderDeck', () => {
  it('escapa el texto del contenido y del título', () => {
    const { html } = renderDeck(
      deck({
        kind: 'content',
        title: ['<script>x</script>'],
        body: [{ kind: 'note', text: 'a & b' }],
      }),
      theme,
    );
    expect(html).toContain('<title>Demo &lt;1&gt;</title>');
    expect(html).toContain('&lt;script&gt;x&lt;/script&gt;');
    expect(html).toContain('a &amp; b');
  });

  it('numera la entrada de los bloques desde 3, en orden', () => {
    const { html } = renderDeck(
      deck({
        kind: 'content',
        body: [
          { kind: 'note', text: 'uno' },
          { kind: 'note', text: 'dos' },
        ],
      }),
      theme,
    );
    expect(html).toMatch(/class="note"[^>]*--i:3[^>]*>uno/);
    expect(html).toMatch(/class="note"[^>]*--i:4[^>]*>dos/);
  });

  it('el título entra por líneas con su propio orden', () => {
    const { html } = renderDeck(
      deck({ kind: 'content', titleSize: 'xl', title: ['Hola', 'equipo'] }),
      theme,
    );
    expect(html).toContain(
      '<h1 class="title t-xl"><span class="mask"><span>Hola</span></span><span class="mask" style="--i:1"><span>equipo</span></span></h1>',
    );
  });

  it('el tamaño del título sale del layout y se puede cambiar', () => {
    expect(
      renderDeck(deck({ kind: 'content', title: ['a'], body: [] }), theme).html,
    ).toContain('<h2 class="title t-sm">');
    expect(
      renderDeck(
        deck({ kind: 'content', titleSize: 'md', title: ['a'], body: [] }),
        theme,
      ).html,
    ).toContain('<h1 class="title t-md">');
  });

  it('una categoría pone --c en la slide y en la tarjeta', () => {
    const { html } = renderDeck(
      deck({
        kind: 'content',
        columns: 2,
        category: 0,
        body: [{ kind: 'card', title: 'x', category: 0 }],
      }),
      theme,
    );
    expect(html).toContain('style="--c: var(--cat-1);"');
    expect(html).toMatch(/--i:3; --c:var\(--cat-1\);/);
    expect(html).toContain('class="card has-category"');
  });

  it('la agenda se parte en dos columnas y marca el descanso', () => {
    const { html } = renderDeck(
      deck({
        kind: 'content',
        body: [
          {
            kind: 'agenda',
            columns: 2,
            split: 1,
            items: [
              { time: '10:00', title: 'A' },
              {
                time: '11:40',
                title: 'Descanso',
                type: 'highlight',
                icon: 'fork',
              },
            ],
          },
        ],
      }),
      theme,
    );
    expect(html.match(/<ol>/g)).toHaveLength(2);
    expect(html).toMatch(
      /<li data-r style="--i:\d+" class="highlight last-highlight has-icon"/,
    );
  });

  it('la cuenta regresiva arranca oculta y lleva la fecha con zona', () => {
    const { html } = renderDeck(
      deck({
        kind: 'content',
        body: [
          {
            kind: 'countdown',
            target: '2026-11-22T10:00:00-05:00',
            label: 'Falta',
          },
        ],
      }),
      theme,
    );
    expect(html).toContain('data-target="2026-11-22T10:00:00-05:00"');
    expect(html).toMatch(/class="countdown"[^>]*hidden/);
  });

  it('el eyebrow lleva el modo y los minutos como datos', () => {
    const { html } = renderDeck(
      deck({
        kind: 'content',
        eyebrow: { text: 'Punto', mode: 'decide', minutes: 9 },
        body: [],
      }),
      theme,
    );
    expect(html).toContain('data-mode="decide">Decidir</span>');
    expect(html).toContain('9 min</span>');
  });

  it('un deck inválido no se dibuja y dice por qué', () => {
    const bad = deck({ kind: 'content', category: 5, body: [] });
    expect(() => renderDeck(bad, theme)).toThrow(/slides\[0\]\.category/);
  });

  it('un componente sin registrar es un error, y uno registrado se usa', () => {
    const custom = deck({
      kind: 'content',
      columns: 2,
      body: [{ kind: 'custom', component: 'hola', props: { n: 2 } }],
    });
    expect(() => renderDeck(custom, theme)).toThrow(/hola/);
    const { html } = renderDeck(custom, theme, {
      registry: {
        components: { hola: (p) => `<i>${String(p.n)}</i>` },
        css: '.x{}',
      },
    });
    expect(html).toContain('<i>2</i>');
    expect(html).toContain('.x{}');
  });

  it('un icono desconocido es un error', () => {
    expect(() =>
      renderDeck(
        deck({
          kind: 'content',
          body: [{ kind: 'notice', text: 'x', icon: 'no-existe' }],
        }),
        theme,
      ),
    ).toThrow(/no-existe/);
  });

  it('declara las fuentes con su rango de peso y devuelve la lista para copiarlas', () => {
    const out = renderDeck(deck(), theme);
    expect(out.html).toContain('font-weight: 200 800');
    expect(out.html).toContain('url("assets/fonts/demo.woff2")');
    expect(out.fonts).toEqual(theme.fonts);
  });

  it('sin botón de tema cuando el deck lo desactiva', () => {
    const d = { ...deck(), engine: { themeToggle: false } };
    expect(renderDeck(d, theme).html).not.toContain('id="theme"');
    expect(renderDeck(deck(), theme).html).toContain('id="theme"');
  });

  it('el motor y el CSS no llevan texto sin resolver', () => {
    const { html } = renderDeck(
      deck({ kind: 'content', titleSize: 'xl', title: ['a'] }),
      theme,
    );
    expect(html).not.toContain('undefined');
    expect(html).not.toContain('${');
    expect(html).toContain('--cat-1: #111;');
  });

  it('el componente «hand-raise» viene con todo tema, sin registrarlo', () => {
    const { html } = renderDeck(
      deck({
        kind: 'content',
        columns: 2,
        body: [
          { kind: 'custom', component: 'hand-raise', props: { text: 'Hola' } },
        ],
      }),
      theme,
    );
    expect(html).toMatch(/class="hand"[^>]*>.*<span>Hola<\/span>/);
    expect(html).toContain('.hand {');
  });

  it('el encabezado y cada bloque van en su celda de la cuadrícula, con el subtítulo bajo el filete', () => {
    const { html } = renderDeck(
      deck({
        kind: 'content',
        columns: 2,
        headerSpan: 1,
        title: ['a'],
        subtitle: 'x',
        body: [{ kind: 'chips', items: [{ text: 'y' }] }],
      }),
      theme,
    );
    expect(html).toContain(
      '<div class="content cols-2" style="--cols:2;--rows:1;grid-template-rows:auto">',
    );
    expect(html).toMatch(
      /<div class="cell head" data-block="0" data-cell="C1·F1" style="grid-column:1 \/ span 1;grid-row:1 \/ span 1;"><h2 class="title[^>]*>.*<div class="rule"><\/div><p class="lede"[^>]*>x<\/p><\/div>/,
    );
    expect(html).toContain(
      '<div class="cell" data-block="1" data-cell="C2·F1" style="grid-column:2 / span 1;grid-row:1 / span 1;"><div class="chips"',
    );
  });

  it('un bloque con posición va a su celda y puede ocupar varias filas', () => {
    const { html } = renderDeck(
      deck({
        kind: 'content',
        columns: 2,
        rows: 2,
        headerSpan: 1,
        title: ['a'],
        body: [
          {
            kind: 'countdown',
            target: '2026-11-22T10:00:00-05:00',
            label: 'Falta',
            col: 1,
            row: 2,
          },
          {
            kind: 'qr',
            src: 's',
            alt: 'a',
            link: 'l',
            col: 2,
            row: 1,
            rowSpan: 2,
          },
        ],
      }),
      theme,
    );
    expect(html).toContain(
      'style="--cols:2;--rows:2;grid-template-rows:auto auto"',
    );
    expect(html).toContain(
      '<div class="cell" data-block="1" data-cell="C1·F2" style="grid-column:1 / span 1;grid-row:2 / span 1;"><p class="countdown"',
    );
    expect(html).toContain(
      'data-block="2" data-cell="C2·F1" style="grid-column:2 / span 1;grid-row:1 / span 2;"',
    );
  });

  it('tarjetas, personas y avisos llenan su celda por omisión; grow: false lo quita', () => {
    const html = (block: object) =>
      renderDeck(
        deck({ kind: 'content', title: ['a'], body: [block as never] }),
        theme,
      ).html;
    expect(html({ kind: 'card', title: 'x' })).toMatch(
      /<div class="cell grow" data-block="1" data-cell="C1·F2"/,
    );
    expect(html({ kind: 'person', person: { name: 'n' } })).toContain(
      'cell grow',
    );
    expect(html({ kind: 'card', title: 'x', grow: false })).not.toContain(
      'cell grow',
    );
    expect(html({ kind: 'note', text: 'x' })).not.toContain('cell grow');
  });

  it('la entrada animada y el orden del HTML siguen la posición en la cuadrícula, no el orden de los bloques', () => {
    const { html } = renderDeck(
      deck({
        kind: 'content',
        columns: 2,
        body: [
          { kind: 'note', text: 'segundo', col: 2, row: 1 },
          { kind: 'note', text: 'primero', col: 1, row: 1 },
        ],
      }),
      theme,
    );
    expect(html).toMatch(/class="note"[^>]*--i:3[^>]*>primero/);
    expect(html).toMatch(/class="note"[^>]*--i:4[^>]*>segundo/);
    expect(html.indexOf('primero')).toBeLessThan(html.indexOf('segundo'));
    expect(html).toContain('data-block="1" data-cell="C1·F1"');
  });

  it('el título es un bloque más: va donde lo pongan', () => {
    const { html } = renderDeck(
      deck({
        kind: 'content',
        columns: 2,
        body: [
          { kind: 'note', text: 'uno' },
          { kind: 'heading', title: ['T'], col: 2, row: 1, span: 1 },
        ],
      }),
      theme,
    );
    expect(html).toContain(
      '<div class="cell head" data-block="1" data-cell="C2·F1" style="grid-column:2 / span 1;grid-row:1 / span 1;"><h2 class="title t-sm">',
    );
  });

  it('el motor de la vista previa avisa de la celda pulsada y resalta la que pide el editor', () => {
    const { html } = renderDeck(
      deck({ kind: 'content', title: ['a'] }),
      theme,
      {
        preview: true,
      },
    );
    expect(html).toContain('{ deckBlock: index }');
    expect(html).toContain('{ deckHover: index }');
    expect(html).toContain('deckAdd: {');
    expect(html).toContain('{ deckDelete: owner }');
    expect(html).toContain("'deckHighlight' in e.data");
    expect(html).toContain('.content > .cell.hl');
  });

  it('la vista previa no lleva las zonas de clic para pasar de slide, el deck final sí', () => {
    const preview = renderDeck(deck({ kind: 'content', title: ['a'] }), theme, {
      preview: true,
    }).html;
    expect(preview).not.toContain('<nav class="nav"');
    const final = renderDeck(
      deck({ kind: 'content', title: ['a'] }),
      theme,
    ).html;
    expect(final).toContain('<nav class="nav"');
  });

  it('la vista previa ofrece un «+» en cada celda libre; el deck final no', () => {
    const slide = {
      kind: 'content',
      columns: 2,
      rows: 2,
      body: [{ kind: 'note', text: 'x', col: 1, row: 1 }],
    };
    const preview = renderDeck(deck(slide), theme, { preview: true }).html;
    expect(preview).toContain('data-add-col="2" data-add-row="1"');
    expect(preview).toContain('data-add-col="1" data-add-row="2"');
    expect(preview).not.toContain('data-add-col="1" data-add-row="1"');
    const final = renderDeck(deck(slide), theme).html;
    expect(final).not.toContain('data-add-col="');
    // una fila fija sin bloques deja su espacio también en el deck final; la que tiene contenido mide lo que él
    expect(final).toContain(
      '--rows:2;grid-template-rows:auto minmax(var(--row-min), auto)',
    );
  });

  it('solo las filas vacías dejan alto mínimo: las que tienen contenido no se estiran', () => {
    const { html } = renderDeck(
      deck({
        kind: 'content',
        body: [
          { kind: 'heading', title: ['a'] },
          { kind: 'chips', items: [{ text: 'x' }] },
        ],
      }),
      theme,
      { preview: true },
    );
    // filas 1 y 2 con contenido, fila 3 (la de los «+») libre
    expect(html).toContain(
      'grid-template-rows:auto auto minmax(var(--row-min), auto)',
    );
  });

  it('la vista previa pone un botón de eliminar en cada bloque; el deck final no', () => {
    const slide = { kind: 'content', body: [{ kind: 'note', text: 'x' }] };
    const preview = renderDeck(deck(slide), theme, { preview: true }).html;
    expect(preview).toContain('<button type="button" class="cell-delete"');
    expect(renderDeck(deck(slide), theme).html).not.toContain(
      '<button type="button" class="cell-delete"',
    );
  });

  it('la densidad cambia la separación entre celdas: compacta la reduce y amplia la aumenta', () => {
    const html = (density: string) =>
      renderDeck(deck({ kind: 'content', density, body: [] }), theme).html;
    expect(html('compact')).toContain('class="slide slide-content compact"');
    expect(html('spacious')).toContain('class="slide slide-content spacious"');
    const css = html('normal');
    expect(css).toContain(
      '.compact { --gap-scale: var(--gap-scale-compact); }',
    );
    expect(css).toContain(
      'column-gap: calc(var(--gap-x) * var(--gap-scale, 1))',
    );
    expect(css).toMatch(/--gap-scale-compact: ?\.45/);
  });

  it('ver celdas: el motor acepta el mensaje deckCells y el CSS dibuja los bordes solo con esa clase', () => {
    const { html } = renderDeck(
      deck({ kind: 'content', title: ['a'] }),
      theme,
      {
        preview: true,
      },
    );
    expect(html).toContain("'deckCells' in e.data");
    expect(html).toContain('.show-cells [data-cell]::before');
  });

  it('un bloque de ancho completo ocupa todas las columnas', () => {
    const { html } = renderDeck(
      deck({
        kind: 'content',
        columns: 3,
        title: ['a'],
        body: [{ kind: 'timeline', events: [{ date: 'd', title: 't' }] }],
      }),
      theme,
    );
    expect(html).toContain('grid-column:1 / span 3;grid-row:2 / span 1;');
  });
});

describe('motor', () => {
  it('guarda la slide en el hash y avisa a la página que lo contiene', () => {
    const { html } = renderDeck(
      deck({ kind: 'content', titleSize: 'xl', title: ['a'] }),
      theme,
    );
    expect(html).toContain("history.replaceState(null, '', '#' + (n + 1))");
    expect(html).toContain('window.parent.postMessage({ deckSlide: n + 1 }');
    expect(html).toContain('(parseInt(location.hash.slice(1), 10) || 1) - 1');
  });
});

describe('vista previa (galería)', () => {
  it('solo se activa si se pide, y entonces el motor acepta mensajes deckPreview', () => {
    const off = renderDeck(
      deck({ kind: 'content', titleSize: 'xl', title: ['a'] }),
      theme,
    ).html;
    expect(off).not.toContain('"preview":true');
    const on = renderDeck(
      deck({ kind: 'content', titleSize: 'xl', title: ['a'] }),
      theme,
      {
        preview: true,
      },
    ).html;
    expect(on).toContain('"preview":true');
    expect(on).toContain('e.data.deckPreview');
    // en la galería y el editor las cuentas regresivas se ven aunque falten más de 24 horas
    expect(on).toContain('!C.preview && ms >');
  });
});

describe('modo de la línea superior', () => {
  it('se muestra por omisión: si el contenido pone un modo, se ve', () => {
    const { html } = renderDeck(
      deck({
        kind: 'content',
        eyebrow: { text: 'Punto', mode: 'discuss' },
        body: [],
      }),
      theme,
    );
    expect(html).toContain('--eyebrow-mode-display: inline-flex;');
    expect(html).toContain('data-mode="discuss">Conversar</span>');
  });

  it('un tema puede ocultarlo con el token', () => {
    const hidden = { ...theme, tokens: { 'eyebrow-mode-display': 'none' } };
    expect(renderDeck(deck(), hidden).html).toContain(
      '--eyebrow-mode-display: none;',
    );
  });
});

describe('lista', () => {
  it('un ítem con icono lleva su propia columna y marca la fila', () => {
    const { html } = renderDeck(
      deck({
        kind: 'content',
        body: [
          {
            kind: 'list',
            ordered: true,
            items: [{ text: 'A', icon: 'info', detail: 'd' }, { text: 'B' }],
          },
        ],
      }),
      theme,
    );
    expect(html).toMatch(
      /<li class="has-icon"[^>]*data-n="01"[^>]*><span class="li-icon"><svg/,
    );
    expect(html).toMatch(/<li data-n="02"/);
    expect(html).toContain('<small>d</small>');
  });
});

describe('línea superior sin texto', () => {
  it('solo con número (como en una sección) se dibuja el número, y sin línea superior no hay nada', () => {
    const con = renderDeck(
      deck({
        kind: 'content',
        titleSize: 'xl',
        eyebrow: { index: '02' },
        title: ['Cambio'],
      }),
      theme,
    ).html;
    expect(con).toMatch(/<div class="eyebrow"[^>]*><b>02<\/b><\/div>/);
    expect(con).toContain('<h1 class="title t-xl">');
    const sin = renderDeck(
      deck({ kind: 'content', title: ['Cambio'] }),
      theme,
    ).html;
    expect(sin).not.toContain('<div class="eyebrow"');
  });
});

describe('mergeRegistries', () => {
  it('el último gana y el CSS se junta', () => {
    const merged = mergeRegistries(
      { components: { a: () => '1' }, css: 'x' },
      { components: { a: () => '2' }, css: 'y' },
    );
    expect(merged.components.a?.({}, {} as never)).toBe('2');
    expect(merged.css).toContain('x');
    expect(merged.css).toContain('y');
  });
});

describe('el renderizador dibuja cada campo que el esquema promete', () => {
  /** Textos únicos de un elemento con todos sus campos llenos. */
  function tokensOf(sample: unknown): string[] {
    if (typeof sample === 'string')
      return sample.startsWith('«') ? [sample] : [];
    if (Array.isArray(sample)) return sample.flatMap(tokensOf);
    if (sample && typeof sample === 'object')
      return Object.values(sample).flatMap(tokensOf);
    return [];
  }

  for (const kind of BLOCK_KINDS.filter((k) => k !== 'custom')) {
    it(`bloque «${kind}»`, () => {
      const block = {
        kind,
        ...fullSample(BLOCK_DESCRIPTORS[kind].fields, kind),
      } as Block;
      const { html } = renderDeck(
        deck({ kind: 'content', body: [block] }),
        theme,
        {
          skipValidation: true,
        },
      );
      const missing = tokensOf(block).filter((token) => !html.includes(token));
      expect(missing).toEqual([]);
    });
  }

  for (const kind of SLIDE_KINDS) {
    it(`slide «${kind}»`, () => {
      const base = fullSample(SLIDE_DESCRIPTORS[kind].fields, kind);
      const slide = {
        kind,
        ...base,
        category: undefined,
      } as unknown as Slide;
      const { html } = renderDeck(deck(slide), theme);
      const skip = ['notes'];
      const tokens = tokensOf(
        Object.fromEntries(
          Object.entries(base).filter(([key]) => !skip.includes(key)),
        ),
      );
      expect(tokens.filter((token) => !html.includes(token))).toEqual([]);
    });
  }
});

describe('renderSlides y reemplazo en vivo', () => {
  it('devuelve el HTML de cada slide, también si el deck está a medias', () => {
    const half = deck(
      { kind: 'content', category: 9, body: [] },
      { kind: 'content', titleSize: 'xl', title: ['b'] },
    );
    const slides = renderSlides(half);
    expect(slides).toHaveLength(2);
    expect(slides[1]).toContain('<h1 class="title t-xl">');
    expect(slides[1]).toContain('02 / 02');
  });

  it('el motor de vista previa sabe reemplazar una slide sin recargar', () => {
    const on = renderDeck(
      deck({ kind: 'content', titleSize: 'xl', title: ['a'] }),
      theme,
      {
        preview: true,
      },
    ).html;
    expect(on).toContain('e.data.deckReplace');
    expect(on).toContain('old.replaceWith(fresh)');
    expect(on).toContain("fresh.classList.add('is-active')");
  });
});

describe('fondo de la slide', () => {
  const layer = {
    src: 'assets/fondo.webp',
    ratio: '1000 / 1063',
    width: 90,
    x: 86,
    y: 80,
    anchorX: 62.5,
    anchorY: 85.5,
    opacity: 70,
  };
  const html = (background: object[]) =>
    renderSlides(deck({ kind: 'content', background, body: [] }))[0] ?? '';

  it('dibuja cada capa detrás del contenido, con su posición en variables', () => {
    const out = html([layer]);
    expect(out).toContain('<div class="bg" aria-hidden="true">');
    expect(out).toContain('--src:url(assets/fondo.webp)');
    expect(out).toContain('--x:86;--y:80;--w:90;--ax:62.5;--ay:85.5;--o:0.7');
    expect(out).toContain('--ratio:1000 / 1063');
    expect(out.indexOf('class="bg"')).toBeLessThan(
      out.indexOf('class="content'),
    );
  });

  it('una silueta lleva su color del tema; una imagen no', () => {
    const out = html([layer, { ...layer, mode: 'silhouette', tint: 'bg' }]);
    expect(out.match(/is-silhouette/g)).toHaveLength(1);
    expect(out).toContain('--tint:var(--bg)');
  });

  it('sin capas no deja nada', () => {
    expect(html([])).not.toContain('class="bg"');
  });

  it('el titular admite un icono en su cuadro', () => {
    const out = renderSlides(
      deck({
        kind: 'content',
        body: [{ kind: 'heading', title: ['A'], icon: 'megaphone' }],
      }),
    )[0];
    expect(out).toContain('heading-badge');
    expect(out).toContain('m3 11 18-5v12L3 14v-3z');
  });
});
