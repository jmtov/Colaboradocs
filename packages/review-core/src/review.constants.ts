/** Largo máximo de un comentario, en caracteres. */
export const MAX_COMMENT_LENGTH = 2000;

/** Largo del extracto del bloque que se guarda junto a cada comentario. */
export const EXCERPT_LENGTH = 80;

/** Largo máximo del nombre y del rol de una persona. */
export const MAX_NAME_LENGTH = 80;
export const MAX_ROLE_LENGTH = 80;

/** Alfabeto de los PIN: sin 0/O/1/I/L para que no se confundan al copiarlos. */
export const PIN_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

/** Largo del PIN sin el guion (se muestra como XXXX-XXXX). */
export const PIN_LENGTH = 8;

/** Dispositivos que puede usar un mismo PIN antes de que haya que resetearlo. */
export const DEFAULT_MAX_DEVICES = 2;
