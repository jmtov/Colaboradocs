import type { Issue, Theme } from '../theme/theme.types';
import { resolveStyle } from '../theme/theme.utils';
import {
  AGENDA_MODES,
  BACKGROUND_MODES,
  BACKGROUND_TINTS,
  BLOCK_KINDS,
  BLOCK_SPAN,
  DECK_VERSION,
  ISO_WITH_OFFSET,
  MAX_ROWS,
  SINGLE_BLOCK_KINDS,
  SLIDE_KINDS,
  TITLE_SIZES,
} from './deck.constants';
import type {
  BackgroundLayer,
  Block,
  ContentSlide,
  Deck,
  Slide,
} from './deck.types';
import { columnsOf, layoutContent } from './layout.utils';

const isBlockKind = (kind: unknown): kind is Block['kind'] =>
  (BLOCK_KINDS as readonly unknown[]).includes(kind);
const isSlideKind = (kind: unknown): kind is Slide['kind'] =>
  (SLIDE_KINDS as readonly unknown[]).includes(kind);

interface Ctx {
  issues: Issue[];
  categoryCount: number;
}

function checkCategory(category: number | undefined, path: string, ctx: Ctx) {
  if (category === undefined) return;
  if (
    !Number.isInteger(category) ||
    category < 0 ||
    category >= ctx.categoryCount
  ) {
    ctx.issues.push({
      path,
      message: `La categoría debe estar entre 0 y ${ctx.categoryCount - 1}.`,
    });
  }
}

function checkBlock(block: Block, path: string, ctx: Ctx) {
  if (!isBlockKind(block.kind)) {
    ctx.issues.push({
      path: `${path}.kind`,
      message: `Tipo de bloque desconocido: ${String(block.kind)}.`,
    });
    return;
  }
  switch (block.kind) {
    case 'countdown':
      if (!ISO_WITH_OFFSET.test(block.target)) {
        ctx.issues.push({
          path: `${path}.target`,
          message: 'La fecha necesita zona horaria (…T10:00:00-05:00).',
        });
      }
      break;
    case 'card':
      checkCategory(block.category, `${path}.category`, ctx);
      break;
    case 'agenda':
      block.items.forEach((item, i) => {
        if (
          item.mode &&
          !(AGENDA_MODES as readonly string[]).includes(item.mode)
        ) {
          ctx.issues.push({
            path: `${path}.items[${i}].mode`,
            message: `Modo desconocido: ${item.mode}.`,
          });
        }
      });
      break;
    case 'heading':
      if (
        block.titleSize &&
        !(TITLE_SIZES as readonly string[]).includes(block.titleSize)
      ) {
        ctx.issues.push({
          path: `${path}.titleSize`,
          message: `Tamaño de título desconocido: ${block.titleSize}.`,
        });
      }
      break;
    case 'list':
      if (block.items.length === 0)
        ctx.issues.push({
          path: `${path}.items`,
          message: 'La lista está vacía.',
        });
      break;
    default:
      break;
  }
}

function checkBlocks(blocks: Block[] | undefined, path: string, ctx: Ctx) {
  blocks?.forEach((block, i) => {
    checkBlock(block, `${path}[${i}]`, ctx);
  });
}

/** El ancho de cada bloque debe estar en su rango y los bloques deben caber en la cuadrícula sin pisarse. */
function checkContent(slide: ContentSlide, path: string, ctx: Ctx) {
  const columns = columnsOf(slide);
  const seen = new Set<string>();
  slide.body?.forEach((block, i) => {
    if (!(SINGLE_BLOCK_KINDS as readonly string[]).includes(block.kind)) return;
    if (seen.has(block.kind))
      ctx.issues.push({
        path: `${path}.body[${i}]`,
        message: `Solo puede haber un bloque «${block.kind}» por slide.`,
      });
    seen.add(block.kind);
  });
  slide.body?.forEach((block, i) => {
    const policy = BLOCK_SPAN[block.kind];
    if (
      policy &&
      policy !== 'fill' &&
      block.span !== undefined &&
      (block.span < policy.min || block.span > policy.max)
    ) {
      ctx.issues.push({
        path: `${path}.body[${i}].span`,
        message: `«${block.kind}» ocupa entre ${policy.min} y ${policy.max} columnas.`,
      });
    }
  });
  if (slide.rows !== undefined && (slide.rows < 1 || slide.rows > MAX_ROWS)) {
    ctx.issues.push({
      path: `${path}.rows`,
      message: `La cuadrícula admite entre 1 y ${MAX_ROWS} filas.`,
    });
  }
  for (const issue of layoutContent(slide).issues) {
    ctx.issues.push({
      path: `${path}.body[${issue.index}]`,
      message:
        issue.kind === 'overlap'
          ? 'Este bloque ocupa celdas de otro.'
          : `Este bloque se sale de la cuadrícula (${columns} columnas, ${MAX_ROWS} filas como máximo).`,
    });
  }
}

/** Lo que va dentro de `url(…)` y de `aspect-ratio`: nada que rompa el CSS (comillas, paréntesis, llaves, `;`, espacios en la ruta). */
const BACKGROUND_SRC = /^[^\s()'"\\;{}<>]+$/;
const BACKGROUND_RATIO = /^[^;{}"'<>\\]+$/;

function checkBackground(layers: BackgroundLayer[], path: string, ctx: Ctx) {
  layers.forEach((layer, i) => {
    const at = `${path}[${i}]`;
    const issue = (field: string, message: string) =>
      ctx.issues.push({ path: `${at}.${field}`, message });
    if (!BACKGROUND_SRC.test(layer.src ?? ''))
      issue(
        'src',
        'Debe ser la ruta de un archivo, sin espacios ni paréntesis (assets/nombre.ext).',
      );
    if (!BACKGROUND_RATIO.test(layer.ratio ?? ''))
      issue(
        'ratio',
        'Debe ser ancho / alto, p. ej. 1000 / 1063, sin comillas ni llaves.',
      );
    if (!(layer.width > 0)) issue('width', 'El ancho debe ser mayor que 0.');
    for (const key of ['x', 'y'] as const)
      if (typeof layer[key] !== 'number')
        issue(key, 'Debe ser un número (% de la slide).');
    if (
      layer.mode !== undefined &&
      !(BACKGROUND_MODES as readonly string[]).includes(layer.mode)
    )
      issue('mode', `Modo desconocido: ${layer.mode}.`);
    if (
      layer.tint !== undefined &&
      !(BACKGROUND_TINTS as readonly string[]).includes(layer.tint)
    )
      issue('tint', `Color desconocido: ${layer.tint}.`);
    if (
      layer.opacity !== undefined &&
      !(layer.opacity >= 0 && layer.opacity <= 100)
    )
      issue('opacity', 'La opacidad va de 0 a 100.');
  });
}

function checkSlide(slide: Slide, path: string, ctx: Ctx) {
  if (!isSlideKind(slide.kind)) {
    ctx.issues.push({
      path: `${path}.kind`,
      message: `Tipo de slide desconocido: ${String(slide.kind)}.`,
    });
    return;
  }
  checkCategory(slide.category, `${path}.category`, ctx);
  if (slide.eyebrow?.minutes !== undefined && !(slide.eyebrow.minutes > 0)) {
    ctx.issues.push({
      path: `${path}.eyebrow.minutes`,
      message: 'Los minutos deben ser mayores que 0.',
    });
  }
  if (
    slide.eyebrow?.mode &&
    !(AGENDA_MODES as readonly string[]).includes(slide.eyebrow.mode)
  ) {
    ctx.issues.push({
      path: `${path}.eyebrow.mode`,
      message: `Modo desconocido: ${slide.eyebrow.mode}.`,
    });
  }
  if (slide.background)
    checkBackground(slide.background, `${path}.background`, ctx);
  checkBlocks(slide.body, `${path}.body`, ctx);
  checkContent(slide, path, ctx);
}

/** Valida un deck contra el esquema y contra su tema (categorías, variante). No dibuja nada. */
export function validateDeck(deck: Deck, theme: Theme): Issue[] {
  const ctx: Ctx = {
    issues: [],
    categoryCount: resolveStyle(theme, deck.variant, deck.style).categories
      .length,
  };
  if (deck.version !== DECK_VERSION)
    ctx.issues.push({
      path: 'version',
      message: `Versión de esquema no soportada: ${deck.version}.`,
    });
  if (deck.theme !== theme.id)
    ctx.issues.push({
      path: 'theme',
      message: `El deck pide el tema «${deck.theme}» y se validó contra «${theme.id}».`,
    });
  if (deck.variant && !theme.variants?.[deck.variant])
    ctx.issues.push({
      path: 'variant',
      message: `El tema no tiene la variante «${deck.variant}».`,
    });
  const ids = new Set<string>();
  deck.slides.forEach((slide, i) => {
    if (slide.id) {
      if (ids.has(slide.id))
        ctx.issues.push({
          path: `slides[${i}].id`,
          message: `Id repetido: ${slide.id}.`,
        });
      ids.add(slide.id);
    }
    checkSlide(slide, `slides[${i}]`, ctx);
  });
  return ctx.issues;
}

/** El título de una slide: las líneas de su bloque `heading` (vacío si no tiene). */
export function slideTitle(slide: Slide): string[] {
  const heading = slide.body?.find((b) => b.kind === 'heading');
  return heading?.kind === 'heading' ? heading.title : [];
}
