import { createSignal } from 'solid-js';

/** Si la hoja de administración de documentos está abierta (la abren el menú y la home). */
export const [documentsOpen, setDocumentsOpen] = createSignal(false);

/**
 * La hoja de subida: `null` cerrada, `{}` documento nuevo, `{ replaceId }`
 * reemplaza ese documento. La abren la hoja de administración, la home y el
 * menú de cada tarjeta.
 */
export const [uploadTarget, setUploadTarget] = createSignal<{
  replaceId?: string;
} | null>(null);
