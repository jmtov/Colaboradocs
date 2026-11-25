import { SELF } from 'cloudflare:test';
import {
  type DocumentContent,
  permissionForAdminRoute,
  ROLE_PERMISSIONS,
  type Task,
} from '@colaboradocs/review-core';
import { neutralTheme } from '@colaboradocs/themes';
import { beforeEach, describe, expect, it } from 'vitest';
import type { UtcpManual, UtcpTool } from '../src/utcp/utcp.types';
import {
  authed,
  createReviewer,
  DEVICE_A,
  resetDatabase,
  type TestReviewer,
  tokenFor,
} from './helpers';

const ORIGIN = 'https://colaboradocs.test';

async function manual(): Promise<UtcpManual> {
  const response = await SELF.fetch(`${ORIGIN}/api/utcp`);
  expect(response.status).toBe(200);
  return (await response.json()) as UtcpManual;
}

function find(m: UtcpManual, name: string): UtcpTool {
  const found = m.tools.find((item) => item.name === name);
  if (!found) throw new Error(`El manual no tiene la herramienta ${name}.`);
  return found;
}

/** Un cliente UTCP mínimo: llama una herramienta tal como la describe su plantilla. */
async function call(
  item: UtcpTool,
  args: Record<string, unknown>,
  token?: string,
): Promise<Response> {
  const template = item.tool_call_template;
  const rest = { ...args };
  let url = template.url.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = rest[key];
    delete rest[key];
    return encodeURIComponent(String(value));
  });
  let body: string | undefined;
  if (template.body_field) {
    body = JSON.stringify(rest[template.body_field]);
    delete rest[template.body_field];
  }
  const query = new URLSearchParams(rest as Record<string, string>).toString();
  if (query) url += `?${query}`;
  const headers: Record<string, string> = {};
  if (body)
    headers['Content-Type'] = template.content_type ?? 'application/json';
  if (template.auth && token)
    headers[template.auth.var_name] = `Bearer ${token}`;
  return SELF.fetch(url, { method: template.http_method, headers, body });
}

function sampleDocument(id: string): DocumentContent {
  return {
    id,
    title: `Documento ${id}`,
    version: '0.1',
    updated: '2026-11-10',
    sources: [],
    sections: [
      {
        id: 'a',
        num: '1',
        title: 'A',
        status: 'borrador',
        html: '<p>Hola</p>',
      },
    ],
  };
}

describe('manual UTCP: forma', () => {
  it('es público y declara versión, información y herramientas', async () => {
    const m = await manual();
    expect(m.utcp_version).toBe('1.0.1');
    expect(m.info.title).toBe('Colaboradocs');
    expect(m.tools.length).toBeGreaterThan(0);
  });

  it('cada herramienta es coherente consigo misma', async () => {
    const m = await manual();
    expect(new Set(m.tools.map((t) => t.name)).size).toBe(m.tools.length);
    for (const item of m.tools) {
      const template = item.tool_call_template;
      expect(template.url.startsWith(`${ORIGIN}/api/`)).toBe(true);
      const properties = item.inputs.properties ?? {};
      const params = [...template.url.matchAll(/\{(\w+)\}/g)].map((x) => x[1]);
      for (const param of params) {
        expect(
          properties[param as string],
          `${item.name}: {${param}}`,
        ).toBeDefined();
        expect(item.inputs.required).toContain(param);
      }
      if (template.body_field) {
        expect(properties[template.body_field], item.name).toBeDefined();
      }
    }
  });

  it('cada herramienta de administración exige el permiso que dice la tabla, y el agente lo tiene', async () => {
    const m = await manual();
    const agentPermissions: readonly string[] = ROLE_PERMISSIONS.agent;
    for (const item of m.tools) {
      const { url, http_method: method } = item.tool_call_template;
      const permission = item.tags.find((tag) => tag.includes(':'));
      if (permission) expect(agentPermissions).toContain(permission);
      if (url.includes('/admin/')) {
        const path = new URL(url).pathname;
        expect(permissionForAdminRoute(method, path), item.name).toBe(
          permission,
        );
      }
    }
  });

  it('solo login va sin token', async () => {
    const m = await manual();
    const open = m.tools.filter((t) => !t.tool_call_template.auth);
    expect(open.map((t) => t.name)).toEqual(['login']);
  });

  it('no anuncia nada que el agente no pueda hacer: ni presentaciones, ni accesos, ni archivar', async () => {
    const m = await manual();
    for (const item of m.tools) {
      const { url, http_method: method } = item.tool_call_template;
      expect(url).not.toMatch(/reviewers|space|\/admin\/themes|files/);
      expect(url).not.toMatch(/decks\/.*publish/);
      if (url.includes('/admin/')) {
        expect(url).toMatch(/\/draft$|\/publish$/);
        expect(['GET', 'PUT', 'POST']).toContain(method);
        if (url.endsWith('/publish')) expect(method).toBe('POST');
      }
    }
  });
});

describe('manual UTCP: un agente que lo sigue', () => {
  let agent: TestReviewer;
  let ana: TestReviewer;
  let m: UtcpManual;
  let token: string;

  beforeEach(async () => {
    await resetDatabase();
    agent = await createReviewer('Claude', { isAgent: true });
    ana = await createReviewer('Ana', { municipality: 'La Ceja' });
    m = await manual();
    const response = await call(find(m, 'login'), {
      login: { pin: agent.pin, deviceId: DEVICE_A },
    });
    expect(response.status).toBe(200);
    token = ((await response.json()) as { token: string }).token;
  });

  it('crea una tarea para otra persona y la encuentra', async () => {
    const people = await call(find(m, 'list_people'), {}, token);
    expect(
      ((await people.json()) as { id: string }[]).map((p) => p.id),
    ).toContain(ana.id);

    const created = await call(
      find(m, 'create_task'),
      {
        task: {
          title: 'Escribir a Abejorral',
          dueDate: '2026-12-01',
          assigneeId: ana.id,
        },
      },
      token,
    );
    expect(created.status).toBe(201);
    const task = (await created.json()) as Task;
    expect(task.assigneeId).toBe(ana.id);

    const all = await call(find(m, 'list_tasks'), { scope: 'all' }, token);
    expect(((await all.json()) as Task[]).map((t) => t.id)).toContain(task.id);

    const update = (changes: object) =>
      call(find(m, 'update_task'), { id: task.id, changes }, token);
    expect((await update({ dueDate: '2026-12-15' })).status).toBeLessThan(300);
    // Marcarla hecha es de quien la tiene (Ana), no de quien la creó.
    expect((await update({ done: true })).status).toBe(403);
  });

  it('crea varias tareas de una vez, o ninguna si una falla', async () => {
    const create = (tasks: object[]) =>
      call(find(m, 'create_tasks'), { batch: { tasks } }, token);
    const ok = await create([
      { title: 'Una', dueDate: '2026-12-01', assigneeId: ana.id },
      { title: 'Dos', dueDate: '2026-12-02' },
    ]);
    expect(ok.status).toBe(201);
    const created = (await ok.json()) as Task[];
    expect(created.map((t) => t.title)).toEqual(['Una', 'Dos']);
    expect(created.map((t) => t.assigneeId)).toEqual([ana.id, agent.id]);

    const bad = await create([
      { title: 'Buena', dueDate: '2026-12-01' },
      { title: 'Mala', dueDate: '2026-12-01', documentId: 'no-existe' },
    ]);
    expect(bad.status).toBe(400);
    const all = await call(find(m, 'list_tasks'), { scope: 'all' }, token);
    expect(((await all.json()) as Task[]).map((t) => t.title).sort()).toEqual([
      'Dos',
      'Una',
    ]);
  });

  it('lee documentos, guarda un borrador, lo publica y cuelga tareas de él', async () => {
    const admin = await createReviewer('Admin', { isAdmin: true });
    const adminToken = await tokenFor(admin);
    await authed(adminToken, '/admin/documents/guia', {
      method: 'PUT',
      body: JSON.stringify(sampleDocument('guia')),
    });

    const list = await call(find(m, 'list_documents'), {}, token);
    expect(
      ((await list.json()) as { id: string }[]).map((d) => d.id),
    ).toContain('guia');
    const read = await call(
      find(m, 'read_document'),
      { documentId: 'guia' },
      token,
    );
    expect(read.status).toBe(200);

    expect(
      (
        await call(
          find(m, 'get_document_draft'),
          { documentId: 'nuevo' },
          token,
        )
      ).status,
    ).toBe(404);
    const saved = await call(
      find(m, 'save_document_draft'),
      {
        documentId: 'nuevo',
        draft: { content: sampleDocument('nuevo'), expectedRevision: 0 },
      },
      token,
    );
    expect(saved.status).toBe(200);
    expect(
      (
        await call(
          find(m, 'get_document_draft'),
          { documentId: 'nuevo' },
          token,
        )
      ).status,
    ).toBe(200);

    const published = await call(
      find(m, 'publish_document'),
      { documentId: 'nuevo', publish: { expectedRevision: 1 } },
      token,
    );
    expect(published.status).toBe(201);

    // El tipo y los datos de personas viajan en el contenido y salen en la lista.
    await call(
      find(m, 'save_document_draft'),
      {
        documentId: 'acta-1',
        draft: {
          content: {
            ...sampleDocument('acta-1'),
            type: 'minutes',
            attendees: 'Ana, Luis',
          },
          expectedRevision: 0,
        },
      },
      token,
    );
    await call(
      find(m, 'publish_document'),
      { documentId: 'acta-1', publish: { expectedRevision: 1 } },
      token,
    );
    const typed = (await (
      await call(find(m, 'list_documents'), {}, token)
    ).json()) as { id: string; type: string; attendees: string }[];
    expect(typed.find((d) => d.id === 'acta-1')).toMatchObject({
      type: 'minutes',
      attendees: 'Ana, Luis',
    });

    // Con el documento publicado, las tareas pueden colgar de él desde el inicio...
    const created = await call(
      find(m, 'create_task'),
      {
        task: {
          title: 'Revisar la guía',
          dueDate: '2026-12-01',
          documentId: 'nuevo',
        },
      },
      token,
    );
    expect(created.status).toBe(201);
    // ...o crearse sin documento y asociarse después.
    const loose = (await (
      await call(
        find(m, 'create_task'),
        { task: { title: 'Suelta', dueDate: '2026-12-01' } },
        token,
      )
    ).json()) as Task;
    expect(loose.documentId).toBeNull();
    const linked = await call(
      find(m, 'update_task'),
      { id: loose.id, changes: { documentId: 'nuevo' } },
      token,
    );
    expect(((await linked.json()) as Task).documentId).toBe('nuevo');
  });

  it('lee presentaciones y guarda el borrador de una existente, pero no la publica', async () => {
    const admin = await createReviewer('Admin', { isAdmin: true });
    const adminToken = await tokenFor(admin);
    await authed(adminToken, '/admin/themes/neutral', {
      method: 'PUT',
      body: JSON.stringify(neutralTheme),
    });
    const deck = {
      version: 1,
      id: 'charla',
      title: 'Charla',
      lang: 'es',
      theme: 'neutral',
      slides: [{ kind: 'content', body: [] }],
    };
    await authed(adminToken, '/admin/decks/charla', {
      method: 'PUT',
      body: JSON.stringify(deck),
    });

    const list = await call(find(m, 'list_decks'), {}, token);
    expect(((await list.json()) as { id: string }[]).map((d) => d.id)).toEqual([
      'charla',
    ]);
    expect(
      (await call(find(m, 'read_deck'), { deckId: 'charla' }, token)).status,
    ).toBe(200);
    expect((await call(find(m, 'list_themes'), {}, token)).status).toBe(200);

    expect(
      (await call(find(m, 'get_deck_draft'), { deckId: 'charla' }, token))
        .status,
    ).toBe(404);
    const saved = await call(
      find(m, 'save_deck_draft'),
      { deckId: 'charla', deck: { ...deck, title: 'Charla v2' } },
      token,
    );
    expect(saved.status).toBe(204);
    const draft = await call(
      find(m, 'get_deck_draft'),
      { deckId: 'charla' },
      token,
    );
    expect(
      ((await draft.json()) as { content: { title: string } }).content.title,
    ).toBe('Charla v2');

    // Un deck que no existe no se crea por aquí.
    const missing = await call(
      find(m, 'save_deck_draft'),
      { deckId: 'otro', deck: { ...deck, id: 'otro' } },
      token,
    );
    expect(missing.status).toBe(404);

    const publish = await SELF.fetch(
      `${ORIGIN}/api/admin/decks/charla/publish`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    expect(publish.status).toBe(403);
  });

  it('sin token, las herramientas con auth responden 401', async () => {
    expect((await call(find(m, 'list_tasks'), {})).status).toBe(401);
  });
});
