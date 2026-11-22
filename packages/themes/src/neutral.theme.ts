import type { Theme } from '@colaboradocs/deck-core';

/** Tema genérico que viaja con el código: blanco y negro, Geist y seis colores de categoría. Los temas de cada organización son datos (JSON), no código. */
export const neutralTheme: Theme = {
  id: 'neutral',
  name: 'Neutro',
  baseMode: 'light',
  colors: {
    light: {
      bg: '#fff',
      ink: '#070707',
      accent: '#070707',
      accentSurface: '#070707',
      onAccent: '#fff',
    },
    dark: {
      bg: '#070707',
      ink: '#f5f5f5',
      accent: '#f5f5f5',
      accentSurface: '#f5f5f5',
      onAccent: '#070707',
    },
  },
  categories: [
    { id: 'blue', name: 'Azul', light: '#2a78d6', dark: '#3987e5' },
    { id: 'green', name: 'Verde', light: '#1baf7a', dark: '#199e70' },
    { id: 'purple', name: 'Morado', light: '#6250d6', dark: '#9085e9' },
    { id: 'amber', name: 'Ámbar', light: '#eda100', dark: '#c98500' },
    { id: 'pink', name: 'Rosa', light: '#e87ba4', dark: '#d55181' },
    { id: 'forest', name: 'Bosque', light: '#008300', dark: '#0ca30c' },
  ],
  tokens: { 'line-style': 'dashed' },
  fonts: [
    { family: 'Geist', weight: 400, file: 'geist-400.woff2' },
    { family: 'Geist', weight: 500, file: 'geist-500.woff2' },
    { family: 'Geist', weight: 600, file: 'geist-600.woff2' },
  ],
  variants: {
    solido: {
      name: 'Acento sólido',
      colors: {
        light: { accentSurface: '#2a78d6', onAccent: '#fff' },
        dark: { accentSurface: '#3987e5', onAccent: '#070707' },
      },
    },
  },
};
