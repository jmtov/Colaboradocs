// @vitest-environment happy-dom
import { ReviewProvider } from '@juntanza/review-ui';
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

function mount(target: { replaceId?: string } | null = {}) {
  const onClose = vi.fn();
  const host = document.createElement('div');
  document.body.appendChild(host);
  disposers.push(
    render(
      () => (
        <ReviewProvider>
          <UploadSheet target={target} onClose={onClose} />
        </ReviewProvider>
      ),
      host,
    ),
  );
  return { host, onClose };
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
    const { host, onClose } = mount();
    await choose(host, new File(['# Mi doc\n\n## Uno\n\nHola\n'], 'mi-doc.md'));
    button(host, 'Publicar')?.click();
    await wait();
    expect(puts).toHaveLength(1);
    expect(puts[0]?.url).toBe('/api/admin/documents/mi-doc');
    expect(puts[0]?.body).toMatchObject({ id: 'mi-doc', title: 'Mi doc' });
    expect(onClose).toHaveBeenCalled();
  });
});
