// @vitest-environment happy-dom
import { render } from 'solid-js/web';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import BlockLayer from '../BlockLayer/BlockLayer';
import ReviewProvider from '../ReviewProvider/ReviewProvider';

const me = { id: 'r1', name: 'Ana López', isAdmin: false, municipality: null };

const wait = (ms = 60) => new Promise((resolve) => setTimeout(resolve, ms));
const disposers: (() => void)[] = [];
const posted: { text: string }[] = [];

beforeEach(() => {
  localStorage.setItem(
    'review:session',
    JSON.stringify({ token: 't', reviewer: me }),
  );
  Element.prototype.scrollIntoView = vi.fn();
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: RequestInit) => {
      if (init?.method === 'POST' && url.endsWith('/comments')) {
        posted.push(JSON.parse(String(init.body)));
        return new Response('{}', { status: 201 });
      }
      const body = url.endsWith('/review')
        ? {
            me,
            comments: [
              {
                id: 'c1',
                blockId: 'b1',
                parentId: null,
                authorId: 'r1',
                authorName: 'Ana López',
                authorMunicipality: null,
                text: 'Revisa esto @José Barrera, por favor',
                blockExcerpt: '',
                createdAt: '2026-11-10T10:00:00.000Z',
                resolved: false,
              },
            ],
            approvals: [],
            reviewers: {
              r1: { name: 'Ana López', municipality: null },
              r2: { name: 'José Barrera', municipality: 'San Rafael' },
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
  posted.length = 0;
});

const dialog = () => document.querySelector('dialog[open]');
const press = (element: Element | null | undefined) =>
  element?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

async function openThread() {
  await wait();
  const pill = document.querySelector<HTMLElement>(
    '[data-block-id="b1"] button',
  );
  press(pill);
  await wait();
}

function textarea(): HTMLTextAreaElement {
  const field = dialog()?.querySelector('textarea');
  if (!field) throw new Error('No hay campo de comentario');
  return field;
}

function type(field: HTMLTextAreaElement, value: string) {
  field.value = value;
  field.setSelectionRange(value.length, value.length);
  field.dispatchEvent(new Event('input', { bubbles: true }));
}

const suggestionButtons = () => [
  ...(dialog()?.querySelectorAll('ul[aria-label="Personas"] button') ?? []),
];

describe('menciones en comentarios', () => {
  it('una @ conocida se muestra como botón y su tarjeta trae el municipio', async () => {
    await openThread();
    const mention = [...(dialog()?.querySelectorAll('button') ?? [])].find(
      (button) => button.textContent === '@José Barrera',
    );
    expect(mention).toBeDefined();
    expect(dialog()?.textContent).not.toContain('San Rafael');
    press(mention);
    await wait();
    expect(dialog()?.textContent).toContain('San Rafael');
  });

  it('al escribir «@jo» sugiere a la persona y al elegirla la inserta', async () => {
    await openThread();
    const field = textarea();
    type(field, 'Hola @jo');
    await wait();
    const options = suggestionButtons();
    expect(options).toHaveLength(1);
    expect(options[0]?.textContent).toContain('José Barrera');
    expect(options[0]?.textContent).toContain('San Rafael');
    press(options[0]);
    await wait();
    expect(textarea().value).toBe('Hola @José Barrera ');
    expect(suggestionButtons()).toHaveLength(0);
  });

  it('Escape cierra la lista sin insertar nada', async () => {
    await openThread();
    const field = textarea();
    type(field, '@jo');
    await wait();
    expect(suggestionButtons()).toHaveLength(1);
    field.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    await wait();
    expect(suggestionButtons()).toHaveLength(0);
    expect(field.value).toBe('@jo');
  });

  it('sin @ no hay lista', async () => {
    await openThread();
    type(textarea(), 'Hola jo');
    await wait();
    expect(suggestionButtons()).toHaveLength(0);
  });
});
