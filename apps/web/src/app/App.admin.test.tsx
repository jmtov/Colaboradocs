// @vitest-environment happy-dom
// Prueba de regresión: si una recarga vuelve a dispararse a sí misma en bucle, esta
// prueba NO termina (las respuestas simuladas son inmediatas y acaparan el hilo).
import { render } from 'solid-js/web';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { openMenus } from '@/shared/test/openMenus';
import App from './App';

const admin = { id: 'r1', name: 'Ana', isAdmin: true, municipality: null };
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

const wait = (ms = 60) => new Promise((resolve) => setTimeout(resolve, ms));
const disposers: (() => void)[] = [];

// happy-dom no implementa el popover del menú: al pulsar, no pasa nada y se navega al instante.
Object.assign(HTMLElement.prototype, {
  togglePopover() {},
  showPopover() {},
  hidePopover() {},
});

/** Pulsa «Accesos» en el menú de la sesión, como lo hace el admin. */
function openAccessFromMenu(host: HTMLElement) {
  host
    .querySelector<HTMLButtonElement>('button[aria-label="Menú de la sesión"]')
    ?.click();
  openMenus(host);
  [...host.querySelectorAll('button')]
    .find((item) => item.textContent?.includes('Accesos'))
    ?.click();
}

/** Cuenta a qué URLs se llamó. */
function fakeApi() {
  const calls: string[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      calls.push(url);
      const json = (body: unknown, status = 200) =>
        new Response(JSON.stringify(body), { status });
      if (url === '/api/space') return json({ name: 'Mi espacio' });
      if (url === '/api/documents') return json([listItem]);
      if (url === '/api/documents/uno/content') return json(content);
      if (url === '/api/admin/reviewers') return json([]);
      if (url === '/api/documents/uno/review') {
        return json({ me: admin, comments: [], approvals: [], reviewers: {} });
      }
      return json({ error: 'not_found' }, 404);
    }),
  );
  return calls;
}

beforeEach(() => {
  localStorage.setItem(
    'review:session',
    JSON.stringify({ token: 't', reviewer: admin }),
  );
  // Ya vio la guía: no queremos que se abra sola en estas pruebas.
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

function mountApp() {
  const host = document.createElement('div');
  document.body.appendChild(host);
  disposers.push(render(() => <App />, host));
  return host;
}

const goTo = (path: string) => {
  window.history.replaceState(null, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
};

describe('páginas de administración', () => {
  it('«Accesos» del menú lleva a su página, no abre una hoja', async () => {
    fakeApi();
    const host = mountApp();
    await wait(120);

    openAccessFromMenu(host);
    await wait(500);

    expect(window.location.pathname).toBe('/accesos');
    expect(host.querySelector('h1')?.textContent).toBe('Accesos');
    // «← Inicio» está en la barra superior, no suelto en el contenido.
    expect(
      host.querySelector('header a[href="/"]')?.getAttribute('aria-label'),
    ).toBe('Inicio');
    expect(host.querySelector('main a[href="/"]')).toBeNull();
    expect(host.querySelector('dialog[open]')).toBeNull();
  });

  it('el menú ya no lleva a «Documentos» ni «Mis tareas» (están en la home) y /documentos no existe', async () => {
    fakeApi();
    const host = mountApp();
    await wait(120);
    openMenus(host);
    const menu = host.querySelector('[popover]')?.textContent ?? '';
    expect(menu).not.toContain('Documentos');
    expect(menu).not.toContain('Mis tareas');
    expect(menu).not.toContain('Sesión');
    goTo('/documentos');
    await wait(500);
    expect(host.querySelector('h1')?.textContent).not.toBe('Documentos');
  });

  it('entrar directo a /accesos muestra la lista de personas', async () => {
    const calls = fakeApi();
    goTo('/accesos');
    const host = mountApp();
    await wait(300);

    expect(host.querySelector('h1')?.textContent).toBe('Accesos');
    expect(host.textContent).toContain('Agregar persona');
    expect(calls.filter((url) => url === '/api/admin/reviewers')).toHaveLength(
      1,
    );
  });

  it('no entra en un bucle de recargas ni deja la revisión «cargando»', async () => {
    const calls = fakeApi();
    goTo('/accesos');
    const host = mountApp();
    await wait(400);

    const lists = calls.filter((url) => url === '/api/documents').length;
    const reviews = calls.filter((url) => url.endsWith('/review')).length;
    // La página pide la lista una vez; no reinicia la revisión una y otra vez.
    expect(lists).toBeLessThanOrEqual(2);
    expect(reviews).toBeLessThanOrEqual(1);
    expect(host.textContent).not.toContain('Cargando revisión');
  });

  it('quien no es admin no ve la administración', async () => {
    fakeApi();
    localStorage.setItem(
      'review:session',
      JSON.stringify({
        token: 't',
        reviewer: { ...admin, isAdmin: false },
      }),
    );
    goTo('/accesos');
    const host = mountApp();
    await wait(300);

    expect(host.textContent).toContain('Solo para administradores');
    expect(host.textContent).not.toContain('Agregar persona');
  });
});
