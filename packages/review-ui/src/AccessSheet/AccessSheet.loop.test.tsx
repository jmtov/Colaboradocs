// @vitest-environment happy-dom
// Prueba de regresión: si una recarga vuelve a dispararse a sí misma en bucle, esta
// prueba NO termina (las respuestas simuladas son inmediatas y acaparan el hilo).

import { onMount } from 'solid-js';
import { render } from 'solid-js/web';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useOverlay } from '../overlay/useOverlay';
import ReviewProvider from '../ReviewProvider/ReviewProvider';
import AccessSheet from './AccessSheet';

const admin = { id: 'r1', name: 'Ana', isAdmin: true, municipality: null };
const wait = (ms = 60) => new Promise((resolve) => setTimeout(resolve, ms));
const disposers: (() => void)[] = [];

/** Abre la hoja de accesos al montarse, como lo hace UserMenu. */
function OpenAccessSheet() {
  const overlay = useOverlay();
  onMount(() => void overlay.sheet(AccessSheet, {}));
  return null;
}

beforeEach(() => {
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

describe('AccessSheet abierta', () => {
  it('pide la lista de personas una vez, no en bucle', async () => {
    const calls: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        calls.push(url);
        const people = [
          {
            id: 'p1',
            name: 'Luis',
            municipality: 'La Ceja',
            isAdmin: false,
            devices: 0,
            maxDevices: 2,
            locked: false,
          },
        ];
        return new Response(JSON.stringify(people), { status: 200 });
      }),
    );
    const host = document.createElement('div');
    document.body.appendChild(host);
    disposers.push(
      render(
        () => (
          <ReviewProvider>
            <OpenAccessSheet />
          </ReviewProvider>
        ),
        host,
      ),
    );
    await wait(300);

    const lists = calls.filter((url) => url === '/api/admin/reviewers').length;
    expect(lists).toBeLessThanOrEqual(2);
    expect(host.textContent).toContain('Luis');
  });
});
