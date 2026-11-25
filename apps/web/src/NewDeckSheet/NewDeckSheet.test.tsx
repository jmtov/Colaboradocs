// @vitest-environment happy-dom
import {
  type OverlayApi,
  ReviewProvider,
  useOverlay,
} from '@colaboradocs/review-ui';
import { render } from 'solid-js/web';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import NewDeckSheet from './NewDeckSheet';
import { blankDeck } from './newDeck.utils';

const admin = { id: 'r1', name: 'Ana', isAdmin: true, municipality: null };
const wait = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms));
const disposers: (() => void)[] = [];
let overlay!: OverlayApi;

function Probe() {
  overlay = useOverlay();
  return null;
}

beforeEach(() => {
  localStorage.setItem(
    'review:session',
    JSON.stringify({ token: 't', reviewer: admin }),
  );
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      const json = (body: unknown) => new Response(JSON.stringify(body));
      if (url === '/api/themes')
        return json([{ id: 'neutral', name: 'Neutral' }]);
      if (url === '/api/decks') return json([]);
      return new Response(JSON.stringify({ error: 'not_found' }), {
        status: 404,
      });
    }),
  );
});

afterEach(() => {
  for (const dispose of disposers.splice(0)) dispose();
  document.body.innerHTML = '';
  localStorage.clear();
  vi.unstubAllGlobals();
});

describe('NewDeckSheet', () => {
  it('tiene dos secciones, con filas «etiqueta … campo»: crear desde cero y subir un JSON', async () => {
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
    void overlay.sheet(NewDeckSheet, {});
    await wait();
    // El primer h2 es el título de la hoja; los otros dos, el de cada sección.
    // El primer h2 es el título de la hoja; los otros dos, el de cada sección.
    const titles = [...document.querySelectorAll('h2, h3')].map(
      (item) => item.textContent,
    );
    expect(titles.slice(1)).toEqual([
      'Crear presentación',
      'Subir presentación',
    ]);
    const labels = [...document.querySelectorAll('label > span')].map(
      (item) => item.textContent,
    );
    expect(labels).toEqual(['Título', 'Id (va en la URL: /p/…)', 'Tema']);
    // El archivo se elige en la zona de arrastre, no en una fila del formulario.
    expect(document.body.textContent).toContain('Arrastra tu archivo aquí');
    expect(document.body.textContent).toContain('JSON de una presentación');
  });

  it('al subir un JSON, el formulario pasa a «Datos de la presentación» (con título y archivo) y se puede quitar el archivo', async () => {
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
    void overlay.sheet(NewDeckSheet, {});
    await wait();
    const deck = blankDeck('charla', 'Mi charla', 'neutral');
    const file = new File([JSON.stringify(deck)], 'charla.json', {
      type: 'application/json',
    });
    const input =
      document.querySelector<HTMLInputElement>('input[type="file"]');
    if (!input) throw new Error('falta el selector de archivo');
    Object.defineProperty(input, 'files', {
      value: [file],
      configurable: true,
    });
    input.dispatchEvent(new Event('change', { bubbles: true }));
    await wait();
    expect(document.body.textContent).toContain('Datos de la presentación');
    expect(document.body.textContent).toContain('charla.json');
    expect(document.body.textContent).not.toContain('Subir presentación');
    const title = document.querySelector<HTMLInputElement>('label input');
    expect(title?.value).toBe('Mi charla');
    const quitar = [...document.querySelectorAll('button')].find((item) =>
      item.textContent?.includes('Quitar archivo'),
    );
    quitar?.click();
    await wait();
    expect(document.body.textContent).toContain('Subir presentación');
    expect(document.body.textContent).not.toContain('Datos de la presentación');
  });
});
