// @vitest-environment happy-dom
import { beforeAll, describe, expect, it } from 'vitest';
import { installPopoverPolyfill, isPopoverOpen } from './popover.polyfill';

type Menu = HTMLElement & { showPopover(): void; hidePopover(): void };

const wait = (ms = 5) => new Promise((resolve) => setTimeout(resolve, ms));

function addMenu() {
  const trigger = document.createElement('button');
  const menu = document.createElement('div') as Menu;
  menu.setAttribute('popover', '');
  document.body.append(trigger, menu);
  return { trigger, menu };
}

beforeAll(() => {
  // El navegador de pruebas puede traer popover: se prueba el polyfill como en Safari 15.
  Reflect.deleteProperty(HTMLElement.prototype, 'popover');
  installPopoverPolyfill();
});

describe('installPopoverPolyfill', () => {
  it('showPopover y hidePopover abren y cierran, y avisan con toggle', () => {
    const { menu } = addMenu();
    const states: string[] = [];
    menu.addEventListener('toggle', (event) =>
      states.push((event as Event & { newState: string }).newState),
    );
    menu.showPopover();
    expect(isPopoverOpen(menu)).toBe(true);
    menu.hidePopover();
    expect(isPopoverOpen(menu)).toBe(false);
    expect(states).toEqual(['open', 'closed']);
  });

  it('un clic fuera cierra el menú; uno dentro, no', async () => {
    const { menu } = addMenu();
    const inside = document.createElement('button');
    menu.append(inside);
    menu.showPopover();
    inside.click();
    await wait();
    expect(isPopoverOpen(menu)).toBe(true);
    document.body.click();
    await wait();
    expect(isPopoverOpen(menu)).toBe(false);
  });

  it('el botón de un menú abierto lo cierra y no lo reabre solo', async () => {
    const { trigger, menu } = addMenu();
    // Como `toggleMenuBelow`: un handler que abre o cierra según el estado.
    trigger.addEventListener('click', () => {
      if (isPopoverOpen(menu)) menu.hidePopover();
      else menu.showPopover();
    });
    trigger.click();
    await wait();
    expect(isPopoverOpen(menu)).toBe(true);
    trigger.click();
    await wait();
    expect(isPopoverOpen(menu)).toBe(false);
  });

  it('abrir un menú con popovertarget cierra los demás', () => {
    const first = addMenu();
    const second = addMenu();
    second.menu.id = 'second-menu';
    second.trigger.setAttribute('popovertarget', 'second-menu');
    first.menu.showPopover();
    second.trigger.click();
    expect(isPopoverOpen(second.menu)).toBe(true);
    expect(isPopoverOpen(first.menu)).toBe(false);
  });

  it('Esc cierra los menús abiertos', () => {
    const { menu } = addMenu();
    menu.showPopover();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(isPopoverOpen(menu)).toBe(false);
  });
});
