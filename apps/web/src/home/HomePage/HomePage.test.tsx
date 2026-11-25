// @vitest-environment happy-dom
import type { DeckListItem } from '@colaboradocs/deck-core';
import type { DocumentListItem } from '@colaboradocs/review-core';
import { ReviewProvider } from '@colaboradocs/review-ui';
import { createSignal } from 'solid-js';
import { render } from 'solid-js/web';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { type HomeTab, navigationKind } from '@/shared/router/router';
import { openMenus } from '@/shared/test/openMenus';
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
  type: 'other',
  date: null,
  owner: null,
  attendees: null,
  openThreads: 0,
  comments: 0,
  approvals: 0,
  lastActivityAt: null,
  ...extra,
});

/** Los tabs como texto: «Documentos3Presentaciones0Tareas». */
const tabLabels = (host: HTMLElement) =>
  [...host.querySelectorAll('nav[aria-label="Secciones"] a')]
    .map((a) => a.textContent)
    .join('');

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

function mount(
  documents: DocumentListItem[],
  decks: DeckListItem[] = [],
  tab: HomeTab = 'documents',
) {
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
          tab={tab}
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
    host.remove();
    const decksTab = mount(
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
      'decks',
    );
    await wait();
    const link = decksTab.querySelector<HTMLAnchorElement>(
      'a[href="/p/charla"]',
    );
    expect(link?.textContent).toContain('Mi charla');
    expect(link?.textContent).toContain('3 slides');
    // Sin presentaciones (y sin ser admin), el tab ni aparece.
    decksTab.remove();
    const empty = mount([item('a')]);
    await wait();
    expect(empty.querySelector('a[href^="/p/"]')).toBeNull();
    expect(empty.querySelector('nav a[href="/presentaciones"]')).toBeNull();
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
    const cards = [...host.querySelectorAll('a[href^="/d/"]')];
    expect(cards.map((card) => card.getAttribute('href'))).toEqual([
      '/d/a',
      '/d/b',
    ]);
    const label = (card: Element | undefined, text: string) =>
      card?.querySelector(`[aria-label="${text}"]`);
    expect(label(cards[0], '3 hilos abiertos')).not.toBeNull();
    expect(label(cards[0], '7 aprobaciones')).not.toBeNull();
    expect(label(cards[1], '0 hilos abiertos')).not.toBeNull();
    expect(cards[1]?.textContent).toContain('Sin actividad');
    expect(host.textContent).not.toContain('hilos abiertos');
  });

  it('una sola lista, sin grupos: iniciativas primero, actas por fecha, con el tipo en cada tarjeta', async () => {
    signIn();
    const host = mount([
      item('acta-vieja', { type: 'minutes', updated: '2026-10-01' }),
      item('acta-nueva', { type: 'minutes', updated: '2026-11-20' }),
      item('ini', { type: 'initiative', owner: 'Ana' }),
    ]);
    await wait();
    expect(tabLabels(host)).toContain('Documentos3');
    const cards = [...host.querySelectorAll('a[href^="/d/"]')];
    expect(cards.map((a) => a.getAttribute('href'))).toEqual([
      '/d/ini',
      '/d/acta-nueva',
      '/d/acta-vieja',
    ]);
    expect(cards[0]?.textContent).toContain('Iniciativa');
    expect(cards[1]?.textContent).toContain('Acta');
    expect(host.textContent).toContain('Responsable: Ana');
  });

  it('el título va antes que los tabs, y los tabs antes que la lista', async () => {
    signIn();
    const host = mount([item('a')]);
    await wait();
    const heading = host.querySelector('h1');
    const tabs = host.querySelector('nav[aria-label="Secciones"]');
    const card = host.querySelector('a[href="/d/a"]');
    if (!heading || !tabs || !card) throw new Error('falta el marco');
    const follows = (a: Node, b: Node) =>
      Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    expect(follows(heading, tabs)).toBe(true);
    expect(follows(tabs, card)).toBe(true);
  });

  it('los tabs son enlaces a /, /presentaciones y /tareas, con el actual marcado y su cuenta', async () => {
    signIn(true);
    const host = mount([item('a'), item('b')], [], 'documents');
    await wait();
    const links = [...host.querySelectorAll('nav[aria-label="Secciones"] a')];
    expect(links.map((a) => a.getAttribute('href'))).toEqual([
      '/',
      '/presentaciones',
      '/tareas',
    ]);
    expect(links.map((a) => a.getAttribute('aria-current'))).toEqual([
      'page',
      null,
      null,
    ]);
    expect(links[0]?.textContent).toBe('Documentos2');
    expect(links[1]?.textContent).toBe('Presentaciones0');
    host.remove();
    const decks = mount([item('a')], [], 'decks');
    await wait();
    expect(
      decks.querySelector('nav a[aria-current="page"]')?.textContent,
    ).toContain('Presentaciones');
  });

  it('cambiar de tab no anima la página (tab) pero sí deja entrada en el historial', async () => {
    signIn(true);
    window.history.replaceState(null, '', '/');
    const host = mount([item('a')]);
    await wait();
    const before = window.history.length;
    host
      .querySelector<HTMLAnchorElement>('nav a[href="/presentaciones"]')
      ?.click();
    expect(window.location.pathname).toBe('/presentaciones');
    expect(navigationKind()).toBe('tab');
    expect(window.history.length).toBe(before + 1);
  });

  it('muestra tres nombres y cuántos más', async () => {
    signIn();
    const host = mount([
      item('a', {
        type: 'minutes',
        attendees: 'Ana, Luis, Eva, Sol, Ivo',
      }),
    ]);
    await wait();
    expect(host.textContent).toContain('Participantes: Ana, Luis, Eva y 2 más');
    expect(host.textContent).not.toContain('Sol');
  });

  it('filtra por texto y por tipo, y se puede quitar el filtro', async () => {
    signIn();
    const host = mount([
      item('a', { title: 'Ejes', type: 'initiative' }),
      item('b', { title: 'Reunión', type: 'minutes' }),
    ]);
    await wait();
    const hrefs = () =>
      [...host.querySelectorAll('a[href^="/d/"]')].map((a) =>
        a.getAttribute('href'),
      );
    expect(hrefs()).toEqual(['/d/a', '/d/b']);
    // Sin filtro el resumen está vacío (y no ocupa lugar): al buscar, el texto aparece bajo el campo.
    expect(host.querySelector('[aria-live="polite"]')?.textContent).toBe('');

    const input = host.querySelector<HTMLInputElement>('input[type="search"]');
    if (!input) throw new Error('falta el buscador');
    input.value = 'reunion';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await wait();
    expect(hrefs()).toEqual(['/d/b']);
    const summary = host.querySelector('[aria-live="polite"]');
    expect(summary?.textContent).toContain('1 de 2');
    // El resumen va debajo del buscador, no antes: al buscar, el campo no se mueve.
    expect(
      input.compareDocumentPosition(summary as Node) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    input.value = 'zzz';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await wait();
    expect(host.textContent).toContain('Ningún documento coincide');
    const clear = [...host.querySelectorAll('button')].find(
      (button) => button.textContent === 'Quitar el filtro',
    );
    clear?.click();
    await wait();
    expect(hrefs()).toEqual(['/d/a', '/d/b']);

    // El tipo se elige en la hoja de filtros.
    const filters = [...host.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === 'Filtros',
    );
    filters?.click();
    await wait(80);
    const actasButton = [...document.querySelectorAll('button')].find(
      (button) => button.textContent?.startsWith('Actas'),
    );
    actasButton?.click();
    const apply = [...document.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === 'Aplicar',
    );
    apply?.click();
    await wait(80);
    expect(hrefs()).toEqual(['/d/b']);
    // Queda un botón con el tipo aplicado, que lo quita.
    const clearKind = host.querySelector<HTMLButtonElement>(
      '[aria-label="Quitar el filtro Actas"]',
    );
    clearKind?.click();
    await wait();
    expect(hrefs()).toEqual(['/d/a', '/d/b']);
  });

  it('si desaparece el último documento del tipo filtrado, el filtro se suelta', async () => {
    signIn();
    const documents = [
      item('a', { title: 'Ejes', type: 'initiative' }),
      item('b', { title: 'Reunión', type: 'minutes' }),
    ];
    const [list, setList] = createSignal(documents);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('[]', { status: 200 })),
    );
    const host = document.createElement('div');
    document.body.appendChild(host);
    render(
      () => (
        <ReviewProvider>
          <HomePage
            name="Espacio de prueba"
            tab="documents"
            documents={list()}
            decks={[]}
          />
        </ReviewProvider>
      ),
      host,
    );
    await wait();
    const filters = [...host.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === 'Filtros',
    );
    filters?.click();
    await wait(80);
    const actas = [...document.querySelectorAll('button')].find((button) =>
      button.textContent?.startsWith('Actas'),
    );
    actas?.click();
    [...document.querySelectorAll('button')]
      .find((button) => button.textContent?.trim() === 'Aplicar')
      ?.click();
    await wait(80);
    expect(host.querySelectorAll('a[href^="/d/"]')).toHaveLength(1);
    setList([documents[0] as DocumentListItem]);
    await wait();
    expect(host.textContent).not.toContain('Ningún documento coincide');
    expect(host.querySelectorAll('a[href^="/d/"]')).toHaveLength(1);
  });

  it('la tarjeta lleva el tipo y la fecha (la de elaboración, o updated), sin la versión', async () => {
    signIn();
    const host = mount([
      item('a', { type: 'minutes', date: '2026-11-24', updated: '2026-11-25' }),
      item('b', { type: 'initiative', updated: '2026-11-10' }),
    ]);
    await wait();
    const text = (id: string) =>
      host.querySelector(`a[href="/d/${id}"]`)?.textContent ?? '';
    expect(text('a')).toContain('Acta · 2026-11-24');
    expect(text('b')).toContain('Iniciativa · 2026-11-10');
    expect(host.textContent).not.toContain('Versión');
  });

  it('solo los admins ven el menú de cada documento y el bloque para subir', async () => {
    signIn(false);
    const member = mount([item('a'), item('b')]);
    await wait();
    expect(member.textContent).not.toContain('Nuevo documento');
    expect(
      member.querySelectorAll('button[aria-label^="Acciones de"]'),
    ).toHaveLength(0);

    document.body.innerHTML = '';
    signIn(true);
    const admin = mount([item('a'), item('b')]);
    await wait();
    // un menú por documento, y el bloque «Nuevo documento» como una celda más
    expect(
      admin.querySelectorAll('button[aria-label^="Acciones de"]'),
    ).toHaveLength(2);
    expect(
      admin.querySelector('button[aria-label="Acciones de «Documento a»"]'),
    ).not.toBeNull();
    // la primera grilla es la de documentos
    const cells = admin.querySelector('ul')?.querySelectorAll(':scope > li');
    expect(cells).toHaveLength(3);
    expect(cells?.[2]?.textContent).toContain('Nuevo documento');
  });

  it('el admin ve la sección de presentaciones con «Nueva presentación» aunque no haya ninguna; los demás no', async () => {
    signIn(true);
    const admin = mount([item('a')], [], 'decks');
    await wait();
    expect(admin.querySelector('nav a[href="/presentaciones"]')).not.toBeNull();
    expect(admin.textContent).toContain('Nueva presentación');
    document.body.innerHTML = '';
    signIn(false);
    const member = mount([item('a')]);
    await wait();
    expect(member.querySelector('nav a[href="/presentaciones"]')).toBeNull();
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
    openMenus(host);
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
    expect(host.textContent).toContain('Nuevo documento');
  });

  it('sin documentos, los demás ven que no hay nada', async () => {
    signIn(false);
    const host = mount([]);
    await wait();
    expect(host.textContent).toContain('Todavía no hay documentos');
    expect(host.textContent).not.toContain('Nuevo documento');
  });

  it('el selector de tema vive en el menú de la sesión, no en la página', async () => {
    signIn(false);
    const host = mount([item('a')]);
    await wait();
    openMenus(host);
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
    openMenus(host);
    const items = [...host.querySelectorAll('li [popover] button')];
    expect(items.length).toBeGreaterThan(0);
    for (const entry of items)
      expect(entry.hasAttribute('data-flat')).toBe(true);
  });
});
