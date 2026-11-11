import { downloadText } from './download.utils';

/**
 * Las dos descargas de la hoja de subida. El texto se arma al pulsar: la guía
 * vive en `doc-import` (que se carga a demanda) y el ejemplo es un archivo
 * del repo, así que ninguno pesa hasta que alguien lo pide.
 */
export function useFormatDownloads() {
  async function downloadGuide() {
    const [{ buildFormatGuide }, { default: example }] = await Promise.all([
      import('@juntanza/doc-import'),
      import('@/content/example.raw'),
    ]);
    downloadText(
      'formato-colaboradocs.md',
      buildFormatGuide(example),
      'text/markdown;charset=utf-8',
    );
  }

  async function downloadExample() {
    const { default: example } = await import('@/content/example.raw');
    downloadText('ejemplo.json', example, 'application/json;charset=utf-8');
  }

  return { downloadGuide, downloadExample };
}
