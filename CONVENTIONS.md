# Convenciones de este repo

Ganan sobre las convenciones generales donde difieran. Aquí va cómo se organiza el código; qué hace cada carpeta está en el README de cada app o paquete.

## Organización

- **Por feature o dominio, no por capa técnica.** No se crean carpetas `routes/`, `db/` o `components/` en el primer nivel de `src/`.
- **Carpetas de feature en inglés y en singular** (`document`, `deck`, `task`).
- **Sin barrels dentro de una app o feature** (cambia la regla general): se importa el archivo (`@/document/prose/buildProse`), no un `index.ts`. El único `index.ts` que reexporta es la API pública de un paquete (`review-core`, `deck-core`…).
- **Dónde va una pieza:** junto a lo que la usa. Sube un nivel cuando aparece un segundo uso (con duda, un tercero).

### Web (`apps/web/src`)

- **PascalCase es página o componente; minúscula es soporte** (`components/`, `hooks/`, `editor/`, `prose/`).
- Una feature tiene sus páginas como carpetas (`document/DocumentPage/`, `document/EditorPage/`).
- Lo que usa una sola página va dentro de ella (`<Página>/components/`). Lo que usan dos páginas de la feature, en `<feature>/components/`. Lo que usan dos features de la misma capa, en `shared/`. Una feature de una capa inferior puede consumirse desde arriba (`task/components/` lo usan `home` y `document`).
- **Hooks grandes:** `<Página>.hooks.ts` queda como compositor y las partes van en `<Página>/hooks/<área>.hooks.ts`, cada una recibe por parámetro lo que necesita (ver `EditorPage`).
- **Íconos:** de `lucide-solid`, uno por import (`lucide-solid/icons/check`), nunca desde la raíz del paquete. No se copian SVG (cambia la regla general). Lucide ya pone `aria-hidden`.

### Worker (`packages/review-worker/src`)

- Una carpeta por dominio, con `<nombre>.route.ts`, `<nombre>.queries.ts` y `<nombre>.utils.ts` según haga falta. Las rutas no escriben SQL.
- **Los guards que cubren un prefijo van en `index.ts`**, antes de montar las rutas (`/admin/*`, `/documents/:documentId/*`). Una ruta nueva queda protegida sin declarar nada. En Hono, un `.use` declarado en una feature también alcanza a lo que se monte después: ahí no se ve.
- Ruta de `/admin/*` que el agente deba usar: además, en la tabla ruta → permiso de `review-core`.
- Una herramienta nueva del manual va en `utcp/tools/<dominio>.tools.ts`.

## Capas

Las dependencias van en un solo sentido:

| Dónde | Capas |
|---|---|
| `apps/web` | `app → home, admin → document, deck → task → shared`. `deck` puede usar `task`; `document` y `deck` no se importan entre sí. |
| `review-worker` | `index → utcp, deck, task, review, space → document → access → shared` |
| `review-core` | `document`, `access`, `task → review, shared`. Entre `document`, `access` y `task`, nada. |

- Las hace cumplir Biome (`noRestrictedImports`, un override por carpeta en `biome.json`). Las pruebas de `web` y `review-core` están exentas.
- **Una carpeta nueva no queda cubierta sola:** agrega su override y súmala a las prohibiciones de las demás.
- La regla compara el texto del import: cubre `@/…` en `web` y el worker, y `../<carpeta>/…` en los paquetes. Un relativo más profundo se le escapa.

## Imports

- `@/` apunta a `src/` en `apps/web` y en `review-worker`. Los paquetes que otro consume como código fuente (`review-core`, `review-ui`) usan rutas relativas.

## Al mover o partir código

- **Sin cambiar comportamiento:** las pruebas existentes solo cambian en sus imports.
- Mover con `git mv` y un script que reescriba los imports. Revisar también lo que el compilador no ve: rutas dentro de pruebas (`new URL('./x.css', import.meta.url)`), las listas de `overrides` de `.stylelintrc.json` y los README.
- **Antes de mover un control de acceso o una validación, quítalo y confirma que una prueba falla.** Si ninguna falla, la prueba se escribe primero (pasó con la validación del id de documento).
- Si el resultado es un dato generado (el manual UTCP), compararlo byte a byte antes y después.
- Verificación: `npm run lint`, `npm run typecheck`, `npm test` y `npm run build`.
