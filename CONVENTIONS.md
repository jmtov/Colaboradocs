# Convenciones de este repo

La organización del código sigue las convenciones generales (`_code-conventions.md`: «Structure of a project» y «Mover o partir código»). Aquí va solo lo propio de este repo; si algo difiere, gana esto. Qué hace cada carpeta está en el README de cada app o paquete.

## Capas

Las dependencias van en un solo sentido:

| Dónde | Capas |
|---|---|
| `apps/web` | `app → home, admin → document, deck → task → shared`. `deck` puede usar `task`; `document` y `deck` no se importan entre sí. |
| `review-worker` | `index → utcp, deck, task, review, space → document → access → shared` |
| `review-core` | `document`, `access`, `task → review, shared`. Entre `document`, `access` y `task`, nada. |

Las hace cumplir Biome (un override por carpeta en `biome.json`). Las pruebas de `web` y `review-core` están exentas.

## Worker (`packages/review-worker/src`)

- Los guards de `/admin/*` y `/documents/:documentId/*` están en `index.ts`.
- Ruta de `/admin/*` que el agente deba usar: además, en la tabla ruta → permiso de `review-core`.
- Una herramienta nueva del manual va en `utcp/tools/<dominio>.tools.ts`.

## Imports

`@/` apunta a `src/` en `apps/web` y en `review-worker`. `review-core` y `review-ui` usan rutas relativas.

## Verificación

`npm run lint`, `npm run typecheck`, `npm test` y `npm run build`.
