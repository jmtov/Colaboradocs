// @vitest-environment happy-dom
// Prueba de regresión: si una recarga vuelve a dispararse a sí misma en bucle, esta
// prueba NO termina (las respuestas simuladas son inmediatas y acaparan el hilo).
import { render } from 'solid-js/web';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

// happy-dom no implementa el popover del menú: al pulsar, no pasa nada y la hoja abre al instante.
Object.assign(HTMLElement.prototype, { togglePopover() {}, hidePopover() {} });

/** Abre «Documentos» desde el menú de la sesión, como lo hace el admin. */
function openDocumentsFromMenu(host: HTMLElement) {
  host
    .querySelector<HTMLButtonElement>('button[aria-label="Menú de la sesión"]')
    ?.click();
  [...host.querySelectorAll('button')]
    .find((item) => item.textContent?.includes('Documentos'))
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

describe('App (admin) con la hoja de documentos abierta', () => {
  it('no entra en un bucle de recargas ni deja la revisión «cargando»', async () => {
    const calls = fakeApi();
    const host = document.createElement('div');
    document.body.appendChild(host);
    disposers.push(render(() => <App />, host));
    await wait(120);
    const reviewsBefore = calls.filter((url) => url.endsWith('/review')).length;
    const listsBefore = calls.filter((url) => url === '/api/documents').length;

    openDocumentsFromMenu(host);
    await wait(400);

    const reviews =
      calls.filter((url) => url.endsWith('/review')).length - reviewsBefore;
    const lists =
      calls.filter((url) => url === '/api/documents').length - listsBefore;
    // Abrir la hoja pide la lista una vez; no debe reiniciar la revisión una y otra vez.
    // La hoja de documentos está abierta de verdad (si no, la prueba no dice nada).
    expect(host.querySelector('dialog[open]')).not.toBeNull();
    expect(lists).toBeLessThanOrEqual(2);
    expect(reviews).toBeLessThanOrEqual(1);
    expect(host.textContent).not.toContain('Cargando revisión');
  });
});
