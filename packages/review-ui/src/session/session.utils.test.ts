import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSessionStorage, randomDeviceId } from './session.utils';

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
