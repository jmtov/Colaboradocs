import { ApiRequestError } from '../api/review.api';

/** Mensaje para mostrar cuando falla el canje del PIN. */
export function describeLoginError(error: unknown): string {
  if (!(error instanceof ApiRequestError)) {
    const detail = error instanceof Error ? error.message : String(error);
    return `No se pudo ingresar (${detail}).`;
  }
  switch (error.code) {
    case 'invalid_pin':
      return 'PIN incorrecto. Revisa el código que te enviaron.';
    case 'device_limit':
      return 'Este PIN ya se usó en el máximo de dispositivos. Escríbele a quien te lo envió para que lo reinicie.';
    case 'too_many_attempts':
      return 'Demasiados intentos. Espera unos 15 minutos.';
    case 'network':
      return 'Sin conexión con el servidor. Intenta de nuevo.';
    default:
      return `No se pudo ingresar (${error.code}, ${error.status}).`;
  }
}

/** Mensaje para mostrar cuando falla subir o archivar un documento. */
export function describePublishError(error: unknown): {
  message: string;
  details: string[];
} {
  if (!(error instanceof ApiRequestError)) {
    return { message: 'No se pudo completar la acción.', details: [] };
  }
  switch (error.code) {
    case 'invalid_request':
      return { message: 'El documento no es válido.', details: error.details };
    case 'forbidden':
      return { message: 'Solo los admins pueden hacer eso.', details: [] };
    case 'not_found':
      return { message: 'Ese documento ya no existe.', details: [] };
    case 'network':
      return {
        message: 'Sin conexión con el servidor. Intenta de nuevo.',
        details: [],
      };
    default:
      return { message: 'No se pudo completar la acción.', details: [] };
  }
}

/** Mensaje para mostrar cuando falla una acción de la pantalla de accesos. */
export function describeAccessError(error: unknown): string {
  if (!(error instanceof ApiRequestError)) {
    return 'No se pudo completar la acción.';
  }
  switch (error.code) {
    case 'name_taken':
      return 'Ya hay alguien con ese nombre.';
    case 'invalid_request':
      return 'Revisa el nombre y el rol: no pueden ir vacíos.';
    case 'forbidden':
      return 'No puedes hacer eso con esta persona.';
    case 'not_found':
      return 'Esa persona ya no existe. Se actualizó la lista.';
    case 'network':
      return 'Sin conexión con el servidor. Intenta de nuevo.';
    default:
      return 'No se pudo completar la acción.';
  }
}

/** Por qué falló una acción del borrador, con el código para que el editor decida qué hacer. */
export function describeDraftError(error: unknown): {
  code: ApiRequestError['code'];
  message: string;
  details: string[];
} {
  if (!(error instanceof ApiRequestError)) {
    return {
      code: 'network',
      message: 'No se pudo completar la acción.',
      details: [],
    };
  }
  const base = { code: error.code, details: [] as string[] };
  // Un fallo del servidor no trae cuerpo JSON y se lee como `invalid_request`:
  // no es que el documento esté mal.
  if (error.status >= 500) {
    return {
      ...base,
      message: `El servidor falló (${error.status}). Si es una instalación nueva, puede faltar aplicar las migraciones.`,
    };
  }
  switch (error.code) {
    case 'conflict':
      return {
        ...base,
        message:
          'Otra persona guardó el borrador mientras lo editabas. Recarga para ver su versión.',
      };
    case 'draft_stale':
      return {
        ...base,
        message:
          'El documento publicado cambió después de que empezaste este borrador. Publicar lo pisaría.',
      };
    case 'invalid_request':
      return {
        ...base,
        message: 'El documento no es válido.',
        details: error.details,
      };
    case 'forbidden':
      return { ...base, message: 'Solo los admins pueden editar.' };
    case 'not_found':
      return { ...base, message: 'No hay borrador para ese documento.' };
    case 'network':
      return {
        ...base,
        message: 'Sin conexión con el servidor. Intenta de nuevo.',
      };
    default:
      return { ...base, message: 'No se pudo completar la acción.' };
  }
}
