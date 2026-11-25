import { isIsoDate } from '../shared/date.utils';
import {
  MAX_DOCUMENT_BYTES,
  MAX_SECTION_HTML_LENGTH,
  MAX_SECTIONS,
} from './document.constants';
import {
  DOCUMENT_KINDS,
  type DocumentContent,
  type DocumentKind,
  type DocumentSection,
  type RoleField,
  type SectionStatus,
  type SpaceInfo,
} from './document.types';

/** Etiquetas que entiende la página; las demás se quitan (queda su texto). */
export const ALLOWED_HTML_TAGS = [
  'p',
  'ul',
  'ol',
  'li',
  'strong',
  'em',
  'a',
  'br',
  'h3',
  'h4',
  'h5',
  'dl',
  'dt',
  'dd',
] as const;

const ALLOWED_TAGS = new Set<string>(ALLOWED_HTML_TAGS);

/** Títulos que Word o Markdown pueden dejar y que la página no usa. */
const RENAMED_TAGS: Record<string, string> = {
  h1: 'h3',
  h2: 'h3',
  h6: 'h5',
  b: 'strong',
  i: 'em',
};

const DOCUMENT_ID_PATTERN = /^[a-z0-9-]{1,64}$/;
const SECTION_ID_PATTERN = /^[a-z0-9-]{1,60}$/;
const STATUSES: SectionStatus[] = ['listo', 'borrador', 'pendiente'];

/**
 * Deja solo HTML que la página entiende: quita scripts, estilos, comentarios,
 * atributos y etiquetas desconocidas (conserva su texto). No es la defensa
 * principal —la página no inyecta HTML crudo—, pero mantiene limpio lo guardado.
 */
export function sanitizeSectionHtml(html: string): string {
  return (
    html
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<(script|style)\b[\s\S]*?<\/\1\s*>/gi, '')
      .replace(
        /<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g,
        (_match, slash, name, attributes) => {
          const lower = String(name).toLowerCase();
          const tag = RENAMED_TAGS[lower] ?? lower;
          if (!ALLOWED_TAGS.has(tag)) return '';
          if (tag === 'a' && !slash) return `<a${hrefAttribute(attributes)}>`;
          return `<${slash}${tag}>`;
        },
      )
      // Un enlace sin dirección válida (javascript:, vacío…) queda como texto.
      .replace(/<a>([\s\S]*?)<\/a>/g, '$1')
  );
}

/** Direcciones que un enlace puede tener: web, correo o una ruta del propio sitio. */
export function isSafeLinkUrl(url: string): boolean {
  return /^(https?:\/\/|mailto:)\S+$/i.test(url) || /^\/(?!\/)\S*$/.test(url);
}

/** ` href="…"` si el atributo es una dirección segura; si no, nada. */
function hrefAttribute(attributes: string): string {
  const found = /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(attributes);
  const url = (found?.[1] ?? found?.[2] ?? '').trim();
  if (!isSafeLinkUrl(url)) return '';
  return ` href="${url
    .replace(/&(?!amp;|quot;|lt;|gt;)/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')}"`;
}

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; errors: string[] };

function text(
  value: unknown,
  field: string,
  max: number,
  errors: string[],
  options: { required: boolean } = { required: false },
): string | undefined {
  if (value === undefined || value === null || value === '') {
    if (options.required) errors.push(`Falta «${field}».`);
    return undefined;
  }
  if (typeof value !== 'string') {
    errors.push(`«${field}» tiene que ser texto.`);
    return undefined;
  }
  const trimmed = value.trim();
  if (trimmed.length > max) {
    errors.push(`«${field}» pasa de ${max} caracteres.`);
    return undefined;
  }
  if (options.required && !trimmed) errors.push(`Falta «${field}».`);
  return trimmed;
}

function isSafeUrl(url: string): boolean {
  return url === '' || /^https?:\/\//i.test(url) || /^\/(?!\/)/.test(url);
}

/** Los nombres que tuvieron en español los campos del tipo, el responsable y los participantes. */
const LEGACY_KEYS = {
  tipo: 'type',
  responsable: 'owner',
  participantes: 'attendees',
} as const;
const LEGACY_KINDS = new Map<string, DocumentKind>([
  ['acta', 'minutes'],
  ['iniciativa', 'initiative'],
  ['guia', 'guide'],
  ['otro', 'other'],
]);

/** El tipo que corresponde a un valor guardado: el actual o el de antes (`acta`…); otro valor es `other`. */
export function kindFromStored(value: unknown): DocumentKind {
  if (typeof value !== 'string') return 'other';
  if (DOCUMENT_KINDS.includes(value as DocumentKind)) {
    return value as DocumentKind;
  }
  return LEGACY_KINDS.get(value) ?? 'other';
}

/**
 * Los documentos escritos antes del cambio de nombres (un JSON importado, un agente con el manual
 * viejo, lo guardado antes de la migración 0011) traen `tipo`, `responsable` y `participantes`, y
 * `tipo` con `acta`, `iniciativa`, `guia` u `otro`. Se leen como los nombres actuales; si vienen
 * los dos, vale el actual. Un valor de tipo que no se conoce se deja tal cual (la validación lo rechaza).
 */
export function migrateLegacyKeys(
  raw: Record<string, unknown>,
): Record<string, unknown> {
  const migrated = { ...raw };
  for (const [legacy, current] of Object.entries(LEGACY_KEYS)) {
    if (legacy in migrated && !(current in migrated)) {
      migrated[current] = migrated[legacy];
    }
  }
  const kind =
    typeof migrated.type === 'string'
      ? LEGACY_KINDS.get(migrated.type)
      : undefined;
  if (kind) migrated.type = kind;
  return migrated;
}

/**
 * Valida y normaliza un documento recibido (de un archivo o de la API): solo
 * quedan los campos conocidos, el HTML de cada sección se limpia y se revisan
 * ids únicos y tamaños. No modifica la entrada.
 */
export function validateDocument(
  input: unknown,
): ValidationResult<DocumentContent> {
  const errors: string[] = [];
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return {
      ok: false,
      errors: ['El documento tiene que ser un objeto JSON.'],
    };
  }
  const raw = migrateLegacyKeys(input as Record<string, unknown>);

  const id = text(raw.id, 'id', 64, errors, { required: true });
  if (id !== undefined && !DOCUMENT_ID_PATTERN.test(id)) {
    errors.push('«id» solo admite minúsculas, números y guiones (máx. 64).');
  }
  const title = text(raw.title, 'title', 200, errors, { required: true });
  const version = text(raw.version, 'version', 40, errors, { required: true });
  const updated = text(raw.updated, 'updated', 40, errors, { required: true });

  const document: Partial<DocumentContent> = { id, title, version, updated };
  for (const [field, max] of [
    ['description', 500],
    ['shortName', 80],
    ['eyebrow', 200],
    ['lead', 600],
    ['owner', 200],
    ['attendees', 500],
  ] as const) {
    const value = text(raw[field], field, max, errors);
    if (value !== undefined) document[field] = value;
  }

  if (raw.type !== undefined && raw.type !== null && raw.type !== '') {
    if (DOCUMENT_KINDS.includes(raw.type as DocumentKind)) {
      document.type = raw.type as DocumentKind;
    } else {
      errors.push(`«type» tiene que ser ${DOCUMENT_KINDS.join(', ')}.`);
    }
  }

  if (raw.date !== undefined && raw.date !== null && raw.date !== '') {
    if (isIsoDate(raw.date)) {
      document.date = raw.date;
    } else {
      errors.push(
        '«date» tiene que ser una fecha real con el formato AAAA-MM-DD.',
      );
    }
  }

  // Fuentes
  const sources: DocumentContent['sources'] = [];
  if (raw.sources !== undefined) {
    if (!Array.isArray(raw.sources) || raw.sources.length > 100) {
      errors.push('«sources» tiene que ser una lista de hasta 100 fuentes.');
    } else {
      raw.sources.forEach((entry: unknown, index) => {
        const source = (entry ?? {}) as Record<string, unknown>;
        const label = text(
          source.label,
          `sources[${index}].label`,
          300,
          errors,
          { required: true },
        );
        const url =
          text(source.url, `sources[${index}].url`, 1000, errors) ?? '';
        if (!isSafeUrl(url)) {
          errors.push(
            `«sources[${index}].url» tiene que empezar con https://, http:// o /.`,
          );
        }
        if (label !== undefined) sources.push({ label, url });
      });
    }
  }
  document.sources = sources;

  // Glosario y personas: mismo formato, «cómo se escribe» -> «entrada».
  for (const key of ['glossaryTerms', 'peopleTerms'] as const) {
    const value = raw[key];
    if (value === undefined) continue;
    if (
      typeof value !== 'object' ||
      value === null ||
      Array.isArray(value) ||
      Object.keys(value).length > 500
    ) {
      errors.push(`«${key}» tiene que ser un objeto de hasta 500 términos.`);
      continue;
    }
    const clean: Record<string, string> = {};
    for (const [term, entry] of Object.entries(value)) {
      if (
        typeof entry !== 'string' ||
        !term.trim() ||
        term.length > 100 ||
        entry.length > 100
      ) {
        errors.push(
          `«${key}» tiene un término inválido: «${term.slice(0, 30)}».`,
        );
        break;
      }
      clean[term.trim().toLowerCase()] = entry.trim();
    }
    document[key] = clean;
  }

  // Secciones
  const sections: DocumentSection[] = [];
  if (!Array.isArray(raw.sections) || raw.sections.length === 0) {
    errors.push(
      'Falta «sections»: el documento necesita al menos una sección.',
    );
  } else if (raw.sections.length > MAX_SECTIONS) {
    errors.push(`Hay más de ${MAX_SECTIONS} secciones.`);
  } else {
    const seen = new Set<string>();
    raw.sections.forEach((entry: unknown, index) => {
      const section = (entry ?? {}) as Record<string, unknown>;
      const where = `sections[${index}]`;
      const sectionId = text(section.id, `${where}.id`, 60, errors, {
        required: true,
      });
      if (sectionId !== undefined) {
        if (!SECTION_ID_PATTERN.test(sectionId)) {
          errors.push(
            `«${where}.id» solo admite minúsculas, números y guiones (máx. 60).`,
          );
        } else if (seen.has(sectionId)) {
          errors.push(`El id de sección «${sectionId}» está repetido.`);
        }
        seen.add(sectionId);
      }
      const num = text(section.num, `${where}.num`, 10, errors, {
        required: true,
      });
      const sectionTitle = text(section.title, `${where}.title`, 200, errors, {
        required: true,
      });
      const status = section.status;
      if (!STATUSES.includes(status as SectionStatus)) {
        errors.push(
          `«${where}.status» tiene que ser listo, borrador o pendiente.`,
        );
      }
      if (typeof section.html !== 'string') {
        errors.push(`Falta «${where}.html».`);
      } else if (section.html.length > MAX_SECTION_HTML_LENGTH) {
        errors.push(`«${where}.html» es demasiado largo.`);
      }
      const description = text(
        section.description,
        `${where}.description`,
        300,
        errors,
      );
      if (
        sectionId !== undefined &&
        num !== undefined &&
        sectionTitle !== undefined &&
        typeof section.html === 'string' &&
        STATUSES.includes(status as SectionStatus)
      ) {
        sections.push({
          id: sectionId,
          num,
          title: sectionTitle,
          status: status as SectionStatus,
          ...(description ? { description } : {}),
          html: sanitizeSectionHtml(section.html).trim(),
        });
      }
    });
  }
  document.sections = sections;

  // Botón extra del inicio
  if (raw.highlightSection !== undefined) {
    const highlight = raw.highlightSection as Record<string, unknown>;
    const highlightId = text(highlight?.id, 'highlightSection.id', 60, errors, {
      required: true,
    });
    const label = text(highlight?.label, 'highlightSection.label', 80, errors, {
      required: true,
    });
    if (highlightId !== undefined && label !== undefined) {
      if (!sections.some((section) => section.id === highlightId)) {
        errors.push(
          `«highlightSection.id» apunta a una sección que no existe: «${highlightId}».`,
        );
      }
      document.highlightSection = { id: highlightId, label };
    }
  }

  if (errors.length === 0) {
    const size = new TextEncoder().encode(JSON.stringify(document)).length;
    if (size > MAX_DOCUMENT_BYTES) {
      errors.push(
        `El documento pesa ${Math.round(size / 1024)} KB; el máximo es ${Math.round(MAX_DOCUMENT_BYTES / 1024)} KB.`,
      );
    }
  }
  return errors.length > 0
    ? { ok: false, errors }
    : { ok: true, value: document as DocumentContent };
}

/** Valida los datos públicos del espacio (nombre, descripción, rol). */
export function validateSpace(input: unknown): ValidationResult<SpaceInfo> {
  const errors: string[] = [];
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return {
      ok: false,
      errors: ['Los datos del espacio tienen que ser un objeto.'],
    };
  }
  const raw = input as Record<string, unknown>;
  const name = text(raw.name, 'name', 100, errors, { required: true });
  const description = text(raw.description, 'description', 300, errors);
  let roleField: RoleField | undefined;
  if (raw.roleField !== undefined) {
    const role = raw.roleField as Record<string, unknown>;
    const label = text(role?.label, 'roleField.label', 40, errors, {
      required: true,
    });
    const format = text(role?.format, 'roleField.format', 100, errors);
    if (format !== undefined && !format.includes('{value}')) {
      errors.push('«roleField.format» tiene que incluir {value}.');
    }
    if (label !== undefined)
      roleField = { label, ...(format ? { format } : {}) };
  }
  if (errors.length > 0 || name === undefined) return { ok: false, errors };
  return {
    ok: true,
    value: {
      name,
      ...(description ? { description } : {}),
      ...(roleField ? { roleField } : {}),
    },
  };
}
