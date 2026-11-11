import {
  ALLOWED_HTML_TAGS,
  MAX_DOCUMENT_BYTES,
  MAX_SECTION_HTML_LENGTH,
  MAX_SECTIONS,
} from '@colaboradocs/review-core';

const tags = ALLOWED_HTML_TAGS.map((tag) => `\`${tag}\``).join(', ');

/**
 * La guía de formato que se descarga desde la pantalla de subida: está
 * pensada para adjuntarla a una conversación con Claude (u otro asistente)
 * junto con el documento propio y pedirle que lo convierta. Los límites salen
 * de las mismas constantes que usa la validación, para que no se desfasen.
 * `exampleJson` es el contenido de `documents/example.json`.
 */
export function buildFormatGuide(exampleJson: string): string {
  return `# Formato de documento para Colaboradocs

> **Para Claude:** la persona que te adjunta este archivo quiere subir su documento a Colaboradocs, una página donde un equipo revisa un documento por secciones. La página solo acepta el formato JSON de abajo. Convierte el documento que te adjunte a ese formato.
>
> - Devuelve **un solo bloque de código JSON** que se pueda guardar tal cual como \`.json\`, y después, aparte, una lista corta de lo que no pudiste conservar o de lo que decidiste.
> - Conserva el texto original. No resumas, no reescribas y no inventes contenido.
> - Si falta un dato obligatorio (título, versión), pregúntalo antes de inventarlo.
> - Revisa tu JSON contra las reglas de abajo antes de entregarlo: si una regla se rompe, la página lo rechaza.

## Cómo se subirá

La persona guarda tu respuesta como \`.json\`, abre la página, entra a «Documentos», pulsa «Subir documento» y arrastra el archivo. La página muestra una vista previa y avisos antes de publicar.

## Estructura

Un objeto JSON con estos campos.

**Obligatorios**

- \`id\`: va en la URL (\`/d/<id>\`). Solo minúsculas, números y guiones (máx. 64). Ejemplo: \`reglamento-interno\`.
- \`title\`: título del documento (máx. 200).
- \`version\`: texto libre, p. ej. \`0.1\` (máx. 40).
- \`updated\`: fecha de la versión como texto, p. ej. \`2026-03-15\` (máx. 40).
- \`sections\`: lista de secciones (al menos una, hasta ${MAX_SECTIONS}).

**Opcionales**

- \`description\`: una o dos líneas para la tarjeta de la home (máx. 500).
- \`shortName\`: nombre corto para el encabezado (máx. 80). Por defecto, el título.
- \`eyebrow\`: línea sobre el título del inicio (máx. 200). \`{version}\` se reemplaza por la versión.
- \`lead\`: párrafo bajo el título del inicio (máx. 600).
- \`highlightSection\`: \`{ "id": "<id de una sección>", "label": "Texto del botón" }\`. Segundo botón del inicio que salta a una sección; el id tiene que existir.
- \`sources\`: lista de fuentes del pie, cada una \`{ "label": "…", "url": "…" }\` (hasta 100; \`label\` máx. 300). Con \`url\` vacío (\`""\`) es solo texto; si no, tiene que empezar con \`https://\`, \`http://\` o \`/\`.
- \`glossaryTerms\`: objeto \`{ "cómo aparece el término en el texto, en minúsculas": "Término tal como está en el glosario" }\` (hasta 500). Sirve para que esas palabras se enlacen solas con su definición.

**Cada sección** (\`sections[]\`)

- \`id\`: único en el documento; minúsculas, números y guiones (máx. 60).
- \`num\`: «1», «2»… para las secciones y «A», «B»… para los anexos (máx. 10).
- \`title\`: título de la sección (máx. 200).
- \`status\`: \`listo\`, \`borrador\` o \`pendiente\` (exactamente así). Si no sabes, \`borrador\`.
- \`description\`: una línea para la tarjeta del inicio (opcional, máx. 300).
- \`html\`: el contenido, como HTML limitado (abajo).

## El HTML de cada sección

Solo estas etiquetas: ${tags}. Cualquier otra se quita (queda su texto). Sin atributos, estilos ni imágenes, y las tablas hay que reescribirlas como párrafos o listas. Títulos dentro de una sección: \`h3\` (grupo), \`h4\`, \`h5\`; no uses \`h1\` ni \`h2\` (el título de la sección va en \`title\`).

Cada **párrafo, viñeta o definición** es un bloque que se comenta y aprueba por separado, así que conviene un párrafo por idea.

Convenciones que la página entiende:

- Un primer párrafo que empieza con **«Para qué sirve»** (en \`<strong>\`) es una nota: se muestra pero no se comenta.
- Un \`<em>\` que empieza con \`[\` (p. ej. \`<em>[2, 3]</em>\`) es una cita a \`sources\` por número (la primera fuente es 1).
- Un \`<h3>\` que empieza con «Pendientes» hace que sus viñetas cuenten como pendientes de la sección.
- El texto «sección N» se enlaza solo a la sección cuyo \`num\` es N.
- **Glosario:** una sección con \`"id": "glosario"\` hecha de \`<dl><dt>Término</dt><dd>Definición</dd></dl>\`, más \`glossaryTerms\` arriba.

## Límites

Hasta ${MAX_SECTIONS} secciones, ${MAX_SECTION_HTML_LENGTH.toLocaleString('es-CO')} caracteres de HTML por sección y ${Math.round(MAX_DOCUMENT_BYTES / 1000)} KB en total. El texto del documento va en el idioma original.

## Ejemplo completo

\`\`\`json
${exampleJson.trim()}
\`\`\`
`;
}
