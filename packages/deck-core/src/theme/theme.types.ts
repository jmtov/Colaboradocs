import type { COLOR_MODES, ColorName, TokenName } from './theme.constants';

export type ColorMode = (typeof COLOR_MODES)[number];

/** Cualquier valor CSS válido para un color (`#fff`, `oklch(...)`, `color-mix(...)`). */
export type CssColor = string;

export type TokenOverrides = Partial<Record<TokenName, string>>;

/** Colores obligatorios de un modo; los derivados (`muted`, `line`…) son opcionales. */
export interface ModeColors extends Partial<Record<ColorName, CssColor>> {
  bg: CssColor;
  ink: CssColor;
  /** Marca: filete, números, detalles. */
  accent: CssColor;
  /** Relleno: fondo de una slide, una tarjeta o una caja con acento. */
  accentSurface: CssColor;
  /** Texto sobre `accentSurface`. */
  onAccent: CssColor;
}

/**
 * Color de categoría (los seis ejes, por ejemplo). Se usa como acento (cuadro, icono, filete) y
 * **nunca como color de texto**. El orden es parte del tema y no cambia entre slides.
 */
export interface CategoryColor {
  id: string;
  name: string;
  light: CssColor;
  dark: CssColor;
  /** Si falta, al imprimir se usa `light`. */
  print?: CssColor;
}

export interface FontFile {
  family: string;
  /** Un peso (`600`) o, en una fuente variable, un rango (`'200 800'`). */
  weight: number | string;
  /** Nombre del archivo `.woff2` dentro de la carpeta de fuentes del tema. */
  file: string;
}

/** Capa de estilo: lo que una variante o un deck puede cambiar del tema. */
export interface StyleLayer {
  tokens?: TokenOverrides;
  colors?: Partial<Record<ColorMode, Partial<ModeColors>>>;
  categories?: CategoryColor[];
  /** Si se define, reemplaza la lista de fuentes del tema (p. ej. otra tipografía para un evento). */
  fonts?: FontFile[];
}

/** Capa de una slide: solo tokens, y el tono (`tone`) y la categoría van aparte en la slide. */
export interface SlideStyle {
  tokens?: TokenOverrides;
}

export interface Theme {
  id: string;
  name: string;
  /** Claro y oscuro son obligatorios: el tema se piensa para los dos desde el principio. */
  colors: Record<ColorMode, ModeColors>;
  /** Con cuál modo arranca un deck. */
  baseMode: ColorMode;
  /** Hasta 10 colores para construir bloques con color. */
  categories: CategoryColor[];
  tokens: TokenOverrides;
  fonts: FontFile[];
  /** Logo con variante para fondo claro y para fondo oscuro. */
  logo?: Record<ColorMode, string>;
  /** Variantes por evento: una capa sobre el tema. */
  variants?: Record<string, StyleLayer & { name: string }>;
}

export interface ResolvedStyle {
  tokens: Record<TokenName, string>;
  colors: Record<ColorMode, Partial<Record<ColorName, CssColor>>>;
  categories: CategoryColor[];
  fonts: FontFile[];
}

export interface Issue {
  /** Ruta dentro del objeto validado, p. ej. `slides[3].start[1].kind`. */
  path: string;
  message: string;
}
