// @vitest-environment happy-dom
import { render } from 'solid-js/web';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '@/app/App';
import { openMenus } from '@/shared/test/openMenus';

const me = { id: 'r1', name: 'Ana', isAdmin: false, municipality: null };
const content = {
  id: 'uno',
  title: 'Título de uno',
  version: '0.1',
  updated: '2026-11-10',
  sources: [],
  sections: [
    {
      id: 'intro',
      num: '1',
      title: 'Introducción',
      status: 'borrador',
      html: '<p>Un párrafo.</p>',
    },
  ],
};
const listItem = {
  id: 'uno',
  title: 'Título de uno',
  description: null,
  version: '0.1',
  updated: '2026-11-10',
  openThreads: 0,
  comments: 0,
  approvals: 0,
  lastActivityAt: null,
};

function task(id: string, title: string, assigneeId: string, extra = {}) {
  return {
    id,
    title,
    documentId: 'uno',
    documentTitle: 'Título de uno',
    blockId: null,
    assigneeId,
    assigneeName: assigneeId === 'r1' ? 'Ana' : 'Luis Gómez',
    assigneeMunicipality: assigneeId === 'r1' ? null : 'Guarne',
    dueDate: '2099-01-01',
    doneAt: null,
    createdById: 'r9',
    createdByName: 'Quique',
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

function fakeApi(tasks: object[]) {
  const patches: { url: string; body: unknown }[] = [];
  const created: unknown[] = [];
  const deleted: string[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: RequestInit) => {
      const json = (body: unknown, status = 200) =>
        new Response(JSON.stringify(body), { status });
      if (url === '/api/space') return json({ name: 'Mi espacio' });
      if (url === '/api/documents') return json([listItem]);
      if (url === '/api/documents/uno/content') return json(content);
      if (url === '/api/documents/uno/review') {
        return json({ me, comments: [], approvals: [], reviewers: {} });
      }
      if (url === '/api/tasks?document=uno') return json(tasks);
      if (url === '/api/tasks' && init?.method === 'POST') {
        created.push(JSON.parse(String(init.body)));
        return json({});
      }
      if (url.startsWith('/api/tasks/') && init?.method === 'DELETE') {
        deleted.push(url);
        return json({});
      }
      if (url.startsWith('/api/tasks/') && init?.method === 'PATCH') {
        patches.push({ url, body: JSON.parse(String(init.body)) });
        return json({});
      }
      return json({ error: 'not_found' }, 404);
    }),
  );
  return { patches, created, deleted };
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
  window.history.replaceState(null, '', '/d/uno');
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo = () => {};
});

afterEach(() => {
  for (const dispose of disposers.splice(0)) dispose();
  document.body.innerHTML = '';
  localStorage.clear();
  vi.unstubAllGlobals();
});

describe('Tareas al pie del documento', () => {
  it('lista las tareas de todas las personas, con quién las tiene', async () => {
    fakeApi([task('a', 'Mía', 'r1'), task('b', 'De Luis', 'r2')]);
    const host = mount();
    await wait(300);
    const section = host.querySelector('#tareas') as HTMLElement;
    expect(section.querySelector('h2')?.textContent).toBe('Tareas');
    expect(section.textContent).toContain('Mía');
    expect(section.textContent).toContain('De Luis');
    expect(section.textContent).toContain('Luis Gómez (Guarne)');
  });

  it('solo se pueden marcar las propias: las de otras personas no responden', async () => {
    const { patches } = fakeApi([
      task('a', 'Mía', 'r1'),
      task('b', 'De Luis', 'r2'),
    ]);
    const host = mount();
    await wait(300);
    const checks = [
      ...host.querySelectorAll<HTMLButtonElement>(
        '#tareas button[aria-pressed]',
      ),
    ];
    expect(checks.map((item) => item.disabled)).toEqual([false, true]);
    checks[0]?.click();
    await wait(200);
    expect(patches).toEqual([{ url: '/api/tasks/a', body: { done: true } }]);
  });

  it('sin tareas la sección sigue, para poder crear la primera', async () => {
    fakeApi([]);
    const host = mount();
    await wait(300);
    const section = host.querySelector('#tareas') as HTMLElement;
    expect(section.querySelectorAll('li')).toHaveLength(0);
    expect(section.textContent).toContain('Nueva tarea');
  });

  it('«Nueva tarea» crea una de este documento, sin entrar al editor', async () => {
    const { created } = fakeApi([]);
    const host = mount();
    await wait(300);
    button(host, 'Nueva tarea').click();
    await wait(300);
    // el documento ya está dado: no hay selector
    expect(document.body.querySelector('dialog[open] select')).toBeNull();
    const [title, date] = [
      ...document.body.querySelectorAll('dialog[open] input'),
    ] as HTMLInputElement[];
    if (!title || !date) throw new Error('faltan los campos de la tarea');
    write(title, 'Invitar a los de Guarne');
    write(date, '2099-02-03');
    await wait(20);
    button(document.body, 'Crear tarea').click();
    await wait(300);
    expect(created).toMatchObject([
      {
        title: 'Invitar a los de Guarne',
        dueDate: '2099-02-03',
        documentId: 'uno',
      },
    ]);
  });

  it('el menú solo aparece en las tareas que la persona puede cambiar', async () => {
    fakeApi([
      task('a', 'Creada por mí', 'r2', { createdById: 'r1' }),
      task('b', 'De otra persona', 'r2'),
    ]);
    const host = mount();
    await wait(300);
    const menus = host.querySelectorAll(
      '#tareas button[aria-label^="Acciones de la tarea"]',
    );
    expect(menus).toHaveLength(1);
    expect(menus[0]?.getAttribute('aria-label')).toContain('Creada por mí');
  });

  it('«Editar» cambia el título y la fecha, y envía solo lo que cambió', async () => {
    const { patches } = fakeApi([
      task('a', 'Escribir', 'r1', { createdById: 'r1' }),
    ]);
    const host = mount();
    await wait(300);
    item(host, 'Editar').click();
    await wait(300);
    const [title, date] = [
      ...document.body.querySelectorAll('dialog[open] input'),
    ] as HTMLInputElement[];
    if (!title || !date) throw new Error('faltan los campos de la tarea');
    expect(title.value).toBe('Escribir');
    write(title, 'Escribir a todas');
    write(date, '2099-03-04');
    await wait(20);
    button(document.body, 'Guardar').click();
    await wait(300);
    expect(patches).toEqual([
      {
        url: '/api/tasks/a',
        body: { title: 'Escribir a todas', dueDate: '2099-03-04' },
      },
    ]);
  });

  it('«Eliminar» pide confirmar y luego borra la tarea', async () => {
    const { deleted } = fakeApi([
      task('a', 'Escribir', 'r1', { createdById: 'r1' }),
    ]);
    const host = mount();
    await wait(300);
    item(host, 'Eliminar').click();
    await wait(50);
    expect(deleted).toEqual([]);
    item(host, 'Eliminar').click();
    await wait(200);
    expect(deleted).toEqual(['/api/tasks/a']);
  });
});

function item(host: HTMLElement, label: string) {
  openMenus(host);
  const found = [
    ...host.querySelectorAll<HTMLButtonElement>('#tareas [popover] button'),
  ].find((element) => element.textContent?.trim().startsWith(label));
  if (!found) throw new Error(`no hay «${label}»`);
  return found;
}

function button(root: HTMLElement, label: string) {
  const found = [...root.querySelectorAll('button')].find(
    (element) => element.textContent?.trim() === label,
  );
  if (!found) throw new Error(`no hay botón «${label}»`);
  return found;
}

function write(input: HTMLInputElement, value: string) {
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}
