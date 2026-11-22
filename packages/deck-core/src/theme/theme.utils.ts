import {
  COLOR_MODES,
  COLOR_VARS,
  type ColorName,
  DERIVED_COLORS,
  MAX_CATEGORIES,
  REQUIRED_COLORS,
  TOKEN_DEFAULTS,
  TOKEN_NAMES,
  type TokenName,
} from './theme.constants';
import type {
  CategoryColor,
  ColorMode,
  Issue,
  ResolvedStyle,
  SlideStyle,
  StyleLayer,
  Theme,
  TokenOverrides,
} from './theme.types';

const isToken = (name: string): name is TokenName =>
  (TOKEN_NAMES as string[]).includes(name);

function mergeTokens(
  base: Record<TokenName, string>,
  layer: TokenOverrides | undefined,
) {
  return { ...base, ...layer } as Record<TokenName, string>;
}

/**
 * Aplica las capas en orden: tema → variante → deck. Lo que una capa no define lo deja como estaba;
 * si una capa trae `categories`, reemplaza la lista completa (el orden es parte del tema).
 */
export function resolveStyle(
  theme: Theme,
  variantId: string | undefined,
  deckLayer?: StyleLayer,
): ResolvedStyle {
  const variant = variantId ? theme.variants?.[variantId] : undefined;
  const layers: StyleLayer[] = [{ tokens: theme.tokens }];
  if (variant) layers.push(variant);
  if (deckLayer) layers.push(deckLayer);

  let tokens = { ...TOKEN_DEFAULTS } as Record<TokenName, string>;
  const colors: ResolvedStyle['colors'] = {
    light: { ...theme.colors.light },
    dark: { ...theme.colors.dark },
  };
  let categories = theme.categories;
  let fonts = theme.fonts;
  for (const layer of layers) {
    tokens = mergeTokens(tokens, layer.tokens);
    for (const mode of COLOR_MODES)
      Object.assign(colors[mode], layer.colors?.[mode]);
    if (layer.categories) categories = layer.categories;
    if (layer.fonts) fonts = layer.fonts;
  }
  return { tokens, colors, categories, fonts };
}

function declarations(entries: [string, string][]): string {
  return entries.map(([name, value]) => `${name}: ${value};`).join(' ');
}

function colorDeclarations(colors: ResolvedStyle['colors'][ColorMode]): string {
  const entries: [string, string][] = [];
  for (const name of Object.keys(COLOR_VARS) as ColorName[]) {
    const value =
      colors[name] ??
      (name in DERIVED_COLORS
        ? DERIVED_COLORS[name as keyof typeof DERIVED_COLORS]
        : undefined);
    if (value) entries.push([COLOR_VARS[name], value]);
  }
  return declarations(entries);
}

function categoryDeclarations(
  categories: CategoryColor[],
  mode: ColorMode | 'print',
): string {
  return declarations(
    categories.map((c, i): [string, string] => [
      `--cat-${i + 1}`,
      mode === 'print' ? (c.print ?? c.light) : c[mode],
    ]),
  );
}

/**
 * CSS de las variables de un deck: `:root` con el modo base, el modo contrario y la impresión (que
 * siempre va en claro, porque el papel es blanco).
 */
export function styleToCss(style: ResolvedStyle, baseMode: ColorMode): string {
  const other: ColorMode = baseMode === 'light' ? 'dark' : 'light';
  const tokenDecl = declarations(
    Object.entries(style.tokens).map(([k, v]) => [`--${k}`, v]),
  );
  const rules = [
    `:root { ${tokenDecl} ${colorDeclarations(style.colors[baseMode])} ${categoryDeclarations(style.categories, baseMode)} }`,
    `:root[data-theme="${other}"] { ${colorDeclarations(style.colors[other])} ${categoryDeclarations(style.categories, other)} }`,
    `@media print { :root, :root[data-theme="dark"], :root[data-theme="light"] { ${colorDeclarations(style.colors.light)} ${categoryDeclarations(style.categories, 'print')} } }`,
  ];
  return rules.join('\n');
}

/** Variables en línea de una slide (`style="--h1: …"`); ignora los nombres que no son tokens. */
export function slideStyleAttr(
  style: SlideStyle | undefined,
  category?: number,
): string {
  const entries: [string, string][] = [];
  for (const [name, value] of Object.entries(style?.tokens ?? {})) {
    if (isToken(name) && value) entries.push([`--${name}`, value]);
  }
  if (category !== undefined)
    entries.push(['--c', `var(--cat-${category + 1})`]);
  return declarations(entries);
}

function checkColors(
  colors: Partial<Record<ColorName, string>>,
  path: string,
  issues: Issue[],
) {
  for (const name of REQUIRED_COLORS) {
    if (!colors[name])
      issues.push({ path: `${path}.${name}`, message: 'Falta el color.' });
  }
}

function checkTokens(
  tokens: TokenOverrides | undefined,
  path: string,
  issues: Issue[],
) {
  for (const name of Object.keys(tokens ?? {})) {
    if (!isToken(name))
      issues.push({
        path: `${path}.${name}`,
        message: 'No es un token conocido.',
      });
  }
}

function checkCategories(
  categories: CategoryColor[],
  path: string,
  issues: Issue[],
) {
  if (categories.length > MAX_CATEGORIES) {
    issues.push({
      path,
      message: `Un tema define hasta ${MAX_CATEGORIES} colores de categoría.`,
    });
  }
  const seen = new Set<string>();
  categories.forEach((c, i) => {
    if (seen.has(c.id))
      issues.push({
        path: `${path}[${i}].id`,
        message: `Id repetido: ${c.id}.`,
      });
    seen.add(c.id);
    if (!c.light)
      issues.push({
        path: `${path}[${i}].light`,
        message: 'Falta el color en claro.',
      });
    if (!c.dark)
      issues.push({
        path: `${path}[${i}].dark`,
        message: 'Falta el color en oscuro.',
      });
  });
}

/** Contrato de un tema: claro y oscuro completos, hasta 10 categorías, solo tokens conocidos. */
export function validateTheme(theme: Theme): Issue[] {
  const issues: Issue[] = [];
  for (const mode of COLOR_MODES) {
    const colors = theme.colors[mode];
    if (!colors)
      issues.push({
        path: `colors.${mode}`,
        message: 'Falta el modo: todo tema define claro y oscuro.',
      });
    else checkColors(colors, `colors.${mode}`, issues);
  }
  if (!COLOR_MODES.includes(theme.baseMode))
    issues.push({ path: 'baseMode', message: 'Debe ser light o dark.' });
  checkCategories(theme.categories, 'categories', issues);
  checkTokens(theme.tokens, 'tokens', issues);
  if (theme.fonts.length === 0)
    issues.push({ path: 'fonts', message: 'Falta al menos una fuente.' });
  for (const [id, variant] of Object.entries(theme.variants ?? {})) {
    checkTokens(variant.tokens, `variants.${id}.tokens`, issues);
    if (variant.categories)
      checkCategories(variant.categories, `variants.${id}.categories`, issues);
  }
  return issues;
}
