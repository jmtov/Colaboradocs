// @vitest-environment happy-dom
import { render } from 'solid-js/web';
import { afterEach, describe, expect, it } from 'vitest';
import CollapsibleSection from './CollapsibleSection';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('CollapsibleSection', () => {
  it('arranca abierta; plegada, oculta el contenido y muestra la nota junto al título', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    render(
      () => (
        <CollapsibleSection id="t" title="Participantes" note="(2)">
          <p>Contenido</p>
        </CollapsibleSection>
      ),
      host,
    );
    const toggle = host.querySelector('button') as HTMLButtonElement;
    expect(host.textContent).toContain('Contenido');
    expect(host.textContent).not.toContain('(2)');
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    toggle.click();
    expect(host.textContent).not.toContain('Contenido');
    expect(host.textContent).toContain('Participantes(2)');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    toggle.click();
    expect(host.textContent).toContain('Contenido');
  });
});
