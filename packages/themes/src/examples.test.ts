import { type Deck, migrateSlide, validateDeck } from '@colaboradocs/deck-core';
import { describe, expect, it } from 'vitest';
import { neutralTheme } from './index';

/** Slides representativas de un evento y de una charla escritas con el esquema: prueban que alcanza para decir lo que hoy es HTML a mano. */
const eventRaw = {
  version: 1,
  id: 'evento',
  title: 'Encuentro regional · 22 de noviembre',
  lang: 'es',
  theme: 'neutral',
  variant: 'solido',
  slides: [
    {
      kind: 'split',
      eyebrow: {
        index: '00',
        text: 'Encuentro regional · 22 de noviembre',
      },
      title: ['Hola', 'equipo'],
      start: [
        {
          kind: 'note',
          text: 'Regístrate desde tu celular y cuéntanos qué ves en tu zona:',
        },
        {
          kind: 'list',
          ordered: true,
          size: 'md',
          items: [
            { text: 'Abre la cámara y apunta al código' },
            { text: 'Deja tu nombre, zona y celular' },
            { text: 'Escribe lo que ves en cada tema' },
          ],
        },
        {
          kind: 'countdown',
          target: '2026-11-22T10:00:00-05:00',
          label: 'Empezamos en',
        },
      ],
      end: [
        {
          kind: 'qr',
          src: 'assets/qr-registro.svg',
          alt: 'Código QR del registro',
          link: 'ejemplo.org/registro',
        },
      ],
    },
    {
      kind: 'content',
      eyebrow: { index: '02', text: 'Programa del día' },
      title: ['Cómo va a ser', 'el día'],
      body: [
        {
          kind: 'agenda',
          columns: 2,
          items: [
            {
              time: '10:00',
              minutes: 10,
              title: 'Bienvenida',
              speaker: { name: 'Ana Pérez', role: 'Norte' },
            },
            {
              type: 'highlight',
              time: '11:40',
              minutes: 15,
              title: 'Descanso y refrigerio',
              icon: 'fork',
            },
          ],
        },
      ],
    },
    {
      kind: 'split',
      eyebrow: { index: '07', text: 'Tema 1', minutes: 5 },
      title: ['Agua,', 'ríos y bosques'],
      category: 0,
      speaker: { name: 'Luis Gómez', role: 'Sur' },
      start: [
        {
          kind: 'note',
          text: 'Cuidar el agua, los ríos y los bosques de la región.',
        },
      ],
      end: [
        {
          kind: 'person',
          person: {
            name: 'Luis Gómez',
            role: 'Representación provisional · Sur',
          },
        },
      ],
    },
    {
      kind: 'content',
      eyebrow: { index: '14', text: 'Mesas por tema', minutes: 40 },
      title: ['Trabajemos', 'por temas'],
      density: 'compact',
      body: [
        {
          kind: 'notice',
          text: 'Elige la mesa de tu primer tema; en la ronda 2 cambias.',
        },
        {
          kind: 'countdown',
          target: '2026-11-22T11:40:00-05:00',
          label: 'Cambio de mesa en',
        },
      ],
    },
  ],
};

const talkRaw = {
  version: 1,
  id: 'charla',
  title: 'Charla abierta · 7 de noviembre',
  lang: 'es',
  theme: 'neutral',
  variant: 'solido',
  slides: [
    {
      kind: 'section',
      tone: 'accent',
      figure: '3',
      title: ['Lo que nos mueve'],
    },
    {
      kind: 'content',
      eyebrow: { index: '5', text: 'Cómo puedes participar' },
      title: ['Lo que se viene'],
      body: [
        { kind: 'date-box', day: '19', month: 'Nov' },
        {
          kind: 'timeline',
          events: [{ date: '29 Nov', title: 'Consulta ciudadana' }],
        },
      ],
    },
    {
      kind: 'content',
      titleSize: 'xl',
      tone: 'accent',
      title: ['Conozcámonos'],
      lede: 'Cerca de un minuto por persona.',
    },
  ],
};

/** Las muestras se escribieron con los tipos de slide anteriores; se pasan al esquema de contenido antes de validar. */
const upgrade = (raw: { slides: unknown[] }): Deck =>
  ({
    ...raw,
    slides: raw.slides.map((slide) =>
      migrateSlide(slide as Record<string, unknown>),
    ),
  }) as unknown as Deck;

describe('el esquema alcanza para decks de ejemplo', () => {
  it('el evento (muestra) valida contra el tema neutro', () => {
    expect(validateDeck(upgrade(eventRaw), neutralTheme)).toEqual([]);
  });

  it('la charla (muestra) valida contra el tema neutro, con sus categorías', () => {
    expect(validateDeck(upgrade(talkRaw), neutralTheme)).toEqual([]);
  });

  it('pedir una categoría que el tema no tiene falla', () => {
    const deck: Deck = {
      ...upgrade(talkRaw),
      slides: [
        {
          kind: 'content',
          category: neutralTheme.categories.length,
          body: [],
        },
      ],
    };
    expect(validateDeck(deck, neutralTheme)).toHaveLength(1);
  });
});
