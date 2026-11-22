import {
  type Deck,
  type FontFile,
  resolveStyle,
  styleToCss,
  type Theme,
  validateDeck,
  validateTheme,
} from '@colaboradocs/deck-core';
import { HAND_RAISE_CSS, handRaise } from '../components/hand-raise.utils';
import { ENGINE_JS } from '../engine/engine.constants';
import { esc } from '../html.utils';
import { mergeRegistries, type Registry } from '../render.types';
import { renderSlide, slideContext } from '../slides/slide.utils';
import { STRINGS_ES, type Strings } from '../strings.constants';
import { BASE_CSS } from '../styles/base.constants';
import { escapeForScript } from './document.utils.helpers';

/** Componentes que todo tema trae. */
export const BASE_REGISTRY: Registry = {
  components: { 'hand-raise': handRaise },
  css: HAND_RAISE_CSS,
};

export interface RenderOptions {
  registry?: Registry;
  strings?: Partial<Strings>;
  /** Ruta (relativa al HTML) de las fuentes. */
  fontsPath?: string;
  /** Para la galería: el deck acepta mensajes que cambian las variantes de la slide actual. */
  preview?: boolean;
  /** El editor dibuja también un deck a medias (con problemas de validación). */
  skipValidation?: boolean;
}

export interface RenderedDeck {
  html: string;
  /** Archivos de fuente que el HTML pide, para que quien escribe el resultado los copie. */
  fonts: FontFile[];
}

function fontFaces(fonts: FontFile[], path: string): string {
  return fonts
    .map(
      (f) =>
        `@font-face { font-family: "${f.family}"; src: url("${path}/${f.file}") format("woff2"); font-weight: ${f.weight}; font-style: normal; font-display: swap; }`,
    )
    .join('\n');
}

const registryFor = (options: RenderOptions): Registry =>
  mergeRegistries(BASE_REGISTRY, options.registry ?? { components: {} });

const stringsFor = (options: RenderOptions): Strings => ({
  ...STRINGS_ES,
  ...options.strings,
});

/** El HTML de cada slide, sin validar: quien llama (el editor) decide qué hacer con un deck a medias. */
export function renderSlides(
  deck: Deck,
  options: RenderOptions = {},
): string[] {
  const registry = registryFor(options);
  const strings = stringsFor(options);
  return deck.slides.map((slide, i) =>
    renderSlide(
      slide,
      i + 1,
      deck.slides.length,
      slideContext({ strings, registry, preview: options.preview }),
    ),
  );
}

/**
 * Deck + tema → un HTML autocontenido (CSS, motor y datos dentro; las fuentes y los assets
 * se piden por ruta relativa). Función pura: no lee ni escribe archivos.
 */
export function renderDeck(
  deck: Deck,
  theme: Theme,
  options: RenderOptions = {},
): RenderedDeck {
  const issues = options.skipValidation
    ? []
    : [...validateTheme(theme), ...validateDeck(deck, theme)];
  if (issues.length) {
    throw new Error(
      `Deck no válido:\n${issues.map((i) => `- ${i.path}: ${i.message}`).join('\n')}`,
    );
  }
  const registry = registryFor(options);
  const strings = stringsFor(options);
  const style = resolveStyle(theme, deck.variant, deck.style);
  const slides = renderSlides(deck, options).join('\n');
  const engine = deck.engine ?? {};
  const themeToggle = engine.themeToggle ?? true;
  const config = {
    themeKey: 'theme',
    baseMode: theme.baseMode,
    themeToggle,
    ...(options.preview && { preview: true }),
    ...(engine.topZonePx !== undefined && { topZone: engine.topZonePx }),
    ...(engine.countdownMaxHours !== undefined && {
      countdownMaxHours: engine.countdownMaxHours,
    }),
  };
  const css = [
    styleToCss(style, theme.baseMode),
    BASE_CSS,
    registry.css ?? '',
  ].join('\n');
  const toggle = themeToggle
    ? `<button class="themebtn" id="theme" aria-label="${esc(strings.themeAria)}"><kbd>T</kbd> ${esc(strings.theme)}</button>`
    : '';
  const html = `<!doctype html>
<html lang="${esc(deck.lang)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(deck.title)}</title>
<script>try{var m=localStorage.getItem('theme');if(m)document.documentElement.dataset.theme=m}catch(e){}</script>
<style>
${fontFaces(style.fonts, options.fontsPath ?? 'assets/fonts')}
${css}
</style>
</head>
<body>
<div class="progress"><i id="bar"></i></div>
<main id="deck">
${slides}
</main>
${options.preview ? '' : `<nav class="nav" aria-label="${esc(strings.navAria)}"><button id="prev" aria-label="${esc(strings.previous)}"></button><button id="next" aria-label="${esc(strings.next)}"></button></nav>`}
<div class="controls"><span><kbd>←</kbd> <kbd>→</kbd> ${esc(strings.navigate)}</span><span><kbd>F</kbd> ${esc(strings.fullscreen)}</span>${toggle}</div>
<div class="hud"><span id="counter">01 / ${String(deck.slides.length).padStart(2, '0')}</span></div>
<script>window.DECK_CONFIG = ${escapeForScript(JSON.stringify(config))};</script>
<script>${ENGINE_JS}</script>
</body>
</html>
`;
  return { html, fonts: style.fonts };
}
