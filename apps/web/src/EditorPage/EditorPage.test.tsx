// @vitest-environment happy-dom
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

/** Todos los editores de la página, en orden: por sección, primero su nota y luego su contenido. */
const editorsIn = (host: HTMLElement) =>
  [...host.querySelectorAll('.ProseMirror')] as (HTMLElement & {
    editor?: Editor;
  })[];

async function waitForEditors(host: HTMLElement, count: number) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const found = editorsIn(host).filter((element) => element.editor);
    if (found.length >= count) {
      return found.map((element) => element.editor as Editor);
    }
    await wait(50);
  }
  throw new Error(`faltan editores (se esperaban ${count})`);
}

/** El editor del contenido de una sección (por defecto, la primera). */
async function editorOf(host: HTMLElement, section = 0): Promise<Editor> {
  const editors = await waitForEditors(host, section * 2 + 2);
  return editors[section * 2 + 1] as Editor;
}

/** El editor de la nota «Para qué sirve» de una sección. */
async function noteEditorOf(host: HTMLElement, section = 0): Promise<Editor> {
  const editors = await waitForEditors(host, section * 2 + 2);
  return editors[section * 2] as Editor;
}

/** El último botón con ese texto exacto: las hojas se montan después de la página. */
const inputs = (host: HTMLElement, label: string) =>
  [...host.querySelectorAll('label')]
    .filter((item) => item.textContent?.trim().startsWith(label))
    .map((item) => item.querySelector('input') as HTMLInputElement);

const titleInputs = (host: HTMLElement) => [
  ...host.querySelectorAll<HTMLInputElement>('input[aria-label^="Título: "]'),
];

const titleInput = (host: HTMLElement, index: number) =>
  titleInputs(host)[index] as HTMLInputElement;

const descriptionInput = (host: HTMLElement, index: number) =>
  [
    ...host.querySelectorAll<HTMLInputElement>(
      'input[aria-label^="Descripción"]',
    ),
  ][index] as HTMLInputElement;

function write(input: HTMLInputElement, value: string) {
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

const button = (root: ParentNode, text: string) => {
  const found = [...root.querySelectorAll('button')]
    .filter((item) => item.textContent?.trim() === text)
    .at(-1);
  if (!found) throw new Error(`falta el botón «${text}»`);
  return found;
};

function type(editor: Editor, html: string) {
  editor.commands.setContent(html, { emitUpdate: true });
}

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
    expect(titleInput(host, 0).getAttribute('aria-label')).toBe(
      'Título: Sección 1',
    );
    expect(titleInput(host, 0).value).toBe('Primera');
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
    expect(editor.getText()).toBe('Del borrador');
    expect(host.textContent).toContain('Borrador guardado');
  });

  it('escribir marca cambios sin guardar; guardar manda la revisión y limpia el aviso', async () => {
    const calls = fakeApi();
    const host = mount();
    const editor = await editorOf(host);
    type(editor, '<p>Hola</p><p>Mundo nuevo</p>');
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

    type(editor, '<p>Otra vez</p>');
    await wait(20);
    button(host, 'Guardar borrador').click();
    await wait();
    expect(calls.puts[1]?.expectedRevision).toBe(1);
  });

  it('escribir no vuelve a crear el editor', async () => {
    fakeApi();
    const host = mount();
    const editor = await editorOf(host);
    type(editor, '<p>Uno</p>');
    await wait(20);
    type(editor, '<p>Dos</p>');
    await wait(20);
    expect((await editorOf(host)) === editor).toBe(true);
  });

  it('lo que se escribe mientras se guarda sigue pendiente y no se pierde', async () => {
    const calls = fakeApi({ putDelay: 300 });
    const host = mount();
    const editor = await editorOf(host);
    type(editor, '<p>Primero</p>');
    await wait(20);
    button(host, 'Guardar borrador').click();
    await wait(50);
    type(editor, '<p>Segundo</p>');
    await wait(500);
    expect(host.textContent).toContain('Cambios sin guardar');
    button(host, 'Guardar borrador').click();
    await wait(500);
    expect(calls.puts.map((put) => put.content.sections[0]?.html)).toEqual([
      '<p>Primero</p>',
      '<p>Segundo</p>',
    ]);
    expect(host.textContent).toContain('Borrador guardado');
  });

  it('editar el título y la descripción de una sección se guarda en el borrador', async () => {
    const calls = fakeApi();
    const host = mount();
    await editorOf(host);
    write(titleInput(host, 0), 'Primera, corregida');
    write(descriptionInput(host, 0), 'Qué hay en esta sección');
    await wait(20);
    expect(host.textContent).toContain('Cambios sin guardar');
    button(host, 'Guardar borrador').click();
    await wait();
    const saved = calls.puts[0]?.content.sections[0];
    expect(saved?.title).toBe('Primera, corregida');
    expect(saved?.description).toBe('Qué hay en esta sección');
    expect(host.textContent).toContain('Borrador guardado');
  });

  it('dejar la descripción vacía otra vez no cuenta como un cambio', async () => {
    fakeApi();
    const host = mount();
    await editorOf(host);
    write(descriptionInput(host, 0), 'algo');
    await wait(20);
    expect(host.textContent).toContain('Cambios sin guardar');
    write(descriptionInput(host, 0), '');
    await wait(20);
    expect(host.textContent).toContain('Sin cambios');
  });

  it('escribir en un título no vuelve a crear el editor ni le quita el foco', async () => {
    fakeApi();
    const host = mount();
    const editor = await editorOf(host);
    const input = titleInput(host, 0);
    write(input, 'Otro');
    await wait(20);
    expect(titleInput(host, 0)).toBe(input);
    expect((await editorOf(host)) === editor).toBe(true);
  });

  it('agregar una sección la pone después de la última numerada y antes del anexo', async () => {
    const calls = fakeApi({ published: WITH_ANNEX });
    const host = mount();
    await editorOf(host);
    button(host, '+ Agregar sección').click();
    await wait(50);
    const sectionTitles = titleInputs(host).map((item) =>
      item.getAttribute('aria-label'),
    );
    expect(sectionTitles).toEqual([
      'Título: Sección 1',
      'Título: Sección 2',
      'Título: Sección 3',
      'Título: Anexo A',
    ]);
    expect(titleInput(host, 2).value).toBe('Nueva sección');
    expect(host.textContent).toContain('Cambios sin guardar');

    write(titleInput(host, 2), 'Mi tercera');
    button(host, 'Guardar borrador').click();
    await wait();
    const ids = calls.puts[0]?.content.sections.map((item) => item.id);
    expect(ids).toEqual(['uno', 'dos', 'nueva-seccion', 'glosario']);
    expect(calls.puts[0]?.content.sections[2]?.title).toBe('Mi tercera');
    expect(calls.puts[0]?.content.sections[2]?.num).toBe('3');
  });

  it('el texto de una sección nueva se puede escribir y se guarda', async () => {
    const calls = fakeApi();
    const host = mount();
    await editorOf(host);
    button(host, '+ Agregar sección').click();
    await wait(400);
    // Dos secciones, cada una con su nota y su contenido.
    expect(editorsIn(host)).toHaveLength(4);
    const created = await editorOf(host, 1);
    type(created, '<p>Texto nuevo</p>');
    await wait(20);
    button(host, 'Guardar borrador').click();
    await wait();
    expect(calls.puts[0]?.content.sections[1]?.html).toBe('<p>Texto nuevo</p>');
  });

  it('la nota «Para qué sirve» es un campo aparte y el contenido no la repite', async () => {
    fakeApi({ published: WITH_NOTE_AND_GLOSSARY });
    const host = mount();
    const note = await noteEditorOf(host);
    const body = await editorOf(host);
    expect(note.getText()).toBe('Explica todo.');
    expect(note.getHTML()).toContain('<strong>todo</strong>');
    expect(body.getText()).toBe('Hola');
    expect(host.textContent).toContain('Para qué sirve');
  });

  it('editar la nota reescribe el primer párrafo sin tocar el contenido', async () => {
    const calls = fakeApi({ published: WITH_NOTE_AND_GLOSSARY });
    const host = mount();
    const note = await noteEditorOf(host);
    type(note, '<p>Una nota <em>nueva</em>.</p>');
    await wait(20);
    expect(host.textContent).toContain('Cambios sin guardar');
    button(host, 'Guardar borrador').click();
    await wait();
    expect(calls.puts[0]?.content.sections[0]?.html).toBe(
      '<p><strong>Para qué sirve.</strong> Una nota <em>nueva</em>.</p><p>Hola</p>',
    );
  });

  it('dejar la nota vacía quita ese párrafo; escribir el contenido no la pierde', async () => {
    const calls = fakeApi({ published: WITH_NOTE_AND_GLOSSARY });
    const host = mount();
    const note = await noteEditorOf(host);
    const body = await editorOf(host);
    type(body, '<p>Hola de nuevo</p>');
    await wait(20);
    button(host, 'Guardar borrador').click();
    await wait();
    expect(calls.puts[0]?.content.sections[0]?.html).toBe(
      '<p><strong>Para qué sirve.</strong> Explica <strong>todo</strong>.</p><p>Hola de nuevo</p>',
    );
    type(note, '<p></p>');
    await wait(20);
    button(host, 'Guardar borrador').click();
    await wait();
    expect(calls.puts[1]?.content.sections[0]?.html).toBe(
      '<p>Hola de nuevo</p>',
    );
  });

  it('en el glosario cada término muestra cómo aparece en el texto', async () => {
    const calls = fakeApi({ published: WITH_NOTE_AND_GLOSSARY });
    const host = mount();
    await editorOf(host, 1);
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
    await editorOf(host, 1);
    expect(host.textContent).toContain('Enlaces sin término');
    expect(host.textContent).toContain('→ Viejo');
    button(host, 'Quitar').click();
    await wait(20);
    expect(host.textContent).not.toContain('Enlaces sin término');
    button(host, 'Guardar borrador').click();
    await wait();
    expect(calls.puts[0]?.content.glossaryTerms).toEqual({ quórum: 'Quórum' });
  });

  it('«+ Término» agrega un término con su definición al glosario', async () => {
    const calls = fakeApi({ published: WITH_NOTE_AND_GLOSSARY });
    const host = mount();
    await editorOf(host, 1);
    // La barra del glosario es la última.
    const bars = host.querySelectorAll('[role="toolbar"]');
    const glossaryBar = bars[bars.length - 1] as HTMLElement;
    button(glossaryBar, '+ Término').click();
    await wait(20);
    button(host, 'Guardar borrador').click();
    await wait();
    const saved = calls.puts[0]?.content.sections[1]?.html ?? '';
    expect(saved).toContain('<dt>Nuevo término</dt><dd>Definición</dd>');
    expect(saved.startsWith('<dl><dt>Quórum</dt>')).toBe(true);
  });

  it('sin glosario ofrece agregarlo como anexo, una sola vez', async () => {
    const calls = fakeApi();
    const host = mount();
    await editorOf(host);
    button(host, '+ Agregar glosario').click();
    await wait(50);
    expect(() => button(host, '+ Agregar glosario')).toThrow();
    expect(titleInput(host, 1).getAttribute('aria-label')).toBe(
      'Título: Anexo A',
    );
    expect(titleInput(host, 1).value).toBe('Glosario');
    button(host, 'Guardar borrador').click();
    await wait();
    const added = calls.puts[0]?.content.sections[1];
    expect(added?.id).toBe('glosario');
    expect(added?.num).toBe('A');
  });

  it('si otra persona guardó antes, avisa, no pierde lo escrito y ofrece recargar', async () => {
    fakeApi({ putStatus: 409 });
    const host = mount();
    const editor = await editorOf(host);
    type(editor, '<p>Mío</p>');
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
    // La primera barra es la de la nota; la segunda, la del contenido.
    const body = host.querySelectorAll('[role="toolbar"]')[1] as HTMLElement;
    const labels = [...body.querySelectorAll('button')].map(
      (item) => item.textContent,
    );
    expect(labels).toEqual([
      'Negrilla',
      'Cursiva',
      'Encabezado 1',
      'Encabezado 2',
      'Encabezado 3',
      'Lista numerada',
      'Lista',
      '↶',
      '↷',
    ]);
  });

  it('un formato activo queda marcado en la barra', async () => {
    fakeApi();
    const host = mount();
    const editor = await editorOf(host);
    editor.commands.selectAll();
    button(host, 'Encabezado 1').click();
    await wait(20);
    expect(button(host, 'Encabezado 1').getAttribute('aria-pressed')).toBe(
      'true',
    );
    expect(button(host, 'Encabezado 2').getAttribute('aria-pressed')).toBe(
      'false',
    );
  });

  it('el formato de la barra se aplica al texto', async () => {
    fakeApi();
    const host = mount();
    const editor = await editorOf(host);
    editor.commands.selectAll();
    button(host, 'Negrilla').click();
    await wait(20);
    expect(editor.getHTML()).toContain('<strong>');
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
    type(editor, '<p>Hola cambiado</p><p>Mundo</p>');
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
    type(editor, '<p>Cambio</p>');
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
