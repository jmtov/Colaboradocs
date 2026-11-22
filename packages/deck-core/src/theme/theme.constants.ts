/** Máximo de colores de categoría que define un tema (`--cat-1` … `--cat-10`). */
export const MAX_CATEGORIES = 10;

export const COLOR_MODES = ['light', 'dark'] as const;

/** Colores que todo tema define, en claro y en oscuro. */
export const REQUIRED_COLORS = [
  'bg',
  'ink',
  'accent',
  'accentSurface',
  'onAccent',
] as const;

/**
 * Colores que se derivan de `bg` e `ink` con `color-mix`; un tema puede fijarlos,
 * pero si no, cambiar `bg` o `ink` ajusta todo.
 */
export const DERIVED_COLORS = {
  muted: 'color-mix(in srgb, var(--ink) 62%, var(--bg))',
  faint: 'color-mix(in srgb, var(--ink) 45%, var(--bg))',
  tint: 'color-mix(in srgb, var(--ink) 5%, var(--bg))',
  line: 'color-mix(in srgb, var(--ink) 14%, var(--bg))',
  lineStrong: 'color-mix(in srgb, var(--ink) 32%, var(--bg))',
} as const;

/** Nombre del color en el tema → variable CSS. */
export const COLOR_VARS = {
  bg: '--bg',
  ink: '--ink',
  accent: '--accent',
  accentSurface: '--accent-surface',
  onAccent: '--on-accent',
  muted: '--muted',
  faint: '--faint',
  tint: '--tint',
  line: '--line',
  lineStrong: '--line-strong',
} as const;

/**
 * Valores de referencia de los tokens que no son color. Toda variable de estilo de un deck sale de
 * esta lista: un tema, una variante, el deck o una slide solo pueden sobrescribir estos nombres.
 */
export const TOKEN_DEFAULTS = {
  // Tipografía
  'font-sans': '"Geist", -apple-system, "Helvetica Neue", Arial, sans-serif',
  'font-mono': '"Geist Mono", ui-monospace, "SF Mono", Menlo, monospace',
  'font-title': 'var(--font-sans)',
  'title-weight': '600',
  'title-tracking': '-.04em',
  'title-leading': '1',
  'title-transform': 'none',
  'eyebrow-font': 'var(--font-mono)',
  'eyebrow-transform': 'uppercase',
  'eyebrow-tracking': '.08em',
  /** `none` oculta la etiqueta del modo (Informar, Conversar, Decidir) en el eyebrow; `inline-flex` la muestra. */
  'eyebrow-mode-display': 'inline-flex',
  // Escala (por ancho y por alto, para que no se salga en pantallas bajas)
  h1: 'clamp(2.8rem, min(7.6vw, 14vh), 8rem)',
  'h1-lg': 'clamp(2.4rem, min(5.6vw, 10vh), 6rem)',
  'h1-md': 'clamp(2rem, min(4.4vw, 8vh), 4.6rem)',
  h2: 'clamp(2.2rem, min(5.2vw, 9.5vh), 5.4rem)',
  big: 'clamp(1.4rem, 2.3vw, 2.4rem)',
  mid: 'clamp(1.1rem, 1.6vw, 1.6rem)',
  small: 'clamp(.85rem, 1.1vw, 1.1rem)',
  xs: 'calc(var(--small) * .85)',
  display: 'clamp(7rem, 22vw, 22rem)',
  date: 'clamp(3.6rem, 7vw, 7rem)',
  // Tamaño de cada texto, por rol. Todo `font-size` del CSS sale de aquí: para cambiar el de un rol se
  // sobrescribe su token (en el tema, la variante, el deck o la slide). Ojo: un rol toma el valor de la
  // escala donde se declara (`:root`), así que cambiar `--big` en una slide no mueve los roles; cambiar
  // el rol sí. Los `-compact` son los que usa una slide con `density: 'compact'`.
  'text-lede': 'var(--big)',
  'text-mono': 'var(--small)',
  'text-note': 'var(--small)',
  'text-eyebrow': 'var(--small)',
  'text-index': 'var(--small)',
  'text-list': 'var(--big)',
  'text-list-detail': 'var(--mid)',
  'text-list-compact': 'var(--mid)',
  'text-list-detail-compact': 'var(--small)',
  'text-list-md': 'var(--mid)',
  'text-list-md-detail': 'calc(var(--mid) * .85)',
  'text-card-kicker': 'var(--small)',
  'text-card-title': 'var(--big)',
  'text-card-title-compact': 'var(--mid)',
  'text-card-text': 'var(--small)',
  'text-card-footer': 'var(--small)',
  'text-source': 'var(--small)',
  'text-source-label': 'var(--xs)',
  'text-person-role': 'var(--small)',
  'text-person-name': 'var(--big)',
  'text-figure': 'var(--display)',
  'text-figure-unit': 'calc(var(--display) * .26)',
  'text-figure-caption': 'var(--mid)',
  'text-qr-link': 'var(--mid)',
  'text-countdown': 'var(--big)',
  'text-notice': 'var(--small)',
  'text-agenda': 'var(--mid)',
  'text-agenda-time': 'var(--small)',
  'text-agenda-detail': 'var(--xs)',
  'text-event-date': 'var(--big)',
  'text-event-text': 'var(--small)',
  'text-event-title': 'calc(var(--small) * 1.15)',
  'text-datebox-day': 'var(--date)',
  'text-datebox-month': 'var(--mid)',
  'text-chip': 'var(--small)',
  'text-speaker': 'var(--small)',
  'text-hud': 'var(--small)',
  'text-controls': 'var(--small)',
  'text-hand': 'var(--xs)',
  // Forma y línea
  'radius-card': '0',
  'radius-pill': '0',
  'radius-frame': '0',
  'radius-badge': '0',
  'line-w': '1px',
  'line-style': 'solid',
  'rule-w': '6rem',
  'rule-h': '3px',
  // Layout
  'pad-x': 'clamp(1.5rem, 8vw, 9rem)',
  'pad-top': 'clamp(4.5rem, 12vh, 7rem)',
  'pad-bottom': 'clamp(3.5rem, 8vh, 5rem)',
  'eyebrow-top': 'clamp(1.5rem, 4.5vh, 3rem)',
  'controls-top': 'clamp(1.2rem, 4vh, 2.6rem)',
  'hud-bottom': 'clamp(.9rem, 2.4vh, 1.8rem)',
  'progress-h': '3px',
  // Movimiento
  ease: 'cubic-bezier(.16, .84, .24, 1)',
  'ease-io': 'cubic-bezier(.76, 0, .24, 1)',
  'slide-shift': '6vw',
  'dur-slide': '.8s',
  /** Duración de las transiciones de tamaño, color y espacio (al cambiar de variante o de modo); `0s` las quita. */
  'dur-vary': '.45s',
  // Separación entre las celdas de la cuadrícula (hasta 2 columnas y con más) y cuánto se escala en cada densidad.
  'gap-x': 'clamp(2rem, 6vw, 7rem)',
  'gap-x-dense': 'clamp(.6rem, 1.2vw, 1.2rem)',
  'gap-y': 'clamp(.9rem, 2.2vh, 1.6rem)',
  'gap-scale-compact': '.45',
  'gap-scale-spacious': '1.7',
  /** Alto mínimo de una fila que la slide fija: una fila vacía deja ese espacio. */
  'row-min': 'clamp(2.5rem, 7vh, 4.5rem)',
  stagger: '80ms',
  'reveal-delay': '240ms',
  'mask-delay': '180ms',
} as const;

export const TOKEN_NAMES = Object.keys(TOKEN_DEFAULTS) as TokenName[];

export type TokenName = keyof typeof TOKEN_DEFAULTS;
export type ColorName = keyof typeof COLOR_VARS;
