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

/** Los menús de acciones de las tareas: solo hay uno por tarea que la persona puede cambiar. */
const menus = (host: HTMLElement) =>
  host.querySelectorAll('button[aria-label^="Acciones de la tarea"]');

const menuItem = (host: HTMLElement, label: string) =>
  [...host.querySelectorAll<HTMLButtonElement>('[popover] button')].find(
    (item) => item.textContent?.trim() === label,
  );

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

describe('Tareas', () => {
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
    expect(
      host.querySelector('nav [aria-current="page"]')?.textContent,
    ).toContain('Tareas');
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

  it('solo ofrece eliminar las que creó la persona (o todas si es admin), con confirmación', async () => {
    const calls = fakeApi([
      task('a', 'Mía', '2099-01-01'),
      task('b', 'De otra persona', '2099-01-02', { createdById: 'r9' }),
    ]);
    const host = mount();
    await wait(200);
    expect(menus(host)).toHaveLength(1);
    menuItem(host, 'Eliminar')?.click();
    await wait(50);
    // pide confirmar antes de borrar
    expect(calls.deletes).toEqual([]);
    const confirm = [
      ...host.querySelectorAll<HTMLButtonElement>('[popover] button'),
    ].find((item) => item.textContent?.trim() === 'Eliminar');
    confirm?.click();
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
    expect(menus(host)).toHaveLength(1);
    menuItem(host, 'Editar')?.click();
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

  describe('buscar y filtrar', () => {
    const buttonByText = (root: ParentNode, text: string) =>
      [...root.querySelectorAll('button')].find((item) =>
        item.textContent?.trim().startsWith(text),
      );

    const withDocuments = () =>
      fakeApi([
        task('a', 'Llamar a Juan', '2099-01-01', {
          documentId: 'amo',
          documentTitle: 'Votación AMO',
        }),
        task('b', 'Escribir el acta', '2099-01-02', {
          documentId: 'comms',
          documentTitle: 'Comunicaciones',
        }),
        task('c', 'Revisar la agenda', '2099-01-03', {
          documentId: 'ejes',
          documentTitle: 'Ejes 2027',
        }),
        task('d', 'Suelta', '2099-01-04'),
      ]);

    it('el buscador filtra por el título de la tarea o el de su documento, sin tildes', async () => {
      withDocuments();
      const host = mount();
      await wait(200);
      const input = host.querySelector<HTMLInputElement>(
        'input[type="search"]',
      );
      if (!input) throw new Error('falta el buscador');
      input.value = 'votacion';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await wait();
      expect(titles(host)).toEqual(['Llamar a Juan']);
      input.value = 'ACTA';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await wait();
      expect(titles(host)).toEqual(['Escribir el acta']);
    });

    it('los documentos se eligen en una hoja aparte, con buscador y casillas, y el botón de la barra los quita', async () => {
      withDocuments();
      const host = mount();
      await wait(200);
      expect(titles(host)).toHaveLength(4);
      const last = (text: string) =>
        [...document.querySelectorAll('button')]
          .filter((item) => item.textContent?.trim().startsWith(text))
          .at(-1);
      buttonByText(host, 'Filtros')?.click();
      await wait(80);
      // La hoja de filtros solo muestra una fila; los documentos están en otra hoja.
      expect(document.querySelectorAll('input[type="checkbox"]')).toHaveLength(
        0,
      );
      last('Todos')?.click();
      await wait(80);
      const checkboxes = () => [
        ...document.querySelectorAll<HTMLInputElement>(
          'input[type="checkbox"]',
        ),
      ];
      expect(checkboxes()).toHaveLength(3);
      // El buscador de la hoja reduce la lista.
      const search = [
        ...document.querySelectorAll<HTMLInputElement>('input[type="search"]'),
      ].at(-1);
      if (!search) throw new Error('falta el buscador de la hoja');
      search.value = 'votacion';
      search.dispatchEvent(new Event('input', { bubbles: true }));
      await wait();
      expect(checkboxes()).toHaveLength(1);
      search.value = '';
      search.dispatchEvent(new Event('input', { bubbles: true }));
      await wait();
      checkboxes()[0]?.click();
      checkboxes()[2]?.click();
      last('Aplicar')?.click();
      await wait(80);
      // De vuelta en la hoja de filtros, la fila dice cuántos hay.
      expect(document.body.textContent).toContain('2 documentos');
      last('Aplicar')?.click();
      await wait(80);
      expect(titles(host)).toHaveLength(2);
      const chip = host.querySelector('[aria-label^="Quitar el filtro"]');
      expect(chip?.textContent).toContain('2 documentos');
      (chip as HTMLElement).click();
      await wait();
      expect(titles(host)).toHaveLength(4);
    });

    it('ya no hay selector de documento en la barra', async () => {
      withDocuments();
      const host = mount();
      await wait(200);
      expect(host.querySelector('select')).toBeNull();
    });
  });
});
