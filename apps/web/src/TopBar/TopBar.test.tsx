// @vitest-environment happy-dom
import { ReviewProvider } from '@colaboradocs/review-ui';
import { render } from 'solid-js/web';
import { afterEach, describe, expect, it, vi } from 'vitest';
import TopBar from './TopBar';

const disposers: (() => void)[] = [];
const wait = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms));

function mount(isAdmin: boolean) {
  const reviewer = { id: 'r1', name: 'Ana', isAdmin, municipality: null };
  localStorage.setItem(
    'review:session',
    JSON.stringify({ token: 't', reviewer }),
  );
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      const body =
        url === '/api/documents/mi-doc/review'
          ? { me: reviewer, comments: [], approvals: [], reviewers: {} }
          : [];
      return new Response(JSON.stringify(body));
    }),
  );
  const host = document.createElement('div');
  document.body.appendChild(host);
  disposers.push(
    render(
      () => (
        <ReviewProvider documentId="mi-doc">
          <TopBar
            documentId="mi-doc"
            documentName="Doc"
            currentLabel="Inicio"
            currentHeading=""
            onOpenContents={() => {}}
            onPrint={() => {}}
          />
        </ReviewProvider>
      ),
      host,
    ),
  );
  return host;
}

const editItem = (host: HTMLElement) =>
  [...host.querySelectorAll('button')].find(
    (item) => item.textContent?.trim() === 'Editar',
  );

afterEach(() => {
  for (const dispose of disposers.splice(0)) dispose();
  document.body.innerHTML = '';
  localStorage.clear();
  vi.unstubAllGlobals();
});

describe('TopBar', () => {
  it('un admin ve «Editar» en el menú y va al editor del documento', async () => {
    const host = mount(true);
    await wait();
    editItem(host)?.click();
    expect(window.location.pathname).toBe('/d/mi-doc/editar');
  });

  it('el menú va por secciones: acciones de la página, administración, tema y salir', async () => {
    const host = mount(true);
    await wait();
    const text = host.querySelector('[popover]')?.textContent ?? '';
    const at = [
      'Imprimir',
      'Editar',
      'Documentos',
      'Accesos',
      'Tema',
      'Salir',
    ].map((label) => text.indexOf(label));
    expect(at.every((index) => index >= 0)).toBe(true);
    expect([...at].sort((a, b) => a - b)).toEqual(at);
  });

  it('quien no es admin no lo ve', async () => {
    const host = mount(false);
    await wait();
    expect(editItem(host)).toBeUndefined();
  });

  it('un admin siempre ve el regreso, y con un solo documento va a Documentos', async () => {
    const host = mount(true);
    await wait();
    const back = host.querySelector('a[title="Volver a los documentos"]');
    expect(back?.getAttribute('href')).toBe('/documentos');
  });

  it('quien no es admin y tiene un solo documento no ve el regreso', async () => {
    const host = mount(false);
    await wait();
    expect(host.querySelector('a[title="Volver a los documentos"]')).toBeNull();
  });
});
