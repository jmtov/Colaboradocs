import type { Reviewer } from '@colaboradocs/review-core';

export type StoredSession = {
  token: string;
  reviewer: Reviewer;
};

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function isStoredSession(value: unknown): value is StoredSession {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  const reviewer = candidate.reviewer as Record<string, unknown> | undefined;
  return (
    typeof candidate.token === 'string' &&
    typeof reviewer === 'object' &&
    reviewer !== null &&
    typeof reviewer.id === 'string' &&
    typeof reviewer.name === 'string' &&
    typeof reviewer.isAdmin === 'boolean'
  );
}

/**
 * Id aleatorio de 32 caracteres hexadecimales. `crypto.randomUUID` solo existe
 * en contextos seguros (https o localhost): por http en la red local no está,
 * pero `getRandomValues` sí.
 */
export function randomDeviceId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

const SESSION_SUFFIX = ':session';

/**
 * Prefijos de sesiones guardadas cuando eran por documento (`review:<id>:session`).
 * Sirve para adoptarlas al pasar a una sesión única del espacio.
 */
export function discoverLegacyPrefixes(
  storage: Pick<Storage, 'length' | 'key'> | null,
  prefix: string,
): string[] {
  const found: string[] = [];
  try {
    for (let index = 0; index < (storage?.length ?? 0); index += 1) {
      const key = storage?.key(index) ?? '';
      if (
        key.startsWith(`${prefix}:`) &&
        key.endsWith(SESSION_SUFFIX) &&
        key !== `${prefix}${SESSION_SUFFIX}`
      ) {
        found.push(key.slice(0, -SESSION_SUFFIX.length));
      }
    }
  } catch {
    // Sin acceso al almacenamiento: no hay nada que adoptar.
  }
  return found;
}

/**
 * Sesión y id de dispositivo en localStorage, con memoria como respaldo si el
 * navegador lo bloquea (modo privado, cookies deshabilitadas).
 */
export function createSessionStorage(
  storage: StorageLike | null,
  prefix: string,
  /**
   * Prefijos de cuando la sesión era por documento (`review:<id>`). Si no hay
   * sesión ni id de dispositivo nuevos, se adoptan los de ahí: así nadie tiene
   * que volver a ingresar su PIN ni gasta un dispositivo más.
   */
  legacyPrefixes: string[] = [],
) {
  const memory = new Map<string, string>();
  const sessionKey = `${prefix}:session`;
  const deviceKey = `${prefix}:device`;

  function read(key: string): string | null {
    try {
      const value = storage?.getItem(key) ?? null;
      return value ?? memory.get(key) ?? null;
    } catch {
      return memory.get(key) ?? null;
    }
  }

  function write(key: string, value: string) {
    memory.set(key, value);
    try {
      storage?.setItem(key, value);
    } catch {
      // Sin almacenamiento: queda solo en memoria hasta cerrar la pestaña.
    }
  }

  function remove(key: string) {
    memory.delete(key);
    try {
      storage?.removeItem(key);
    } catch {
      // Nada que limpiar.
    }
  }

  /** Lee la clave nueva; si falta, adopta la primera heredada. */
  function readOrAdopt(suffix: 'session' | 'device'): string | null {
    const current = read(`${prefix}:${suffix}`);
    if (current) return current;
    for (const legacy of legacyPrefixes) {
      const inherited = read(`${legacy}:${suffix}`);
      if (inherited) {
        write(`${prefix}:${suffix}`, inherited);
        return inherited;
      }
    }
    return null;
  }

  return {
    loadSession(): StoredSession | null {
      const raw = readOrAdopt('session');
      if (!raw) return null;
      try {
        const parsed: unknown = JSON.parse(raw);
        if (!isStoredSession(parsed)) return null;
        // Las sesiones guardadas antes de existir el municipio no lo traen.
        const { reviewer } = parsed;
        return {
          token: parsed.token,
          reviewer: {
            ...reviewer,
            municipality: reviewer.municipality ?? null,
          },
        };
      } catch {
        return null;
      }
    },
    saveSession(session: StoredSession) {
      write(sessionKey, JSON.stringify(session));
    },
    clearSession() {
      remove(sessionKey);
      // Si no, al recargar se volvería a adoptar la sesión heredada.
      for (const legacy of legacyPrefixes) remove(`${legacy}:session`);
    },
    /** Id estable de este navegador; el servidor lo usa para contar dispositivos. */
    deviceId(): string {
      const existing = readOrAdopt('device');
      if (existing) return existing;
      const created = randomDeviceId();
      write(deviceKey, created);
      return created;
    },
  };
}

export type SessionStorageApi = ReturnType<typeof createSessionStorage>;
