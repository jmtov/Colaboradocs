import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  MENU_CLOSE_TIMEOUT_MS,
  openAfterMenuCloses,
  type PopoverLike,
} from './menu.utils';

afterEach(() => {
  vi.useRealTimers();
});

/** Un menú simulado: guarda el listener de `toggle` para dispararlo a mano. */
function fakeMenu(isOpen: boolean) {
  let listener: (() => void) | null = null;
  const menu: PopoverLike = {
    matches: () => isOpen,
    hidePopover: vi.fn(),
    addEventListener: (_type, fn) => {
      listener = fn;
    },
  };
  return { menu, fireToggle: () => listener?.() };
}

describe('openAfterMenuCloses', () => {
  it('cierra el menú y abre la hoja solo cuando el menú terminó de cerrarse', () => {
    const { menu, fireToggle } = fakeMenu(true);
    const open = vi.fn();
    openAfterMenuCloses(menu, open);
    expect(menu.hidePopover).toHaveBeenCalledTimes(1);
    expect(open).not.toHaveBeenCalled();
    fireToggle();
    expect(open).toHaveBeenCalledTimes(1);
  });

  it('si el menú ya estaba cerrado, abre de inmediato', () => {
    const { menu } = fakeMenu(false);
    const open = vi.fn();
    openAfterMenuCloses(menu, open);
    expect(open).toHaveBeenCalledTimes(1);
    expect(menu.hidePopover).not.toHaveBeenCalled();
  });

  it('en un navegador sin popover abre de inmediato', () => {
    const menu: PopoverLike = {
      matches: () => {
        throw new Error('selector no soportado');
      },
      hidePopover: vi.fn(),
      addEventListener: vi.fn(),
    };
    const open = vi.fn();
    openAfterMenuCloses(menu, open);
    expect(open).toHaveBeenCalledTimes(1);
  });

  it('si el navegador nunca avisa que el menú cerró, abre igual pasado el plazo', () => {
    vi.useFakeTimers();
    const { menu } = fakeMenu(true);
    const open = vi.fn();
    openAfterMenuCloses(menu, open);
    vi.advanceTimersByTime(MENU_CLOSE_TIMEOUT_MS - 1);
    expect(open).not.toHaveBeenCalled();
    vi.advanceTimersByTime(2);
    expect(open).toHaveBeenCalledTimes(1);
  });

  it('abre una sola vez aunque lleguen el aviso y el plazo', () => {
    vi.useFakeTimers();
    const { menu, fireToggle } = fakeMenu(true);
    const open = vi.fn();
    openAfterMenuCloses(menu, open);
    fireToggle();
    vi.advanceTimersByTime(MENU_CLOSE_TIMEOUT_MS * 2);
    expect(open).toHaveBeenCalledTimes(1);
  });
});
