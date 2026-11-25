// @vitest-environment happy-dom
import type { DeckListItem } from '@colaboradocs/deck-core';
import { ReviewProvider } from '@colaboradocs/review-ui';
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
  tipo: 'otro',
  responsable: null,
  participantes: null,
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

function mount(documents: DocumentListItem[], decks: DeckListItem[] = []) {
  vi.stubGlobal(
    'fetch',
    vi.fn(
      async (url: string) =>
        new Response(
          JSON.stringify(String(url).includes('archived=1') ? [] : documents),
          { status: 200 },
        ),
    ),
  );
  const host = document.createElement('div');
  document.body.appendChild(host);
  render(
    () => (
      <ReviewProvider>
        <HomePage
          name="Espacio de prueba"
          documents={documents}
          decks={decks}
        />
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
  it('muestra las presentaciones con enlace a /p/<id>, y nada si no hay', async () => {
    signIn();
    const host = mount(
      [item('a')],
      [
        {
          id: 'charla',
          title: 'Mi charla',
          themeId: 'neutral',
          slides: 3,
          hasDraft: false,
          updatedAt: new Date().toISOString(),
        },
      ],
    );
    await wait();
    const link = host.querySelector<HTMLAnchorElement>('a[href="/p/charla"]');
    expect(link?.textContent).toContain('Mi charla');
    expect(link?.textContent).toContain('3 slides');
    expect(host.textContent).toContain('1 presentación');
    host.remove();
    const empty = mount([item('a')]);
    await wait();
    expect(empty.querySelector('a[href^="/p/"]')).toBeNull();
  });

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

  it('agrupa por tipo: iniciativas arriba, actas por fecha, y muestra responsable', async () => {
    signIn();
    const host = mount([
      item('acta-vieja', { tipo: 'acta', updated: '2026-10-01' }),
      item('acta-nueva', { tipo: 'acta', updated: '2026-11-20' }),
      item('ini', { tipo: 'iniciativa', responsable: 'Ana' }),
    ]);
    await wait();
    const titles = [...host.querySelectorAll('h2')].map((h) =>
      h.textContent?.replace(/\d+$/, ''),
    );
    expect(titles).toEqual(['Iniciativas', 'Actas']);
    expect(
      [...host.querySelectorAll('a')].map((a) => a.getAttribute('href')),
    ).toEqual(['/d/ini', '/d/acta-nueva', '/d/acta-vieja']);
    expect(host.textContent).toContain('Responsable: Ana');
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
    // la primera grilla es la de documentos
    const cells = admin.querySelector('ul')?.querySelectorAll(':scope > li');
    expect(cells).toHaveLength(3);
    expect(cells?.[2]?.textContent).toContain('Subir documento');
  });

  it('el admin ve la sección de presentaciones con «Nueva presentación» aunque no haya ninguna; los demás no', async () => {
    signIn(true);
    const admin = mount([item('a')]);
    await wait();
    expect(admin.textContent).toContain('0 presentaciones');
    expect(admin.textContent).toContain('Nueva presentación');
    document.body.innerHTML = '';
    signIn(false);
    const member = mount([item('a')]);
    await wait();
    expect(member.textContent).not.toContain('presentaciones');
    expect(member.textContent).not.toContain('Nueva presentación');
  });

  it('el menú no queda dentro del enlace de la tarjeta', async () => {
    signIn(true);
    const host = mount([item('a')]);
    await wait();
    expect(host.querySelector('a button')).toBeNull();
  });

  it('el menú ofrece editar (lleva al editor), reemplazar y archivar', async () => {
    signIn(true);
    const host = mount([item('a')]);
    await wait();
    const menuText = host.querySelector('li [popover]')?.textContent ?? '';
    expect(menuText).toContain('Editar');
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
