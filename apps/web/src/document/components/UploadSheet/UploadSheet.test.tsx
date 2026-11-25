// @vitest-environment happy-dom
import {
  type OverlayApi,
  ReviewProvider,
  useOverlay,
} from '@colaboradocs/review-ui';
import { render } from 'solid-js/web';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import UploadSheet from './UploadSheet';

const admin = { id: 'r1', name: 'Ana', isAdmin: true, municipality: null };
const wait = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));
const disposers: (() => void)[] = [];

/** Una API simulada: guarda a qué URLs se llamó y qué se subió. */
function fakeApi() {
  const puts: { url: string; body: { id: string; title: string } }[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: RequestInit) => {
      const json = (body: unknown, status = 200) =>
        new Response(JSON.stringify(body), { status });
      if (init?.method === 'PUT' && url.startsWith('/api/admin/documents/')) {
        puts.push({ url, body: JSON.parse(String(init.body)) });
        return json({ created: true }, 201);
      }
      if (url === '/api/documents') return json([]);
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

function mount(target: { replaceId?: string } = {}) {
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
  const closed = vi.fn();
  void overlay.sheet(UploadSheet, { target }).then(closed);
  return { host, closed };
}

async function choose(host: HTMLElement, file: File) {
  const input = host.querySelector('input[type="file"]') as HTMLInputElement;
  Object.defineProperty(input, 'files', { value: [file], configurable: true });
  input.dispatchEvent(new Event('change', { bubbles: true }));
  await wait();
}

const button = (host: HTMLElement, text: string) =>
  [...host.querySelectorAll('button')].find((b) =>
    b.textContent?.includes(text),
  );

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
});

describe('UploadSheet', () => {
  it('empieza con la zona de arrastrar y sin formulario', () => {
    fakeApi();
    const { host } = mount();
    expect(host.textContent).toContain('Arrastra tu archivo aquí');
    expect(host.textContent).not.toContain('Publicar');
  });

  it('ofrece las descargas del formato hasta que hay un documento leído', async () => {
    fakeApi();
    const { host } = mount();
    expect(host.textContent).toContain('Guía para Claude');
    expect(host.textContent).toContain('Ejemplo (.json)');
    await choose(host, new File(['# Mi doc\n\n## Uno\n\nHola\n'], 'mi-doc.md'));
    expect(host.textContent).not.toContain('Guía para Claude');
  });

  it('un archivo que no sirve sigue ofreciendo las descargas', async () => {
    fakeApi();
    const { host } = mount();
    await choose(host, new File(['x'], 'foto.pdf'));
    expect(host.textContent).toContain('No pude usar ese archivo');
    expect(host.textContent).toContain('Guía para Claude');
  });

  it('elegir un .md muestra el archivo, el resumen de secciones y el formulario', async () => {
    fakeApi();
    const { host } = mount();
    await choose(
      host,
      new File(['# Mi doc\n\n## Uno\n\nHola\n\n## Dos\n\nChau\n'], 'mi-doc.md'),
    );
    expect(host.textContent).toContain('mi-doc.md');
    expect(host.textContent).toContain('2 secciones');
    expect(host.textContent).toContain('Uno');
    expect(host.textContent).toContain('Dos');
    expect(host.textContent).not.toContain('Arrastra tu archivo aquí');
    expect(button(host, 'Publicar')).toBeDefined();
  });

  it('un archivo que no sirve explica por qué, y se puede cambiar', async () => {
    fakeApi();
    const { host } = mount();
    await choose(host, new File(['x'], 'foto.pdf'));
    expect(host.textContent).toContain('No pude usar ese archivo');
    expect(host.textContent).toContain('Formato no soportado');
    expect(button(host, 'Cambiar archivo')).toBeDefined();
    expect(button(host, 'Publicar')).toBeUndefined();
  });

  it('publicar sube el documento a /api/admin/documents/<id> y cierra la hoja', async () => {
    const puts = fakeApi();
    const { host, closed } = mount();
    await choose(host, new File(['# Mi doc\n\n## Uno\n\nHola\n'], 'mi-doc.md'));
    button(host, 'Publicar')?.click();
    await wait();
    expect(puts).toHaveLength(1);
    expect(puts[0]?.url).toBe('/api/admin/documents/mi-doc');
    expect(puts[0]?.body).toMatchObject({ id: 'mi-doc', title: 'Mi doc' });
    expect(closed).toHaveBeenCalled();
  });

  describe('crear desde cero, dentro de «Subir documento»', () => {
    it('ofrece las dos cosas en secciones: crear desde cero (con filas etiqueta … campo) y subir un archivo', async () => {
      fakeApi();
      const { host } = mount();
      await wait();
      expect(host.textContent).toContain('Crear documento');
      expect(host.textContent).toContain('Subir documento');
      const rows = [...host.querySelectorAll('label')].filter((row) =>
        row.querySelector('input:not([type="file"])'),
      );
      expect(rows.map((row) => row.querySelector('span')?.textContent)).toEqual(
        ['Título', 'Id (va en la URL: /d/…)'],
      );
    });

    it('al reemplazar un documento no ofrece crear uno nuevo', async () => {
      fakeApi();
      const { host } = mount({ replaceId: 'ya-existe' });
      await wait();
      expect(host.textContent).not.toContain('Crear documento');
    });

    it('crea el borrador y abre el editor', async () => {
      const drafts: string[] = [];
      const bodies: { content: { type?: string } }[] = [];
      vi.stubGlobal(
        'fetch',
        vi.fn(async (url: string, init?: RequestInit) => {
          const json = (body: unknown, status = 200) =>
            new Response(JSON.stringify(body), { status });
          if (init?.method === 'PUT' && url.endsWith('/draft')) {
            drafts.push(url);
            bodies.push(JSON.parse(String(init.body)));
            return json({ revision: 1, updatedAt: 'ahora', stale: false });
          }
          if (url === '/api/documents') return json([]);
          return json({ error: 'not_found' }, 404);
        }),
      );
      const { host, closed } = mount();
      await wait();
      const title = host.querySelector<HTMLInputElement>(
        'label input:not([type="file"])',
      );
      if (!title) throw new Error('falta el título');
      title.value = 'Plan de trabajo';
      title.dispatchEvent(new Event('input', { bubbles: true }));
      const kind = host.querySelector('select');
      if (!kind) throw new Error('falta el tipo');
      kind.value = 'minutes';
      kind.dispatchEvent(new Event('change', { bubbles: true }));
      await wait(30);
      button(host, 'Crear')?.click();
      await wait();
      expect(drafts).toEqual(['/api/admin/documents/plan-de-trabajo/draft']);
      expect(bodies[0]?.content.type).toBe('minutes');
      expect(window.location.pathname).toBe('/d/plan-de-trabajo/editar');
      expect(closed).toHaveBeenCalled();
    });
  });
});
