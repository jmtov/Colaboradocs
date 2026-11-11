// @vitest-environment happy-dom
import { ReviewProvider } from '@colaboradocs/review-ui';
import { render } from 'solid-js/web';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DocumentContent } from '@/content/content.types';
import DocumentPage from './DocumentPage';

const me = { id: 'r1', name: 'Ana', isAdmin: false, municipality: null };
const content: DocumentContent = {
  id: 'uno',
  title: 'Reglamento',
  version: '0.2',
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

const wait = (ms = 40) => new Promise((resolve) => setTimeout(resolve, ms));
const disposers: (() => void)[] = [];

beforeEach(() => {
  localStorage.setItem(
    'review:session',
    JSON.stringify({ token: 't', reviewer: me }),
  );
  localStorage.setItem('review:howto-dismissed', '1');
  document.title = 'Mi espacio';
  window.scrollTo = () => {};
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      const body = url.endsWith('/review')
        ? { me, comments: [], approvals: [], reviewers: {} }
        : [];
      return new Response(JSON.stringify(body), { status: 200 });
    }),
  );
  const host = document.createElement('div');
  document.body.appendChild(host);
  disposers.push(
    render(
      () => (
        <ReviewProvider documentId="uno">
          <DocumentPage content={content} />
        </ReviewProvider>
      ),
      host,
    ),
  );
});

afterEach(() => {
  for (const dispose of disposers.splice(0)) dispose();
  document.body.innerHTML = '';
  localStorage.clear();
  vi.unstubAllGlobals();
});

describe('imprimir el documento', () => {
  it('el botón de la barra abre el diálogo de impresión', async () => {
    await wait();
    const print = vi.fn();
    vi.stubGlobal('print', print);
    document
      .querySelector<HTMLButtonElement>(
        'button[aria-label="Imprimir o guardar como PDF"]',
      )
      ?.click();
    expect(print).toHaveBeenCalledOnce();
  });

  it('mientras se imprime, la página lleva el título y la versión del documento (nombre del PDF)', async () => {
    await wait();
    window.dispatchEvent(new Event('beforeprint'));
    expect(document.title).toBe('Reglamento (v0.2)');
    window.dispatchEvent(new Event('afterprint'));
    expect(document.title).toBe('Mi espacio');
  });

  it('al salir del documento en plena impresión, no deja el título cambiado', async () => {
    await wait();
    window.dispatchEvent(new Event('beforeprint'));
    for (const dispose of disposers.splice(0)) dispose();
    expect(document.title).toBe('Mi espacio');
  });
});
