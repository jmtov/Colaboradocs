export type Reviewer = {
  id: string;
  name: string;
  isAdmin: boolean;
  /** Municipio de la persona; null si no se registró. */
  municipality: string | null;
};

/** Cómo se muestra a un revisor en comentarios y OK. */
export type ReviewerLabel = {
  name: string;
  municipality: string | null;
};

export type ReviewComment = {
  id: string;
  blockId: string;
  /** null en un comentario raíz; id del comentario al que responde si no. */
  parentId: string | null;
  authorId: string;
  authorName: string;
  authorMunicipality: string | null;
  /** null cuando el autor lo eliminó. */
  text: string | null;
  /** Primeras palabras del bloque al comentar: sirve para reconocer huérfanos. */
  blockExcerpt: string;
  createdAt: string;
  resolved: boolean;
};

export type BlockApproval = {
  blockId: string;
  reviewerId: string;
  /** Cuándo dio el OK (ISO). */
  createdAt: string;
};

export type ReviewSnapshot = {
  me: Reviewer;
  comments: ReviewComment[];
  approvals: BlockApproval[];
  /** Nombre y municipio de cada revisor, para mostrar quién comentó o dio OK. */
  reviewers: Record<string, ReviewerLabel>;
};

export type LoginRequest = {
  pin: string;
  deviceId: string;
};

export type LoginResponse = {
  token: string;
  reviewer: Reviewer;
};

export type NewComment = {
  blockId: string;
  parentId: string | null;
  text: string;
  blockExcerpt: string;
};

export type ApiErrorCode =
  | 'invalid_pin'
  | 'device_limit'
  | 'too_many_attempts'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'name_taken'
  | 'invalid_request';

export type ApiError = {
  error: ApiErrorCode;
  /** Qué estaba mal, para mostrárselo a quien subió el documento. */
  details?: string[];
};

/** Una persona en la pantalla de accesos (solo para admins). */
export type ManagedReviewer = {
  id: string;
  name: string;
  /** El rol de la persona (p. ej., su municipio). */
  municipality: string | null;
  isAdmin: boolean;
  /** Dispositivos que ya usaron su PIN, y cuántos permite. */
  devices: number;
  maxDevices: number;
  /**
   * Quien consulta no puede quitarle el acceso, cambiarle el nivel, regenerar
   * su PIN ni restablecer sus dispositivos: es ella misma, quien la hizo admin
   * (o quien lo hizo a quien la hizo, etc.) o un admin creado por CLI.
   */
  locked: boolean;
};

export type NewReviewer = {
  name: string;
  municipality: string;
  isAdmin: boolean;
};

/** Cambios sobre una persona; lo que no viene no se toca. */
export type ReviewerPatch = {
  municipality?: string;
  isAdmin?: boolean;
};

/** Respuesta al crear una persona o regenerar su PIN: el PIN solo se ve esta vez. */
export type IssuedPin = {
  reviewer: ManagedReviewer;
  /** Con formato XXXX-XXXX. */
  pin: string;
};

/** Actividad de un documento, para la home. */
export type DocumentSummary = {
  /** Hilos sin resolver (comentarios raíz con texto). */
  openThreads: number;
  /** Comentarios con texto, respuestas incluidas. */
  comments: number;
  /** OK dados, sumando todas las personas. */
  approvals: number;
  /** Último comentario u OK; null si aún no hay actividad. */
  lastActivityAt: string | null;
};
