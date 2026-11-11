# @colaboradocs/doc-import

Convierte archivos (Word, Markdown, JSON) a un documento válido. Corre en Node (CLI) y **en el navegador** (pantalla de subida de `apps/web`, que lo carga a demanda: `mammoth` pesa ~370 kB). Consumido como código fuente.

## API

`src/index.ts`:

| Export | Qué hace |
|---|---|
| `parseUpload(file, { id?, title? })` | Lee un `File`-like (`name`, `text()`, `arrayBuffer()`) .md, .docx o .json. Devuelve `{ ok: true, kind, document, warnings }` con el documento **ya validado y limpio** (`validateDocument` de `review-core`), o `{ ok: false, errors }`. Para .md y .docx el id sale del nombre del archivo. |
| `markdownToDocument(text, options)`, `docxToDocument(input, options)` | Los convertidores por separado. `docxToDocument` acepta `{ path }` (Node) o `{ arrayBuffer }` (ambos entornos). |
| `slugify`, `idFromFileName` | Ids a partir de texto. |
| `buildFormatGuide(exampleJson)` | La guía de formato en Markdown que se descarga desde la pantalla de subida: instrucciones para Claude, reglas del documento y el ejemplo embebido. Los límites y las etiquetas salen de `review-core`; una prueba comprueba que el ejemplo embebido valida. **Si cambias una regla del formato, cámbiala aquí también.** |

## Cómo se interpretan los archivos

- **Markdown:** `# Título` (opcional), un `## Sección` por sección, `### Grupo`. Lo que va antes del primer `##` se descarta.
- **Word:** estilos «Título 1» (título), «Título 2» (secciones), «Título 3» (grupos). Sin «Título 2», cada «Título 1» es una sección (y el título hay que darlo aparte). Las tablas pasan a un párrafo por fila (celdas separadas por « · ») y las imágenes se quitan; ambos casos devuelven un aviso. Sin títulos reales (negrita a mano), no hay secciones y el aviso explica qué hacer.
- **JSON:** se valida tal cual.
- Los ids de sección salen del título (máx. 60 caracteres, únicos). Todo estado queda como `borrador`; el glosario, las fuentes, `description`, etc. se completan en el JSON.

## CLI

```
npm run convert -w @colaboradocs/doc-import -- documento.docx --id mi-doc [--title "…"] [--version 0.1] > documents/mi-doc.json
```
Los avisos salen por stderr; el JSON, por stdout.

## Reglas

- **Sin DOM:** el HTML de Word se procesa con expresiones regulares, para que corra igual en Node y en el navegador. Si un caso nuevo lo exige, agrega una prueba con un `.docx` en `src/fixtures/`.
- Todo lo que sale pasa por `sanitizeSectionHtml`: solo etiquetas que entiende la página.

## Probar

```
npm test -w @colaboradocs/doc-import
```
