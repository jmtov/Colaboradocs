// @vitest-environment happy-dom
import { render } from 'solid-js/web';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';

const me = { id: 'r1', name: 'Ana', isAdmin: false, municipality: null };

function task(id: string, title: string, dueDate: string, extra = {}) {
  return {
    id,
    title,
    documentId: null,
    documentTitle: null,
    blockId: null,
    assigneeId: 'r1',
    assigneeName: 'Ana',
    assigneeMunicipality: null,
    dueDate,
    doneAt: null,
    createdById: 'r1',
    createdByName: 'Ana',
    createdAt: '2026-11-01T10:00:00.000Z',
    ...extra,
  };
}

const wait = (ms = 60) => new Promise((resolve) => setTimeout(resolve, ms));
const disposers: (() => void)[] = [];

Object.assign(HTMLElement.prototype, {
  togglePopover() {},
  showPopover() {},
  hidePopover() {},
});

type Calls = { patches: { url: string; body: unknown }[]; deletes: string[] };

const edits = (host: HTMLElement) =>
  host.querySelectorAll('button[aria-label="Editar la tarea"]');

function fakeApi(initial: object[]) {
  const calls: Calls = { patches: [], deletes: [] };
  let tasks = [...initial] as { id: string; doneAt: string | null }[];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: RequestInit) => {
      const json = (body: unknown, status = 200) =>
        new Response(JSON.stringify(body), { status });
      const method = init?.method ?? 'GET';
      if (url === '/api/space') return json({ name: 'Mi espacio' });
      if (url === '/api/documents') return json([]);
      if (url === '/api/tasks' && method === 'GET') return json(tasks);
      if (url.startsWith('/api/tasks/') && method === 'PATCH') {
        const body = JSON.parse(String(init?.body));
        calls.patches.push({ url, body });
        const id = url.split('/').at(-1);
        tasks = tasks.map((item) => {
          if (item.id !== id) return item;
          if (body.done === undefined) return { ...item, ...body };
          return {
            ...item,
            doneAt: body.done ? '2026-11-19T12:00:00.000Z' : null,
          };
        });
        return json(tasks.find((item) => item.id === id));
      }
      if (url.startsWith('/api/tasks/') && method === 'DELETE') {
        calls.deletes.push(url);
        tasks = tasks.filter((item) => item.id !== url.split('/').at(-1));
        return new Response(null, { status: 204 });
      }
      return json({ error: 'not_found' }, 404);
    }),
  );
  return calls;
}

function mount() {
  const host = document.createElement('div');
  document.body.appendChild(host);
  disposers.push(render(() => <App />, host));
  return host;
}

beforeEach(() => {
  localStorage.setItem(
    'review:session',
    JSON.stringify({ token: 't', reviewer: me }),
  );
  localStorage.setItem('review:howto-dismissed', '1');
  window.history.replaceState(null, '', '/tareas');
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo = () => {};
});

afterEach(() => {
  for (const dispose of disposers.splice(0)) dispose();
  document.body.innerHTML = '';
  localStorage.clear();
  vi.unstubAllGlobals();
});

const titles = (host: HTMLElement) =>
  [...host.querySelectorAll('li span[class*="title"]')].map(
    (item) => item.textContent,
  );
const groupTitles = (host: HTMLElement) =>
  [...host.querySelectorAll('h2')].map((item) => item.textContent);

describe('Mis tareas', () => {
  it('muestra las tareas por grupo: vencidas, esta semana, más adelante y hechas', async () => {
    const today = new Date();
    const iso = (days: number) => {
      const date = new Date(today);
      date.setDate(date.getDate() + days);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };
    fakeApi([
      task('a', 'Vieja', iso(-3)),
      task('b', 'De la semana', iso(2)),
      task('c', 'Lejana', iso(60)),
      task('d', 'Cerrada', iso(-10), { doneAt: '2026-11-01T00:00:00.000Z' }),
    ]);
    const host = mount();
    await wait(200);
    expect(host.querySelector('h1')?.textContent).toBe('Mis tareas');
    expect(groupTitles(host).map((t) => t?.replace(/\d+$/, ''))).toEqual([
      'Vencidas',
      'Esta semana',
      'Más adelante',
      'Hechas',
    ]);
    expect(titles(host)).toEqual([
      'Vieja',
      'De la semana',
      'Lejana',
      'Cerrada',
    ]);
    expect(host.textContent).toContain('Vencida');
  });

  it('sin tareas lo dice y ofrece crear una', async () => {
    fakeApi([]);
    const host = mount();
    await wait(200);
    expect(host.textContent).toContain('No tienes tareas');
    expect(host.textContent).toContain('Nueva tarea');
  });

  it('marcar una tarea la manda a «Hechas» y reabrirla la devuelve', async () => {
    const calls = fakeApi([task('a', 'Escribir', '2099-01-01')]);
    const host = mount();
    await wait(200);
    host
      .querySelector<HTMLButtonElement>(
        'button[aria-label="Marcar como hecha"]',
      )
      ?.click();
    await wait(200);
    expect(calls.patches[0]).toMatchObject({
      url: '/api/tasks/a',
      body: { done: true },
    });
    expect(groupTitles(host).map((t) => t?.replace(/\d+$/, ''))).toEqual([
      'Hechas',
    ]);
    host
      .querySelector<HTMLButtonElement>('button[aria-label="Reabrir la tarea"]')
      ?.click();
    await wait(200);
    expect(calls.patches[1]?.body).toEqual({ done: false });
    expect(groupTitles(host).map((t) => t?.replace(/\d+$/, ''))).toEqual([
      'Más adelante',
    ]);
  });

  it('solo ofrece borrar las que creó la persona (o todas si es admin)', async () => {
    const calls = fakeApi([
      task('a', 'Mía', '2099-01-01'),
      task('b', 'De otra persona', '2099-01-02', { createdById: 'r9' }),
    ]);
    const host = mount();
    await wait(200);
    const deletes = host.querySelectorAll(
      'button[aria-label="Eliminar la tarea"]',
    );
    expect(deletes).toHaveLength(1);
    (deletes[0] as HTMLButtonElement).click();
    await wait(200);
    expect(calls.deletes).toEqual(['/api/tasks/a']);
    expect(titles(host)).toEqual(['De otra persona']);
  });

  it('solo ofrece editar las que creó la persona, y el cambio se ve en la lista', async () => {
    const calls = fakeApi([
      task('a', 'Mía', '2099-01-01'),
      task('b', 'De otra persona', '2099-01-02', { createdById: 'r9' }),
    ]);
    const host = mount();
    await wait(200);
    expect(edits(host)).toHaveLength(1);
    (edits(host)[0] as HTMLButtonElement).click();
    await wait(300);
    const title = document.body.querySelector(
      'dialog[open] input',
    ) as HTMLInputElement;
    expect(title.value).toBe('Mía');
    title.value = 'Mía, ajustada';
    title.dispatchEvent(new Event('input', { bubbles: true }));
    await wait(20);
    const save = [...document.body.querySelectorAll('button')]
      .filter((item) => item.textContent?.trim() === 'Guardar')
      .at(-1);
    save?.click();
    await wait(300);
    expect(calls.patches[0]).toEqual({
      url: '/api/tasks/a',
      body: { title: 'Mía, ajustada' },
    });
    expect(titles(host)).toContain('Mía, ajustada');
  });
});
