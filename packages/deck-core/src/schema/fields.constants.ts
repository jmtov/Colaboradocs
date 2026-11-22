import {
  AGENDA_MODES,
  DENSITIES,
  SLIDE_TONES,
  TITLE_SIZES,
} from './deck.constants';
import type { BlockKind, SlideKind } from './deck.types';
import type {
  Descriptor,
  Field,
  SelectOption,
  TestCaseId,
} from './fields.types';

const options = (
  values: readonly (string | number)[],
  labels: Record<string, string> = {},
): SelectOption[] =>
  values.map((v) => ({
    value: String(v),
    label: labels[String(v)] ?? String(v),
  }));

const MODE_LABELS = {
  inform: 'Informar',
  discuss: 'Conversar',
  decide: 'Decidir',
};
const TONE_LABELS = { default: 'Normal', accent: 'Acento', inverse: 'Inverso' };

export const PERSON_FIELDS: Field[] = [
  {
    key: 'name',
    label: 'Nombre',
    type: 'text',
    required: true,
    sample: 'Nombre Apellido',
  },
  { key: 'role', label: 'Rol', type: 'text', sample: 'Rol o detalle' },
];

const EYEBROW: Field = {
  key: 'eyebrow',
  label: 'Línea superior',
  type: 'object',
  fields: [
    { key: 'index', label: 'Número', type: 'text', keep: true, sample: '01' },
    {
      key: 'text',
      label: 'Texto',
      type: 'text',
      sample: 'Tema de la slide',
    },
    { key: 'minutes', label: 'Minutos', type: 'number', min: 1, sample: 10 },
    {
      key: 'mode',
      label: 'Modo',
      type: 'select',
      options: options(AGENDA_MODES, MODE_LABELS),
      sample: 'inform',
    },
  ],
};

/** Grupos de campos de una slide: cada uno es una tarjeta de filas con su título. */
export const STYLE_GROUP = 'Estilo de la diapositiva';
export const NOTES_GROUP = 'Notas';
const STYLE = STYLE_GROUP;

const SLIDE_STYLE: Field[] = [
  {
    key: 'tone',
    label: 'Tono',
    type: 'select',
    group: STYLE,
    options: options(SLIDE_TONES, TONE_LABELS),
    sample: 'default',
  },
  { key: 'category', label: 'Categoría', type: 'category', group: STYLE },
  {
    key: 'density',
    label: 'Densidad',
    type: 'select',
    group: STYLE,
    options: options(DENSITIES, {
      normal: 'Normal',
      compact: 'Compacta',
      spacious: 'Amplia',
    }),
    help: 'Cambia la separación entre las celdas de la cuadrícula.',
    sample: 'normal',
  },
];

/** Lo que cierra toda slide: quién habla (se ve al pie) y las notas para quien presenta (no se dibujan). */
const SLIDE_END: Field[] = [
  {
    key: 'speaker',
    label: 'Pie de página (quién habla)',
    type: 'object',
    fields: PERSON_FIELDS,
  },
  {
    key: 'notes',
    label: 'Notas para quien presenta',
    type: 'longtext',
    group: NOTES_GROUP,
    sample: 'Notas que no se dibujan.',
  },
];

/**
 * El orden de los campos va de lo más general a lo más específico: primero el estilo de la slide,
 * luego lo que se ve de arriba abajo (línea superior, título, contenido), de izquierda a derecha
 * en dos columnas, y al final quién habla y las notas.
 */
export const SLIDE_DESCRIPTORS: Record<SlideKind, Descriptor> = {
  content: {
    label: 'Contenido',
    fields: [
      ...SLIDE_STYLE,
      { key: 'gridSize', label: 'Cuadrícula', type: 'gridsize', group: STYLE },
      EYEBROW,
      { key: 'body', label: 'Bloques', type: 'blocks', required: true },
      ...SLIDE_END,
    ],
  },
};

const LIST_ITEM: Field[] = [
  {
    key: 'text',
    label: 'Texto',
    type: 'text',
    required: true,
    sample: 'Un punto',
  },
  {
    key: 'detail',
    label: 'Detalle',
    type: 'text',
    sample: 'Con un detalle debajo',
  },
  { key: 'icon', label: 'Icono', type: 'icon', sample: 'info' },
];

export const BLOCK_DESCRIPTORS: Record<BlockKind, Descriptor> = {
  heading: {
    label: 'Título',
    fields: [
      {
        key: 'title',
        label: 'Título',
        type: 'lines',
        required: true,
        sample: ['Título de la slide'],
      },
      {
        key: 'titleSize',
        label: 'Tamaño del título',
        type: 'select',
        options: options(TITLE_SIZES, { xl: 'XL', lg: 'L', md: 'M', sm: 'S' }),
        sample: 'sm',
      },
      {
        key: 'subtitle',
        label: 'Subtítulo',
        type: 'longtext',
        sample: 'Una frase que explica de qué va.',
      },
    ],
  },
  note: {
    label: 'Nota',
    fields: [
      {
        key: 'text',
        label: 'Texto',
        type: 'longtext',
        required: true,
        sample: 'Una nota al pie.',
      },
    ],
  },
  list: {
    label: 'Lista',
    fields: [
      { key: 'ordered', label: 'Numerada', type: 'boolean' },
      {
        key: 'size',
        label: 'Tamaño',
        type: 'select',
        options: options(['lg', 'md'], { lg: 'Grande', md: 'Mediano' }),
        sample: 'lg',
      },
      {
        key: 'items',
        label: 'Puntos',
        type: 'list',
        itemLabel: 'Punto',
        required: true,
        fields: LIST_ITEM,
        sample: [
          { text: 'Primer punto' },
          { text: 'Segundo punto' },
          { text: 'Tercer punto' },
        ],
      },
    ],
  },
  card: {
    label: 'Tarjeta',
    fields: [
      {
        key: 'title',
        label: 'Título',
        type: 'text',
        required: true,
        sample: 'Título de la tarjeta',
      },
      {
        key: 'kicker',
        label: 'Etiqueta',
        type: 'text',
        keep: true,
        sample: '01',
      },
      {
        key: 'text',
        label: 'Texto',
        type: 'longtext',
        sample: 'Un texto corto que la explica.',
      },
      { key: 'icon', label: 'Icono', type: 'icon', sample: 'info' },
      { key: 'category', label: 'Categoría', type: 'category' },
      {
        key: 'tone',
        label: 'Tono',
        type: 'select',
        options: options(SLIDE_TONES, TONE_LABELS),
        sample: 'default',
      },
      { key: 'people', label: 'Personas', type: 'people' },
      {
        key: 'sources',
        label: 'Fuentes',
        type: 'list',
        itemLabel: 'Fuente',
        fields: [
          { key: 'label', label: 'Etiqueta', type: 'text', sample: 'Ley' },
          {
            key: 'text',
            label: 'Texto',
            type: 'text',
            required: true,
            sample: 'Art. 19 de los estatutos',
          },
        ],
        sample: [{ text: 'Una fuente' }],
      },
      { key: 'footer', label: 'Pie', type: 'text', sample: 'Responsable' },
    ],
  },
  person: {
    label: 'Persona',
    fields: [
      {
        key: 'person',
        label: 'Persona',
        type: 'object',
        required: true,
        fields: PERSON_FIELDS,
      },
    ],
  },
  figure: {
    label: 'Cifra',
    fields: [
      {
        key: 'value',
        label: 'Valor',
        type: 'text',
        keep: true,
        required: true,
        sample: '29',
      },
      { key: 'unit', label: 'Unidad', type: 'text', keep: true, sample: 'nov' },
      {
        key: 'caption',
        label: 'Pie',
        type: 'text',
        sample: 'Qué significa la cifra',
      },
    ],
  },
  image: {
    label: 'Imagen',
    fields: [
      {
        key: 'src',
        label: 'Archivo',
        type: 'asset',
        required: true,
        sample: 'assets/imagen.webp',
      },
      {
        key: 'alt',
        label: 'Texto alternativo',
        type: 'text',
        required: true,
        sample: 'Descripción de la imagen',
      },
      {
        key: 'ratio',
        label: 'Proporción',
        type: 'text',
        keep: true,
        sample: '4 / 3',
      },
      { key: 'framed', label: 'Con marco', type: 'boolean' },
    ],
  },
  qr: {
    label: 'Código QR',
    fields: [
      {
        key: 'src',
        label: 'Archivo',
        type: 'asset',
        required: true,
        sample: 'assets/qr.svg',
      },
      {
        key: 'alt',
        label: 'Texto alternativo',
        type: 'text',
        required: true,
        sample: 'Código QR',
      },
      {
        key: 'link',
        label: 'Enlace visible',
        type: 'text',
        keep: true,
        required: true,
        sample: 'ejemplo.org/registro',
      },
    ],
  },
  countdown: {
    label: 'Cuenta regresiva',
    fields: [
      {
        key: 'target',
        label: 'Fecha y hora (con zona)',
        type: 'datetime',
        required: true,
        sample: '2026-11-22T10:00:00-05:00',
      },
      {
        key: 'label',
        label: 'Texto',
        type: 'text',
        required: true,
        sample: 'Empezamos en',
      },
    ],
  },
  notice: {
    label: 'Aviso',
    fields: [
      {
        key: 'text',
        label: 'Texto',
        type: 'longtext',
        required: true,
        sample: 'Un aviso breve.',
      },
      { key: 'icon', label: 'Icono', type: 'icon', sample: 'info' },
    ],
  },
  agenda: {
    label: 'Agenda',
    fields: [
      {
        key: 'columns',
        label: 'Columnas',
        type: 'select',
        options: options([1, 2]),
        numeric: true,
        sample: '1',
      },
      {
        key: 'split',
        label: 'Primer ítem de la 2.ª columna',
        type: 'number',
        min: 1,
        sample: 3,
      },
      {
        key: 'items',
        label: 'Ítems',
        type: 'list',
        itemLabel: 'Ítem',
        required: true,
        fields: [
          {
            key: 'type',
            label: 'Tipo',
            type: 'select',
            options: options(['item', 'highlight'], {
              item: 'Normal',
              highlight: 'Resaltado',
            }),
            sample: 'item',
          },
          {
            key: 'time',
            label: 'Hora',
            type: 'text',
            keep: true,
            sample: '10:00',
          },
          {
            key: 'minutes',
            label: 'Minutos',
            type: 'number',
            min: 1,
            sample: 10,
          },
          {
            key: 'mode',
            label: 'Modo',
            type: 'select',
            options: options(AGENDA_MODES, MODE_LABELS),
            sample: 'inform',
          },
          {
            key: 'title',
            label: 'Título',
            type: 'text',
            required: true,
            sample: 'Bienvenida',
          },
          {
            key: 'detail',
            label: 'Detalle',
            type: 'text',
            sample: 'Con un detalle',
          },
          { key: 'icon', label: 'Icono', type: 'icon', sample: 'fork' },
          {
            key: 'speaker',
            label: 'Quién lo lleva',
            type: 'object',
            fields: PERSON_FIELDS,
          },
        ],
        sample: [
          { time: '10:00', minutes: 10, title: 'Bienvenida' },
          { time: '10:10', minutes: 15, title: 'Ronda de municipios' },
        ],
      },
    ],
  },
  timeline: {
    label: 'Línea de tiempo',
    fields: [
      {
        key: 'events',
        label: 'Eventos',
        type: 'list',
        itemLabel: 'Evento',
        required: true,
        fields: [
          {
            key: 'date',
            label: 'Fecha',
            type: 'text',
            keep: true,
            required: true,
            sample: '22 nov',
          },
          {
            key: 'title',
            label: 'Título',
            type: 'text',
            required: true,
            sample: 'Encuentro regional',
          },
          { key: 'detail', label: 'Detalle', type: 'text', sample: 'Norte' },
          { key: 'hollow', label: 'Pendiente (punto hueco)', type: 'boolean' },
        ],
        sample: [
          { date: '19 nov', title: 'Paro nacional' },
          { date: '22 nov', title: 'Encuentro regional' },
        ],
      },
    ],
  },
  'date-box': {
    label: 'Caja de fecha',
    fields: [
      {
        key: 'day',
        label: 'Día',
        type: 'text',
        keep: true,
        required: true,
        sample: '29',
      },
      {
        key: 'month',
        label: 'Mes',
        type: 'text',
        keep: true,
        required: true,
        sample: 'Nov',
      },
    ],
  },
  chips: {
    label: 'Etiquetas',
    fields: [
      {
        key: 'items',
        label: 'Etiquetas',
        type: 'list',
        itemLabel: 'Etiqueta',
        required: true,
        fields: [
          {
            key: 'text',
            label: 'Texto',
            type: 'text',
            required: true,
            sample: 'Etiqueta',
          },
          {
            key: 'variant',
            label: 'Estilo',
            type: 'select',
            options: options(['outline', 'solid', 'dashed'], {
              outline: 'Borde',
              solid: 'Rellena',
              dashed: 'Punteada',
            }),
            sample: 'outline',
          },
        ],
        sample: [{ text: 'Una' }, { text: 'Otra' }],
      },
    ],
  },
  custom: {
    label: 'Componente registrado',
    fields: [
      {
        key: 'component',
        label: 'Componente',
        type: 'text',
        keep: true,
        required: true,
        sample: 'hand-raise',
      },
    ],
  },
};

/** Dónde cae cada bloque en la cuadrícula de la slide: columna, fila y cuántas ocupa (lo dibuja el editor). */
for (const field of Object.values(BLOCK_DESCRIPTORS))
  field.fields.push({ key: 'position', label: 'Posición', type: 'position' });

/** Los bloques con recuadro pueden crecer hasta llenar el alto de su celda: va con las primeras opciones del bloque. */
const SECTION_TYPES: Field['type'][] = [
  'object',
  'list',
  'people',
  'blocks',
  'position',
];
for (const kind of ['card', 'person', 'notice'] as const) {
  const fields = BLOCK_DESCRIPTORS[kind].fields;
  const firstSection = fields.findIndex((f) => SECTION_TYPES.includes(f.type));
  fields.splice(firstSection < 0 ? fields.length : firstSection, 0, {
    key: 'grow',
    label: 'Llenar el espacio de la celda',
    help: 'Crece en alto hasta donde llegan sus celdas.',
    type: 'boolean',
    default: true,
  });
}

export const TEST_CASES: { id: TestCaseId; label: string; help: string }[] = [
  { id: 'short', label: 'Corto', help: 'Cada texto se reduce a una palabra.' },
  {
    id: 'long',
    label: 'Largo',
    help: 'Textos de varias líneas y títulos de tres líneas.',
  },
  {
    id: 'many',
    label: 'Muchos',
    help: 'Las listas se alargan a diez elementos.',
  },
  { id: 'minimal', label: 'Mínimo', help: 'Solo lo obligatorio.' },
];

/** Cuántos elementos tiene una lista en el caso «muchos». */
export const MANY_ITEMS = 10;
