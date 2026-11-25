import type { Task } from '@colaboradocs/review-core';
import { describe, expect, it, vi } from 'vitest';
import type { ReviewApi } from '../api/review.api';
import { createTasksStore } from './createTasksStore';

const task = (id: string): Task => ({ id }) as Task;

function storeWith(fetchDocumentTasks: (id: string) => Promise<Task[]>) {
  const api = {
    fetchDocumentTasks,
    patchTask: vi.fn(async () => undefined),
  } as unknown as ReviewApi;
  return createTasksStore(api);
}

describe('createTasksStore: tareas de un documento', () => {
  it('al marcar una tarea no se vacía la lista mientras se recarga (si no, la página encoge y el scroll salta)', async () => {
    let resolveReload: (tasks: Task[]) => void = () => {};
    let calls = 0;
    const store = storeWith(() => {
      calls += 1;
      return calls === 1
        ? Promise.resolve([task('a')])
        : new Promise<Task[]>((resolve) => {
            resolveReload = resolve;
          });
    });
    await store.loadForDocument('doc');
    expect(store.documentTasks()).toHaveLength(1);

    const pending = store.setDone('a', true);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(store.documentTasks()).toHaveLength(1);
    resolveReload([task('a'), task('b')]);
    await pending;
    expect(store.documentTasks()).toHaveLength(2);
  });

  it('al cambiar de documento sí se vacía, para no mostrar las del anterior', async () => {
    const store = storeWith((id) =>
      id === 'uno' ? Promise.resolve([task('a')]) : new Promise(() => {}),
    );
    await store.loadForDocument('uno');
    void store.loadForDocument('dos');
    expect(store.documentTasks()).toBeNull();
  });
});
