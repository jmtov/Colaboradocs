// @vitest-environment happy-dom
import { ReviewProvider } from '@colaboradocs/review-ui';
import { render } from 'solid-js/web';
import { afterEach, describe, expect, it, vi } from 'vitest';
import PageBar from './PageBar';

const disposers: (() => void)[] = [];

function mount(ui: () => unknown) {
  localStorage.setItem(
    'review:session',
    JSON.stringify({
      token: 't',
      reviewer: { id: 'r', name: 'Ana', isAdmin: true, municipality: null },
    }),
  );
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response('[]')),
  );
  const host = document.createElement('div');
  document.body.appendChild(host);
  disposers.push(
    render(() => <ReviewProvider>{ui() as never}</ReviewProvider>, host),
  );
  return host;
}

afterEach(() => {
  for (const dispose of disposers.splice(0)) dispose();
  document.body.innerHTML = '';
  localStorage.clear();
  vi.unstubAllGlobals();
});

describe('PageBar', () => {
  it('con backHref el regreso es un enlace; muestra el nombre y lo que se le pasa', () => {
    const host = mount(() => (
      <PageBar backLabel="← Inicio" backHref="/" name="Mi espacio">
        <span>Sin conexión</span>
      </PageBar>
    ));
    const link = host.querySelector('a');
    expect(link?.textContent).toBe('← Inicio');
    expect(link?.getAttribute('href')).toBe('/');
    expect(host.textContent).toContain('Mi espacio');
    expect(host.textContent).toContain('Sin conexión');
  });

  it('sin backHref es un botón que llama a onBack', () => {
    const onBack = vi.fn();
    const host = mount(() => (
      <PageBar backLabel="← Volver" onBack={onBack} name="Mi espacio" />
    ));
    expect(host.querySelector('a')).toBeNull();
    const button = [...host.querySelectorAll('button')].find(
      (item) => item.textContent === '← Volver',
    );
    button?.click();
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
