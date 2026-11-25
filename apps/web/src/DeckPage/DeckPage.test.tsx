// @vitest-environment happy-dom

import { defaultSlide } from '@colaboradocs/deck-core';
import { BUILTIN_THEMES } from '@colaboradocs/themes';
import { render } from 'solid-js/web';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { openMenus } from '@/test/openMenus';
import App from '../App';
import { deckStore } from '../DeckEditor/features/deck/deck.store';

const admin = { id: 'r1', name: 'Ana', isAdmin: true, municipality: null };
const wait = (ms = 80) => new Promise((resolve) => setTimeout(resolve, ms));
const disposers: (() => void)[] = [];

const theme = BUILTIN_THEMES[0];
if (!theme) throw new Error('falta el tema neutro');
const deck = {
  version: 1,
  id: 'charla',
  title: 'Mi charla',
  lang: 'es',
  theme: theme.id,
  slides: [defaultSlide('cover'), defaultSlide('cover'), defaultSlide('cover')],
};

function fakeApi() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      const json = (body: unknown, status = 200) =>
        new Response(JSON.stringify(body), { status });
      if (url === '/api/space') return json({ name: 'Mi espacio' });
      if (url === '/api/decks/charla') return json({ deck, theme, files: [] });
      if (url === '/api/themes') return json([theme]);
      if (url === '/api/admin/decks/charla/draft') {
        return json({ error: 'not_found' }, 404);
      }
      // Las fuentes del tema: el contenido no importa, solo que se puedan bajar.
      if (url.includes('/files/')) return new Response('x');
      return json({ error: 'not_found' }, 404);
    }),
  );
}

function go(path: string) {
  window.history.replaceState(null, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

function mount() {
  const host = document.createElement('div');
  document.body.appendChild(host);
  disposers.push(render(() => <App />, host));
  return host;
}

beforeEach(() => {
  localStorage.setItem(
    'review:session',
    JSON.stringify({ token: 't', reviewer: admin }),
  );
  window.scrollTo = () => {};
});

afterEach(() => {
  for (const dispose of disposers.splice(0)) dispose();
  document.body.innerHTML = '';
  localStorage.clear();
  go('/');
  vi.unstubAllGlobals();
});

/** El iframe avisa en qué slide va, como lo hace el motor del deck (`deckSlide`). */
function reportSlide(frame: HTMLIFrameElement, slide: number) {
  window.dispatchEvent(
    new MessageEvent('message', {
      data: { deckSlide: slide },
      source: frame.contentWindow,
    }),
  );
}

describe('DeckPage: ir al editor y volver, en la misma slide', () => {
  it('«atrás» de una presentación vuelve a la lista de presentaciones, no a los documentos', async () => {
    fakeApi();
    go('/p/charla');
    const host = mount();
    await wait(200);
    const back = host.querySelector(
      'a[aria-label="Volver a las presentaciones"]',
    );
    expect(back?.getAttribute('href')).toBe('/presentaciones');
    (back as HTMLElement).click();
    expect(window.location.pathname).toBe('/presentaciones');
  });

  it('«Editar» abre el editor en la slide que se está viendo', async () => {
    fakeApi();
    go('/p/charla');
    const host = mount();
    await wait(200);
    const frame = host.querySelector('iframe');
    if (!frame) throw new Error('falta el iframe');
    reportSlide(frame, 3);
    const edit = [...host.querySelectorAll('button')].find((item) =>
      item.textContent?.includes('Editar'),
    );
    edit?.click();
    expect(window.location.pathname).toBe('/p/charla/editar');
    expect(window.location.search).toBe('?slide=3');
  });

  it('ignora lo que avise otra ventana que no es el iframe', async () => {
    fakeApi();
    go('/p/charla');
    const host = mount();
    await wait(200);
    window.dispatchEvent(
      new MessageEvent('message', { data: { deckSlide: 2 }, source: window }),
    );
    [...host.querySelectorAll('button')]
      .find((item) => item.textContent?.includes('Editar'))
      ?.click();
    expect(window.location.search).toBe('?slide=1');
  });

  it('al abrir con ?slide=N, lleva el iframe a esa slide cuando carga', async () => {
    fakeApi();
    go('/p/charla?slide=2');
    const host = mount();
    await wait(200);
    const frame = host.querySelector('iframe');
    if (!frame?.contentWindow) throw new Error('falta el iframe');
    const post = vi.spyOn(frame.contentWindow, 'postMessage');
    frame.dispatchEvent(new Event('load'));
    expect(post).toHaveBeenCalledWith({ deckGo: 2 }, '*');
  });

  it('el editor abre en la slide de ?slide=N, y «Volver a la presentación» vuelve a ella', async () => {
    fakeApi();
    go('/p/charla/editar?slide=3');
    const host = mount();
    await wait(300);
    expect(deckStore.slideIndex()).toBe(2);
    deckStore.select(1);
    [...host.querySelectorAll('button')]
      .find((item) => item.textContent?.includes('Volver a la presentación'))
      ?.click();
    await wait(100);
    expect(window.location.pathname).toBe('/p/charla');
    expect(window.location.search).toBe('?slide=2');
  });

  it('sin ?slide, el editor abre en la primera', async () => {
    fakeApi();
    go('/p/charla/editar');
    mount();
    await wait(300);
    expect(deckStore.slideIndex()).toBe(0);
  });

  describe('la barra del editor', () => {
    beforeEach(() => {
      Object.assign(HTMLElement.prototype, {
        togglePopover() {},
        showPopover() {},
        hidePopover() {},
      });
    });

    const buttonsNamed = (host: HTMLElement, text: string) => {
      openMenus(host);
      return [...host.querySelectorAll('button')].filter((item) =>
        item.textContent?.trim().startsWith(text),
      );
    };

    it('Importar, Exportar, Descartar y Ver celdas viven en el menú «Opciones», no sueltos en la barra', async () => {
      fakeApi();
      go('/p/charla/editar');
      const host = mount();
      await wait(300);
      expect(buttonsNamed(host, 'Opciones')).toHaveLength(1);
      for (const name of [
        'Importar JSON',
        'Exportar JSON',
        'Descartar cambios',
        'Ver celdas',
      ]) {
        const found = buttonsNamed(host, name);
        expect(found, name).toHaveLength(1);
        expect(found[0]?.closest('[popover]'), name).not.toBeNull();
      }
      // Lo que se usa todo el rato sigue a la vista.
      for (const name of [
        'Deshacer',
        'Rehacer',
        'Publicar',
        'Volver a la presentación',
      ]) {
        expect(
          buttonsNamed(host, name)[0]?.closest('[popover]'),
          name,
        ).toBeNull();
      }
    });

    it('sin botón «Inicio»: la barra solo vuelve a la presentación', async () => {
      fakeApi();
      go('/p/charla/editar');
      const host = mount();
      await wait(300);
      expect(buttonsNamed(host, 'Inicio')).toHaveLength(0);
      expect(buttonsNamed(host, 'Ver presentación')).toHaveLength(0);
      expect(buttonsNamed(host, 'Volver a la presentación')).toHaveLength(1);
    });

    it('todas las opciones de «Opciones» llevan ícono', async () => {
      fakeApi();
      go('/p/charla/editar');
      const host = mount();
      await wait(300);
      for (const name of [
        'Configuración de la presentación',
        'Ver celdas',
        'Importar JSON',
        'Exportar JSON',
        'Descartar cambios',
      ]) {
        const item = buttonsNamed(host, name)[0];
        expect(item?.firstElementChild?.tagName.toLowerCase(), name).toBe(
          'svg',
        );
      }
    });

    it('«Ver celdas» se marca con un visto al activarlo', async () => {
      fakeApi();
      go('/p/charla/editar');
      const host = mount();
      await wait(300);
      const item = buttonsNamed(host, 'Ver celdas')[0];
      if (!item) throw new Error('falta Ver celdas');
      expect(item.querySelector('svg:last-child')).toBeNull();
      item.click();
      await wait();
      expect(
        buttonsNamed(host, 'Ver celdas')[0]?.querySelector(
          'span:last-child svg',
        ),
      ).not.toBeNull();
    });

    it('Tema y variante ya no están en la barra: se eligen en «Configuración de la presentación», en una hoja', async () => {
      fakeApi();
      go('/p/charla/editar');
      const host = mount();
      await wait(300);
      // La barra no tiene selectores de tema ni de variante.
      expect(host.querySelector('header select')).toBeNull();
      const open = buttonsNamed(host, 'Configuración de la presentación')[0];
      if (!open) throw new Error('falta la opción de configuración');
      open.click();
      await wait(120);
      const selects = [...document.querySelectorAll('dialog select')];
      expect(selects).toHaveLength(2);
      const labels = [...document.querySelectorAll('dialog label > span')].map(
        (item) => item.textContent,
      );
      expect(labels).toEqual(['Tema', 'Variante']);
    });
  });
});
