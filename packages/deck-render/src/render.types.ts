import type { Strings } from './strings.constants';

/** Contexto de una slide: reparte el orden de entrada (`--i`) de sus elementos. */
export interface SlideContext {
  /** Siguiente número de entrada; los títulos usan 0, 1…, el contenido arranca en 3. */
  reveal(): number;
  strings: Strings;
  registry: Registry;
  /** Vista previa del editor: se dibujan las celdas libres con un «+» para agregar un bloque. */
  preview?: boolean;
}

/** Componente registrado por un tema o un deck: devuelve HTML. */
export type Component = (
  props: Record<string, unknown>,
  ctx: SlideContext,
) => string;

export interface Registry {
  components: Record<string, Component>;
  /** CSS que traen los componentes registrados. */
  css?: string;
}

export const EMPTY_REGISTRY: Registry = { components: {} };

/** Une registros; el último gana si repite un nombre. */
export function mergeRegistries(...registries: Registry[]): Registry {
  return {
    components: Object.assign({}, ...registries.map((r) => r.components)),
    css: registries.map((r) => r.css ?? '').join('\n'),
  };
}
