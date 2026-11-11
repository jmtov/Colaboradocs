// @vitest-environment happy-dom
import type { ManagedReviewer } from '@juntanza/review-core';
import { render } from 'solid-js/web';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ReviewProvider from '../../../ReviewProvider/ReviewProvider';
import PersonRow from './PersonRow';

const admin = { id: 'r1', name: 'Ana', isAdmin: true, municipality: null };
const luis: ManagedReviewer = {
  id: 'p1',
  name: 'Luis',
  municipality: 'La Ceja',
  isAdmin: false,
  devices: 1,
  maxDevices: 2,
  locked: false,
};

const wait = (ms = 40) => new Promise((resolve) => setTimeout(resolve, ms));
const disposers: (() => void)[] = [];
let calls: { url: string; method: string; body: string }[] = [];

function mount(person: ManagedReviewer, isMe = false) {
  const host = document.createElement('div');
  document.body.appendChild(host);
  disposers.push(
    render(
      () => (
        <ReviewProvider>
          <ul>
            <PersonRow person={person} isMe={isMe} />
          </ul>
        </ReviewProvider>
      ),
      host,
    ),
  );
  return host;
}

const menuItems = (host: HTMLElement) =>
  [...host.querySelectorAll<HTMLElement>('[popover] button')].map((button) =>
    button.textContent?.trim(),
  );
const press = (root: ParentNode, text: string) =>
  [...root.querySelectorAll('button')]
    .find((button) => button.textContent?.trim() === text)
    ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
const dialog = () => document.querySelector('dialog[open]');

beforeEach(() => {
  calls = [];
  localStorage.setItem(
    'review:session',
    JSON.stringify({ token: 't', reviewer: admin }),
  );
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: RequestInit) => {
      calls.push({
        url,
        method: init?.method ?? 'GET',
        body: String(init?.body ?? ''),
      });
      return new Response(JSON.stringify([]), { status: 200 });
    }),
  );
});

afterEach(() => {
  for (const dispose of disposers.splice(0)) dispose();
  document.body.innerHTML = '';
  localStorage.clear();
  vi.unstubAllGlobals();
});

describe('PersonRow: menú de acciones', () => {
  it('trae Editar, Restablecer dispositivos, Regenerar PIN y Eliminar, cada una con su ícono', () => {
    const host = mount(luis);
    expect(menuItems(host)).toEqual([
      'Editar',
      'Restablecer dispositivos',
      'Regenerar PIN',
      'Eliminar',
    ]);
    const buttons = host.querySelectorAll('[popover] button');
    for (const button of buttons) {
      expect(button.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
    }
  });

  it('una persona protegida solo puede editarse, y el menú dice por qué', () => {
    const host = mount({ ...luis, locked: true }, true);
    expect(menuItems(host)).toEqual(['Editar']);
    expect(host.textContent).toContain('Eres tú');
  });
});

describe('PersonRow: Editar abre una hoja', () => {
  it('guarda el nuevo valor y cierra la hoja', async () => {
    const host = mount(luis);
    press(host, 'Editar');
    await wait();
    expect(dialog()?.textContent).toContain('Editar a Luis');
    const field = dialog()?.querySelector('input');
    if (!field) throw new Error('falta el campo');
    expect(field.value).toBe('La Ceja');

    field.value = 'Rionegro';
    field.dispatchEvent(new Event('input', { bubbles: true }));
    dialog()
      ?.querySelector('form')
      ?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await wait();

    const patch = calls.find((call) => call.method === 'PATCH');
    expect(patch?.url).toBe('/api/admin/reviewers/p1');
    expect(JSON.parse(patch?.body ?? '{}')).toEqual({
      municipality: 'Rionegro',
    });
    await wait(700);
    expect(dialog()).toBeNull();
  });
});

describe('PersonRow: acciones que piden confirmar', () => {
  it('Eliminar pide confirmación: cancelar no borra', async () => {
    const host = mount(luis);
    press(host, 'Eliminar');
    await wait();
    expect(dialog()?.textContent).toContain('pierde el acceso');
    press(dialog() as ParentNode, 'Cancelar');
    await wait();
    expect(calls.some((call) => call.method === 'DELETE')).toBe(false);
  });

  it('confirmar Eliminar borra a la persona', async () => {
    const host = mount(luis);
    press(host, 'Eliminar');
    await wait();
    press(dialog() as ParentNode, 'Eliminar');
    await wait();
    const removal = calls.find((call) => call.method === 'DELETE');
    expect(removal?.url).toBe('/api/admin/reviewers/p1');
  });

  it('Regenerar PIN también pide confirmación', async () => {
    const host = mount(luis);
    press(host, 'Regenerar PIN');
    await wait();
    expect(dialog()?.textContent).toContain('queda fuera');
    expect(calls.some((call) => call.url.endsWith('/pin'))).toBe(false);
  });
});
