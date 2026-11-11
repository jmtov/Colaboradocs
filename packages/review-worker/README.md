# @colaboradocs/review-worker

API de revisión en un Cloudflare Worker (Hono) con D1. Genérica: todo cuelga de un `documentId`. En producción el mismo Worker sirve también la página compilada (`apps/web/dist`) como assets; solo `/api/*` pasa por el código.

## Mapa

| Ruta | Qué hace |
|---|---|
| `src/index.ts` | App Hono con `basePath('/api')`; monta `loginRoute` y `reviewRoute`. |
| `src/routes/login.route.ts` | `POST /api/login` |
| `src/routes/admin.route.ts` | `/api/admin/*`, solo admins: accesos, documentos y espacio (abajo). |
| `src/routes/space.route.ts` | `GET /api/space`, público. |
| `src/routes/review.route.ts` | Rutas de documento (abajo). Todas exigen sesión. |
| `src/auth/` | `requireReviewer` (middleware), tokens firmados (`token.utils.ts`), constantes (TTL 30 días, 10 fallos/15 min por IP). |
| `src/db/*.queries.ts` | Todo el SQL. Las rutas no escriben SQL. |
| `migrations/` | Esquema D1. Una migración nueva por cambio; nunca se edita una ya aplicada. |
| `scripts/pins.ts` | CLI de PIN (`npm run pins -- …`). |
| `scripts/documents.ts` | CLI de documentos y espacio (`npm run documents -- import|list|space`). Parte el contenido en trozos por el límite de ~100 KB por sentencia de D1. |
| `scripts/setup.ts` | Montaje inicial en Cloudflare (`npm run setup -- <nombre>`). |
| `wrangler.example.jsonc` | Plantilla. `wrangler.jsonc` (gitignored) es la config real de cada despliegue. |
| `test/` | Pruebas en `workerd` real con D1 local. |

## API

Errores: `{ "error": <ApiErrorCode> }` (ver `review-core`), con el HTTP de `src/http.utils.ts`. Auth: `Authorization: Bearer <token>`.

| Método y ruta | Cuerpo → respuesta |
|---|---|
| `POST /api/login` | `{ pin, deviceId }` → `{ token, reviewer }`. `deviceId` = `/^[A-Za-z0-9-]{16,64}$/`. Errores: `invalid_pin`, `device_limit`, `too_many_attempts`. |
| `GET /api/space` | **Público.** → `SpaceInfo` (`name`, `description?`, `roleField?`): la puerta del PIN lo muestra. |
| `GET /api/documents` | → `DocumentListItem[]`: documentos no archivados, con `openThreads`, `comments`, `approvals` y `lastActivityAt`. Alimenta la home. |
| `GET /api/documents/:doc/content` | → `DocumentContent`. Exige sesión: el texto no es público. `404` si no existe o está archivado. |
| `GET /api/documents/:doc/versions` | → `DocumentVersionItem[]`: la versión actual primero (`current: true`, cuándo y quién la publicó) y luego las reemplazadas, la más reciente antes (cuándo y quién las reemplazó). Sale de `document_versions`. `404` si no existe o está archivado. |
| `GET /api/documents/:doc/review` | → `ReviewSnapshot` (`me`, `comments`, `approvals`, `reviewers`). |
| `POST /api/documents/:doc/comments` | `{ blockId, parentId\|null, text, blockExcerpt }` → `201` comentario. Si hay `parentId`, tiene que ser del mismo bloque. |
| `DELETE /api/documents/:doc/comments/:id` | `204`. Borrado suave (`text = null`). Solo el autor o un admin. |
| `PUT /api/documents/:doc/comments/:id/resolved` | `{ resolved: boolean }` → `204`. Solo en comentarios raíz; autor o admin. |
| `PUT /api/documents/:doc/approvals/:blockId` | `204`. Idempotente (OK del revisor en sesión). |
| `DELETE /api/documents/:doc/approvals/:blockId` | `204`. |

### Documentos y espacio (solo admins)

| Método y ruta | Qué hace |
|---|---|
| `PUT /api/admin/documents/:id` | Cuerpo: el documento completo. Se valida y se limpia con `validateDocument` (de `review-core`); `400 { error, details[] }` si no sirve. `201` si es nuevo, `200` si reemplaza: lo anterior pasa a `document_versions`. Reactiva uno archivado. El id de la ruta tiene que coincidir con el del cuerpo. |
| `DELETE /api/admin/documents/:id` | Archiva (`archived_at`): se oculta, **no se borran sus comentarios**. `204`, o `404` si no está visible. |
| `PUT /api/admin/space` | `SpaceInfo`. Se valida con `validateSpace`. |

### Borrador y publicación (solo admins)

Un borrador por documento, compartido por los admins; los revisores no lo ven. Guarda el `DocumentContent` completo, validado y limpio como al subirlo. Publicar lo convierte en la versión vigente (la anterior pasa a `document_versions`) y borra el borrador.

| Método y ruta | Cuerpo → respuesta |
|---|---|
| `GET /api/admin/documents/:id/draft` | → `DocumentDraft` (`content`, `revision`, `updatedAt`, `updatedBy`, `baseUpdatedAt`, `stale`). `404` si no hay. |
| `PUT /api/admin/documents/:id/draft` | `{ content, expectedRevision }` → `DraftInfo` (lo mismo sin `content`). Valida con `validateDocument`; el id del contenido tiene que ser el de la ruta. `expectedRevision` = la `revision` que quien guarda tiene delante (`0` = cree que no hay borrador). Si no coincide, `409 conflict` y no se pisa nada. Sirve también para un documento que todavía no existe. |
| `DELETE /api/admin/documents/:id/draft` | `204`, o `404` si no había. Lo publicado no se toca. |
| `POST /api/admin/documents/:id/publish` | `{ expectedRevision, force? }` → `{ created }` (`201` si el documento era nuevo, `200` si reemplaza). `404` sin borrador, `409 conflict` si la revisión no coincide, `409 draft_stale` si el documento publicado cambió desde que se creó el borrador (salvo `force: true`). |

- **`stale`:** `baseUpdatedAt` es el `updated_at` del documento publicado cuando se creó el borrador (`null` si no existía). Si hoy es distinto, alguien lo reemplazó por otro camino (p. ej. «Subir documento»). Se detecta desde el primer guardado, no desde que se abrió el editor.
- **Atomicidad:** guardar es un solo `UPDATE ... WHERE revision = ?`, así que dos guardados a la vez no se pisan. Publicar lee, guarda el documento y borra el borrador **solo si sigue en la revisión publicada**: si alguien guardó en medio, su borrador queda (y aparece como viejo).

### Accesos (solo admins)

`requireReviewer` + `requireAdmin` (403 si no es admin). Las reglas se validan aquí, no en la UI.

| Método y ruta | Qué hace |
|---|---|
| `GET /api/admin/reviewers` | Lista (sin eliminadas): `ManagedReviewer[]`, con `locked` calculado para quien consulta. |
| `POST /api/admin/reviewers` | `{ name, municipality, isAdmin }` → `201 { reviewer, pin }`. Nombre y rol obligatorios. `409 name_taken` si ya existe activa; si fue eliminada, se **reactiva** a la misma persona con PIN nuevo. |
| `PATCH /api/admin/reviewers/:id` | `{ municipality?, isAdmin? }` → `204`. Cambiar el rol vale para cualquiera; cambiar `isAdmin` de alguien bloqueado → `403`. |
| `DELETE /api/admin/reviewers/:id` | `204`. Borrado suave (`revoked_at`): sus comentarios se conservan. |
| `POST /api/admin/reviewers/:id/pin` | Regenera el PIN → `{ reviewer, pin }`. El anterior deja de servir y se sueltan los dispositivos. |
| `POST /api/admin/reviewers/:id/devices/reset` | `204`. |

**Quién está bloqueado** (`lockedReviewerIds` en `review-core`): no se puede quitar el acceso, cambiar el nivel, regenerar el PIN ni restablecer dispositivos de uno mismo, de quien te hizo admin (y toda esa cadena), ni de un admin creado por CLI (`promoted_by` nulo). Así siempre queda un admin con acceso. Al quitar el admin a alguien o eliminarlo, quienes ella hizo admin pasan a depender de quien la hizo a ella.

El PIN no se puede volver a ver: solo se guarda el HMAC. Para entregar uno hay que crear o regenerar.

## Datos y auth (lo no obvio)

- Tablas: `reviewers`, `devices`, `login_failures`, `comments`, `approvals`, `documents`, `document_versions`, `document_drafts`, `settings`. `comments` y `approvals` apuntan a un `document_id` **sin clave foránea**: sobreviven si el documento se archiva o se reemplaza; **los revisores son globales** (un PIN sirve en todos los documentos del despliegue).
- El PIN no se guarda: solo `HMAC(TOKEN_SECRET, pin)`. Cambiar `TOKEN_SECRET` invalida todos los PIN.
- Cada petición vuelve a verificar en D1 que el revisor no esté revocado y que el dispositivo siga registrado: revocar o resetear corta el acceso al instante, aunque el token no haya vencido.
- `reviewers.promoted_by` (migración 0003): quién hizo admin a cada persona; define la cadena de bloqueo. Los admins creados por CLI quedan en `NULL` y solo se gestionan por CLI.
- La columna `reviewers.municipality` es un rótulo de grupo opcional (nombre histórico; se muestra junto al nombre).
- No hay tiempo real: la UI sondea cada 30 s.

- `documents.content` es el JSON completo del documento (máx. ~1 MB, límite de fila de D1). `document_versions` conserva el contenido anterior cada vez que se reemplaza; todavía no hay pantalla para restaurarlo (se puede leer con SQL).
- `document_drafts` (migración 0005): un borrador por documento, sin clave foránea (puede existir antes que el documento). `revision` cuenta los guardados.
- `settings` es clave/valor; hoy solo existe `space`.

## Cómo extender

- **Ruta nueva:** agrégala en `review.route.ts` (queda detrás de `requireReviewer` y de la validación de `documentId`), el SQL en `db/*.queries.ts`, el tipo de la respuesta en `review-core`, y una prueba en `test/`.
- **Cambio de esquema:** `migrations/000N_descripcion.sql`; aplicar con `wrangler d1 migrations apply <base> --remote` **antes** de desplegar. Las pruebas aplican las migraciones solas (`test/apply-migrations.ts`).
- Secretos: `TOKEN_SECRET` (`.dev.vars` local, `.prod.vars` para el CLI contra producción, `wrangler secret put` en el Worker). Nunca al repo.

## Comandos

```
npm test -w @colaboradocs/review-worker
npm run dev:api                                  # wrangler dev en :8800 (desde la raíz)
npm run pins -w @colaboradocs/review-worker -- add "Ana" --admin [--remote]   # también reissue, reset-devices, set-devices, revoke, list, import
npm run deploy -w @colaboradocs/review-worker        # compila la página antes (npm run build en la raíz)
```

El CLI de PIN lee el nombre de la base desde `wrangler.jsonc` y deja los PIN en claro en `pins.private*` (gitignored); hay que mandarlos y borrarlos.
