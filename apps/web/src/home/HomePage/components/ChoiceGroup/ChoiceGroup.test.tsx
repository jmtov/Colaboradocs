// @vitest-environment happy-dom
import { createSignal } from 'solid-js';
import { render } from 'solid-js/web';
import { afterEach, describe, expect, it } from 'vitest';
import ChoiceGroup from './ChoiceGroup';

const options = [
  { value: 'a', label: 'Uno', count: 2 },
  { value: 'b', label: 'Dos', count: 1 },
];

afterEach(() => {
  document.body.innerHTML = '';
});

function mount(initial: string | null = null) {
  const host = document.createElement('div');
  document.body.append(host);
  let latest = initial;
  render(() => {
    const [selected, setSelected] = createSignal(initial);
    return (
      <ChoiceGroup
        label="Tipo"
        options={options}
        selected={selected()}
        allLabel="Todos"
        allCount={3}
        onChange={(next) => {
          latest = next;
          setSelected(next);
        }}
      />
    );
  }, host);
  const button = (text: string) => {
    const found = [...host.querySelectorAll('button')].find((item) =>
      item.textContent?.startsWith(text),
    );
    if (!found) throw new Error(`falta el botón ${text}`);
    return found;
  };
  return { button, selected: () => latest };
}

describe('ChoiceGroup', () => {
  it('elegir una opción reemplaza a la otra, y se marca', () => {
    const { button, selected } = mount();
    button('Uno').click();
    button('Dos').click();
    expect(selected()).toBe('b');
    expect(button('Dos').getAttribute('aria-pressed')).toBe('true');
    expect(button('Uno').getAttribute('aria-pressed')).toBe('false');
  });

  it('«Todos» quita la elección y está marcado cuando no hay ninguna', () => {
    const { button, selected } = mount('a');
    expect(button('Todos').getAttribute('aria-pressed')).toBe('false');
    button('Todos').click();
    expect(selected()).toBeNull();
    expect(button('Todos').getAttribute('aria-pressed')).toBe('true');
  });
});
