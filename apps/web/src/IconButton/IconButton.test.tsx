// @vitest-environment happy-dom
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render } from 'solid-js/web';
import { afterEach, describe, expect, it, vi } from 'vitest';
import BoldIcon from '@/icons/BoldIcon';
import IconButton from './IconButton';

const disposers: (() => void)[] = [];
afterEach(() => {
  for (const dispose of disposers.splice(0)) dispose();
  document.body.innerHTML = '';
});

function mount(onClick = vi.fn()) {
  const host = document.createElement('div');
  document.body.appendChild(host);
  disposers.push(
    render(
      () => (
        <IconButton
          label="Negrilla"
          tooltip="Negrilla (Cmd/Ctrl+B)"
          icon={BoldIcon}
          pressed
          onClick={onClick}
        />
      ),
      host,
    ),
  );
  return host.querySelector('button') as HTMLButtonElement;
}

describe('IconButton', () => {
  it('es solo un ícono, con nombre para el lector y tooltip', () => {
    const button = mount();
    expect(button.textContent).toBe('');
    expect(button.querySelector('svg')).not.toBeNull();
    expect(button.getAttribute('aria-label')).toBe('Negrilla');
    // el tooltip es hermano del botón (no hijo): el clip-path del botón lo recortaría
    const tip = button.nextElementSibling;
    expect(tip?.textContent).toBe('Negrilla (Cmd/Ctrl+B)');
    expect(button.contains(tip)).toBe(false);
    expect(button.getAttribute('aria-pressed')).toBe('true');
  });

  it('usa el despegue y el hundido de la página: no es plano y no usa sus pseudo-elementos', () => {
    const button = mount();
    expect(button.hasAttribute('data-flat')).toBe(false);
    const css = readFileSync(
      join(import.meta.dirname, 'IconButton.module.css'),
      'utf8',
    );
    // ::before y ::after son la sombra larga y el marco de index.css
    const rules = css.replace(/\/\*[\s\S]*?\*\//g, '');
    expect(rules).not.toMatch(/::(before|after)/);
    // encendido: más oscuro; el hundido viene de aria-pressed en index.css
    expect(rules).toMatch(/aria-pressed="true"\]\s*\{[^}]*background:/);
  });

  it('lleva borde también en reposo', () => {
    const css = readFileSync(
      join(import.meta.dirname, 'IconButton.module.css'),
      'utf8',
    );
    const base = /\.button\s*\{([^}]*)\}/.exec(css)?.[1] ?? '';
    expect(base).toMatch(/border:\s*1px solid var\(--edge\)/);
    // la sombra larga es del color del borde
    expect(base).toMatch(/--edge:\s*var\(--line-strong\)/);
    expect(base).toMatch(/--lift-color:\s*var\(--edge\)/);
  });

  it('hover, activo y presionar se animan juntos: la transición incluye --t y respeta reduced-motion', () => {
    const css = readFileSync(
      join(import.meta.dirname, 'IconButton.module.css'),
      'utf8',
    );
    const media =
      /@media \(prefers-reduced-motion: no-preference\)\s*\{([\s\S]*?)\n\}/.exec(
        css,
      )?.[1] ?? '';
    expect(media).toMatch(/transition:[^;]*--t \d+ms/);
    expect(media).toMatch(/transition:[^;]*background-color/);
  });

  it('el clic no le quita el foco al editor y llama a onClick', () => {
    const onClick = vi.fn();
    const button = mount(onClick);
    const down = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
    });
    button.dispatchEvent(down);
    expect(down.defaultPrevented).toBe(true);
    button.click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
