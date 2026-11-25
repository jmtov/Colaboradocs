// @vitest-environment happy-dom
import { render } from 'solid-js/web';
import { afterEach, describe, expect, it, vi } from 'vitest';
import MenuItem from './MenuItem';

afterEach(() => {
  document.body.innerHTML = '';
});

function mount(props: Parameters<typeof MenuItem>[0]) {
  const host = document.createElement('div');
  document.body.append(host);
  render(() => <MenuItem {...props} />, host);
  return host.querySelector('button') as HTMLButtonElement;
}

describe('MenuItem', () => {
  it('lleva la etiqueta y, si hay, la descripción debajo', () => {
    const button = mount({
      label: 'Editar',
      description: 'Abre el editor',
      onClick: () => {},
    });
    expect(button.textContent).toBe('EditarAbre el editor');
    expect(button.querySelector('small')?.textContent).toBe('Abre el editor');
    expect(
      mount({ label: 'Salir', onClick: () => {} }).querySelector('small'),
    ).toBeNull();
  });

  it('con `checked` lleva un visto cuando está activa, y nada si está apagada', () => {
    const on = mount({ label: 'A', checked: true, onClick: () => {} });
    expect(on.querySelector('[data-check]')).not.toBeNull();
    document.body.innerHTML = '';
    const off = mount({ label: 'A', checked: false, onClick: () => {} });
    expect(off.querySelector('[data-check]')).toBeNull();
    document.body.innerHTML = '';
    // Sin `checked` no es una opción que se enciende: ni espacio para el visto.
    const plain = mount({ label: 'A', onClick: () => {} });
    expect(plain.querySelector('span:last-child svg')).toBeNull();
  });

  it('llama a onClick, salvo desactivada', () => {
    const onClick = vi.fn();
    mount({ label: 'A', onClick }).click();
    expect(onClick).toHaveBeenCalledTimes(1);
    document.body.innerHTML = '';
    const disabled = mount({ label: 'A', disabled: true, onClick });
    disabled.click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
