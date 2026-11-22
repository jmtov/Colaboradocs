# @colaboradocs/deck-render

Datos → HTML. Toma un `Deck` y un `Theme` y devuelve un único `index.html` autocontenido: el CSS y el motor de navegación van dentro; las fuentes y los assets se piden por ruta relativa. Todo son funciones puras; no lee ni escribe archivos.

```ts
import { renderDeck } from '@colaboradocs/deck-render';

const { html } = renderDeck(deck, theme, { registry });   // valida antes de dibujar
```

## Qué trae

| Función | Para qué |
|---|---|
| `renderDeck(deck, theme, options)` | El HTML completo del deck. Lanza un error con la lista de problemas si el deck no es válido |
| `renderSlides(deck, options)` | El HTML de cada slide, sin validar: lo usa el editor para reemplazar una slide sin recargar |
| `renderBlock(s)` / `renderSlide` | Piezas sueltas |
| `BASE_REGISTRY` | Componentes que todo tema trae (`hand-raise`) |
| `mergeRegistries` | Une registros de componentes; el último gana |

Opciones: `registry` (componentes y CSS propios de un tema o deck), `strings` (textos de la interfaz), `fontsPath`, `preview` (modo vista previa), `skipValidation`.

## Cómo dibuja

- **Cuadrícula.** Cada bloque va en una celda (`grid-column` / `grid-row`) que calcula `layoutContent` de deck-core. La animación de entrada y el orden del HTML siguen la posición, no el orden de la lista.
- **Estilo.** `BASE_CSS` solo usa variables; el tema las define. Una prueba exige que todo `font-size` salga de una variable y que no queden roles de texto huérfanos. Las filas fijadas y vacías dejan `--row-min`.
- **Motor** (`ENGINE_JS`): teclas, gesto táctil, hash en la URL, claro/oscuro, cuentas regresivas, pantalla completa, controles que salen con el mouse arriba. En el PDF cada slide es una página.
- **Componentes registrados.** Un bloque `custom` pide un componente por nombre al registro; si no existe, es un error.

## Modo vista previa (`preview: true`)

Solo para el editor y la galería; el deck final no lleva nada de esto:

- El motor acepta mensajes del editor (`deckGo`, `deckReplace`, `deckPreview`, `deckCells`, `deckHighlight`) y avisa de lo que se hace dentro (`deckSlide`, `deckBlock`, `deckHover`, `deckAdd`, `deckDelete`).
- Cada celda libre muestra un «+» para agregar un bloque, y cada bloque, un botón de eliminar al pasar el cursor.
- «Ver celdas» dibuja columnas, filas y celdas con su número.
- No hay zonas de clic para pasar de slide.

## Comandos

```sh
npm test -w @colaboradocs/deck-render
npm run typecheck -w @colaboradocs/deck-render
```
