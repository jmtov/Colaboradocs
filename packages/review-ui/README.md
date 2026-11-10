# @juntanza/review-ui

Componentes Solid para revisar un documento: puerta de PIN, comentarios por bloque con respuestas, OK por bloque. **No saben nada del documento ni del diseño de la app**: la app aporta el contenido y los tokens CSS. Se consume como código fuente (sin build propio): la app host lo compila.

## Uso mínimo

```tsx
import { BlockLayer, PinGate, ReviewProvider } from '@juntanza/review-ui';

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
| `BlockLayer` | Envuelve el contenido: tocar un bloque abre la barra Comentar / OK; cada bloque muestra insignias de OK e hilos abiertos; abre el hilo en una hoja inferior. |
| `BottomSheet` | Hoja inferior reutilizable, sobre `<dialog>`. **Entra y sale deslizándose desde abajo** (500 ms, curva `cubic-bezier(0.32, 0.72, 0, 1)` de las hojas de iOS; se ajustan con `--sheet-duration` y `--sheet-ease`). Para poder animar la salida, al cerrarse el diálogo y su contenido siguen puestos hasta que termina la transición; Escape no cierra por su cuenta sino que pide cerrar (`onClose`) para que salga animada. Con «reducir movimiento» no hay deslizamiento. |
| `AccessSheet` (`open`, `onClose`) | Pantalla de accesos para admins: lista (nombre, rol, dispositivos, toggle de admin) y menú por fila (editar rol, restablecer dispositivos, regenerar PIN, eliminar, con confirmación). «Agregar persona» abre otra hoja; el PIN nuevo se muestra una sola vez con botón de copiar. Montarla solo si `me.isAdmin`; el servidor valida igual. Estado en `useReview().access`. |

## Contrato con el contenido

- Cada bloque revisable lleva **`data-block-id`**. Genera los ids con `assignBlockIds` de `@juntanza/review-core` (no a mano), y deben cumplir `/^[a-z0-9-]{1,100}$/`.
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
npm test -w @juntanza/review-ui
```
Las pruebas cubren sesión, mensajes y tiempos (utilidades puras); los componentes no tienen pruebas de DOM.
