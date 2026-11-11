// @vitest-environment happy-dom
import { render } from 'solid-js/web';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ReviewProvider from '../ReviewProvider/ReviewProvider';
import BlockLayer from './BlockLayer';

const me = { id: 'r1', name: 'Ana', isAdmin: false, municipality: null };

function comment(id: string, blockId: string, text: string) {
  return {
    id,
    blockId,
    parentId: null,
    authorId: 'r2',
    authorName: 'Luis',
    authorMunicipality: 'La Ceja',
    text,
    blockExcerpt: '',
    createdAt: '2026-11-10T10:00:00.000Z',
    resolved: false,
  };
}

const wait = (ms = 60) => new Promise((resolve) => setTimeout(resolve, ms));
const disposers: (() => void)[] = [];

beforeEach(() => {
  localStorage.setItem(
    'review:session',
    JSON.stringify({ token: 't', reviewer: me }),
  );
  Element.prototype.scrollIntoView = vi.fn();
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      const body = url.endsWith('/review')
        ? {
            me,
            // El bloque b1 tiene un hilo y dos OK; b2 no tiene nada.
            comments: [comment('c1', 'b1', 'Falta precisar el plazo')],
            approvals: [
              {
                blockId: 'b1',
                reviewerId: 'r2',
                createdAt: '2026-11-10T09:00:00.000Z',
              },
              {
                blockId: 'b1',
                reviewerId: 'r1',
                createdAt: '2026-11-10T11:30:00.000Z',
              },
            ],
            reviewers: {
              r1: { name: 'Ana', municipality: null },
              r2: { name: 'Luis', municipality: 'La Ceja' },
            },
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
          <BlockLayer>
            <p data-block-id="b1">Primer párrafo</p>
            <p data-block-id="b2">Segundo párrafo</p>
          </BlockLayer>
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

const block = (id: string) =>
  document.querySelector<HTMLElement>(`[data-block-id="${id}"]`);
const pills = (id: string) => [
  ...(block(id)?.querySelectorAll('button') ?? []),
];
const press = (element: Element | undefined) =>
  element?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
const dialog = () => document.querySelector('dialog[open]');

describe('insignias de un bloque', () => {
  it('los OK y los hilos son dos botones separados; un bloque sin nada no lleva ninguno', async () => {
    await wait();
    const labels = pills('b1').map((pill) => pill.textContent?.trim());
    expect(labels).toEqual(['2', '1 hilo']);
    expect(pills('b2')).toHaveLength(0);
    // Las dos se ven igual (mismo borde): tu OK no cambia el aspecto de la pastilla.
    const [ok, threads] = pills('b1');
    expect(ok?.className).not.toBe('');
    expect(ok?.className).toBe(threads?.className);
  });

  it('tocar la pastilla de hilos abre los comentarios de ese bloque', async () => {
    await wait();
    press(pills('b1')[1]);
    await wait();
    expect(dialog()?.textContent).toContain('Falta precisar el plazo');
    expect(dialog()?.textContent).toContain('Primer párrafo');
  });

  it('los botones del hilo llevan la sombra levantada (no son data-flat)', async () => {
    await wait();
    press(pills('b1')[1]);
    await wait();
    const reply = [...(dialog()?.querySelectorAll('button') ?? [])].find(
      (button) => button.textContent?.trim() === 'Responder',
    );
    expect(reply).toBeDefined();
    expect(reply?.hasAttribute('data-flat')).toBe(false);
  });

  it('tocar la pastilla de OK abre quién dio OK y cuándo, del más antiguo al más reciente', async () => {
    await wait();
    press(pills('b1')[0]);
    await wait();
    const rows = [...(dialog()?.querySelectorAll('li') ?? [])].map(
      (row) => row.textContent ?? '',
    );
    expect(rows).toHaveLength(2);
    expect(rows[0]).toContain('Luis');
    expect(rows[0]).toContain('La Ceja');
    expect(rows[1]).toContain('Ana');
    expect(rows[0]).toMatch(/\d{1,2}:\d{2}/);
  });

  it('tocar una pastilla no selecciona el bloque ni abre la barra de acciones', async () => {
    await wait();
    press(pills('b1')[0]);
    await wait();
    expect(document.querySelector('[data-review-bar]')).toBeNull();
  });
});

describe('barra de acciones', () => {
  it('ya no lista los OK, y su botón de cerrar tiene borde como los demás', async () => {
    await wait();
    press(block('b1') ?? undefined);
    await wait();
    const bar = document.querySelector('[data-review-bar]');
    expect(bar).not.toBeNull();
    expect(bar?.textContent).not.toContain('OK:');
    const buttons = [...(bar?.querySelectorAll('button') ?? [])];
    expect(buttons).toHaveLength(3);
    // Cerrar dice «Cerrar» y es un botón como los otros: comparte su clase (tamaño y borde).
    const close = buttons[2];
    expect(close?.textContent?.trim()).toBe('Cerrar');
    const shared = buttons[0]?.classList[0] ?? '';
    expect(shared).not.toBe('');
    expect(close?.classList.contains(shared)).toBe(true);
  });
});
