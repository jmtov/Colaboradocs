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
