import { PIN_ALPHABET, PIN_LENGTH } from './review.constants';

const encoder = new TextEncoder();

/** Mayúsculas y sin espacios ni guiones: "k7q2 m9xp" -> "K7Q2M9XP". */
export function normalizePin(input: string): string {
  return input.toUpperCase().replace(/[\s-]/g, '');
}

export function isValidPin(pin: string): boolean {
  if (pin.length !== PIN_LENGTH) return false;
  return [...pin].every((char) => PIN_ALPHABET.includes(char));
}

/** "K7Q2M9XP" -> "K7Q2-M9XP", para mostrarlo y mandarlo por WhatsApp. */
export function formatPin(pin: string): string {
  const half = PIN_LENGTH / 2;
  return `${pin.slice(0, half)}-${pin.slice(half)}`;
}

/**
 * PIN al azar. Descarta los bytes que sesgarían la distribución (el alfabeto
 * no divide 256 en partes iguales).
 */
export function generatePin(): string {
  const limit = 256 - (256 % PIN_ALPHABET.length);
  let pin = '';
  while (pin.length < PIN_LENGTH) {
    const bytes = crypto.getRandomValues(new Uint8Array(PIN_LENGTH));
    for (const byte of bytes) {
      if (byte < limit && pin.length < PIN_LENGTH) {
        pin += PIN_ALPHABET[byte % PIN_ALPHABET.length];
      }
    }
  }
  return pin;
}

/** HMAC-SHA256 del PIN con el secreto del servidor, en hex. */
export async function hashPin(pin: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(pin));
  return [...new Uint8Array(signature)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}
