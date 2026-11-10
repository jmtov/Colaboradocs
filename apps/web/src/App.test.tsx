// @vitest-environment happy-dom
import { render } from 'solid-js/web';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

const content = (id: string) => ({
  id,
  title: `Título de ${id}`,
  version: '0.1',
  updated: '2026-11-10',
  sources: [],
  sections: [
    {
      id: 'intro',
      num: '1',
      title: 'Introducción',
      status: 'borrador',
      html: '<p>Un párrafo de prueba.</p>',
    },
  ],
});
const listItem = (id: string) => ({
  id,
  title: `Título de ${id}`,
  description: null,
  version: '0.1',
  updated: '2026-11-10',
  openThreads: 0,
  comments: 0,
  approvals: 0,
  lastActivityAt: null,
});
const snapshot = {
  me: { id: 'r1', name: 'Ana', isAdmin: false, municipality: null },
  comments: [],
  approvals: [],
  reviewers: {},
};

const wait = (ms = 60) => new Promise((resolve) => setTimeout(resolve, ms));

/** Una API simulada: qué documentos existen y a qué URLs se llamó. */
function fakeApi(ids: string[]) {
  const calls: string[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      calls.push(url);
      const json = (body: unknown, status = 200) =>
        new Response(JSON.stringify(body), { status });
      if (url === '/api/space') return json({ name: 'Mi espacio' });
      if (url === '/api/documents') return json(ids.map(listItem));
      const match = /^\/api\/documents\/([^/]+)\/(content|review)$/.exec(url);
      if (match && ids.includes(match[1] ?? '')) {
        return match[2] === 'content'
          ? json(content(match[1] ?? ''))
          : json(snapshot);
      }
      return json({ error: 'not_found' }, 404);
    }),
  );
  return calls;
}

/** Cambia la URL como lo haría el navegador (y avisa al router). */
function go(path: string) {
  window.history.replaceState(null, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

const disposers: (() => void)[] = [];

function mount() {
  const host = document.createElement('div');
  document.body.appendChild(host);
  disposers.push(render(() => <App />, host));
  return host;
}

beforeEach(() => {
  localStorage.setItem(
    'review:session',
    JSON.stringify({ token: 't', reviewer: snapshot.me }),
  );
  window.scrollTo = () => {};
});

afterEach(() => {
  // Desmontar de verdad: si no, la app anterior sigue reaccionando a las rutas.
  for (const dispose of disposers.splice(0)) dispose();
  document.body.innerHTML = '';
  localStorage.clear();
  go('/');
  vi.unstubAllGlobals();
});

describe('App', () => {
  it('con un solo documento, / lleva directo a él', async () => {
    const calls = fakeApi(['uno']);
    const host = mount();
    await wait(120);
    expect(window.location.pathname).toBe('/d/uno');
    expect(host.textContent).toContain('Título de uno');
    expect(host.textContent).toContain('Un párrafo de prueba.');
    expect(calls).toContain('/api/documents/uno/content');
    expect(document.title).toBe('Mi espacio');
  });

  it('con varios documentos, / es la home y cada tarjeta abre el suyo', async () => {
    fakeApi(['uno', 'dos']);
    const host = mount();
    await wait(80);
    expect(window.location.pathname).toBe('/');
    expect(host.querySelector('h1')?.textContent).toBe('Mi espacio');
    expect(
      [...host.querySelectorAll('a')].map((a) => a.getAttribute('href')),
    ).toEqual(['/d/uno', '/d/dos']);
  });

  it('un documento que no existe muestra «no encontramos»', async () => {
    fakeApi(['uno', 'dos']);
    go('/d/nada');
    const host = mount();
    await wait(120);
    expect(host.textContent).toContain('No encontramos ese documento');
  });

  it('una ruta desconocida también', async () => {
    fakeApi(['uno', 'dos']);
    go('/cualquier/cosa');
    const host = mount();
    await wait(60);
    expect(host.textContent).toContain('No encontramos ese documento');
  });

  it('al navegar entre páginas, la actual sale y después entra la nueva', async () => {
    fakeApi(['uno', 'dos']);
    // happy-dom no calcula transiciones: se simula una duración corta para ver las fases
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      transitionDuration: '0.1s',
    } as CSSStyleDeclaration);
    const host = mount();
    await wait(80);
    const page = host.querySelector('[data-phase]') as HTMLElement;
    expect(page.dataset.phase).toBe('idle');
    expect(host.querySelector('h1')?.textContent).toBe('Mi espacio');

    (host.querySelector('a[href="/d/uno"]') as HTMLAnchorElement).click();
    // saliendo: la URL ya cambió pero se sigue viendo la home, desvanecida
    expect(window.location.pathname).toBe('/d/uno');
    expect(page.dataset.phase).toBe('leaving');
    expect(host.querySelector('h1')?.textContent).toBe('Mi espacio');

    await wait(260);
    // ya entró la página nueva
    expect(page.dataset.phase).toBe('idle');
    expect(host.textContent).toContain('Un párrafo de prueba.');
    expect(host.textContent).not.toContain('Mi espacio /');
    vi.restoreAllMocks();
  });
});
