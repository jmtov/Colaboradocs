# @juntanza/web

La página: Vite + Solid. Lee **un documento JSON** y lo monta sobre `@juntanza/review-ui`. Es la «app host»: aporta el contenido, el diseño y los tokens CSS (`src/index.css`).

## Qué documento se compila

Un solo documento por build. Se elige con `DOCUMENT` (variable de entorno o `apps/web/.env.local`, gitignored), por defecto `documents/example.json`. Vite lo expone como el alias `@document` (lo importa `src/App.tsx`) y toma de él el `<title>`. El tipado usa el de ejemplo (`tsconfig.json` → `paths`).

```
DOCUMENT=documents/mi-doc.json npm run build        # desde la raíz o con -w @juntanza/web
npm run convert -w @juntanza/web -- mi.md --id mi-doc > documents/mi-doc.json
```

`apps/web/documents/*` está en `.gitignore` salvo `example.json`: los documentos propios no se versionan por defecto (quita la regla si quieres versionar el tuyo).

## Formato del documento

Tipos en `src/content/content.types.ts`; ejemplo en `documents/example.json`; descripción campo por campo en el README de la raíz. Convenciones que el código **sí interpreta**:

- Sección con `id: "glosario"`: `<dl><dt><dd>`. Alimenta la hoja de definiciones; en esa sección no se enlazan términos.
- `glossaryTerms` (cómo aparece en el texto, minúsculas → entrada del glosario): los términos se enlazan **una vez por sección**; gana el más largo; no parte palabras.
- Primer párrafo que empieza con «Para qué sirve»: nota, no es revisable.
- `<em>[1, 2]</em>` = cita a `sources`; «sección N» se enlaza a la sección con `num` N.
- `<h3>` (y `<h4>`) entran al índice; un `<h3>` que empieza con «Pendientes» cuenta sus `<li>` como pendientes.
- `roleField` (opcional): `{ label, format }`, cómo se llama y se muestra el rol de cada persona en la pantalla de accesos. Ver `review-ui`.
- `html` solo admite `p, ul, ol, li, strong, em, br, h3, h4, dl, dt, dd`; lo demás se aplana a texto (`src/Prose/buildProse.ts`).

## Mapa de `src/`

| Carpeta | Qué es |
|---|---|
| `App.tsx`, `main.tsx` | Providers (`ReviewProvider` → `PinGate` → `DocumentPage`) y arranque. |
| `content/` | Tipos y utilidades del documento (pendientes, glosario, etiquetas de sección). |
| `Prose/` | `buildProse`: HTML limitado → DOM con clases, `data-block-id`, `data-outline-level`, enlaces de glosario/cita/sección. Es el punto donde se unen contenido y `review-ui`. |
| `DocumentPage/` | Pantalla principal: estado de la sección activa, métricas, hojas. |
| `Hero/`, `SectionCards/`, `ReviewSummary/` | Inicio: título, tarjetas, contadores. |
| `SectionView/`, `SideNav/`, `TopBar/`, `DocumentSheet/` | Lectura, navegación, índice y hojas (contenido, glosario, citas). |
| `ThemeSwitch/`, `UserMenu/` | Tema claro/oscuro/sistema (clave `review:theme`) y sesión. Para admins, el menú trae «Accesos» (`AccessSheet` de `review-ui`). |
| `index.css` | **Tokens de diseño** que exige `review-ui`. |

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
