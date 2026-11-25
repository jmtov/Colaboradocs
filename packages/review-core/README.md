# @colaboradocs/review-core

Tipos y lógica pura compartidos por el Worker y la UI. TypeScript sin dependencias, sin DOM ni Cloudflare: corre en navegador, Worker y Node. Todo se exporta desde `src/index.ts`.

## Qué hay
Por dominio: `review/` (comentarios, OK, bloques, hilos, menciones; es la base), `access/` (personas, PIN, permisos), `document/` (el formato del documento), `task/` (tareas) y `shared/` (lo que usan varios, como `date.utils.ts`). Las capas van en un sentido: `document`, `access` y `task` pueden apoyarse en `review` y en `shared`, pero no entre sí; Biome lo hace cumplir (`noRestrictedImports`, `biome.json`).


| Archivo | Exporta | Para qué |
|---|---|---|
| `review/review.types.ts` | `Reviewer`, `ReviewComment`, `BlockApproval`, `ReviewSnapshot`, `LoginRequest/Response`, `NewComment`, `ApiError`, `ApiErrorCode` | **El contrato del API.** Worker y UI lo importan; si cambias la forma de una respuesta, cámbiala aquí primero. |
| `review/review.constants.ts` | `MAX_COMMENT_LENGTH` (2000), `EXCERPT_LENGTH` (80) | Límites de comentarios, compartidos por cliente y servidor. Los de cada dominio están en su carpeta: `access/access.constants.ts` (nombre, rol, PIN, dispositivos), `document/document.constants.ts` y `task/task.constants.ts`. |
| `review/blocks.utils.ts` | `assignBlockIds(blocks)`, `excerptOf`, `hashText`, `normalizeBlockText` | Id estable de cada bloque: `<sección>-<hash del texto>` (+ `-2`, `-3` si el texto se repite en la sección). Devuelve `null` para bloques sin texto. |
| `review/threads.utils.ts` | `groupThreads(comments)` → `Map<blockId, Thread[]>`, `openThreadCount` | Agrupa comentarios en hilos (raíz + respuestas en una sola capa). |
| `review/approvals.utils.ts` | `groupApprovals`, `fullyApprovedBlocks` | OK por bloque. |
| `access/pin.utils.ts` | `generatePin`, `formatPin`, `normalizePin`, `isValidPin`, `hashPin(pin, secret)` | PIN de 8 caracteres sin ambiguos (`K7Q2-M9XP`). `hashPin` es un HMAC-SHA256 con `TOKEN_SECRET`. |
| `document/document.types.ts`, `document/document.utils.ts` | `DocumentContent`, `SpaceInfo`, `DocumentListItem`… y `validateDocument`, `validateSpace`, `sanitizeSectionHtml` | **El formato del documento y su validación.** Los usan el Worker (al guardar) y `doc-import` (vista previa en el navegador): nada entra a la base sin pasar por aquí. Deja solo los campos conocidos, limpia el HTML y revisa ids, tamaños y URLs. |
| `document/document.types.ts` (borrador) | `DraftInfo`, `DocumentDraft`, `DraftSave`, `DraftPublish` | Contrato de `/api/admin/documents/:id/draft` y `/publish`. El borrador es un `DocumentContent` más `revision` para detectar guardados cruzados. |
| `access/access.utils.ts` | `lockedReviewerIds(people, callerId)` | Ids sobre los que una persona **no puede actuar** en la pantalla de accesos: ella misma, la cadena de quienes la hicieron admin y los admins creados por CLI. Es la regla que valida el Worker. |
| `access/reviewers.utils.ts` | `formatReviewerLabel` | «Nombre · grupo» para mostrar quién comentó. |

## Reglas que no hay que romper

- **El id del bloque depende del texto, a propósito.** Si se edita un párrafo, sus comentarios y OK dejan de aplicar. Cada comentario guarda un `blockExcerpt` para reconocer los huérfanos. No «arregles» esto con ids posicionales.
- `assignBlockIds` debe recibir los bloques **en orden de documento** y el mismo `sectionId` siempre; el orden decide el sufijo de los repetidos.
- Ids válidos para el servidor: `/^[a-z0-9-]{1,100}$/`. El `documentId`: `/^[a-z0-9-]{1,64}$/`.
- **Home:** `DocumentListItem` es lo que devuelve `GET /api/documents` (datos del documento + actividad).
- **Accesos:** `ManagedReviewer`, `NewReviewer`, `ReviewerPatch` e `IssuedPin` son el contrato de `/api/admin/*`. El PIN solo viaja en `IssuedPin`, una vez.
- Un comentario borrado queda con `text: null` (para no romper el hilo). Cualquier UI nueva tiene que tolerarlo.
- **Imports relativos dentro de `src/`** (`./x`, no `@/x`): el alias `@/` rompe cuando otro paquete consume el código fuente.

## Probar

```
npm test -w @colaboradocs/review-core
```
