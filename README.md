# Colaboradocs

Revisión de un documento por un equipo: acceso con PIN, comentarios por bloque con respuestas y OK por bloque. Un solo Worker de Cloudflare (API + D1) sirve la página. Pensado para borradores internos que un grupo revisa desde el celular.

Nació para revisar los «Principios de la Juntanza del Oriente»; cualquier documento con secciones sirve.

## Estructura

| Carpeta | Qué es |
|---|---|
| `packages/review-core` | TypeScript puro, sin dependencias: ids estables de bloque, hilos, OK, PIN y tipos compartidos. Con tests. |
| `packages/review-worker` | API en Cloudflare Worker (Hono) + D1. Login por PIN, comentarios, respuestas, OK. Genérico por `documentId`. También sirve la página estática. |
| `packages/review-ui` | Componentes Solid reusables: `ReviewProvider`, `PinGate`, `BlockLayer` (tocar un bloque → Comentar / OK, insignias, hilos) y `BottomSheet`. El contenido solo tiene que marcar sus bloques con `data-block-id` (ver `assignBlockIds` en `review-core`) y los elementos no seleccionables con `data-interactive`. La app define los tokens CSS que usan (`--bg`, `--fg`, `--muted`, `--line-strong`, `--ok`, `--ok-bg`, `--warn`, `--font-mono`, `--font-size-xs…lg`, `--z-fixed`). |
| `apps/web` | La página (Vite + Solid): lee **un documento JSON** y monta `review-ui`. Los documentos viven en `apps/web/documents/`. |

> **Para agentes y contribuciones:** cada módulo tiene su README con mapa, contrato y reglas → [`review-core`](packages/review-core/README.md) · [`review-worker`](packages/review-worker/README.md) · [`review-ui`](packages/review-ui/README.md) · [`web`](apps/web/README.md).

## Montar tu propia copia

Necesitas Node 20+ y una cuenta de Cloudflare (el plan gratuito alcanza).

```
npm install
npx wrangler login
```

**1. Tu documento.** Parte de `apps/web/documents/example.json` o conviértelo desde Markdown:

```
npm run convert -w @juntanza/web -- mi-doc.md --id mi-doc --title "Mi documento" > apps/web/documents/mi-doc.json
```

El Markdown usa `# Título`, un `## Sección` por sección, `### Grupo` dentro de cada una, párrafos, listas, **negrita** y *cursiva*. Después edita el JSON a mano (ver «Formato del documento»). Para compilar ese documento en vez del de ejemplo:

```
echo "DOCUMENT=documents/mi-doc.json" > apps/web/.env.local
```

**2. Cloudflare (una vez).**

```
npm run setup -w @juntanza/review-worker -- mi-revision
```

Crea la base D1, escribe `packages/review-worker/wrangler.jsonc` (no se versiona), aplica migraciones, compila, despliega y sube un `TOKEN_SECRET` nuevo, que queda en `packages/review-worker/.prod.vars`. **Respalda ese archivo fuera del repo:** sin él no se pueden crear PIN válidos (si se pierde: generar otro, `secret put` y `reissue` de cada persona).

**3. PIN.** Hay dos formas. El primer admin se crea por CLI; después, los admins gestionan personas desde la app (menú ⋮ → «Accesos»): agregar, dar o quitar admin, regenerar PIN, restablecer dispositivos, eliminar. Un admin no puede tocarse a sí mismo ni a quien lo hizo admin; los creados por CLI solo se gestionan por CLI. El PIN solo se ve al crearlo o regenerarlo. Desde `packages/review-worker`, o con `-w @juntanza/review-worker`:

```
npm run pins -w @juntanza/review-worker -- add "Tu nombre" --admin --remote
```

Entra a la URL `*.workers.dev` que imprimió el deploy y pega el PIN. Un `workers.dev` nuevo tarda unos minutos en tener certificado TLS.

**4. Actualizar.** Cambias el JSON, y:

```
npm run build && npm run deploy -w @juntanza/review-worker
```

Cambios de esquema: agregar `migrations/000N_*.sql` y `npx wrangler d1 migrations apply <base> --remote` **antes** del deploy.

## Formato del documento

Ver `apps/web/documents/example.json` y los tipos en `apps/web/src/content/content.types.ts`.

- `id`: identifica el documento en la base. **Cambiarlo empieza de cero** (sin comentarios ni OK).
- `title`, `shortName`, `eyebrow` (`{version}` se reemplaza), `lead`, `version`, `updated`: textos del inicio y del pie.
- `highlightSection`: segundo botón del inicio que salta a una sección (opcional).
- `sources`: lista del pie. `url` vacío = solo texto; los archivos locales van en `apps/web/public/`.
- `sections[]`: `id`, `num` («1», «2»… o «A» para anexos), `title`, `status` (`listo | borrador | pendiente`), `description` (tarjeta del inicio) y `html`.
- `html` admite `p, ul, ol, li, strong, em, br, h3, h4, dl, dt, dd`. Convenciones:
  - Un primer párrafo que empieza con **«Para qué sirve»** es una nota: no se comenta.
  - Un `<em>` que empieza con `[` (p. ej. `[2, 3]`) es una cita a `sources`.
  - Un `<h3>` que empieza con «Pendientes» cuenta sus viñetas como pendientes.
  - «sección N» en el texto se enlaza a la sección.
- Glosario: una sección con `id: "glosario"` hecha de `<dl><dt>Término</dt><dd>Definición</dd></dl>`, más `glossaryTerms` (cómo aparece el término en el texto, en minúsculas → entrada) para que se enlace.
- El texto está en español. Los textos fijos de la interfaz están en los componentes de `apps/web/src` y `packages/review-ui/src`.
- `roleField` (opcional): `{ "label": "Municipio", "format": "Representante {value}" }`. Nombra el rol de cada persona (en la base es `municipality`) y cómo se muestra en la pantalla de accesos. Úsalo para equipo, área u organización.

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
