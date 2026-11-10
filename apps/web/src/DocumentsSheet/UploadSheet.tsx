import { BottomSheet, useReview } from '@juntanza/review-ui';
import { createEffect, createSignal, For, Show } from 'solid-js';
import type { DocumentContent } from '@/content/content.types';
import FilePicker from './FilePicker';
import styles from './UploadSheet.module.css';

type Props = {
  /** `null`: cerrada. `{}`: documento nuevo. `{ replaceId }`: reemplaza ese documento. */
  target: { replaceId?: string } | null;
  onClose: () => void;
};

type Problem = { message: string; details: string[] };

/**
 * Subir un documento: se lee el archivo en el navegador, se muestra qué se
 * entendió (secciones y avisos) y recién entonces se publica.
 */
export default function UploadSheet(props: Props) {
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

  const replaceId = () => props.target?.replaceId;
  const publishLabel = () => {
    if (busy()) return 'Publicando…';
    return exists() ? 'Reemplazar' : 'Publicar';
  };
  const exists = () =>
    (review.documents() ?? []).find((document) => document.id === id());

  createEffect(() => {
    if (props.target === null) return;
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
    props.onClose();
  }

  return (
    <BottomSheet
      open={props.target !== null}
      kicker="Documentos"
      title={replaceId() ? `Reemplazar «${replaceId()}»` : 'Subir documento'}
      compact
      onClose={props.onClose}
    >
      <div class={styles.content}>
        <FilePicker
          accept=".docx,.md,.markdown,.json"
          file={fileInfo()}
          reading={reading()}
          onFile={(file) => void onFile(file)}
        />

        <Show when={problem()}>
          {(current) => (
            <div class={styles.problem} role="alert">
              <strong>{current().message}</strong>
              <ul>
                <For each={current().details}>
                  {(detail) => <li>{detail}</li>}
                </For>
              </ul>
            </div>
          )}
        </Show>

        <Show when={parsed()}>
          {(document) => (
            <>
              <div class={styles.form}>
                <label class={styles.label}>
                  Título
                  <input
                    class={styles.field}
                    value={title()}
                    maxLength={200}
                    onInput={(event) => setTitle(event.currentTarget.value)}
                  />
                </label>
                <label class={styles.label}>
                  Id (va en la URL: /d/…)
                  <input
                    class={styles.field}
                    value={id()}
                    maxLength={64}
                    disabled={replaceId() !== undefined}
                    onInput={(event) => setId(event.currentTarget.value)}
                  />
                </label>
                <label class={styles.label}>
                  Descripción (la tarjeta de la home)
                  <input
                    class={styles.field}
                    value={description()}
                    maxLength={500}
                    onInput={(event) =>
                      setDescription(event.currentTarget.value)
                    }
                  />
                </label>
                <label class={styles.label}>
                  Versión
                  <input
                    class={styles.field}
                    value={version()}
                    maxLength={40}
                    onInput={(event) => setVersion(event.currentTarget.value)}
                  />
                </label>
              </div>

              <Show when={exists()}>
                {(current) => (
                  <p class={styles.warn}>
                    Ya existe «{current().title}» con ese id: se reemplaza y se
                    guarda la versión anterior. Los comentarios y OK de los
                    párrafos que cambien dejan de aplicar.
                  </p>
                )}
              </Show>

              <div class={styles.summary}>
                <strong>
                  {document().sections.length}{' '}
                  {document().sections.length === 1 ? 'sección' : 'secciones'}
                </strong>
                <ol>
                  <For each={document().sections}>
                    {(section) => (
                      <li>
                        {section.num}. {section.title}{' '}
                        <span class={styles.meta}>
                          {Math.max(1, Math.round(section.html.length / 1000))}{' '}
                          k
                        </span>
                      </li>
                    )}
                  </For>
                </ol>
              </div>

              <Show when={warnings().length > 0}>
                <div class={styles.warn}>
                  <strong>Revisa esto del archivo original:</strong>
                  <ul>
                    <For each={warnings()}>
                      {(warning) => <li>{warning}</li>}
                    </For>
                  </ul>
                </div>
              </Show>

              <div class={styles.row}>
                <button
                  type="button"
                  class={styles.button}
                  onClick={props.onClose}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  class={`${styles.button} ${styles.primary}`}
                  disabled={
                    busy() ||
                    !id().trim() ||
                    !title().trim() ||
                    !version().trim()
                  }
                  onClick={() => void publish()}
                >
                  {publishLabel()}
                </button>
              </div>
            </>
          )}
        </Show>
      </div>
    </BottomSheet>
  );
}
