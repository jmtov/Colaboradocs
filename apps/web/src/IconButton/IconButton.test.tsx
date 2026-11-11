// @vitest-environment happy-dom
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
