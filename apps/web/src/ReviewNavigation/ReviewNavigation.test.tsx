// @vitest-environment happy-dom
import { ReviewProvider, useOverlay } from '@juntanza/review-ui';
import { render } from 'solid-js/web';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DocumentSection } from '@/content/content.types';
import ReviewNavigation from './ReviewNavigation';
import { useReviewNavigation } from './ReviewNavigation.hooks';

const me = { id: 'r1', name: 'Ana', isAdmin: false, municipality: null };
const sections: DocumentSection[] = [
  { id: 's', num: '1', title: 'Plazos', status: 'borrador', html: '' },
];

function comment(id: string, blockId: string, resolved = false) {
  return {
    id,
    blockId,
    parentId: null,
    authorId: 'r1',
    authorName: 'Ana',
    authorMunicipality: null,
    text: 'Revisar',
    blockExcerpt: '',
    createdAt: `2026-11-10T10:00:0${id.slice(1)}.000Z`,
    resolved,
  };
}

const wait = (ms = 40) => new Promise((resolve) => setTimeout(resolve, ms));
const disposers: (() => void)[] = [];
let navigation!: ReturnType<typeof useReviewNavigation>;
let overlay!: ReturnType<typeof useOverlay>;

function Harness() {
  navigation = useReviewNavigation(() => sections, 'd');
  overlay = useOverlay();
  return <ReviewNavigation navigation={navigation} />;
}

beforeEach(() => {
  localStorage.setItem(
    'review:session',
    JSON.stringify({ token: 't', reviewer: me }),
  );
  // El documento: tres bloques en la sección 1, en este orden.
  document.body.innerHTML = `<section id="sec-s">
    <p data-block-id="b1">Primer bloque</p>
    <p data-block-id="b2">Segundo bloque</p>
    <p data-block-id="b3">Tercer bloque</p></section>`;
  Element.prototype.scrollIntoView = vi.fn();
  window.matchMedia = vi.fn(() => ({ matches: false })) as never;
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      const body = url.endsWith('/review')
        ? {
            me,
            // b3 con hilo resuelto: no cuenta. b2 antes que b1 en la lista de comentarios.
            comments: [
              comment('c2', 'b2'),
              comment('c1', 'b1'),
              comment('c3', 'b3', true),
            ],
            approvals: [{ blockId: 'b3', reviewerId: 'r1' }],
            reviewers: { r1: { name: 'Ana', municipality: null } },
          }
        : [];
      return new Response(JSON.stringify(body), { status: 200 });
    }),
  );
  const host = document.createElement('div');
  document.body.appendChild(host);
  disposers.push(
    render(
      () => (
        <ReviewProvider documentId="d">
          <Harness />
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

const bar = () =>
  document.querySelector('section[aria-label="Hilos abiertos"]');
const press = (label: string) =>
  document
    .querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)
    ?.click();
const current = () =>
  [...document.querySelectorAll('[data-nav-current]')].map(
    (element) => (element as HTMLElement).dataset.blockId,
  );
// Los ítems de la hoja de bloques, ya montada por el overlay.
const listed = () =>
  [...document.querySelectorAll<HTMLButtonElement>('dialog nav button')].map(
    (button) => button.textContent ?? '',
  );
// Elige en la hoja abierta el ítem que contiene ese texto.
function choose(text: string) {
  const item = [
    ...document.querySelectorAll<HTMLButtonElement>('dialog nav button'),
  ].find((button) => button.textContent?.includes(text));
  if (!item) throw new Error(`No hay ítem con «${text}» en la hoja.`);
  item.click();
}

describe('recorrer hilos abiertos', () => {
  it('la lista trae solo los bloques con hilo abierto, en el orden del documento', async () => {
    await wait();
    void navigation.openList('threads');
    await wait();
    expect(listed()).toEqual([
      '1. Plazos · 1 hiloPrimer bloque',
      '1. Plazos · 1 hiloSegundo bloque',
    ]);
  });

  it('elegir uno cierra la hoja, muestra la barra «1 / 2» y marca el bloque', async () => {
    await wait();
    const opened = navigation.openList('threads');
    await wait();
    choose('Segundo bloque');
    await opened;
    await wait();
    expect(overlay.isOpen()).toBe(false);
    expect(bar()?.textContent).toContain('Hilos abiertos');
    expect(bar()?.textContent).toContain('2 / 2');
    expect(current()).toEqual(['b2']);
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });

  it('siguiente y anterior dan la vuelta; cerrar quita la barra y la marca', async () => {
    await wait();
    const opened = navigation.openList('threads');
    await wait();
    choose('Primer bloque');
    await opened;
    await wait();
    expect(bar()?.textContent).toContain('1 / 2');
    press('Siguiente');
    await wait();
    expect(bar()?.textContent).toContain('2 / 2');
    expect(current()).toEqual(['b2']);
    press('Siguiente');
    await wait();
    expect(bar()?.textContent).toContain('1 / 2');
    press('Anterior');
    await wait();
    expect(bar()?.textContent).toContain('2 / 2');
    press('Cerrar');
    await wait();
    expect(bar()).toBeNull();
    expect(current()).toEqual([]);
  });

  it('«Bloques con OK» recorre los bloques con algún OK', async () => {
    await wait();
    void navigation.openList('approved');
    await wait();
    expect(listed()).toEqual(['1. Plazos · ✓ 1Tercer bloque']);
  });
});
