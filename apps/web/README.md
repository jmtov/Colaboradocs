# @colaboradocs/web

La página: Vite + Solid. Lee **un documento JSON** y lo monta sobre `@colaboradocs/review-ui`. Es la «app host»: aporta el contenido, el diseño y los tokens CSS (`src/index.css`).

## Documentos y home

La página **no trae documentos**: los pide a la API después de ingresar el PIN (`GET /api/documents`, `GET /api/documents/:id/content`). Cuántos y cuáles hay lo decide la base, no la compilación.

- `/` es la home: una tarjeta por documento, con hilos abiertos, OK y última actividad. Con un solo documento, redirige a `/d/<id>` (sin dejar entrada en el historial).
- `/d/<id>/editar` es el editor del documento (solo admins).
- `/documentos` y `/accesos` son la administración (solo admins; los demás ven «Solo para administradores»), a las que se llega desde el menú ⋮ de la sesión.
- `/d/<id>` abre un documento. Un id que no existe, o una ruta rara, muestra «No encontramos ese documento».
- El nombre del espacio (título de la pestaña y de la puerta del PIN) sale de `GET /api/space`, público.
- La sesión (PIN) es una sola para todo el espacio.
- Administración (solo admins), en la home: cada tarjeta trae un menú ⋮ (`DocumentMenu`: reemplazar el archivo, archivar con confirmación) y la grilla termina con un bloque «+ Subir documento». Además, desde el menú ⋮ de la sesión, dos páginas propias: **Documentos** (`/documentos`, `DocumentsPage`: subir, reemplazar, archivar) y **Accesos** (`/accesos`, `AccessPanel` de `review-ui`), ambas dentro de `AdminPage`. La subida lee el archivo en el navegador con `@colaboradocs/doc-import` (que se descarga recién al subir algo), muestra qué entendió y publica con `review.publishDocument`.

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
| `App.tsx`, `main.tsx` | Providers (`ReviewProvider` → `PinGate`) y rutas: `HomeRoute` (home o redirección), `DocumentRoute` (pide el contenido), `AdminPage` (administración) y «no encontrado». |
| `router/` | Router mínimo con History API (`resolveRoute`, `navigate`, `Link`). |
| `HomePage/` | La home: una tarjeta por documento, con su actividad. |
| `AdminPage/` | Marco de `/documentos` y `/accesos` (solo admins; a los demás les dice «Solo para administradores»): encabezado, «← Inicio», título y el contenido de la página. |
| `DocumentsPage/` | Contenido de `/documentos`: lista, subir, reemplazar y archivar. `UploadSheet` (subir y reemplazar con vista previa) es una hoja que se abre con `useOverlay().sheet`, igual desde la home y desde el menú de cada tarjeta: no hay estado global. Sirve para espacios de un solo documento, donde `/` redirige y no hay home. |
| `FieldGroup/` | Grupos de filas «etiqueta … valor» (`FieldGroup`, `FieldRow`, `FieldTitle`, y el input sin borde de `FieldInput.module.css`): caja con líneas finas, valor a la derecha, «—» si está vacío. Es el formato de lo que no es texto libre (título y descripción de una sección, enlaces del glosario). Esquinas rectas, como todo. |
| `PageBar/` | La barra superior de `/documentos`, `/accesos` y del editor: botón de regreso (enlace o acción), nombre del espacio y menú de la sesión; lo que se le pasa como hijo va a la derecha (p. ej. «Sin conexión»). |
| `EditorPage/` | `/d/<id>/editar` (solo admins): editor del documento. Parte del borrador si lo hay (si no, de lo publicado) y muestra **todo el documento en un solo editor** (carga perezosa con la página: Tiptap pesa ~350 kB). A la izquierda, `EditorOutline` (las secciones y la bibliografía, siguiendo lo que se escribe). Los ajustes de una sección que no son texto (estado, descripción, anexo, «Eliminar sección», que confirma y dice qué comentarios y OK deja atrás) se abren en `SectionSheet` desde el botón del título. A la derecha del título: el estado, un menú de tres puntos (`ActionMenu`: Editar título y descripción —`DetailsSheet`—, Guardar borrador y Descartar, en rojo y con confirmación) y «Publicar…», la única acción principal. `EditorToolbar` va arriba del texto, pegada bajo la barra de la página mientras se recorre el editor (no baja al glosario ni a la bibliografía), solo con íconos (`IconButton`): en grupos (Negrilla y Cursiva · Sección y encabezados · listas · Nota y Cita); la barra no cambia según dónde esté el cursor.  Nota y Cita se marcan cuando el cursor está en una. Una sección nueva se hace con el botón «Sección» de la barra (convierte el renglón en título). El glosario **no está en el editor**: va debajo, en `GlossaryList` (un término a la vez; «Editar» abre `TermSheet` con término, definición, «aparece como» y «Quitar término»; «+ Agregar término»). Se guarda como la sección `glosario` (anexo; vacío no se guarda; `splitGlossary` / `joinGlossary`, `parseGlossary` / `buildGlossary`): lo que no se edita conserva su formato, lo reescrito queda en texto plano. Debajo, `GlossaryLinks` muestra los enlaces que apuntan a un término que ya no existe (`glossaryTerms`, `glossary.utils.ts`); luego `SourcesEditor` (la bibliografía) y `CitationSheet` (elegir fuentes para insertar una cita «[n]», o para cambiar una al tocarla en el texto: `onEditCitation`, `replaceCitation`). `useEditorPage` lleva la copia de trabajo (`sections`, que el editor actualiza en cada cambio) y la compara con lo último guardado (lo escrito mientras se guarda no se pierde) y la `revision` del borrador. `ChangeWarnings` avisa en vivo, sin bloquear, qué comentarios y OK perderían los cambios y si alguna sección cambia de número y algún texto dice «sección N» (`affected.utils.ts`: el id de bloque sale del texto). Antes de publicar, `PublishSheet` muestra la versión actual y pide la nueva (se propone la siguiente, `nextVersion`; `isLaterVersion` no deja una igual o anterior) y qué comentarios y OK se pierden. Se entra por «Editar» en la barra del documento. |
| `Editor/` | El editor en sí: un solo documento donde cada título de sección (`sectionTitle`, un `<h2>`) abre una sección nueva; el título lleva `id` (estable: es la base de los ids de bloque), estado, descripción y si es anexo, y **el número sale de la posición** (1, 2… y A, B… para anexos). Schema de Tiptap limitado al formato del documento (`editor.extensions.ts`; nodos propios en `editor.nodes.ts`: `dl/dt/dd` y la cita `[n]`; `editor.sections.ts`: el título, con Enter/Backspace propios y ids únicos, y el estilo de la nota «Para qué sirve»). `document.convert.ts` pasa de `sections[]` al HTML del editor y de vuelta; `section.commands.ts` son los comandos (agregar, borrar, ir a, cambiar datos, nota, término). `DocumentEditor` monta Tiptap. Una prueba pasa los documentos de `documents/` por el editor y exige HTML y ids de bloque idénticos. |
| `HowToReview/` | `HowToReview` programa la guía (`HowToSheet`, una hoja inferior abierta con `useOverlay`): se abre sola cada vez que se abre un documento hasta que se elige «No volver a mostrar» (`localStorage`, clave `review:howto-dismissed`, vale para todos los documentos de ese navegador). Después se abre a pedido desde el menú ⋮ de la sesión. |
| `Loading/` | Página de un mensaje: cargando, error, «no existe». |
| `content/` | Utilidades del documento (pendientes, glosario, etiquetas de sección) y los tipos re-exportados de `review-core`. |
| `Prose/` | `buildProse`: HTML limitado → DOM con clases, `data-block-id`, `data-outline-level`, enlaces de glosario/cita/sección. Es el punto donde se unen contenido y `review-ui`. |
| `DocumentPage/` | Pantalla principal: estado de la sección activa, resumen de la revisión, hojas y vista de impresión (botón en `TopBar`; `print.utils.ts` da el título del PDF). |
| `ReviewNavigation/` | Recorrer la revisión desde el resumen: «Hilos abiertos», «Pendientes» y «Bloques con OK» abren una hoja con sus bloques (`BlockListSheet`); al elegir uno se va a él y aparece una barra inferior (`NavigationBar`) con contador y flechas. La lista sale de la revisión en vivo. |
| `VersionsSheet/` | Hoja de solo lectura con las versiones del documento (`GET /api/documents/:doc/versions`). |
| `Hero/`, `SectionCards/`, `ReviewSummary/` | Inicio: título, tarjetas y los cuatro datos de la revisión, que son botones (borde colapsado como las tarjetas). |
| `SectionView/`, `SideNav/`, `TopBar/`, `DocumentSheet/` | Lectura, navegación, índice y hojas (contenido, glosario, citas). |
| `ThemeSwitch/`, `UserMenu/` | Tema claro/oscuro/auto (clave `review:theme`) y sesión. El selector de tema está en el menú ⋮ del usuario (`<ThemeSwitch fill />`), no en el pie de las páginas. Para admins, el menú trae «Documentos» y «Accesos», que llevan a sus páginas. |
| `index.css` | **Tokens de diseño** que exige `review-ui`. |

Estilo: **esquinas rectas, sin `border-radius`** en ningún elemento. `index.css` lo reinicia para todo (`*`) y los componentes no declaran radios: no los agregues.

Transición de página: al navegar, la página que se ve sale con un fade y se transforma, cambia el contenido y la nueva entra (`App.module.css`: `--page-duration`, `--page-ease`, `--page-shift` y las fases `leaving` / `entering`). La ruta que se muestra va un paso por detrás de la URL (`router/pageTransition.ts`); las redirecciones y «reducir movimiento» cambian el contenido sin animar. Las pruebas del CSS cuidan la estructura, no los valores de diseño.

Grillas de celdas (la home y las tarjetas de sección): **bordes colapsados**. Cada celda lleva su borde completo de 1 px y un margen `0 -1px -1px 0`, de modo que se monta sobre la vecina y donde se juntan queda una sola línea de 1 px; la grilla añade `padding: 0 1px 1px 0` para compensar la última columna y fila. La celda bajo el cursor sube de `z-index` para que se vea su borde completo y su sombra. Con zoom de navegador no entero puede notarse un redondeo en alguna unión.

Interacción: al pasar el cursor, lo accionable **se despega del papel** (`--lift`, hoy 2 px) y deja una **sombra larga y sólida**, sin difuminado, que rellena el hueco entre su posición original y la nueva. Todo sale de una sola variable animada, `--t` (registrada con `@property`): el desplazamiento y el largo de la sombra crecen a la par, y se encogen a la par al soltar; sin soporte de `@property` (Safari < 16.4) funciona igual pero sin transición. La sombra es un pseudo-elemento `::after` (con `clip-path`), no un `box-shadow`: así el hueco que deja sigue siendo clicable y el hover no parpadea. Al presionar vuelve al papel. Es una regla global en `index.css`: aplica a todo `<button>` habilitado, salvo los marcados con `data-flat` (ítems de menús y listas, texto), y a los enlaces marcados con `data-lift` (tarjetas; `<Link lift>`). Solo con cursor real (`hover: hover`). El color de la sombra es `--lift-color` (por defecto, el color del texto del elemento). Un botón nuevo ya lo trae; si vive dentro de una lista o menú, márcalo `data-flat`. Los elementos con `::after` propio no pueden usar el efecto (hoy ninguno lo necesita). Es una regla global en `index.css`: aplica a todo `<button>` habilitado, salvo los marcados con `data-flat` (ítems de menús y listas, texto) y a los enlaces marcados con `data-lift` (tarjetas; `<Link lift>`). Solo con cursor real (`hover: hover`). Un botón nuevo ya lo trae; si vive dentro de una lista o menú, márcalo `data-flat`.

Convención: `Componente/Componente.tsx` + `.module.css`; utilidades en `*.utils.ts`, constantes en `*.constants.ts`, con su `*.test.ts` al lado. Alias `@/` → `src/` (solo en la app; los paquetes usan imports relativos).

## Botones

Todo lo que se toca para hacer algo es un `Button` (`packages/review-ui/src/Button/`, lo usan las dos apps): un solo aspecto, siempre con ícono (sin texto, es solo de ícono), `variant` (`default`, `primary` —la acción principal de la pantalla—, `danger`, `dangerSolid`, `ok`), `size` (`md`, o `sm` para insignias y acciones dentro de un texto) y `pressed` para los que se encienden. Con `href` es un enlace. `IconButton` es un `Button` solo de ícono más un tooltip. Un `class` en un `Button` es solo para ubicarlo; nunca para su aspecto. No son `Button`: ítems de menú, tarjetas, pestañas y navegación.

## Desarrollo

```
npm run dev:api          # raíz: Worker local en :8800
npm run dev:web          # raíz: Vite en :5180 (host abierto, para el celular), /api con proxy a :8800
npm test -w @colaboradocs/web && npm run typecheck -w @colaboradocs/web
```

## Cambiar la interfaz o el formato

- **Texto fijo de la UI** (instrucciones del inicio «Cómo revisar», etiquetas): en los componentes, en español.
- **Campo nuevo del documento:** tipo en `content.types.ts`, uso en el componente, valor en `example.json` y una línea en el README de la raíz y en la guía de `buildFormatGuide` (`doc-import`), que es lo que se descarga desde «Subir documento».
- **Nuevo tipo de bloque revisable:** hay que tocar `buildProse.ts` (qué elementos son bloques y cuáles son notas) y mantener la regla de `review-core`: el id sale de `assignBlockIds`.
