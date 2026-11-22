# @colaboradocs/deck-core

El contrato del sistema: qué es un deck, qué es un tema y cómo se valida. Solo TypeScript puro, sin DOM ni archivos; todo son funciones que se prueban sin navegador.

## Qué trae

| Módulo | Para qué |
|---|---|
| `schema/deck.types.ts`, `deck.constants.ts` | Los tipos del deck: `Deck`, `ContentSlide`, los bloques (`heading`, `note`, `list`, `card`, `person`, `figure`, `image`, `qr`, `countdown`, `notice`, `agenda`, `timeline`, `date-box`, `chips`, `custom`), tonos, densidades, tamaños de título |
| `schema/layout.utils.ts` | La cuadrícula: `layoutContent` (dónde cae cada bloque y qué se pisa), `blockSpan`, `freeCells`, `tidyGrid` |
| `schema/deck.utils.ts` | `validateDeck(deck, theme)` → lista de `{path, message}`; `slideTitle` |
| `schema/fields.constants.ts` | Los **descriptores**: cada campo de cada slide y bloque (control, etiqueta, valor de ejemplo, orden) |
| `schema/fields.utils.ts` | De los descriptores: `defaultBlock`, `defaultSlide`, `fullSample`, `applyTestCase` (corto, largo, muchos, mínimo), `partsOf` (general, contenido, otros datos) |
| `schema/templates.constants.ts` | Las plantillas al agregar una slide (portada, sección, una columna, dos columnas, cuadrícula) |
| `schema/migrate.utils.ts` | `migrateSlide`: pasa slides con formas anteriores (`cover`, `split`, `flow`, `title` en la slide…) a la actual |
| `theme/theme.constants.ts`, `theme.types.ts`, `theme.utils.ts` | El contrato de tema: tokens y sus valores por omisión, colores claro y oscuro, categorías; `resolveStyle`, `styleToCss`, `validateTheme` |

## Ideas

- **Una slide `content`, una cuadrícula.** `columns` × `rows` (máx. 4 × 4); cada bloque lleva `col`, `row`, `span` y `rowSpan`, o ninguno (va a la primera celda libre). El título es el bloque `heading`, como los demás; algunos bloques solo pueden estar una vez (`SINGLE_BLOCK_KINDS`). `BLOCK_SPAN` dice cuántas columnas admite cada tipo (la agenda y la línea de tiempo, todas).
- **Cascada de estilo:** tema → variante → deck → slide, con `resolveStyle`. Los nombres de token se validan contra `TOKEN_DEFAULTS`.
- **Los descriptores son la única verdad** del formulario del editor, de los valores de prueba y de la prueba que comprueba que el renderizador dibuja todo.

Diseño completo en [`docs/ESQUEMA.md`](../../docs/ESQUEMA.md).

## Comandos

```sh
npm test -w @colaboradocs/deck-core
npm run typecheck -w @colaboradocs/deck-core
```
