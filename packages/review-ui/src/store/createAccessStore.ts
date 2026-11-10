import type {
  IssuedPin,
  ManagedReviewer,
  NewReviewer,
} from '@juntanza/review-core';
import { createSignal, untrack } from 'solid-js';
import type { ReviewApi } from '../api/review.api';
import { describeAccessError } from './review.messages';

export type AccessOutcome = { ok: true } | { ok: false; message: string };

/** Estado de la pantalla de accesos (solo admins). Cada acción recarga la lista real. */
export function createAccessStore(api: ReviewApi) {
  const [people, setPeople] = createSignal<ManagedReviewer[] | null>(null);
  const [status, setStatus] = createSignal<
    'idle' | 'loading' | 'ready' | 'error'
  >('idle');
  /** El último PIN entregado: se muestra una sola vez y se descarta al cerrar. */
  const [issued, setIssued] = createSignal<IssuedPin | null>(null);

  /**
   * Pide la lista. No lee `people()` de forma reactiva: quien llame a `load`
   * desde un efecto no debe quedar suscrito a su propio resultado (sería un bucle).
   */
  async function load() {
    if (untrack(() => people() === null)) setStatus('loading');
    try {
      setPeople(await api.listPeople());
      setStatus('ready');
    } catch {
      if (people() === null) setStatus('error');
    }
  }

  async function act<T>(
    action: () => Promise<T>,
  ): Promise<AccessOutcome & { value?: T }> {
    try {
      const value = await action();
      await load();
      return { ok: true, value };
    } catch (error) {
      // Si el servidor cambió (p. ej. alguien ya la eliminó), la lista se corrige sola.
      await load();
      return { ok: false, message: describeAccessError(error) };
    }
  }

  async function add(person: NewReviewer): Promise<AccessOutcome> {
    const result = await act(() => api.addPerson(person));
    if (result.ok && result.value) setIssued(result.value);
    return result.ok ? { ok: true } : result;
  }

  async function regeneratePin(id: string): Promise<AccessOutcome> {
    const result = await act(() => api.regeneratePin(id));
    if (result.ok && result.value) setIssued(result.value);
    return result.ok ? { ok: true } : result;
  }

  return {
    people,
    status,
    issued,
    clearIssued: () => setIssued(null),
    load,
    add,
    regeneratePin,
    setAdmin: (id: string, isAdmin: boolean) =>
      act(() => api.patchPerson(id, { isAdmin })),
    setRole: (id: string, municipality: string) =>
      act(() => api.patchPerson(id, { municipality })),
    remove: (id: string) => act(() => api.removePerson(id)),
    resetDevices: (id: string) => act(() => api.resetDevices(id)),
  };
}

export type AccessStore = ReturnType<typeof createAccessStore>;
