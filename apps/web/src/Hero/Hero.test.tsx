// @vitest-environment happy-dom
import { render } from 'solid-js/web';
import { afterEach, describe, expect, it } from 'vitest';
import Hero from './Hero';

const base = { title: 'Reunión', version: '0.3', firstSectionId: 'a' };

function mount(extra: Partial<Parameters<typeof Hero>[0]>) {
  const host = document.createElement('div');
  document.body.appendChild(host);
  render(() => <Hero {...base} onGo={() => {}} {...extra} />, host);
  return host;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('Hero', () => {
  it('el tipo va como texto al comienzo de la línea de arriba; «otro» no se rotula', () => {
    expect(mount({ type: 'minutes' }).textContent).toContain(
      'Acta · Borrador · versión 0.3',
    );
    expect(mount({ type: 'other' }).textContent).not.toContain('Otro');
  });
});
