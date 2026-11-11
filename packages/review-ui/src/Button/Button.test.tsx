// @vitest-environment happy-dom
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render } from 'solid-js/web';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CheckIcon from '../icons/CheckIcon';
import Button from './Button';

const disposers: (() => void)[] = [];
afterEach(() => {
  for (const dispose of disposers.splice(0)) dispose();
  document.body.innerHTML = '';
});

function mount(view: () => unknown) {
  const host = document.createElement('div');
  document.body.appendChild(host);
  disposers.push(render(view as () => never, host));
  return host;
}

const css = readFileSync(
  join(import.meta.dirname, 'Button.module.css'),
  'utf8',
);

describe('Button', () => {
  it('lleva ícono y texto, y llama a onClick', () => {
    const onClick = vi.fn();
    const host = mount(() => (
      <Button icon={CheckIcon} onClick={onClick}>
        Aplicar
      </Button>
    ));
    const button = host.querySelector('button') as HTMLButtonElement;
    expect(button.textContent).toBe('Aplicar');
    expect(button.querySelector('svg')).not.toBeNull();
    expect(button.type).toBe('button');
    button.click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('sin texto es un botón solo de ícono, con nombre para el lector', () => {
    const host = mount(() => <Button icon={CheckIcon} aria-label="Cerrar" />);
    const button = host.querySelector('button') as HTMLButtonElement;
    expect(button.textContent).toBe('');
    expect(button.getAttribute('aria-label')).toBe('Cerrar');
  });

  it('submit envía el formulario; pressed se dice a los lectores', () => {
    const host = mount(() => (
      <Button icon={CheckIcon} submit pressed>
        Guardar
      </Button>
    ));
    const button = host.querySelector('button') as HTMLButtonElement;
    expect(button.type).toBe('submit');
    expect(button.getAttribute('aria-pressed')).toBe('true');
  });

  it('keepFocus: el clic no le quita el foco a lo que se escribe', () => {
    const host = mount(() => (
      <Button icon={CheckIcon} aria-label="Negrilla" keepFocus />
    ));
    const down = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
    });
    host.querySelector('button')?.dispatchEvent(down);
    expect(down.defaultPrevented).toBe(true);
  });

  it('con href es un enlace: un clic normal llama a onClick sin recargar', () => {
    const onClick = vi.fn();
    const host = mount(() => (
      <Button icon={CheckIcon} href="/inicio" onClick={onClick}>
        Inicio
      </Button>
    ));
    const link = host.querySelector('a') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/inicio');
    // sin esto no tiene el despegue de index.css (que vale para `button` y `a[data-lift]`)
    expect(link.hasAttribute('data-lift')).toBe(true);
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    link.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(true);
    expect(onClick).toHaveBeenCalledTimes(1);
    const modified = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      ctrlKey: true,
    });
    link.dispatchEvent(modified);
    expect(modified.defaultPrevented).toBe(false);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('usa el despegue y el hundido de la página: no usa sus pseudo-elementos y lo encendido va más oscuro', () => {
    // ::before y ::after son la sombra larga y el marco de index.css
    const rules = css.replace(/\/\*[\s\S]*?\*\//g, '');
    expect(rules).not.toMatch(/::(before|after)/);
    expect(rules).toMatch(/aria-pressed="true"\]\s*\{[^}]*background:/);
  });

  it('lleva borde también en reposo, y la sombra larga es de su color', () => {
    const base = /\.button\s*\{([^}]*)\}/.exec(css)?.[1] ?? '';
    expect(base).toMatch(/border:\s*1px solid var\(--edge\)/);
    expect(base).toMatch(/--edge:\s*var\(--line-strong\)/);
    expect(base).toMatch(/--lift-color:\s*var\(--edge\)/);
  });

  it('hover, activo y presionar se animan juntos: la transición incluye --t y respeta reduced-motion', () => {
    const media =
      /@media \(prefers-reduced-motion: no-preference\)\s*\{([\s\S]*?)\n\}/.exec(
        css,
      )?.[1] ?? '';
    expect(media).toMatch(/transition:[^;]*--t \d+ms/);
    expect(media).toMatch(/transition:[^;]*background-color/);
  });
});
