export type SectionStatus = 'listo' | 'borrador' | 'pendiente';

export type DocumentSection = {
  id: string;
  /** "1", "2"… para las secciones; "A", "B" para los anexos. */
  num: string;
  title: string;
  status: SectionStatus;
  /** Una línea para la tarjeta del inicio (opcional). */
  description?: string;
  /** HTML limitado: p, ul, ol, li, strong, em, br, h3, h4, h5, dl, dt, dd. */
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
  /** Segundo botón del inicio, que salta a una sección. Sin esto, no hay botón. */
  highlightSection?: { id: string; label: string };
  /**
   * Cómo se escribe un término en el texto (minúsculas) -> su entrada en la
   * sección `glosario`. Opcional: sin esto no se enlaza nada.
   */
  glossaryTerms?: Record<string, string>;
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
  openThreads: number;
  comments: number;
  approvals: number;
  lastActivityAt: string | null;
};
