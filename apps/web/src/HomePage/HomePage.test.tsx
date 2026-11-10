// @vitest-environment happy-dom
import { ReviewProvider } from '@juntanza/review-ui';
import { render } from 'solid-js/web';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DocumentListItem } from '@/content/content.types';
import HomePage from './HomePage';

const item = (
  id: string,
  extra: Partial<DocumentListItem> = {},
): DocumentListItem => ({
  id,
  title: `Documento ${id}`,
  description: `Descripción de ${id}`,
  version: '0.2',
  updated: '2026-11-09',
  openThreads: 0,
  comments: 0,
  approvals: 0,
  lastActivityAt: null,
  ...extra,
});

const wait = (ms = 30) => new Promise((resolve) => setTimeout(resolve, ms));

function signIn(isAdmin = false) {
  localStorage.setItem(
    'review:session',
    JSON.stringify({
      token: 't',
      reviewer: { id: 'r1', name: 'Ana', isAdmin, municipality: null },
    }),
  );
}

function mount(documents: DocumentListItem[]) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify(documents), { status: 200 })),
  );
  const host = document.createElement('div');
  document.body.appendChild(host);
  render(
    () => (
      <ReviewProvider>
        <HomePage name="Espacio de prueba" documents={documents} />
      </ReviewProvider>
    ),
    host,
  );
  return host;
}

afterEach(() => {
  document.body.innerHTML = '';
  localStorage.clear();
  vi.unstubAllGlobals();
});

describe('HomePage', () => {
  it('muestra una tarjeta por documento, con su actividad', async () => {
    signIn();
    const host = mount([
      item('a', {
        openThreads: 3,
        approvals: 7,
        lastActivityAt: new Date().toISOString(),
      }),
      item('b'),
    ]);
    await wait();

    expect(host.querySelector('h1')?.textContent).toBe('Espacio de prueba');
    const cards = [...host.querySelectorAll('a')];
    expect(cards.map((card) => card.getAttribute('href'))).toEqual([
      '/d/a',
      '/d/b',
    ]);
    expect(cards[0]?.textContent).toContain('3 hilos abiertos');
    expect(cards[0]?.textContent).toContain('7 OK');
    expect(cards[1]?.textContent).toContain('0 hilos abiertos');
    expect(cards[1]?.textContent).toContain('Sin actividad');
  });

  it('solo los admins ven el menú de cada documento y el bloque para subir', async () => {
    signIn(false);
    const member = mount([item('a'), item('b')]);
    await wait();
    expect(member.textContent).not.toContain('Subir documento');
    expect(
      member.querySelectorAll('button[aria-label^="Acciones de"]'),
    ).toHaveLength(0);

    document.body.innerHTML = '';
    signIn(true);
    const admin = mount([item('a'), item('b')]);
    await wait();
    // un menú por documento, y el bloque «Subir documento» como una celda más
    expect(
      admin.querySelectorAll('button[aria-label^="Acciones de"]'),
    ).toHaveLength(2);
    expect(
      admin.querySelector('button[aria-label="Acciones de «Documento a»"]'),
    ).not.toBeNull();
    const cells = admin.querySelectorAll('ul > li');
    expect(cells).toHaveLength(3);
    expect(cells[2]?.textContent).toContain('Subir documento');
  });

  it('el menú no queda dentro del enlace de la tarjeta', async () => {
    signIn(true);
    const host = mount([item('a')]);
    await wait();
    expect(host.querySelector('a button')).toBeNull();
  });

  it('el menú ofrece reemplazar y archivar', async () => {
    signIn(true);
    const host = mount([item('a')]);
    await wait();
    const menuText = host.querySelector('li [popover]')?.textContent ?? '';
    expect(menuText).toContain('Reemplazar documento');
    expect(menuText).toContain('Archivar');
  });

  it('sin documentos, un admin ve solo el bloque para subir el primero', async () => {
    signIn(true);
    const host = mount([]);
    await wait();
    expect(host.textContent).not.toContain('Todavía no hay documentos');
    expect(host.textContent).toContain('Subir documento');
  });

  it('sin documentos, los demás ven que no hay nada', async () => {
    signIn(false);
    const host = mount([]);
    await wait();
    expect(host.textContent).toContain('Todavía no hay documentos');
    expect(host.textContent).not.toContain('Subir documento');
  });

  it('el selector de tema vive en el menú de la sesión, no en la página', async () => {
    signIn(false);
    const host = mount([item('a')]);
    await wait();
    const groups = host.querySelectorAll('[role="group"][aria-label="Tema"]');
    expect(groups).toHaveLength(1);
    // dentro del popover del usuario (el primero de la página)
    expect(groups[0]?.closest('[popover]')).not.toBeNull();
    expect(host.querySelector('footer')).toBeNull();

    const dark = [...(groups[0]?.querySelectorAll('button') ?? [])].find(
      (button) => button.textContent?.includes('Oscuro'),
    );
    dark?.click();
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem('review:theme')).toBe('dark');
    delete document.documentElement.dataset.theme;
  });

  it('las tarjetas se levantan al pasar el cursor; los ítems de menú, no', async () => {
    signIn(true);
    const host = mount([item('a')]);
    await wait();
    // la tarjeta (enlace) opta por el efecto
    expect(
      host.querySelector('a[href="/d/a"]')?.hasAttribute('data-lift'),
    ).toBe(true);
    // el botón ⋮ de cada documento se levanta (no está marcado como plano)…
    const trigger = host.querySelector('button[aria-label^="Acciones de"]');
    expect(trigger?.hasAttribute('data-flat')).toBe(false);
    // …pero los ítems dentro del menú son planos
    const items = [...host.querySelectorAll('li [popover] button')];
    expect(items.length).toBeGreaterThan(0);
    for (const entry of items)
      expect(entry.hasAttribute('data-flat')).toBe(true);
  });
});
