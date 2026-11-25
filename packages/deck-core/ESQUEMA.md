# Esquema v1: decks como datos

Un deck es un JSON (`Deck`) que se dibuja con un **tema**. Tipos en `packages/deck-core/src/schema/deck.types.ts`; temas en `packages/themes`. El renderizador está en `packages/deck-render` y el CLI en `packages/cli`; `decks/galeria` muestra todos los layouts y bloques con cada tema y variante (`npm run gallery`).

## Capas de estilo

```
tema (organización) → variante (evento) → deck → slide
```

- **Tema** (`Theme`): claro y oscuro **obligatorios**, `baseMode`, hasta 10 colores de categoría, tokens, fuentes, logo en claro y oscuro, variantes.
- **Variante:** una capa sobre el tema (tokens, colores, categorías, fuentes). Ejemplo: `solido` cambia la superficie de acento del tema neutro.
- **Deck** (`style`): la misma capa, para lo que sea propio de ese deck.
- **Slide** (`style.tokens`): solo tokens, en línea. El color y la forma de una slide se piden con `tone`, `category` y `density`, no con CSS.

Los nombres válidos son los de `TOKEN_DEFAULTS` (`theme.constants.ts`): tipografía y escala, forma y línea, layout, movimiento. Un nombre que no esté ahí es un error de validación.

### Colores
`bg`, `ink`, `accent` (marca: filete, números), `accentSurface` (relleno: fondo de slide, tarjeta o caja) y `onAccent` (texto sobre el relleno). `muted`, `faint`, `tint`, `line` y `lineStrong` se derivan con `color-mix` si el tema no los fija, así que cambiar `bg` o `ink` ajusta todo. La impresión siempre usa los colores claros.

### Categorías
Hasta 10 por tema (`--cat-1` … `--cat-10`), cada una con `light`, `dark` y `print` opcional. Se usan como acento (cuadro, icono, filete), **nunca como texto**, y el orden no cambia. Una slide o una tarjeta pide la suya con `category: <índice desde 0>`, que pone `--c`. En una slide, la categoría colorea el filete bajo el título, el borde superior de las personas y el cuadro de los iconos.

## Slides

Hay un solo tipo, `content` (todo lo que se ve: portada, sección, texto, cuadrícula…). Un componente registrado por el tema o el deck es el bloque `custom`.

Una `content` es un **encabezado** y unos **bloques** en una **cuadrícula** de hasta 4 columnas × 4 filas:

| Campo | Qué hace |
|---|---|
| `columns` | 1 a 4 (por omisión, 1) |
| `rows` | 1 a 4; por omisión, las que hagan falta |
| `eyebrow` | Línea superior, fija arriba: `index` (p. ej. el número de una sección), `text`, `minutes`, `mode`; todo opcional |
| `body[]` | Los bloques, el título incluido |

**El título es el bloque `heading`** (`title[]` una línea por elemento, `titleSize` `xl`/`lg`/`md`/`sm`, `subtitle`), como cualquier otro: se coloca, se ensancha (por omisión ocupa todas las columnas) y se mueve. Solo puede haber uno por slide (`SINGLE_BLOCK_KINDS`); se dibuja siempre primero para que sus máscaras entren antes que el resto. `slideTitle(slide)` devuelve sus líneas.

**Posición de un bloque:** `col` y `row` (desde 1) dicen dónde empieza; `span` cuántas columnas ocupa y `rowSpan` cuántas filas. Sin `col` y `row`, el bloque va a la primera celda libre donde cabe, por filas, de izquierda a derecha. `layoutContent(slide)` calcula la disposición completa y detecta bloques que se pisan o se salen de la cuadrícula (`validateDeck` los avisa); es la única fuente de la disposición. Las filas se comparten entre columnas: un bloque con `rowSpan` ocupa varias.

**Ancho de los bloques** (`BLOCK_SPAN`): `agenda` y `timeline` ocupan siempre todas las columnas. Los demás arrancan en 1 y se pueden ensanchar con `span` hasta su máximo (`person`, `qr`, `date-box`: 2; el resto: 4); nunca más que las columnas de la slide.

**Plantillas** (`SLIDE_TEMPLATES`): puntos de partida al agregar una slide —portada o cierre, sección, una columna, dos columnas, cuadrícula—. Fijan `columns` y el título (tamaño, ancho…) y después todo se edita igual: no hay un tipo que limite.

**Fondo de la slide** (`background`): una lista de capas, de atrás hacia adelante, detrás de todo el contenido. Cada capa es un archivo del deck (`src: 'assets/…'`) con su proporción (`ratio: '1000 / 1063'`), su `width` (% del ancho de la slide) y el punto donde cae: `x` e `y` (% de la slide) para el punto de la imagen que marcan `anchorX` y `anchorY` (% de la imagen, por omisión el centro). Con `mode: 'image'` se dibuja tal cual; con `mode: 'silhouette'` la imagen es una máscara y se pinta con un color del tema (`tint`: `ink`, `bg` o `accent`), así sigue el claro y el oscuro. `opacity` va de 0 a 100. Una capa puede pasarse del borde de la slide: se recorta.

Campos de la slide: `speaker` (una persona: nombre y rol), `tone` (`default`, `accent`, `inverse`), `category`, `density` (`normal`, `compact`), `decor` (componente registrado, p. ej. el croquis), `style`, `notes`.

Los decks guardados con los tipos anteriores (`cover`, `section`, `stack`, `split`, `grid`) con `flow` o `newColumn`, con `title`/`subtitle`/`headerSpan` en la slide o con la slide `custom` se pasan con `migrateSlide`.

## Bloques

`heading` (con `icon` opcional: un cuadro con el icono, del color de la categoría, sobre el título), `note`, `list` (numerada o con viñetas, `size` `lg`/`md`, con icono y detalle; `plain: true` quita las viñetas y los números), `card` (con `category`, `tone`, `people`, `sources`), `person` (`plain: true` lo deja sin marco, como unos créditos), `figure`, `image`, `qr`, `countdown` (fecha **con zona horaria**), `notice`, `agenda` (ítems con `time`, `minutes`, `mode`, `speaker`; `type: 'break'` para descansos), `timeline`, `date-box`, `chips`, `custom`.

## Lo que decide el tema y no el contenido
Cómo se ve el modo de una slide (etiqueta Informar/Conversar/Decidir o solo reloj), si los títulos van en mayúsculas, el grosor de las líneas, si las formas son rectas o redondeadas, el estilo de las tarjetas. El contenido solo dice el dato (`mode: 'inform'`, `minutes: 10`).

## Descriptores de campos
`fields.constants.ts` describe cada campo de cada slide y bloque (tipo de control, etiqueta, si es obligatorio, valor de ejemplo). De ahí salen el formulario del editor, los elementos nuevos (`defaultBlock`, `defaultSlide`), los casos de prueba (`applyTestCase`: corto, largo, muchos, mínimo) y una prueba que comprueba que el renderizador dibuja cada campo que el esquema promete.

## Validación
`validateTheme(theme)` y `validateDeck(deck, theme)` devuelven una lista de `{path, message}` (vacía si todo está bien): tema con claro y oscuro completos, tokens conocidos, categorías únicas y ≤ 10; deck con tipos de slide y bloque conocidos, categorías dentro de las del tema, fechas con zona horaria, ids de slide únicos.

## Pendiente
- Más iconos en el registro (hoy: clock, mic, fork, hand, info) y los de Tabler que usen los decks migrados.
- Texto con énfasis (negrita) dentro del subtítulo, las notas y las listas: hoy el texto es plano.
- Bloques que se pueden fusionar o retirar (`chips` y `date-box` son candidatos).
- Agenda enlazada a colaboradocs (hoy el bloque `agenda` lleva los datos dentro).
