import { useReview } from '@juntanza/review-ui';
import { createEffect, createSignal } from 'solid-js';
import type { DocumentContent } from '@/content/content.types';
import type { Problem, UploadSheetProps } from './UploadSheet.types';

/** Estado, efectos y publicación de la hoja de subida. Recibe accessors de las props. */
export function useUploadSheet({
  target,
  close,
}: {
  target: () => UploadSheetProps['target'];
  close: () => void;
}) {
  const review = useReview();
  const [parsed, setParsed] = createSignal<DocumentContent | null>(null);
  const [warnings, setWarnings] = createSignal<string[]>([]);
  const [problem, setProblem] = createSignal<Problem | null>(null);
  const [reading, setReading] = createSignal(false);
  const [fileInfo, setFileInfo] = createSignal<{
    name: string;
    size: number;
  } | null>(null);
  const [busy, setBusy] = createSignal(false);
  const [id, setId] = createSignal('');
  const [title, setTitle] = createSignal('');
  const [description, setDescription] = createSignal('');
  const [version, setVersion] = createSignal('');

  const isOpen = () => target() !== null;
  const replaceId = () => target()?.replaceId;
  const publishLabel = () => {
    if (busy()) return 'Publicando…';
    return exists() ? 'Reemplazar' : 'Publicar';
  };
  const publishDisabled = () =>
    busy() || !id().trim() || !title().trim() || !version().trim();
  const exists = () =>
    (review.documents() ?? []).find((document) => document.id === id());

  createEffect(() => {
    if (target() === null) return;
    setParsed(null);
    setWarnings([]);
    setProblem(null);
    setFileInfo(null);
    setBusy(false);
  });

  async function onFile(file: File) {
    setFileInfo({ name: file.name, size: file.size });
    setReading(true);
    setProblem(null);
    setParsed(null);
    // El convertidor (Word incluido) pesa: se descarga solo al subir algo.
    const { parseUpload } = await import('@juntanza/doc-import');
    const result = await parseUpload(file, { id: replaceId() });
    setReading(false);
    if (!result.ok) {
      setProblem({
        message: 'No pude usar ese archivo.',
        details: result.errors,
      });
      return;
    }
    const document = result.document;
    // Al reemplazar, el id es el del documento que se está reemplazando.
    setParsed(
      replaceId() ? { ...document, id: replaceId() as string } : document,
    );
    setWarnings(result.warnings);
    setId(replaceId() ?? document.id);
    setTitle(document.title);
    setDescription(document.description ?? '');
    setVersion(document.version);
  }

  async function publish() {
    const base = parsed();
    if (!base || busy()) return;
    setBusy(true);
    setProblem(null);
    const result = await review.publishDocument({
      ...base,
      id: id().trim(),
      title: title().trim(),
      version: version().trim(),
      description: description().trim() || undefined,
    });
    setBusy(false);
    if (!result.ok) {
      setProblem({ message: result.message, details: result.details });
      return;
    }
    review.flash(
      result.created ? 'Documento publicado.' : 'Documento reemplazado.',
    );
    close();
  }

  return {
    isOpen,
    replaceId,
    parsed,
    warnings,
    problem,
    reading,
    fileInfo,
    busy,
    id,
    setId,
    title,
    setTitle,
    description,
    setDescription,
    version,
    setVersion,
    exists,
    publishLabel,
    publishDisabled,
    onFile,
    publish,
    close,
  };
}
