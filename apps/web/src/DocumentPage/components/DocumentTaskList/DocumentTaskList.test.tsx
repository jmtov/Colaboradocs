// @vitest-environment happy-dom
import { render } from 'solid-js/web';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '@/App';

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
      if (url.startsWith('/api/tasks/') && init?.method === 'PATCH') {
        patches.push({ url, body: JSON.parse(String(init.body)) });
        return json({});
      }
      return json({ error: 'not_found' }, 404);
    }),
  );
  return patches;
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
    const patches = fakeApi([
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

  it('sin tareas no aparece la sección', async () => {
    fakeApi([]);
    const host = mount();
    await wait(300);
    expect(host.querySelector('#tareas')).toBeNull();
  });
});
