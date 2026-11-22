import type { Block, ContentSlide, TitleSize } from './deck.types';

/**
 * Puntos de partida al agregar una slide. No son tipos: después de crearla todo se edita igual,
 * y lo que cambian son solo su cuadrícula y su título.
 */
export interface SlideTemplate {
  id: string;
  label: string;
  help: string;
  slide: Partial<ContentSlide>;
}

const heading = (
  extra: {
    titleSize?: TitleSize;
    subtitle?: string;
    span?: 1 | 2 | 3 | 4;
  } = {},
): Block => ({ kind: 'heading', title: ['Título de la slide'], ...extra });

export const SLIDE_TEMPLATES: SlideTemplate[] = [
  {
    id: 'cover',
    label: 'Portada o cierre',
    help: 'Título grande y subtítulo.',
    slide: {
      body: [
        heading({
          titleSize: 'xl',
          subtitle: 'Una frase que explica de qué va.',
        }),
      ],
    },
  },
  {
    id: 'section',
    label: 'Sección',
    help: 'Número arriba y título grande.',
    slide: { eyebrow: { index: '01' }, body: [heading({ titleSize: 'xl' })] },
  },
  {
    id: 'one-column',
    label: 'Una columna',
    help: 'Título y bloques uno bajo otro.',
    slide: { columns: 1, body: [heading()] },
  },
  {
    id: 'two-columns',
    label: 'Dos columnas',
    help: 'Título a la izquierda y bloques a la derecha.',
    slide: { columns: 2, body: [heading({ span: 1 })] },
  },
  {
    id: 'grid',
    label: 'Cuadrícula',
    help: 'Título arriba y bloques en tres columnas.',
    slide: { columns: 3, body: [heading()] },
  },
];
