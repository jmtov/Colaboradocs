// @vitest-environment happy-dom
import { createSignal } from 'solid-js';
import { render } from 'solid-js/web';
import { afterEach, describe, expect, it } from 'vitest';
import type { HomeTab } from '@/router/router';
import HomeTabs from './HomeTabs';

const disposers: (() => void)[] = [];
afterEach(() => {
  for (const dispose of disposers.splice(0)) dispose();
  document.body.innerHTML = '';
});

describe('HomeTabs: la raya del tab activo', () => {
  it('hay una sola raya, decorativa, y mide el tab activo; al cambiar de tab se vuelve a medir', async () => {
    const [tab, setTab] = createSignal<HomeTab>('documents');
    const host = document.createElement('div');
    document.body.appendChild(host);
    disposers.push(
      render(
        () => (
          <HomeTabs
            tab={tab()}
            counts={{ documents: 1, decks: 2, tasks: 3 }}
            showDecks
          />
        ),
        host,
      ),
    );
    const nav = host.querySelector('nav') as HTMLElement;
    const lines = nav.querySelectorAll('[aria-hidden="true"]');
    expect(lines).toHaveLength(1);
    expect(nav.style.getPropertyValue('--tab-x')).toBe('0px');
    // La nueva medida se pide al cambiar de tab (happy-dom no hace layout: el valor es 0).
    nav.style.setProperty('--tab-x', '999px');
    setTab('tasks');
    await Promise.resolve();
    expect(nav.style.getPropertyValue('--tab-x')).not.toBe('999px');
    expect(nav.querySelector('[aria-current="page"]')?.textContent).toContain(
      'Tareas',
    );
  });
});
