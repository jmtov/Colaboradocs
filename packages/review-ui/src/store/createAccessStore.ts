import type { ManagedReviewer, NewReviewer } from '@colaboradocs/review-core';
import { createSignal, untrack } from 'solid-js';
import type { ReviewApi } from '../api/review.api';
import { describeAccessError } from './review.messages';

/** Resultado de una acción de accesos: el valor si sale bien, el mensaje si falla. */
export type AccessOutcome<T = void> =
  | { ok: true; value: T }
  | { ok: false; message: string };

/** Estado de la pantalla de accesos (solo admins). Cada acción recarga la lista real. */
export function createAccessStore(api: ReviewApi) {
  const [people, setPeople] = createSignal<ManagedReviewer[] | null>(null);
  const [status, setStatus] = createSignal<
    'idle' | 'loading' | 'ready' | 'error'
  >('idle');

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

  async function act<T>(action: () => Promise<T>): Promise<AccessOutcome<T>> {
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

  return {
    people,
    status,
    load,
    // Alta y regenerar PIN devuelven el PIN entregado: quien llama lo muestra.
    add: (person: NewReviewer) => act(() => api.addPerson(person)),
    regeneratePin: (id: string) => act(() => api.regeneratePin(id)),
    setAdmin: (id: string, isAdmin: boolean) =>
      act(() => api.patchPerson(id, { isAdmin })),
    setRole: (id: string, municipality: string) =>
      act(() => api.patchPerson(id, { municipality })),
    remove: (id: string) => act(() => api.removePerson(id)),
    resetDevices: (id: string) => act(() => api.resetDevices(id)),
  };
}

export type AccessStore = ReturnType<typeof createAccessStore>;
