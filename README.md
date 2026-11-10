# Colaboradocs

Revisión de un documento por un equipo: acceso con PIN, comentarios por bloque con respuestas y OK por bloque. Un solo Worker de Cloudflare (API + D1) sirve la página. Pensado para borradores internos que un grupo revisa desde el celular.

Nació para revisar los «Principios de la Juntanza del Oriente»; cualquier documento con secciones sirve.

> **Para agentes y contribuciones:** cada módulo tiene su README con mapa, contrato y reglas → [`review-core`](packages/review-core/README.md) · [`review-worker`](packages/review-worker/README.md) · [`review-ui`](packages/review-ui/README.md) · [`doc-import`](packages/doc-import/README.md) · [`web`](apps/web/README.md).

## Estructura

| Carpeta | Qué es |
|---|---|
| `packages/review-core` | TypeScript puro, sin dependencias: tipos del API y del documento, **validación y limpieza de documentos**, ids estables de bloque, hilos, OK y PIN. Con tests. |
| `packages/review-worker` | API en Cloudflare Worker (Hono) + D1: login por PIN, **documentos**, comentarios, OK, accesos. También sirve la página estática. CLI de PIN y de documentos. |
| `packages/review-ui` | Componentes Solid reusables: `ReviewProvider`, `PinGate`, `BlockLayer`, `AccessSheet`, `BottomSheet`, y el estado (sesión, documentos, accesos). El contenido solo tiene que marcar sus bloques con `data-block-id` (ver `assignBlockIds` en `review-core`). |
| `packages/doc-import` | Convierte Word (.docx), Markdown y JSON a un documento válido. Lo usan el CLI y la pantalla de subida (en el navegador). |
| `apps/web` | La página (Vite + Solid): home, documentos y pantallas de administración. **No trae documentos**: los pide a la API. |
| `documents/` | Documentos de ejemplo/origen para importar por CLI. El de ejemplo se versiona; los propios no (están en `.gitignore`). |

## Cómo funciona

Los documentos, comentarios, OK y personas viven en **D1**. El Worker no guarda archivos y la página tampoco: pide el contenido a la API **después** de ingresar el PIN, así que el texto no es público.

- `/` es la home (una tarjeta por documento) y `/d/<id>` abre uno. Con un solo documento, `/` redirige a él.
- Un admin sube documentos desde el menú ⋮ → «Documentos» (Word, Markdown o JSON), con vista previa y avisos de lo que no se pudo conservar. Reemplazar un documento guarda la versión anterior; «archivar» lo oculta sin borrar sus comentarios.

## Montar tu propia copia

Necesitas Node 20+ y una cuenta de Cloudflare (el plan gratuito alcanza).

```
npm install
npx wrangler login
npm run setup -w @juntanza/review-worker -- mi-revision
```

`setup` crea la base D1, escribe `packages/review-worker/wrangler.jsonc` (no se versiona), aplica migraciones, compila, despliega, sube un `TOKEN_SECRET` nuevo (queda en `packages/review-worker/.prod.vars`) y carga el documento de ejemplo. **Respalda `.prod.vars` fuera del repo:** sin él no se pueden crear PIN válidos (si se pierde: generar otro, `secret put` y `reissue` de cada persona).

Luego:

1. **Tu primer admin** (por CLI; los demás se crean desde la app):
   `npm run pins -w @juntanza/review-worker -- add "Tu nombre" --admin --municipality="Tu rol" --remote`
2. Entra a la URL `*.workers.dev` que imprimió el deploy y pega el PIN. Un `workers.dev` nuevo tarda unos minutos en tener certificado TLS.
3. **Sube tus documentos** desde el menú ⋮ → «Documentos». O por CLI: `npm run documents -w @juntanza/review-worker -- import documents/mi-doc.json --remote`.
4. **Nombre del espacio y rol** (ver «El espacio»).

Para actualizar la app (no los documentos): `npm run build && npm run deploy -w @juntanza/review-worker`. Cambios de esquema: agregar `migrations/000N_*.sql` y `npx wrangler d1 migrations apply <base> --remote` **antes** del deploy.

## Documentos

Un documento es un JSON (ver `documents/example.json` y los tipos en `packages/review-core/src/document.types.ts`). Puedes escribirlo a mano o generarlo desde un archivo:

- **Word (.docx):** estilos «Título 1» (título), «Título 2» (secciones) y «Título 3» (grupos). Si no hay «Título 2», cada «Título 1» es una sección. Las tablas pasan a un párrafo por fila y las imágenes se quitan.
- **Markdown:** `# Título`, un `## Sección` por sección, `### Grupo`, párrafos, listas, **negrita** y *cursiva*.
- **JSON:** el documento completo, con todo lo avanzado (glosario, fuentes, estados).

Por CLI: `npm run convert -w @juntanza/doc-import -- mi.docx --id mi-doc > documents/mi-doc.json`. Todo lo que se sube se valida y se limpia (solo quedan las etiquetas HTML que entiende la página).

Campos del JSON:

- `id` (obligatorio): va en la URL (`/d/<id>`) y es la clave de sus comentarios. **Cambiarlo empieza de cero** (sin comentarios ni OK) y rompe los enlaces. Solo minúsculas, números y guiones.
- `title`, `version`, `updated`: obligatorios. `description` (tarjeta de la home), `shortName`, `eyebrow` (`{version}` se reemplaza) y `lead`: opcionales.
- `highlightSection`: segundo botón del inicio que salta a una sección (opcional).
- `sources`: lista del pie. `url` vacío = solo texto; si no, tiene que empezar con `https://`, `http://` o `/`.
- `sections[]`: `id`, `num` («1», «2»… o «A» para anexos), `title`, `status` (`listo | borrador | pendiente`), `description` y `html`.
- `html` admite `p, ul, ol, li, strong, em, br, h3, h4, h5, dl, dt, dd`. Convenciones:
  - Un primer párrafo que empieza con **«Para qué sirve»** es una nota: no se comenta.
  - Un `<em>` que empieza con `[` (p. ej. `[2, 3]`) es una cita a `sources`.
  - Un `<h3>` que empieza con «Pendientes» cuenta sus viñetas como pendientes.
  - «sección N» en el texto se enlaza a la sección con `num` N.
- Glosario: una sección con `id: "glosario"` hecha de `<dl><dt>Término</dt><dd>Definición</dd></dl>`, más `glossaryTerms` (cómo aparece el término en el texto, en minúsculas → entrada) para que se enlace.
- Límites: hasta 200 secciones y ~1 MB por documento.
- El texto está en español. Los textos fijos de la interfaz están en los componentes de `apps/web/src` y `packages/review-ui/src`.

## El espacio

Nombre y descripción de la home, y cómo se llama el rol de cada persona (en la base es `municipality`). Se cambian por CLI (la pantalla de edición viene después):

```
npm run documents -w @juntanza/review-worker -- space --name "Mi equipo" --role-label "Municipio" --role-format "Representante {value}" [--remote]
```

`--role-format` solo cambia cómo se **muestra** el rol en la lista de accesos; el valor guardado es «La Ceja». Sin configurar: el campo se llama «Rol» y se muestra tal cual.

## Qué va a git y qué no

Un solo repo y un solo código para todos los despliegues. **Lo único que no va a git es la data** de cada uno:

| Va a git | No va a git (está en `.gitignore`) |
|---|---|
| El código, las migraciones, las pruebas | `documents/*` (tus documentos en JSON; `documents/example.json` sí va) |
| `documents/example.json` y la plantilla `wrangler.example.jsonc` | `apps/web/public/documentos/` (los archivos que tus documentos enlazan como fuentes) |
| | `docs/` (planes y notas de tu despliegue) |
| | `packages/review-worker/wrangler.jsonc`, `.dev.vars`, `.prod.vars` (tu configuración y secretos) |
| | `packages/review-worker/backups/` y `pins.private*` (respaldos de la base y PIN en claro) |

Los documentos viven en la base de datos (D1); los JSON de `documents/` solo sirven para importarlos por CLI, y se pueden volver a exportar de la base. Lo que **no** se puede reconstruir desde el repo es la base: respáldala (`wrangler d1 export <base> --remote --output packages/review-worker/backups/…`) y guarda esa carpeta fuera del repo.

## Correr y probar

```
npm install
npm test            # core + worker (corre en workerd real, con D1 local) + web
npm run typecheck
npm run lint
```

Todo en local, sin cuenta de Cloudflare:

```
cp packages/review-worker/wrangler.example.jsonc packages/review-worker/wrangler.jsonc   # una vez; el database_id puede quedar así en local
echo "TOKEN_SECRET=$(openssl rand -hex 32)" > packages/review-worker/.dev.vars   # una vez
cd packages/review-worker && npx wrangler d1 migrations apply doc-review --local   # una vez
npm run pins -- add "Ana" "Luis" --admin      # imprime los PIN (desde packages/review-worker)
npm run documents -- import ../../documents/example.json   # un documento para empezar
cd ../.. && npm run build                     # compila la página a apps/web/dist
npx wrangler dev --ip 0.0.0.0 --port 8800     # (en packages/review-worker) API + página en http://localhost:8800
```

Con recarga en caliente: `npm run dev` levanta los dos (Ctrl+C los cierra) → http://localhost:5180. También puedes correrlos por separado: `npm run dev:api` y `npm run dev:web` (también por IP de la red, para el celular). Si `wrangler dev` corre en otro puerto: `API_ORIGIN=http://localhost:PUERTO npm run dev:web`.

## PIN y acceso

- Un PIN por persona, 8 caracteres (`K7Q2-M9XP`). En la base se guarda solo un HMAC con `TOKEN_SECRET`.
- `POST /api/login` canjea PIN + id de dispositivo por un token firmado (30 días). El front lo guarda en localStorage.
- Cada PIN sirve en un máximo de 2 dispositivos (`--max-devices=N` para cambiarlo). Compartir el PIN con otra persona consume un cupo; el tercer dispositivo recibe `device_limit`.
- Revocar un PIN o resetear sus dispositivos corta el acceso al instante: cada petición verifica en D1.
- Máximo 10 PIN fallidos por IP cada 15 minutos.
- **Barrera suave, no seguridad real.** Alcanza para un documento de revisión interna; no pongas nada sensible.

Operaciones (con `--remote` actúan sobre producción):

```
npm run pins -- add "Nombre" [--admin] [--max-devices=3]
npm run pins -- reissue "Nombre"        # PIN nuevo + resetea dispositivos
npm run pins -- reset-devices "Nombre"  # cambió de celular
npm run pins -- revoke "Nombre"
npm run pins -- list
```

Los PIN en claro quedan en `packages/review-worker/pins.private.txt` (gitignored). Se mandan por WhatsApp uno a uno.

## Decisiones

- **Un solo Worker** sirve la página y la API: sin CORS, un solo deploy.
- **Ids de bloque = sección + hash del texto.** Si se edita un párrafo, sus comentarios y OK dejan de aplicar (a propósito). Cada comentario guarda un extracto del bloque para reconocer los huérfanos.
- **Borrado suave:** un comentario borrado queda con texto `null` para no romper el hilo.
- **Imports relativos en `packages/*`:** el alias `@/` rompe cuando otro paquete consume el código fuente. En las apps sí se usa `@/`.
- `@cloudflare/vitest-pool-workers` está deprecado; se usa `@cloudflare/vitest-plugin`.

## Licencia

Apache-2.0, ver [`LICENSE`](LICENSE).
