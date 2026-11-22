import type { Theme } from '@colaboradocs/deck-core';
import { neutralTheme } from './neutral.theme';

export { neutralTheme };

/** Temas que viajan con el código. Los de cada organización se cargan como JSON desde fuera (CLI: carpeta de temas; editor: importar). */
export const BUILTIN_THEMES: Theme[] = [neutralTheme];
