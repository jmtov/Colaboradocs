import { icon } from '../icons.utils';
import type { Component } from '../render.types';

export const HAND_RAISE_CSS = `
.hand { position: absolute; right: var(--pad-x); bottom: clamp(3.2rem, 9vh, 5rem); width: 200px; height: 200px; display: grid; place-items: center; align-content: center; gap: .9rem; text-align: center; padding: 1rem; background: var(--tint); border: var(--line-w) var(--line-style) var(--line-strong); border-radius: var(--radius-card); }
@keyframes float { 0%, 100% { translate: 0 0; } 50% { translate: 0 -12px; } }
.is-active .hand { animation: float 3.4s ease-in-out 1.4s infinite; }
.hand svg { width: 64px; height: 64px; color: var(--muted); }
.hand span { font: 400 var(--text-hand)/1.3 var(--font-mono); color: var(--muted); max-width: 16ch; }
@media print { .hand { animation: none !important; translate: none !important; } }
@media (prefers-reduced-motion: reduce) { .is-active .hand { animation: none; } }
`;

/** «Levanta la mano»: recuadro sutil de 200 px que flota, para el espacio de participación. */
export const handRaise: Component = (props, ctx) => {
  const text = typeof props.text === 'string' ? props.text : '';
  return `<div class="hand" data-r style="--i:${ctx.reveal()}">${icon('hand')}<span>${text}</span></div>`;
};
