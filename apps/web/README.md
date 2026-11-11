# @juntanza/web

La página: Vite + Solid. Lee **un documento JSON** y lo monta sobre `@juntanza/review-ui`. Es la «app host»: aporta el contenido, el diseño y los tokens CSS (`src/index.css`).

## Documentos y home

La página **no trae documentos**: los pide a la API después de ingresar el PIN (`GET /api/documents`, `GET /api/documents/:id/content`). Cuántos y cuáles hay lo decide la base, no la compilación.

- `/` es la home: una tarjeta por documento, con hilos abiertos, OK y última actividad. Con un solo documento, redirige a `/d/<id>` (sin dejar entrada en el historial).
- `/d/<id>` abre un documento. Un id que no existe, o una ruta rara, muestra «No encontramos ese documento».
- El nombre del espacio (título de la pestaña y de la puerta del PIN) sale de `GET /api/space`, público.
- La sesión (PIN) es una sola para todo el espacio.
- Administración (solo admins), en la home: cada tarjeta trae un menú ⋮ (`DocumentMenu`: reemplazar el archivo, archivar con confirmación) y la grilla termina con un bloque «+ Subir documento». Además, desde el menú ⋮ de la sesión, dos páginas propias: **Documentos** (`/documentos`, `DocumentsPage`: subir, reemplazar, archivar) y **Accesos** (`/accesos`, `AccessPanel` de `review-ui`), ambas dentro de `AdminPage`. La subida lee el archivo en el navegador con `@juntanza/doc-import` (que se descarga recién al subir algo), muestra qué entendió y publica con `review.publishDocument`.

## Formato del documento

Tipos en `packages/review-core/src/document.types.ts` (re-exportados en `src/content/content.types.ts`), validación en `review-core`, ejemplo en `documents/example.json` y descripción campo por campo en el README de la raíz. Convenciones que el código de esta app **sí interpreta**:

- Sección con `id: "glosario"`: `<dl><dt><dd>`. Alimenta la hoja de definiciones; en esa sección no se enlazan términos.
- `glossaryTerms` (cómo aparece en el texto, minúsculas → entrada del glosario): los términos se enlazan **una vez por sección**; gana el más largo; no parte palabras.
- Primer párrafo que empieza con «Para qué sirve»: nota, no es revisable.
- `<em>[1, 2]</em>` = cita a `sources`; «sección N» se enlaza a la sección con `num` N.
- `<h3>` (y `<h4>`) entran al índice; un `<h3>` que empieza con «Pendientes» cuenta sus `<li>` como pendientes.
- Lo que no sea una etiqueta conocida se aplana a texto (`src/Prose/buildProse.ts`); la página **nunca inyecta HTML crudo**.
- `roleField` ya no es del documento sino del espacio (`PUT /api/admin/space`).

## Mapa de `src/`

| Carpeta | Qué es |
|---|---|
| `App.tsx`, `main.tsx` | Providers (`ReviewProvider` → `PinGate`) y rutas: `HomeRoute` (home o redirección), `DocumentRoute` (pide el contenido) y «no encontrado». |
| `router/` | Router mínimo con History API (`resolveRoute`, `navigate`, `Link`). |
| `HomePage/` | La home: una tarjeta por documento, con su actividad. |
| `AdminPage/` | Marco de `/documentos` y `/accesos` (solo admins; a los demás les dice «Solo para administradores»): encabezado, «← Inicio», título y el contenido de la página. |
| `DocumentsPage/` | Contenido de `/documentos`: lista, subir, reemplazar y archivar. `UploadSheet` (subir y reemplazar con vista previa) es una hoja que se abre con `useOverlay().sheet`, igual desde la home y desde el menú de cada tarjeta: no hay estado global. Sirve para espacios de un solo documento, donde `/` redirige y no hay home. |
| `HowToReview/` | `HowToReview` programa la guía (`HowToSheet`, una hoja inferior abierta con `useOverlay`): se abre sola cada vez que se abre un documento hasta que se elige «No volver a mostrar» (`localStorage`, clave `review:howto-dismissed`, vale para todos los documentos de ese navegador). Después se abre a pedido desde el menú ⋮ de la sesión. |
| `Loading/` | Página de un mensaje: cargando, error, «no existe». |
| `content/` | Utilidades del documento (pendientes, glosario, etiquetas de sección) y los tipos re-exportados de `review-core`. |
| `Prose/` | `buildProse`: HTML limitado → DOM con clases, `data-block-id`, `data-outline-level`, enlaces de glosario/cita/sección. Es el punto donde se unen contenido y `review-ui`. |
| `DocumentPage/` | Pantalla principal: estado de la sección activa, métricas, hojas. |
| `Hero/`, `SectionCards/`, `ReviewSummary/` | Inicio: título, tarjetas, contadores. |
| `SectionView/`, `SideNav/`, `TopBar/`, `DocumentSheet/` | Lectura, navegación, índice y hojas (contenido, glosario, citas). |
| `ThemeSwitch/`, `UserMenu/` | Tema claro/oscuro/auto (clave `review:theme`) y sesión. El selector de tema está en el menú ⋮ del usuario (`<ThemeSwitch fill />`), no en el pie de las páginas. Para admins, el menú trae «Documentos» y «Accesos», que llevan a sus páginas. |
| `index.css` | **Tokens de diseño** que exige `review-ui`. |

Estilo: **esquinas rectas, sin `border-radius`** en ningún elemento. `index.css` lo reinicia para todo (`*`) y los componentes no declaran radios: no los agregues.

Transición de página: al navegar, la página que se ve sale con un fade y se transforma, cambia el contenido y la nueva entra (`App.module.css`: `--page-duration`, `--page-ease`, `--page-shift` y las fases `leaving` / `entering`). La ruta que se muestra va un paso por detrás de la URL (`router/pageTransition.ts`); las redirecciones y «reducir movimiento» cambian el contenido sin animar. Las pruebas del CSS cuidan la estructura, no los valores de diseño.

Grillas de celdas (la home y las tarjetas de sección): **bordes colapsados**. Cada celda lleva su borde completo de 1 px y un margen `0 -1px -1px 0`, de modo que se monta sobre la vecina y donde se juntan queda una sola línea de 1 px; la grilla añade `padding: 0 1px 1px 0` para compensar la última columna y fila. La celda bajo el cursor sube de `z-index` para que se vea su borde completo y su sombra. Con zoom de navegador no entero puede notarse un redondeo en alguna unión.

Interacción: al pasar el cursor, lo accionable **se despega del papel** (`--lift`, hoy 2 px) y deja una **sombra larga y sólida**, sin difuminado, que rellena el hueco entre su posición original y la nueva. Todo sale de una sola variable animada, `--t` (registrada con `@property`): el desplazamiento y el largo de la sombra crecen a la par, y se encogen a la par al soltar; sin soporte de `@property` (Safari < 16.4) funciona igual pero sin transición. La sombra es un pseudo-elemento `::after` (con `clip-path`), no un `box-shadow`: así el hueco que deja sigue siendo clicable y el hover no parpadea. Al presionar vuelve al papel. Es una regla global en `index.css`: aplica a todo `<button>` habilitado, salvo los marcados con `data-flat` (ítems de menús y listas, texto), y a los enlaces marcados con `data-lift` (tarjetas; `<Link lift>`). Solo con cursor real (`hover: hover`). El color de la sombra es `--lift-color` (por defecto, el color del texto del elemento). Un botón nuevo ya lo trae; si vive dentro de una lista o menú, márcalo `data-flat`. Los elementos con `::after` propio no pueden usar el efecto (hoy ninguno lo necesita). Es una regla global en `index.css`: aplica a todo `<button>` habilitado, salvo los marcados con `data-flat` (ítems de menús y listas, texto) y a los enlaces marcados con `data-lift` (tarjetas; `<Link lift>`). Solo con cursor real (`hover: hover`). Un botón nuevo ya lo trae; si vive dentro de una lista o menú, márcalo `data-flat`.

Convención: `Componente/Componente.tsx` + `.module.css`; utilidades en `*.utils.ts`, constantes en `*.constants.ts`, con su `*.test.ts` al lado. Alias `@/` → `src/` (solo en la app; los paquetes usan imports relativos).

## Desarrollo

```
npm run dev:api          # raíz: Worker local en :8800
npm run dev:web          # raíz: Vite en :5180 (host abierto, para el celular), /api con proxy a :8800
npm test -w @juntanza/web && npm run typecheck -w @juntanza/web
```

## Cambiar la interfaz o el formato

- **Texto fijo de la UI** (instrucciones del inicio «Cómo revisar», etiquetas): en los componentes, en español.
- **Campo nuevo del documento:** tipo en `content.types.ts`, uso en el componente, valor en `example.json` y una línea en el README de la raíz.
- **Nuevo tipo de bloque revisable:** hay que tocar `buildProse.ts` (qué elementos son bloques y cuáles son notas) y mantener la regla de `review-core`: el id sale de `assignBlockIds`.
