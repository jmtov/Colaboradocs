/** Vigencia de un token: un mes. */
export const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** Intentos fallidos de login por IP dentro de la ventana antes de bloquear. */
export const MAX_LOGIN_FAILURES = 10;

/** Ventana de los intentos fallidos: 15 minutos. */
export const LOGIN_FAILURE_WINDOW_MS = 15 * 60 * 1000;

/** Los intentos fallidos más viejos que esto se borran: un día. */
export const LOGIN_FAILURE_RETENTION_MS = 24 * 60 * 60 * 1000;

export const DEVICE_ID_PATTERN = /^[A-Za-z0-9-]{16,64}$/;
