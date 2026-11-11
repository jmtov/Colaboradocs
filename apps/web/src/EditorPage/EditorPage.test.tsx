// @vitest-environment happy-dom
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ReviewProvider } from '@colaboradocs/review-ui';
import type { Editor } from '@tiptap/core';
import { render } from 'solid-js/web';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DocumentContent } from '@/content/content.types';
import { buildProse } from '@/Prose/buildProse';
import EditorPage from './EditorPage';

const admin = { id: 'r1', name: 'Ana', isAdmin: true, municipality: null };
const member = { id: 'r2', name: 'Luis', isAdmin: false, municipality: null };
const wait = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));
const disposers: (() => void)[] = [];

const PUBLISHED: DocumentContent = {
  id: 'doc',
  title: 'Mi documento',
  version: '1.0',
  updated: '2026-01-01',
  sources: [],
  sections: [
    {
      id: 'uno',
      num: '1',
      title: 'Primera',
      status: 'listo',
      html: '<p>Hola</p><p>Mundo</p>',
    },
  ],
};

const blockId = (html: string, index: number) =>
  [
    ...buildProse(html, {
      sectionId: 'uno',
      reviewable: true,
    }).querySelectorAll('[data-block-id]'),
  ][index]?.getAttribute('data-block-id') ?? '';

/** Dos secciones numeradas y un anexo, para ver dónde cae una sección nueva. */
const WITH_ANNEX: DocumentContent = {
  ...PUBLISHED,
  sections: [
    ...PUBLISHED.sections,
    {
      id: 'dos',
      num: '2',
      title: 'Segunda',
      status: 'borrador',
      html: '<p>B</p>',
    },
    {
      id: 'glosario',
      num: 'A',
      title: 'Glosario',
      status: 'listo',
      html: '<dl><dt>X</dt><dd>Y</dd></dl>',
    },
  ],
};

const NOTE_HTML =
  '<p><strong>Para qué sirve.</strong> Explica <strong>todo</strong>.</p><p>Hola</p>';

/** Una sección con nota y un glosario con enlaces (uno huérfano). */
const WITH_NOTE_AND_GLOSSARY: DocumentContent = {
  ...PUBLISHED,
  glossaryTerms: { quórum: 'Quórum', 'qué era': 'Viejo' },
  sections: [
    { ...(PUBLISHED.sections[0] as object), html: NOTE_HTML },
    {
      id: 'glosario',
      num: 'A',
      title: 'Glosario',
      status: 'listo',
      html: '<dl><dt>Quórum</dt><dd>Mínimo.</dd><dt>AMO</dt><dd>Área.</dd></dl>',
    },
  ] as DocumentContent['sections'],
};

type Calls = {
  puts: { expectedRevision: number; content: DocumentContent }[];
  publishes: { expectedRevision: number; force?: boolean }[];
  discards: number;
};

type Options = {
  me?: typeof admin;
  draft?: { content: DocumentContent; revision: number; stale?: boolean };
  putStatus?: number;
  /** El documento publicado, si no es el de siempre. */
  published?: DocumentContent;
  /** Demora del guardado, para escribir mientras se guarda. */
  putDelay?: number;
  publishResults?: ('ok' | 'draft_stale')[];
  comments?: object[];
};

/** Una API simulada: lleva la cuenta de lo que se guardó, publicó y descartó. */
function fakeApi(options: Options = {}) {
  const calls: Calls = { puts: [], publishes: [], discards: 0 };
  let revision = options.draft?.revision ?? 0;
  const publishResults = [...(options.publishResults ?? ['ok'])];
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status });
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET';
      if (url === '/api/documents') return json([]);
      if (url === '/api/documents/doc/review') {
        return json({
          me: options.me ?? admin,
          comments: options.comments ?? [],
          approvals: [],
          reviewers: {},
        });
      }
      if (url === '/api/documents/doc/content') {
        return json(options.published ?? PUBLISHED);
      }
      if (url === '/api/admin/documents/doc/draft') {
        if (method === 'GET') {
          return options.draft
            ? json({
                ...options.draft,
                stale: options.draft.stale ?? false,
                updatedAt: '2026-01-02',
                updatedBy: null,
                baseUpdatedAt: '2026-01-01',
              })
            : json({ error: 'not_found' }, 404);
        }
        if (method === 'PUT') {
          if (options.putStatus === 409) {
            return json({ error: 'conflict' }, 409);
          }
          calls.puts.push(JSON.parse(String(init?.body)));
          if (options.putDelay) await wait(options.putDelay);
          revision += 1;
          return json({
            revision,
            updatedAt: '2026-01-02',
            updatedBy: null,
            baseUpdatedAt: '2026-01-01',
            stale: false,
          });
        }
        if (method === 'DELETE') {
          calls.discards += 1;
          return new Response(null, { status: 204 });
        }
      }
      if (url === '/api/admin/documents/doc/publish' && method === 'POST') {
        calls.publishes.push(JSON.parse(String(init?.body)));
        return publishResults.shift() === 'draft_stale'
          ? json({ error: 'draft_stale' }, 409)
          : json({ created: false });
      }
      return json({ error: 'not_found' }, 404);
    }),
  );
  return calls;
}

function mount() {
  const host = document.createElement('div');
  document.body.appendChild(host);
  disposers.push(
    render(
      () => (
        <ReviewProvider documentId="doc">
          <EditorPage id="doc" name="Espacio" />
        </ReviewProvider>
      ),
      host,
    ),
  );
  return host;
}

/** El editor del documento (hay uno solo). */
async function editorOf(host: HTMLElement): Promise<Editor> {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const element = host.querySelector('.ProseMirror') as
      | (HTMLElement & { editor?: Editor })
      | null;
    if (element?.editor) return element.editor;
    await wait(50);
  }
  throw new Error('falta el editor');
}

const inputs = (host: ParentNode, label: string) =>
  [...host.querySelectorAll('label')]
    .filter((item) => item.textContent?.trim().startsWith(label))
    .map((item) => item.querySelector('input') as HTMLInputElement);

function write(input: HTMLInputElement, value: string) {
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

/** El último botón con ese texto (o nombre, si es solo ícono) exacto: las hojas se montan después de la página. */
const button = (root: ParentNode, text: string) => {
  const found = [...root.querySelectorAll('button')]
    .filter(
      (item) =>
        (item.getAttribute('aria-label') ?? item.textContent)?.trim() === text,
    )
    .at(-1);
  if (!found) throw new Error(`falta el botón «${text}»`);
  return found;
};

/** Pone el cursor al final del bloque que tiene ese texto. */
function cursorAtEndOf(editor: Editor, text: string) {
  let found = -1;
  editor.state.doc.descendants((node, pos) => {
    if (node.isTextblock && node.textContent === text) {
      found = pos + node.nodeSize - 1;
    }
  });
  if (found < 0) throw new Error(`no hay un bloque «${text}»`);
  editor.commands.focus(found);
}

/** Escribe al final de un bloque. */
function typeAtEndOf(editor: Editor, text: string, extra: string) {
  cursorAtEndOf(editor, text);
  editor.commands.insertContent(extra);
}

/** Los títulos del documento, sin el botón de ajustes que lleva cada uno. */
const titles = (host: HTMLElement) =>
  [...host.querySelectorAll('.ProseMirror h2')].map((item) =>
    [...item.childNodes]
      .filter((node) => node.nodeType === 3)
      .map((node) => node.textContent)
      .join(''),
  );

/** Abre los ajustes de una sección desde el botón de su título (el sheet queda en `document.body`). */
async function openSettings(host: HTMLElement, sectionId: string) {
  const trigger = host.querySelector(
    `[data-section-settings="${sectionId}"]`,
  ) as HTMLButtonElement | null;
  if (!trigger) throw new Error(`falta el botón de ajustes de «${sectionId}»`);
  trigger.click();
  await wait(300);
}

const sheetInputs = (label: string) => inputs(document.body, label);

beforeEach(() => {
  window.history.replaceState(null, '', '/d/doc/editar');
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

describe('EditorPage', () => {
  it('sin borrador parte de lo publicado y no hay nada que guardar ni publicar', async () => {
    fakeApi();
    const host = mount();
    const editor = await editorOf(host);
    expect(host.textContent).toContain('Mi documento');
    // el glosario está siempre, al final (antes de la bibliografía), aunque el documento no lo tenga
    expect(titles(host)).toEqual(['Primera', 'Glosario']);
    expect(editor.getText()).toContain('Hola');
    expect(host.textContent).toContain('Sin cambios');
    expect(button(host, 'Guardar borrador').disabled).toBe(true);
    expect(button(host, 'Publicar…').disabled).toBe(true);
  });

  it('con borrador parte del borrador', async () => {
    fakeApi({
      draft: {
        revision: 3,
        content: {
          ...PUBLISHED,
          sections: [
            {
              ...(PUBLISHED.sections[0] as object),
              html: '<p>Del borrador</p>',
            },
          ],
        } as DocumentContent,
      },
    });
    const host = mount();
    const editor = await editorOf(host);
    expect(editor.getText()).toContain('Del borrador');
    expect(host.textContent).toContain('Borrador guardado');
  });

  it('escribir marca cambios sin guardar; guardar manda la revisión y limpia el aviso', async () => {
    const calls = fakeApi();
    const host = mount();
    const editor = await editorOf(host);
    typeAtEndOf(editor, 'Mundo', ' nuevo');
    await wait(20);
    expect(host.textContent).toContain('Cambios sin guardar');

    button(host, 'Guardar borrador').click();
    await wait();
    expect(calls.puts).toHaveLength(1);
    expect(calls.puts[0]?.expectedRevision).toBe(0);
    expect(calls.puts[0]?.content.sections[0]?.html).toBe(
      '<p>Hola</p><p>Mundo nuevo</p>',
    );
    expect(host.textContent).toContain('Borrador guardado');

    typeAtEndOf(editor, 'Hola', ' otra vez');
    await wait(20);
    button(host, 'Guardar borrador').click();
    await wait();
    expect(calls.puts[1]?.expectedRevision).toBe(1);
  });

  it('escribir no vuelve a crear el editor', async () => {
    fakeApi();
    const host = mount();
    const editor = await editorOf(host);
    typeAtEndOf(editor, 'Hola', '!');
    await wait(20);
    typeAtEndOf(editor, 'Hola!', '!');
    await wait(20);
    expect((await editorOf(host)) === editor).toBe(true);
    expect(editor.getText()).toContain('Hola!!');
  });

  it('lo que se escribe mientras se guarda sigue pendiente y no se pierde', async () => {
    const calls = fakeApi({ putDelay: 300 });
    const host = mount();
    const editor = await editorOf(host);
    typeAtEndOf(editor, 'Hola', ' primero');
    await wait(20);
    button(host, 'Guardar borrador').click();
    await wait(50);
    typeAtEndOf(editor, 'Hola primero', ' segundo');
    await wait(500);
    expect(host.textContent).toContain('Cambios sin guardar');
    button(host, 'Guardar borrador').click();
    await wait(500);
    expect(calls.puts.map((put) => put.content.sections[0]?.html)).toEqual([
      '<p>Hola primero</p><p>Mundo</p>',
      '<p>Hola primero segundo</p><p>Mundo</p>',
    ]);
    expect(host.textContent).toContain('Borrador guardado');
  });

  it('el título se edita en el documento y se guarda', async () => {
    const calls = fakeApi();
    const host = mount();
    const editor = await editorOf(host);
    typeAtEndOf(editor, 'Primera', ', corregida');
    await wait(20);
    expect(host.textContent).toContain('Cambios sin guardar');
    button(host, 'Guardar borrador').click();
    await wait();
    expect(calls.puts[0]?.content.sections[0]?.title).toBe(
      'Primera, corregida',
    );
    expect(calls.puts[0]?.content.sections[0]?.id).toBe('uno');
  });

  it('el botón del título abre los ajustes de esa sección y aplica estado y descripción', async () => {
    const calls = fakeApi({ published: WITH_ANNEX });
    const host = mount();
    await editorOf(host);
    await openSettings(host, 'dos');
    expect(document.body.textContent).toContain('Sección 2');
    const select = document.body.querySelector('select') as HTMLSelectElement;
    expect(select.value).toBe('borrador');
    select.value = 'listo';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    write(sheetInputs('Descripción')[0] as HTMLInputElement, 'Qué hay aquí');
    button(document.body, 'Aplicar').click();
    await wait(300);
    expect(host.textContent).toContain('Cambios sin guardar');
    button(host, 'Guardar borrador').click();
    await wait();
    const saved = calls.puts[0]?.content.sections;
    expect(saved?.[0]?.status).toBe('listo');
    expect(saved?.[0]?.description).toBeUndefined();
    expect(saved?.[1]).toMatchObject({
      id: 'dos',
      status: 'listo',
      description: 'Qué hay aquí',
    });
  });

  it('cancelar los ajustes no cambia nada', async () => {
    fakeApi();
    const host = mount();
    await editorOf(host);
    await openSettings(host, 'uno');
    write(sheetInputs('Descripción')[0] as HTMLInputElement, 'algo');
    button(document.body, 'Cancelar').click();
    await wait(300);
    expect(host.textContent).toContain('Sin cambios');
  });

  it('dejar la descripción vacía otra vez no cuenta como un cambio', async () => {
    fakeApi();
    const host = mount();
    await editorOf(host);
    await openSettings(host, 'uno');
    write(sheetInputs('Descripción')[0] as HTMLInputElement, 'algo');
    button(document.body, 'Aplicar').click();
    await wait(300);
    expect(host.textContent).toContain('Cambios sin guardar');
    await openSettings(host, 'uno');
    write(sheetInputs('Descripción')[0] as HTMLInputElement, '');
    button(document.body, 'Aplicar').click();
    await wait(300);
    expect(host.textContent).toContain('Sin cambios');
  });

  it('la bibliografía se edita: agregar fuentes, escribirlas y guardarlas', async () => {
    const calls = fakeApi();
    const host = mount();
    await editorOf(host);
    expect(host.textContent).toContain('Bibliografía');
    button(host, '+ Agregar fuente').click();
    await wait(20);
    const label = host.querySelector(
      'input[aria-label="Fuente 1: referencia"]',
    ) as HTMLInputElement;
    write(label, 'Ostrom, 1990');
    write(
      host.querySelector(
        'input[aria-label="Fuente 1: enlace"]',
      ) as HTMLInputElement,
      'https://example.org',
    );
    await wait(20);
    // Escribir no recrea la fila: el campo sigue siendo el mismo.
    expect(host.querySelector('input[aria-label="Fuente 1: referencia"]')).toBe(
      label,
    );
    expect(host.textContent).toContain('Cambios sin guardar');
    button(host, 'Guardar borrador').click();
    await wait();
    expect(calls.puts[0]?.content.sources).toEqual([
      { label: 'Ostrom, 1990', url: 'https://example.org' },
    ]);
  });

  it('quitar la última fuente avisa si el texto la cita', async () => {
    const published: DocumentContent = {
      ...PUBLISHED,
      sources: [
        { label: 'A', url: '' },
        { label: 'B', url: '' },
      ],
      sections: [
        {
          ...(PUBLISHED.sections[0] as DocumentContent['sections'][number]),
          html: '<p>Dato <em>[1, 2]</em>.</p>',
        },
      ],
    };
    const calls = fakeApi({ published });
    const host = mount();
    await editorOf(host);
    button(host, 'Quitar la última').click();
    await wait(300);
    expect(document.body.textContent).toContain('1 cita');
    expect(document.body.textContent).toContain('[2]');
    button(document.body, 'Quitar').click();
    await wait(20);
    button(host, 'Guardar borrador').click();
    await wait();
    expect(calls.puts[0]?.content.sources).toEqual([{ label: 'A', url: '' }]);
  });

  it('«Bibliografía» en el índice lleva a la lista', async () => {
    fakeApi();
    const host = mount();
    await editorOf(host);
    const outline = host.querySelector('nav') as HTMLElement;
    button(outline, '0Bibliografía').click();
    await wait(20);
    expect(document.activeElement?.textContent).toBe('+ Agregar fuente');
  });

  it('el índice muestra las secciones y al tocar una lleva el cursor ahí', async () => {
    fakeApi({ published: WITH_ANNEX });
    const host = mount();
    const editor = await editorOf(host);
    const outline = host.querySelector('nav') as HTMLElement;
    expect(outline.textContent).toContain('Primera');
    expect(outline.textContent).toContain('Glosario');
    button(outline, '2Segunda').click();
    await wait(20);
    expect(editor.state.selection.$from.parent.textContent).toBe('Segunda');
    expect(button(outline, '2Segunda').getAttribute('aria-current')).toBe(
      'true',
    );
  });

  it('eliminar una sección pide confirmación y dice qué se pierde', async () => {
    const published: DocumentContent = WITH_ANNEX;
    const blockOfB = [
      ...buildProse('<p>B</p>', {
        sectionId: 'dos',
        reviewable: true,
      }).querySelectorAll('[data-block-id]'),
    ][0]?.getAttribute('data-block-id');
    const comments = [
      {
        id: 'c1',
        blockId: blockOfB,
        parentId: null,
        authorId: 'r2',
        authorName: 'Luis',
        authorMunicipality: null,
        text: 'ojo',
        blockExcerpt: 'B',
        createdAt: '2026-01-01',
        resolved: false,
      },
    ];
    fakeApi({ published, comments });
    const host = mount();
    await editorOf(host);
    await openSettings(host, 'dos');
    button(document.body, 'Eliminar sección').click();
    await wait(300);
    expect(document.body.textContent).toContain('«Segunda»');
    expect(document.body.textContent).toContain('1 comentarios y OK');
    button(document.body, 'Eliminar').click();
    await wait(50);
    expect(titles(host)).toEqual(['Primera', 'Glosario']);
  });

  it('con una sola sección no se puede eliminar', async () => {
    fakeApi();
    const host = mount();
    await editorOf(host);
    await openSettings(host, 'uno');
    expect(button(document.body, 'Eliminar sección').disabled).toBe(true);
  });

  it('avisa en vivo qué comentarios se pierden y se quita al deshacer', async () => {
    const original = PUBLISHED.sections[0]?.html ?? '';
    fakeApi({
      comments: [
        {
          id: 'c1',
          blockId: blockId(original, 0),
          parentId: null,
          authorId: 'r2',
          authorName: 'Luis',
          authorMunicipality: null,
          text: 'ojo',
          blockExcerpt: 'Hola',
          createdAt: '2026-01-01',
          resolved: false,
        },
      ],
    });
    const host = mount();
    const editor = await editorOf(host);
    await wait(500);
    expect(host.textContent).not.toContain('pierden');
    typeAtEndOf(editor, 'Hola', ' cambiado');
    await wait(700);
    expect(host.textContent).toContain(
      'Con estos cambios, 1 bloque pierden 1 comentario y 0 OK',
    );
    editor.commands.undo();
    await wait(700);
    expect(host.textContent).not.toContain('pierden');
  });

  it('avisa si una sección cambia de número y algún texto dice «sección N»', async () => {
    const published: DocumentContent = {
      ...PUBLISHED,
      sections: [
        {
          id: 'uno',
          num: '1',
          title: 'Uno',
          status: 'listo',
          html: '<p>Mira la sección 3.</p>',
        },
        {
          id: 'dos',
          num: '2',
          title: 'Dos',
          status: 'listo',
          html: '<p>B</p>',
        },
        {
          id: 'tres',
          num: '3',
          title: 'Tres',
          status: 'listo',
          html: '<p>C</p>',
        },
      ],
    };
    fakeApi({ published });
    const host = mount();
    await editorOf(host);
    await openSettings(host, 'dos');
    button(document.body, 'Eliminar sección').click();
    await wait(300);
    button(document.body, 'Eliminar').click();
    await wait(700);
    expect(host.textContent).toContain('«Tres» (3 → 2)');
  });

  it('la nota «Para qué sirve» se ve apagada y «Nota» agrega una a la sección actual', async () => {
    const calls = fakeApi({ published: WITH_NOTE_AND_GLOSSARY });
    const host = mount();
    const editor = await editorOf(host);
    expect(host.querySelectorAll('[data-note]')).toHaveLength(1);
    cursorAtEndOf(editor, 'Hola');
    await wait(20);
    cursorAtEndOf(editor, 'Quórum');
    await wait(20);
    button(host, 'Nota').click();
    await wait(20);
    button(host, 'Guardar borrador').click();
    await wait();
    expect(calls.puts[0]?.content.sections[1]?.html).toContain(
      '<p><strong>Para qué sirve.</strong> </p><dl>',
    );
  });

  it('en el glosario cada término muestra cómo aparece en el texto', async () => {
    const calls = fakeApi({ published: WITH_NOTE_AND_GLOSSARY });
    const host = mount();
    await editorOf(host);
    const quorum = inputs(host, 'Quórum')[0] as HTMLInputElement;
    const amo = inputs(host, 'AMO')[0] as HTMLInputElement;
    expect(quorum.value).toBe('quórum');
    expect(amo.value).toBe('');
    amo.value = 'AMO, A.M.O.';
    amo.dispatchEvent(new Event('change', { bubbles: true }));
    await wait(20);
    expect(host.textContent).toContain('Cambios sin guardar');
    button(host, 'Guardar borrador').click();
    await wait();
    expect(calls.puts[0]?.content.glossaryTerms).toEqual({
      quórum: 'Quórum',
      'qué era': 'Viejo',
      amo: 'AMO',
      'a.m.o.': 'AMO',
    });
  });

  it('un enlace a un término que ya no existe se ve aparte y se puede quitar', async () => {
    const calls = fakeApi({ published: WITH_NOTE_AND_GLOSSARY });
    const host = mount();
    await editorOf(host);
    expect(host.textContent).toContain('Enlaces sin término');
    expect(host.textContent).toContain('→ Viejo');
    button(host, 'Quitar').click();
    await wait(20);
    expect(host.textContent).not.toContain('Enlaces sin término');
    button(host, 'Guardar borrador').click();
    await wait();
    expect(calls.puts[0]?.content.glossaryTerms).toEqual({ quórum: 'Quórum' });
  });

  it('«+ Término» solo aparece dentro del glosario y agrega el término ahí', async () => {
    const calls = fakeApi({ published: WITH_NOTE_AND_GLOSSARY });
    const host = mount();
    const editor = await editorOf(host);
    expect(() => button(host, '+ Término')).toThrow();
    cursorAtEndOf(editor, 'Área.');
    await wait(20);
    button(host, '+ Término').click();
    await wait(20);
    button(host, 'Guardar borrador').click();
    await wait();
    const saved = calls.puts[0]?.content.sections[1]?.html ?? '';
    expect(saved).toContain('<dt>Nuevo término</dt><dd>Definición</dd>');
    expect(saved.startsWith('<dl><dt>Quórum</dt>')).toBe(true);
  });

  it('si otra persona guardó antes, avisa, no pierde lo escrito y ofrece recargar', async () => {
    fakeApi({ putStatus: 409 });
    const host = mount();
    const editor = await editorOf(host);
    typeAtEndOf(editor, 'Hola', ' mío');
    await wait(20);
    button(host, 'Guardar borrador').click();
    await wait();
    expect(host.querySelector('[role="alert"]')?.textContent).toContain(
      'Otra persona guardó',
    );
    expect(host.textContent).toContain('Cambios sin guardar');
    expect(button(host, 'Recargar el borrador')).toBeDefined();
  });

  it('la barra ofrece estos botones, con estos nombres y en este orden', async () => {
    fakeApi();
    const host = mount();
    await editorOf(host);
    const bar = host.querySelector('[role="toolbar"]') as HTMLElement;
    const labels = [...bar.querySelectorAll('button')].map((item) =>
      item.getAttribute('aria-label'),
    );
    // Solo íconos: sin texto visible y con el nombre en un tooltip.
    for (const item of bar.querySelectorAll('button')) {
      expect(item.textContent).toBe('');
      expect(item.querySelector('svg')).not.toBeNull();
      expect(item.nextElementSibling?.textContent).toBeTruthy();
    }
    expect(labels).toEqual([
      'Sección',
      'Negrilla',
      'Cursiva',
      'Encabezado 1',
      'Encabezado 2',
      'Encabezado 3',
      'Lista numerada',
      'Lista',
      'Nota',
      'Cita',
      'Deshacer',
      'Rehacer',
    ]);
  });

  it('la barra va al pie: después del editor en la página y pegada abajo, con fondo blanco', async () => {
    fakeApi();
    const host = mount();
    await editorOf(host);
    const bar = host.querySelector('[role="toolbar"]') as HTMLElement;
    const prose = host.querySelector('.ProseMirror') as HTMLElement;
    // si fuera antes que el texto, «sticky bottom» no la dejaría pegada al pie al recorrer el documento
    expect(
      prose.compareDocumentPosition(bar) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    const css = readFileSync(
      join(import.meta.dirname, 'EditorPage.module.css'),
      'utf8',
    );
    const rule = /\.toolbar\s*\{([^}]*)\}/.exec(css)?.[1] ?? '';
    expect(rule).toMatch(/position:\s*sticky/);
    expect(rule).toMatch(/bottom:/);
    expect(rule).not.toMatch(/top:/);
    expect(rule).toMatch(/background:\s*var\(--bg\)/);
  });

  it('«Cita» elige fuentes de la bibliografía e inserta «[1, 2]» donde está el cursor', async () => {
    const published: DocumentContent = {
      ...PUBLISHED,
      sources: [
        { label: 'Ostrom, 1990', url: '' },
        { label: 'Ley 1757', url: '' },
        { label: 'Otra', url: '' },
      ],
    };
    const calls = fakeApi({ published });
    const host = mount();
    const editor = await editorOf(host);
    cursorAtEndOf(editor, 'Hola');
    button(host, 'Cita').click();
    await wait(300);
    expect(button(document.body, 'Insertar').disabled).toBe(true);
    const boxes = [
      ...document.body.querySelectorAll('input[type="checkbox"]'),
    ] as HTMLInputElement[];
    expect(boxes).toHaveLength(3);
    // el orden en que se eligen no importa: la cita sale ordenada
    boxes[1]?.click();
    boxes[0]?.click();
    await wait(20);
    button(document.body, 'Insertar').click();
    await wait(300);
    button(host, 'Guardar borrador').click();
    await wait();
    expect(calls.puts[0]?.content.sections[0]?.html).toBe(
      '<p>Hola<em>[1, 2]</em></p><p>Mundo</p>',
    );
    // y es una cita (nodo propio), no cursiva
    const types: string[] = [];
    editor.state.doc.descendants((node) => {
      types.push(node.type.name);
    });
    expect(types).toContain('citation');
  });

  it('sin fuentes, «Cita» manda a la bibliografía y no deja insertar', async () => {
    fakeApi();
    const host = mount();
    await editorOf(host);
    button(host, 'Cita').click();
    await wait(300);
    expect(document.body.textContent).toContain('Todavía no hay fuentes');
    expect(button(document.body, 'Insertar').disabled).toBe(true);
  });

  it('un formato activo queda marcado en la barra', async () => {
    fakeApi();
    const host = mount();
    const editor = await editorOf(host);
    cursorAtEndOf(editor, 'Hola');
    button(host, 'Encabezado 1').click();
    await wait(20);
    expect(button(host, 'Encabezado 1').getAttribute('aria-pressed')).toBe(
      'true',
    );
    expect(button(host, 'Encabezado 2').getAttribute('aria-pressed')).toBe(
      'false',
    );
  });

  it('el botón «Sección» convierte el renglón en un título y parte la sección', async () => {
    const calls = fakeApi();
    const host = mount();
    const editor = await editorOf(host);
    cursorAtEndOf(editor, 'Mundo');
    button(host, 'Sección').click();
    await wait(20);
    expect(titles(host)).toEqual(['Primera', 'Mundo', 'Glosario']);
    button(host, 'Guardar borrador').click();
    await wait();
    const saved = calls.puts[0]?.content.sections ?? [];
    expect(saved.map((item) => item.html)).toEqual(['<p>Hola</p>', '']);
    expect(saved[0]?.id).toBe('uno');
  });

  it('el formato de la barra se aplica al texto', async () => {
    fakeApi();
    const host = mount();
    const editor = await editorOf(host);
    editor.commands.setTextSelection({ from: 10, to: 12 });
    button(host, 'Negrilla').click();
    await wait(20);
    expect(editor.getHTML()).toContain('<strong>');
  });

  it('una sección nueva se hace con el botón «Sección»: recibe id propio y se le puede escribir', async () => {
    const calls = fakeApi();
    const host = mount();
    const editor = await editorOf(host);
    cursorAtEndOf(editor, 'Mundo');
    button(host, 'Sección').click();
    await wait(20);
    // Enter en el título pasa al cuerpo de la sección nueva
    editor.view.dom.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
    );
    editor.commands.insertContent('Texto nuevo');
    await wait(20);
    button(host, 'Guardar borrador').click();
    await wait();
    const saved = calls.puts[0]?.content.sections ?? [];
    expect(saved.map((item) => item.title)).toEqual(['Primera', 'Mundo']);
    expect(saved.map((item) => item.num)).toEqual(['1', '2']);
    expect(saved[1]?.id).toMatch(/^s-[0-9a-f]{8}$/);
    expect(saved[1]?.html).toBe('<p>Texto nuevo</p>');
  });

  it('no hay botones de agregar sección ni de agregar glosario, ni vista previa', async () => {
    fakeApi();
    const host = mount();
    await editorOf(host);
    for (const text of [
      '+ Agregar sección',
      '+ Agregar glosario',
      'Vista previa',
    ]) {
      expect(() => button(host, text)).toThrow();
    }
  });

  it('el glosario vacío no se guarda; con términos, sí, como anexo', async () => {
    const calls = fakeApi();
    const host = mount();
    const editor = await editorOf(host);
    typeAtEndOf(editor, 'Hola', '!');
    await wait(20);
    button(host, 'Guardar borrador').click();
    await wait();
    expect(calls.puts[0]?.content.sections.map((item) => item.id)).toEqual([
      'uno',
    ]);

    // dentro del glosario la barra ofrece «+ Término»
    let at = -1;
    editor.state.doc.descendants((node, pos) => {
      if (
        node.type.name === 'sectionTitle' &&
        node.textContent === 'Glosario'
      ) {
        at = pos + node.nodeSize + 1;
      }
    });
    editor.commands.focus(at);
    await wait(20);
    button(host, '+ Término').click();
    await wait(20);
    button(host, 'Guardar borrador').click();
    await wait();
    const added = calls.puts[1]?.content.sections[1];
    expect(added?.id).toBe('glosario');
    expect(added?.num).toBe('A');
    expect(added?.html).toBe(
      '<dl><dt>Nuevo término</dt><dd>Definición</dd></dl>',
    );
  });

  it('los botones de guardar, publicar y descartar van junto al título y llevan ícono', async () => {
    fakeApi();
    const host = mount();
    await editorOf(host);
    const title = host.querySelector('h1') as HTMLElement;
    for (const text of ['Guardar borrador', 'Publicar…', 'Descartar']) {
      const item = button(host, text);
      expect(title.parentElement?.contains(item)).toBe(true);
      expect(item.querySelector('svg')).not.toBeNull();
    }
  });

  it('«Nota» queda marcado cuando el cursor está en una nota, y «Cita» cuando está en una cita', async () => {
    fakeApi({
      published: {
        ...WITH_NOTE_AND_GLOSSARY,
        sources: [{ label: 'A', url: '' }],
        sections: [
          {
            ...(WITH_NOTE_AND_GLOSSARY
              .sections[0] as DocumentContent['sections'][number]),
            html: '<p><strong>Para qué sirve.</strong> Explica.</p><p>Dato <em>[1]</em></p>',
          },
          WITH_NOTE_AND_GLOSSARY
            .sections[1] as DocumentContent['sections'][number],
        ],
      },
    });
    const host = mount();
    const editor = await editorOf(host);
    cursorAtEndOf(editor, 'Hola'.replace('Hola', 'Para qué sirve. Explica.'));
    await wait(20);
    expect(button(host, 'Nota').getAttribute('aria-pressed')).toBe('true');
    expect(button(host, 'Cita').getAttribute('aria-pressed')).toBe('false');

    let citation = -1;
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'citation') citation = pos;
    });
    editor.commands.setNodeSelection(citation);
    await wait(20);
    expect(button(host, 'Cita').getAttribute('aria-pressed')).toBe('true');
    expect(button(host, 'Nota').getAttribute('aria-pressed')).toBe('false');
  });

  it('publicar avisa qué comentarios se pierden, guarda y publica', async () => {
    const original = PUBLISHED.sections[0]?.html ?? '';
    const calls = fakeApi({
      comments: [
        {
          id: 'c1',
          blockId: blockId(original, 0),
          parentId: null,
          authorId: 'r2',
          authorName: 'Luis',
          authorMunicipality: null,
          text: 'ojo',
          blockExcerpt: 'Hola',
          createdAt: '2026-01-01',
          resolved: false,
        },
      ],
    });
    const host = mount();
    const editor = await editorOf(host);
    typeAtEndOf(editor, 'Hola', ' cambiado');
    await wait(20);
    button(host, 'Publicar…').click();
    await wait(300);
    const sheet = document.body.textContent ?? '';
    expect(sheet).toContain('1 comentario y 0 OK dejarán de aplicar');
    expect(sheet).toContain('«Hola»');

    button(document.body, 'Publicar').click();
    await wait(400);
    expect(calls.puts).toHaveLength(1);
    expect(calls.puts[0]?.content.updated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(calls.publishes).toEqual([{ expectedRevision: 1 }]);
    expect(window.location.pathname).toBe('/d/doc');
  });

  it('si lo publicado cambió, pregunta y publica con force solo si se confirma', async () => {
    const calls = fakeApi({ publishResults: ['draft_stale', 'ok'] });
    const host = mount();
    const editor = await editorOf(host);
    typeAtEndOf(editor, 'Hola', ' cambio');
    await wait(20);
    button(host, 'Publicar…').click();
    await wait(300);
    button(document.body, 'Publicar').click();
    await wait(400);
    expect(document.body.textContent).toContain('El documento cambió');
    button(document.body, 'Publicar de todos modos').click();
    await wait(400);
    expect(calls.publishes).toEqual([
      { expectedRevision: 1 },
      { expectedRevision: 1, force: true },
    ]);
    expect(window.location.pathname).toBe('/d/doc');
  });

  it('descartar pide confirmación y borra el borrador', async () => {
    const calls = fakeApi({
      draft: { revision: 2, content: PUBLISHED },
    });
    const host = mount();
    await editorOf(host);
    button(host, 'Descartar').click();
    await wait(300);
    expect(calls.discards).toBe(0);
    button(document.body, 'Descartar').click();
    await wait(400);
    expect(calls.discards).toBe(1);
    expect(window.location.pathname).toBe('/d/doc');
  });

  it('quien no es admin no ve el editor', async () => {
    localStorage.setItem(
      'review:session',
      JSON.stringify({ token: 't', reviewer: member }),
    );
    fakeApi({ me: member as typeof admin });
    const host = mount();
    await wait();
    expect(host.textContent).toContain('Solo para administradores');
    expect(host.querySelector('.ProseMirror')).toBeNull();
  });
});
