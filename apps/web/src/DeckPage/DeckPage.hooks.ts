import { ApiRequestError, useReview } from '@colaboradocs/review-ui';
import { createResource } from 'solid-js';
import { blobToDataUrl, buildDeckHtml, themeFontFiles } from './deck.utils';

/**
 * Pide el deck con su tema y baja las fuentes y los archivos con el token (el iframe no
 * puede mandarlo): el resultado es el HTML completo, con todo incrustado.
 */
export function useDeckPage(id: () => string) {
  const review = useReview();
  const [html, { refetch }] = createResource(id, async (deckId) => {
    const bundle = await review.fetchDeck(deckId);
    const [fonts, files] = await Promise.all([
      loadAll(themeFontFiles(bundle), (file) =>
        review.fetchFile(`/themes/${bundle.theme.id}/files/${file}`),
      ),
      loadAll(bundle.files, (path) =>
        review.fetchFile(`/decks/${deckId}/files/${path}`),
      ),
    ]);
    return {
      html: buildDeckHtml(bundle, { fonts, files }),
      title: bundle.deck.title,
    };
  });
  const notFound = () => {
    const error: unknown = html.error;
    return error instanceof ApiRequestError && error.code === 'not_found';
  };
  return { deck: html, refetch, notFound };
}

async function loadAll(
  names: string[],
  fetchBlob: (name: string) => Promise<Blob>,
): Promise<Record<string, string>> {
  const entries = await Promise.all(
    names.map(
      async (name) =>
        [name, await blobToDataUrl(await fetchBlob(name))] as const,
    ),
  );
  return Object.fromEntries(entries);
}
