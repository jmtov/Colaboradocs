import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createSessionStorage,
  discoverLegacyPrefixes,
  randomDeviceId,
} from './session.utils';

function fakeStorage() {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
  };
}

const reviewer = {
  id: 'r1',
  name: 'Ana',
  isAdmin: false,
  municipality: 'La Ceja',
};

describe('createSessionStorage', () => {
  it('guarda, recupera y borra la sesión', () => {
    const storage = fakeStorage();
    const api = createSessionStorage(storage, 'doc');
    expect(api.loadSession()).toBeNull();
    api.saveSession({ token: 't', reviewer });
    expect(api.loadSession()).toEqual({ token: 't', reviewer });
    expect(storage.data.has('doc:session')).toBe(true);
    api.clearSession();
    expect(api.loadSession()).toBeNull();
    expect(storage.data.has('doc:session')).toBe(false);
  });

  it('completa el municipio en sesiones guardadas antes de que existiera', () => {
    const storage = fakeStorage();
    storage.setItem(
      'doc:session',
      JSON.stringify({
        token: 't',
        reviewer: { id: 'r1', name: 'Ana', isAdmin: false },
      }),
    );
    const session = createSessionStorage(storage, 'doc').loadSession();
    expect(session?.reviewer.municipality).toBeNull();
  });

  it('ignora una sesión guardada con forma inválida', () => {
    const storage = fakeStorage();
    storage.setItem('doc:session', '{"token":1}');
    expect(createSessionStorage(storage, 'doc').loadSession()).toBeNull();
    storage.setItem('doc:session', 'no es json');
    expect(createSessionStorage(storage, 'doc').loadSession()).toBeNull();
  });

  it('mantiene el mismo id de dispositivo', () => {
    const storage = fakeStorage();
    const first = createSessionStorage(storage, 'doc').deviceId();
    const second = createSessionStorage(storage, 'doc').deviceId();
    expect(first).toBe(second);
    expect(first).toMatch(/^[A-Za-z0-9-]{16,64}$/);
  });

  it('funciona en memoria cuando el almacenamiento lanza errores', () => {
    const broken = {
      getItem: () => {
        throw new Error('bloqueado');
      },
      setItem: () => {
        throw new Error('bloqueado');
      },
      removeItem: () => {
        throw new Error('bloqueado');
      },
    };
    const api = createSessionStorage(broken, 'doc');
    api.saveSession({ token: 't', reviewer });
    expect(api.loadSession()).toEqual({ token: 't', reviewer });
    expect(api.deviceId()).toBe(api.deviceId());
  });
});

describe('randomDeviceId', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('funciona sin crypto.randomUUID (contexto no seguro)', () => {
    vi.stubGlobal('crypto', {
      getRandomValues: crypto.getRandomValues.bind(crypto),
    });
    const id = randomDeviceId();
    expect(id).toMatch(/^[a-f0-9]{32}$/);
    expect(randomDeviceId()).not.toBe(id);
  });

  it('cumple el formato que acepta el servidor', () => {
    expect(randomDeviceId()).toMatch(/^[A-Za-z0-9-]{16,64}$/);
  });
});

describe('sesiones heredadas (antes eran por documento)', () => {
  const stored = JSON.stringify({ token: 't', reviewer });

  it('adopta la sesión y el id de dispositivo del prefijo viejo', () => {
    const storage = fakeStorage();
    storage.data.set('review:principios:session', stored);
    storage.data.set('review:principios:device', 'dispositivo-viejo-1234');
    const sessions = createSessionStorage(storage, 'review', [
      'review:principios',
    ]);
    expect(sessions.loadSession()?.token).toBe('t');
    expect(sessions.deviceId()).toBe('dispositivo-viejo-1234');
    // quedó copiada bajo la clave nueva
    expect(storage.data.get('review:session')).toBe(stored);
  });

  it('prefiere lo nuevo a lo heredado', () => {
    const storage = fakeStorage();
    storage.data.set('review:principios:device', 'viejo');
    storage.data.set('review:device', 'nuevo');
    const sessions = createSessionStorage(storage, 'review', [
      'review:principios',
    ]);
    expect(sessions.deviceId()).toBe('nuevo');
  });

  it('al cerrar sesión no se vuelve a adoptar la heredada', () => {
    const storage = fakeStorage();
    storage.data.set('review:principios:session', stored);
    const sessions = createSessionStorage(storage, 'review', [
      'review:principios',
    ]);
    expect(sessions.loadSession()).not.toBeNull();
    sessions.clearSession();
    expect(sessions.loadSession()).toBeNull();
    const reloaded = createSessionStorage(storage, 'review', [
      'review:principios',
    ]);
    expect(reloaded.loadSession()).toBeNull();
  });
});

describe('discoverLegacyPrefixes', () => {
  function withKeys(keys: string[]) {
    return { length: keys.length, key: (index: number) => keys[index] ?? null };
  }

  it('encuentra las sesiones por documento y no la del espacio', () => {
    const found = discoverLegacyPrefixes(
      withKeys([
        'review:principios:session',
        'review:principios:device',
        'review:session',
        'review:otro:session',
        'theme',
      ]),
      'review',
    );
    expect(found).toEqual(['review:principios', 'review:otro']);
  });

  it('sin almacenamiento no hay nada', () => {
    expect(discoverLegacyPrefixes(null, 'review')).toEqual([]);
  });
});
