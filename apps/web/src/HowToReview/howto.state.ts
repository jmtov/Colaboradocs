import { createSignal } from 'solid-js';

/** Si la guía «Cómo revisar» está abierta. */
export const [howToOpen, setHowToOpen] = createSignal(false);

/** Si hay un documento abierto (la guía solo existe ahí): el menú de la sesión lo usa para ofrecerla. */
export const [howToAvailable, setHowToAvailable] = createSignal(false);
