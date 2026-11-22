import type { DeckBundle, Theme } from '@colaboradocs/deck-core';
import { renderDeck } from '@colaboradocs/deck-render';

/** Carpeta ficticia de las fuentes en el HTML: se reemplaza por data URIs. */
const FONTS_PATH = 'fonts';

/** Archivos ya bajados, como data URIs: las fuentes por nombre de archivo y los del deck por ruta (relativa a `assets/`). */
export type DeckFiles = {
  fonts: Record<string, string>;
  files: Record<string, string>;
};

/** Nombres de las fuentes de un tema (y las de sus variantes). */
export function themeFontFiles(theme: Theme): string[] {
  const names = new Set<string>();
  for (const font of theme.fonts) names.add(font.file);
  for (const variant of Object.values(theme.variants ?? {})) {
    for (const font of variant.fonts ?? []) names.add(font.file);
  }
  return [...names];
}

/**
 * El HTML del deck listo para un iframe sin red: el visor baja las fuentes y los archivos
 * con el token (el iframe no puede mandarlo) y aquí se incrustan como data URIs.
 */
export function buildDeckHtml(
  bundle: Pick<DeckBundle, 'deck' | 'theme'>,
  loaded: DeckFiles,
  options: { preview?: boolean } = {},
): string {
  const { html } = renderDeck(bundle.deck, bundle.theme, {
    fontsPath: FONTS_PATH,
    // El editor dibuja decks a medias: la vista previa no se niega a mostrarlos.
    ...(options.preview && { preview: true, skipValidation: true }),
  });
  return inlineFiles(html, loaded);
}

/** Cambia las rutas de fuentes y archivos del deck por sus data URIs (también en el HTML suelto de una slide). */
export function inlineFiles(html: string, loaded: DeckFiles): string {
  let out = html;
  for (const [file, url] of Object.entries(loaded.fonts)) {
    out = out.replaceAll(`"${FONTS_PATH}/${file}"`, `"${url}"`);
  }
  for (const [path, url] of Object.entries(loaded.files)) {
    out = out.replaceAll(`"assets/${path}"`, `"${url}"`);
  }
  return out;
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
