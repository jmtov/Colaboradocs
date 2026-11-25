import type { ReviewerLabel } from './review.types';

/** Qué clase de documento es: la home los agrupa así. Sin `tipo`, «otro». */
export const DOCUMENT_KINDS = ['acta', 'iniciativa', 'guia', 'otro'] as const;
export type DocumentKind = (typeof DOCUMENT_KINDS)[number];

export type SectionStatus = 'listo' | 'borrador' | 'pendiente';

export type DocumentSection = {
  id: string;
  /** "1", "2"… para las secciones; "A", "B" para los anexos. */
  num: string;
  title: string;
  status: SectionStatus;
  /** Una línea para la tarjeta del inicio (opcional). */
  description?: string;
  /** HTML limitado: p, ul, ol, li, strong, em, a (con href), br, h3, h4, h5, dl, dt, dd. */
  html: string;
};

export type DocumentSource = {
  label: string;
  url: string;
};

export type DocumentContent = {
  /** Id del documento: va en la URL (`/d/<id>`) y es la clave de sus comentarios. */
  id: string;
  title: string;
  /** Una o dos líneas para la tarjeta en la home (opcional). */
  description?: string;
  /** Nombre corto para el encabezado ("Principios /"). Por defecto, el título. */
  shortName?: string;
  /** Línea sobre el título del inicio. `{version}` se reemplaza por la versión. */
  eyebrow?: string;
  /** Párrafo bajo el título del inicio. */
  lead?: string;
  version: string;
  updated: string;
  /** Clase de documento (`acta`, `iniciativa`, `guia`, `otro`). Por defecto, `otro`. */
  tipo?: DocumentKind;
  /** Quién responde por una iniciativa; va en su tarjeta (opcional). */
  responsable?: string;
  /** Quiénes estuvieron en un acta, como texto libre (opcional). */
  participantes?: string;
  /** Segundo botón del inicio, que salta a una sección. Sin esto, no hay botón. */
  highlightSection?: { id: string; label: string };
  /**
   * Cómo se escribe un término en el texto (minúsculas) -> su entrada en la
   * sección `glosario`. Opcional: sin esto no se enlaza nada.
   */
  glossaryTerms?: Record<string, string>;
  /**
   * Cómo se escribe el nombre de una persona en el texto (minúsculas) -> su
   * nombre tal como está registrado en el espacio. Al tocarlo se abre su tarjeta
   * con el municipio. Opcional: sin esto no se enlaza ninguna persona.
   */
  peopleTerms?: Record<string, string>;
  sources: DocumentSource[];
  sections: DocumentSection[];
};

/** Cómo se llama y se muestra el rol de cada persona (campo `municipality`). */
export type RoleField = {
  /** Nombre del campo en formularios: «Municipio», «Área»… Por defecto «Rol». */
  label: string;
  /** Plantilla para mostrarlo en la lista de accesos: «Representante {value}». */
  format?: string;
};

/** El espacio que agrupa los documentos. Público: se ve antes de ingresar. */
export type SpaceInfo = {
  name: string;
  description?: string;
  roleField?: RoleField;
};

/** Un documento en la home: sus datos básicos y su actividad. */
export type DocumentListItem = {
  id: string;
  title: string;
  description: string | null;
  version: string;
  updated: string;
  tipo: DocumentKind;
  responsable: string | null;
  participantes: string | null;
  openThreads: number;
  comments: number;
  approvals: number;
  lastActivityAt: string | null;
};

/** Una versión de un documento: la actual y las que se reemplazaron. */
export type DocumentVersionItem = {
  version: string;
  /** Actual: cuándo se publicó. Anterior: cuándo se reemplazó. */
  at: string;
  /** Quién la publicó (la actual) o la reemplazó (una anterior); null si ya no existe. */
  by: ReviewerLabel | null;
  current: boolean;
};

/**
 * El borrador de un documento (uno por documento, compartido por los admins).
 * Los revisores no lo ven: publicarlo es lo que crea la versión.
 */
export type DraftInfo = {
  /** Cuenta los guardados; 0 = todavía no hay borrador. Va en cada guardado para detectar conflictos. */
  revision: number;
  updatedAt: string;
  /** Quién lo guardó por última vez; null si esa persona ya no existe. */
  updatedBy: ReviewerLabel | null;
  /** `updated_at` del documento publicado cuando se creó el borrador; null si el documento era nuevo. */
  baseUpdatedAt: string | null;
  /** El documento publicado cambió (alguien lo reemplazó) después de crearse el borrador. */
  stale: boolean;
};

export type DocumentDraft = DraftInfo & { content: DocumentContent };

/** Cuerpo de `PUT /api/admin/documents/:id/draft`. */
export type DraftSave = {
  content: DocumentContent;
  /** La `revision` que quien guarda tiene delante; 0 si cree que no hay borrador. */
  expectedRevision: number;
};

/** Cuerpo de `POST /api/admin/documents/:id/publish`. */
export type DraftPublish = {
  expectedRevision: number;
  /** Publicar aunque el documento publicado haya cambiado desde que se creó el borrador. */
  force?: boolean;
};
