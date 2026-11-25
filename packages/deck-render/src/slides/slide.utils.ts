import type {
  BackgroundLayer,
  Eyebrow,
  Person,
  Slide,
} from '@colaboradocs/deck-core';
import {
  type Block,
  type ContentSlide,
  freeCells,
  layoutContent,
  type Placement,
  slideStyleAttr,
} from '@colaboradocs/deck-core';
import { renderBlock } from '../blocks/block.utils';
import { cx, esc } from '../html.utils';
import { icon } from '../icons.utils';
import type { SlideContext } from '../render.types';

function eyebrowHtml(eyebrow: Eyebrow | undefined, ctx: SlideContext): string {
  if (!eyebrow) return '';
  const mode = eyebrow.mode
    ? `<span class="mode" data-mode="${eyebrow.mode}">${esc(ctx.strings.modes[eyebrow.mode])}</span>`
    : '';
  const minutes = eyebrow.minutes
    ? `<span class="t" title="${esc(ctx.strings.minutesTitle)}">${icon('clock')}${eyebrow.minutes} min</span>`
    : '';
  const index = eyebrow.index ? `<b>${esc(eyebrow.index)}</b>` : '';
  // El texto va en un contenedor que lo desliza si no cabe (ver el motor: `mq`).
  const text = eyebrow.text
    ? `<span class="mq"><span class="mq-track"><span class="mq-text">${esc(eyebrow.text)}</span></span></span>`
    : '';
  return `<div class="eyebrow" data-r>${index}${text}${mode}${minutes}</div>`;
}

function speakerHtml(speaker: Person | undefined, ctx: SlideContext): string {
  if (!speaker) return '';
  const text = `<b>${esc(speaker.name)}</b>${speaker.role ? ` · ${esc(speaker.role)}` : ''}`;
  // Igual que el eyebrow: si no cabe en la línea, el texto se desliza.
  return `<div class="speaker" data-r title="${esc(ctx.strings.speakerTitle)}">${icon('mic')}<span class="mq"><span class="mq-track"><span class="mq-text">${text}</span></span></span></div>`;
}

function decorHtml(slide: Slide, ctx: SlideContext): string {
  if (!slide.decor) return '';
  const component = ctx.registry.components[slide.decor.component];
  if (!component)
    throw new Error(`Componente no registrado: «${slide.decor.component}».`);
  return component(slide.decor.props ?? {}, ctx);
}

const num = (value: number | undefined, fallback: number) =>
  Number.isFinite(value) ? (value as number) : fallback;

/** Una capa: la posición y el tamaño van en variables; el archivo, en `--src` (se reemplaza con la ruta real al servir). */
function layerHtml(layer: BackgroundLayer): string {
  const silhouette = layer.mode === 'silhouette';
  const vars = [
    `--src:url(${layer.src})`,
    `--x:${num(layer.x, 50)}`,
    `--y:${num(layer.y, 50)}`,
    `--w:${num(layer.width, 50)}`,
    `--ax:${num(layer.anchorX, 50)}`,
    `--ay:${num(layer.anchorY, 50)}`,
    `--o:${num(layer.opacity, 100) / 100}`,
    `--ratio:${layer.ratio}`,
    silhouette && `--tint:var(--${layer.tint ?? 'ink'})`,
  ].filter(Boolean);
  return `<div class="${cx('bg-layer', silhouette && 'is-silhouette')}" style="${esc(vars.join(';'))}"></div>`;
}

function backgroundHtml(slide: Slide): string {
  if (!slide.background?.length) return '';
  return `<div class="bg" aria-hidden="true">${slide.background.map(layerHtml).join('')}</div>`;
}

const cell = (place: Placement) =>
  `grid-column:${place.col} / span ${place.span};grid-row:${place.row} / span ${place.rowSpan};`;

/** Rótulo de una celda para «ver celdas» en la vista previa: columna y fila, desde 1. */
const label = (place: Placement) => `C${place.col}·F${place.row}`;

/** Los bloques con recuadro llenan el alto de su celda salvo que pidan lo contrario. */
const GROWING: readonly Block['kind'][] = ['card', 'person', 'notice'];
const growsToFill = (block: Block): boolean =>
  GROWING.includes(block.kind) && block.grow !== false;

/** El botón de eliminar que aparece sobre un bloque en la vista previa (nunca en el deck final). */
const DELETE_BUTTON =
  '<button type="button" class="cell-delete" aria-label="Eliminar bloque"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg></button>';

function contentHtml(slide: ContentSlide, ctx: SlideContext): string {
  const layout = layoutContent(slide);
  // la entrada animada y el orden de lectura siguen la posición en la cuadrícula (de arriba a abajo, de izquierda a derecha)
  const ordered = (slide.body ?? [])
    .map((block, index) => ({ block, index, place: layout.blocks[index] }))
    .sort(
      (a, b) =>
        (a.place?.row ?? 0) - (b.place?.row ?? 0) ||
        (a.place?.col ?? 0) - (b.place?.col ?? 0) ||
        a.index - b.index,
    );
  // en la vista previa, cada celda libre ofrece un «+» para agregar un bloque ahí
  const free = ctx.preview ? freeCells(slide) : [];
  const addCells = free
    .map(
      (at) =>
        `<div class="cell add" style="${cell({ ...at, span: 1, rowSpan: 1 })}"><button type="button" class="add-cell" data-add-col="${at.col}" data-add-row="${at.row}" aria-label="Agregar bloque">+</button></div>`,
    )
    .join('\n');
  const rows = Math.max(layout.rows, ...free.map((at) => at.row));
  // una fila sin ningún bloque deja un alto mínimo (para usarla de espacio); las demás miden lo que su contenido
  const used = new Set<number>();
  for (const at of layout.blocks)
    for (let r = at.row; r < at.row + at.rowSpan; r++) used.add(r);
  const tracks = Array.from({ length: rows }, (_, i) =>
    used.has(i + 1) ? 'auto' : 'minmax(var(--row-min), auto)',
  ).join(' ');
  const cells = ordered
    .map(({ block, index, place }) => {
      const inner = renderBlock(block, ctx);
      if (!place) return inner;
      const classes = cx(
        'cell',
        block.kind === 'heading' && 'head',
        growsToFill(block) && 'grow',
      );
      const remove = ctx.preview ? DELETE_BUTTON : '';
      return `<div class="${classes}" data-block="${index}" data-cell="${label(place)}" style="${cell(place)}">${inner}${remove}</div>`;
    })
    .join('\n');
  return `<div class="content cols-${layout.columns}" style="--cols:${layout.columns};--rows:${rows};grid-template-rows:${tracks}">${cells}${addCells}</div>`;
}

/** Una slide completa. `page`/`total` solo alimentan el número que sale en el PDF. */
export function renderSlide(
  slide: Slide,
  page: number,
  total: number,
  ctx: SlideContext,
): string {
  const style = slideStyleAttr(slide.style, slide.category);
  const classes = cx(
    'slide',
    `slide-${slide.kind}`,
    slide.tone && slide.tone !== 'default' && `tone-${slide.tone}`,
    slide.density === 'compact' && 'compact',
    slide.density === 'spacious' && 'spacious',
    slide.category !== undefined && 'has-category',
  );
  const pg = `<div class="pg" aria-hidden="true">${String(page).padStart(2, '0')} / ${String(total).padStart(2, '0')}</div>`;
  const inner = `${backgroundHtml(slide)}${decorHtml(slide, ctx)}${eyebrowHtml(slide.eyebrow, ctx)}${contentHtml(slide, ctx)}${speakerHtml(slide.speaker, ctx)}${pg}`;
  return `<section${style ? ` style="${esc(style)}"` : ''} class="${classes}"${slide.id ? ` id="${esc(slide.id)}"` : ''}>${inner}</section>`;
}

/** Contexto nuevo para cada slide: el orden de entrada de los bloques arranca en 3 (0 a 2 son de las líneas del título). */
export function slideContext(base: Omit<SlideContext, 'reveal'>): SlideContext {
  let next = 3;
  return {
    ...base,
    reveal: () => next++,
  };
}
