// @vitest-environment happy-dom
import {
  type OverlayApi,
  ReviewProvider,
  useOverlay,
} from '@colaboradocs/review-ui';
import { render } from 'solid-js/web';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import NewDocumentSheet from './NewDocumentSheet';

const admin = { id: 'r1', name: 'Ana', isAdmin: true, municipality: null };
const wait = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));
const disposers: (() => void)[] = [];

type Put = {
  url: string;
  body: { content: { id: string; title: string }; expectedRevision: number };
};

/** Una API simulada: guarda los borradores que se envían y devuelve una lista de documentos. */
function fakeApi(existing: { id: string; title: string }[] = [], fail = false) {
  const puts: Put[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: RequestInit) => {
      const json = (body: unknown, status = 200) =>
        new Response(JSON.stringify(body), { status });
      if (init?.method === 'PUT' && url.endsWith('/draft')) {
        puts.push({ url, body: JSON.parse(String(init.body)) });
        return fail
          ? json({ error: 'conflict' }, 409)
          : json({ revision: 1, updatedAt: 'ahora', stale: false });
      }
      if (url === '/api/documents') return json(existing);
      return json({ error: 'not_found' }, 404);
    }),
  );
  return puts;
}

let overlay!: OverlayApi;

/** Captura la API de hojas del ReviewProvider: así se abre la hoja como en la app. */
function Probe() {
  overlay = useOverlay();
  return null;
}

function mount() {
  const host = document.createElement('div');
  document.body.appendChild(host);
  disposers.push(
    render(
      () => (
        <ReviewProvider>
          <Probe />
        </ReviewProvider>
      ),
      host,
    ),
  );
  void overlay.sheet(NewDocumentSheet, {});
  return host;
}

const inputs = (host: HTMLElement) =>
  [...host.querySelectorAll('input')] as HTMLInputElement[];

function type(input: HTMLInputElement, value: string) {
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

const button = (host: HTMLElement, text: string) =>
  [...host.querySelectorAll('button')].find((b) =>
    b.textContent?.includes(text),
  ) as HTMLButtonElement;

beforeEach(() => {
  localStorage.setItem(
    'review:session',
    JSON.stringify({ token: 't', reviewer: admin }),
  );
});

afterEach(() => {
  for (const dispose of disposers.splice(0)) dispose();
  document.body.innerHTML = '';
  localStorage.clear();
  vi.unstubAllGlobals();
  window.history.replaceState(null, '', '/');
});

describe('NewDocumentSheet', () => {
  it('empieza con «Crear» desactivado', async () => {
    fakeApi();
    const host = mount();
    await wait();
    expect(button(host, 'Crear').disabled).toBe(true);
  });

  it('el id sigue al título hasta que se escribe a mano', async () => {
    fakeApi();
    const host = mount();
    await wait();
    const [title, id] = inputs(host) as [HTMLInputElement, HTMLInputElement];
    type(title, 'Agenda del 22');
    expect(id.value).toBe('agenda-del-22');
    type(id, 'mi-agenda');
    type(title, 'Agenda del 22 de noviembre');
    expect(id.value).toBe('mi-agenda');
  });

  it('avisa y no deja crear si el id ya existe', async () => {
    fakeApi([{ id: 'acta', title: 'Acta' }]);
    const host = mount();
    await wait();
    type(inputs(host)[0] as HTMLInputElement, 'Acta');
    await wait(50);
    expect(host.textContent).toContain('Ya hay un documento con ese id');
    expect(button(host, 'Crear').disabled).toBe(true);
  });

  it('avisa si el id escrito a mano no es válido', async () => {
    fakeApi();
    const host = mount();
    await wait();
    type(inputs(host)[0] as HTMLInputElement, 'Algo');
    type(inputs(host)[1] as HTMLInputElement, 'Mal Id');
    expect(host.textContent).toContain('Solo minúsculas, números y guiones');
    expect(button(host, 'Crear').disabled).toBe(true);
  });

  it('crear guarda un borrador (revisión 0), cierra la hoja y abre el editor', async () => {
    const puts = fakeApi();
    const host = mount();
    await wait();
    type(inputs(host)[0] as HTMLInputElement, 'Agenda del 22');
    button(host, 'Crear').click();
    await wait();
    expect(puts).toHaveLength(1);
    const put = puts[0] as Put;
    expect(put.url).toBe('/api/admin/documents/agenda-del-22/draft');
    expect(put.body.expectedRevision).toBe(0);
    expect(put.body.content.title).toBe('Agenda del 22');
    expect(window.location.pathname).toBe('/d/agenda-del-22/editar');
    expect(host.querySelector('input')).toBeNull();
  });

  it('si el borrador no se puede guardar, muestra el error y no navega', async () => {
    fakeApi([], true);
    const host = mount();
    await wait();
    type(inputs(host)[0] as HTMLInputElement, 'Agenda del 22');
    button(host, 'Crear').click();
    await wait();
    expect(host.querySelector('[role="alert"]')).not.toBeNull();
    expect(window.location.pathname).toBe('/');
  });
});
