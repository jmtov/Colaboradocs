# @colaboradocs/review-ui

Componentes Solid para revisar un documento: puerta de PIN, comentarios por bloque con respuestas, OK por bloque. **No saben nada del documento ni del diseño de la app**: la app aporta el contenido y los tokens CSS. Se consume como código fuente (sin build propio): la app host lo compila.

## Uso mínimo

```tsx
import { BlockLayer, PinGate, ReviewProvider } from '@colaboradocs/review-ui';

<ReviewProvider documentId="mi-doc">
  <PinGate title="Mi documento">
    <BlockLayer>
      <p data-block-id="intro-1a2b3c">Un párrafo revisable.</p>
    </BlockLayer>
  </PinGate>
</ReviewProvider>
```

| Export | Qué hace |
|---|---|
| `ReviewProvider` (`documentId?`, `roleField?`) | Crea el store y lo pone en contexto. La sesión es del **espacio** (`localStorage`, claves `review:session` y `review:device`): cambiar de documento no vuelve a pedir el PIN. `documentId` es el documento abierto, o nada en la home; cambia en caliente. Las sesiones de cuando eran por documento (`review:<id>:session`) se descubren y adoptan solas, para no pedir el PIN otra vez ni gastar un dispositivo más. Sondea cada 30 s con la pestaña visible: el documento abierto, o la lista de documentos en la home. |
| `useReview()` | El store: `session`, `snapshot`, `documents` (`DocumentListItem[]`, para la home), `status` (`idle\|loading\|ready\|error`), `notice`, `login`, `logout`, `refresh`, `addComment`, `deleteComment`, `setResolved`, `toggleApproval`, `flash`, más `fetchContent(id)` (el contenido de un documento), `loadDocuments`, `publishDocument`, `archiveDocument` y `saveSpace` (admins; devuelven `{ ok }` o `{ ok: false, message, details }`). Solo dentro de un `ReviewProvider`. |
| `PinGate` (`title`, `hint?`) | Muestra sus hijos solo con sesión; si no, pide el PIN. |
| `BlockLayer` | Envuelve el contenido: tocar un bloque abre la barra Comentar / OK; cada bloque muestra dos pastillas que son botones: «✓ n» abre la hoja de quién dio OK y cuándo (`ApprovalsSheet`, con la fecha de cada OK que trae `BlockApproval.createdAt`) y «n hilos» abre los comentarios del bloque en una hoja inferior. |
| `BottomSheet` | Hoja inferior reutilizable, sobre `<dialog>`. **Entra y sale deslizándose desde abajo** (500 ms, curva `cubic-bezier(0.32, 0.72, 0, 1)` de las hojas de iOS; se ajustan con `--sheet-duration` y `--sheet-ease`). Para poder animar la salida, al cerrarse el diálogo y su contenido siguen puestos hasta que termina la transición; Escape no cierra por su cuenta sino que pide cerrar (`onClose`) para que salga animada. **Al empezar a salir deja de ser modal** (`close()` + `show()`): un `<dialog>` modal deja inerte el resto de la página y eso no se arregla con `pointer-events`, así que mientras se anima la página ya responde; el fondo oscuro se desvanece con una sombra grande (sin `::backdrop`) y el foco vuelve a quien abrió la hoja. Necesita `--z-fixed` (la hoja es `position: fixed` con ese `z-index`). Con «reducir movimiento» no hay deslizamiento. |
| `OverlayProvider`, `useOverlay()` | **Único punto de montaje de las hojas.** `ReviewProvider` ya lo incluye. `useOverlay().sheet(Componente, props)` abre una hoja y resuelve con lo que pase a `close(resultado)` (o `undefined` si se cierra con Esc, fondo o arrastre); `isOpen()` dice si hay alguna abierta. La hoja se monta al abrir y se desmonta al cerrar (tras su salida animada): nace limpia, sin banderas `open` repartidas. Las hojas se apilan. El componente recibe `SheetLayerProps` (`open`, `onClose`, `close`) y dibuja su propio `BottomSheet`. |
| `ConfirmSheet` | Hoja de confirmación (`title`, `message`, `confirmLabel`, `danger?`) para `overlay.sheet`: resuelve `true` o `false`. |
| `ActionMenu` (`label`, `items`, `note?`) | Tres puntos con un menú de acciones con ícono (popover nativo). `openAfterMenuCloses` se exporta aparte: abrir una hoja modal justo cuando un popover se cierra es frágil, así que espera a que termine. |
| `AccessPanel` | Contenido de la página de accesos para admins (la app lo enmarca): lista (nombre, rol, dispositivos, toggle de admin) y menú por fila (editar rol, restablecer dispositivos, regenerar PIN, eliminar, con confirmación). Las acciones de cada fila van en un menú ⋮ con íconos (`ActionMenu`): «Editar» abre una hoja, y «Regenerar PIN» y «Eliminar» piden confirmar con `ConfirmSheet`. «Agregar persona» abre una hoja (`useOverlay().sheet`); el PIN nuevo se muestra una sola vez con botón de copiar. Montarla solo si `me.isAdmin`; el servidor valida igual. Estado en `useReview().access`. |

## Contrato con el contenido

- Cada bloque revisable lleva **`data-block-id`**. Genera los ids con `assignBlockIds` de `@colaboradocs/review-core` (no a mano), y deben cumplir `/^[a-z0-9-]{1,100}$/`.
- Lo que no debe seleccionar un bloque al tocarlo (enlaces, citas, términos del glosario) lleva **`data-interactive`**. Enlaces y botones tampoco seleccionan.
- Un bloque = una unidad (párrafo, viñeta, definición). Al tocar, se toma el `data-block-id` **más cercano** hacia arriba (`closest`), así que no anides bloques.

## Tokens CSS que la app debe definir

`--bg`, `--fg`, `--muted`, `--line-strong`, `--ok`, `--ok-bg`, `--warn`, `--font-mono`, `--font-size-xs`…`--font-size-lg`, `--z-fixed`, `--danger` (acciones destructivas), `--tint`. Sin ellos los componentes se ven rotos; no hay valores por defecto. Es lo primero a revisar si «se ve raro» en una app nueva.

## Espacio y rol

`fetchSpace()` (exportada) pide `GET /api/space` sin sesión: sirve para el título de la puerta del PIN. Su `roleField` se pasa a `ReviewProvider`.

## Rol configurable

`ReviewProvider roleField={{ label: 'Municipio', format: 'Representante {value}' }}`. `label` nombra el campo en formularios; `format` solo cambia cómo se **muestra** en la lista de accesos (el valor guardado es «La Ceja»). En comentarios e insignias se muestra el valor corto. Sin `roleField`: «Rol», tal cual.

## API

`src/api/review.api.ts` habla con `/api` (ruta fija, mismo origen). En desarrollo la app host hace proxy a `wrangler dev`. Los tipos vienen de `review-core`.

## Reglas

- **Imports relativos** dentro de `src/`, no `@/`: el alias rompe al consumir el paquete desde otra app.
- Textos de interfaz en español, escritos en los componentes (`ThreadSheet`, `PinGate`, `store/review.messages.ts`). No hay capa de i18n.
- Los errores de login se traducen en `store/review.messages.ts`; si agregas un `ApiErrorCode`, agrega su mensaje.
- Un 401 en cualquier llamada cierra la sesión y avisa («Tu acceso ya no es válido»).

## Probar

```
npm test -w @colaboradocs/review-ui
```
Las pruebas cubren sesión, mensajes y tiempos (utilidades puras); los componentes no tienen pruebas de DOM.
