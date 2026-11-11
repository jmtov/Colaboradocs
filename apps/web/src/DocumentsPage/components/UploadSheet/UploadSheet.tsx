import { BottomSheet } from '@colaboradocs/review-ui';
import { For, Show } from 'solid-js';
import FilePicker from './components/FilePicker/FilePicker';
import FormatDownloads from './components/FormatDownloads/FormatDownloads';
import { useUploadSheet } from './UploadSheet.hooks';
import styles from './UploadSheet.module.css';
import type { UploadSheetProps } from './UploadSheet.types';

/**
 * Subir un documento: se lee el archivo en el navegador, se muestra qué se
 * entendió (secciones y avisos) y recién entonces se publica.
 */
export default function UploadSheet(props: UploadSheetProps) {
  const upload = useUploadSheet({
    replaceId: () => props.target.replaceId,
    close: () => props.close(),
  });

  return (
    <BottomSheet
      open={props.open}
      kicker="Documentos"
      title={
        upload.replaceId()
          ? `Reemplazar «${upload.replaceId()}»`
          : 'Subir documento'
      }
      compact
      onClose={props.onClose}
    >
      <div class={styles.content}>
        <FilePicker
          accept=".docx,.md,.markdown,.json"
          file={upload.fileInfo()}
          reading={upload.reading()}
          onFile={(file) => void upload.onFile(file)}
        />

        <Show when={!upload.parsed()}>
          <FormatDownloads />
        </Show>

        <Show when={upload.problem()}>
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

        <Show when={upload.parsed()}>
          {(document) => (
            <>
              <div class={styles.form}>
                <label class={styles.label}>
                  Título
                  <input
                    class={styles.field}
                    value={upload.title()}
                    maxLength={200}
                    onInput={(event) =>
                      upload.setTitle(event.currentTarget.value)
                    }
                  />
                </label>
                <label class={styles.label}>
                  Id (va en la URL: /d/…)
                  <input
                    class={styles.field}
                    value={upload.id()}
                    maxLength={64}
                    disabled={upload.replaceId() !== undefined}
                    onInput={(event) => upload.setId(event.currentTarget.value)}
                  />
                </label>
                <label class={styles.label}>
                  Descripción (la tarjeta de la home)
                  <input
                    class={styles.field}
                    value={upload.description()}
                    maxLength={500}
                    onInput={(event) =>
                      upload.setDescription(event.currentTarget.value)
                    }
                  />
                </label>
                <label class={styles.label}>
                  Versión
                  <input
                    class={styles.field}
                    value={upload.version()}
                    maxLength={40}
                    onInput={(event) =>
                      upload.setVersion(event.currentTarget.value)
                    }
                  />
                </label>
              </div>

              <Show when={upload.exists()}>
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

              <Show when={upload.warnings().length > 0}>
                <div class={styles.warn}>
                  <strong>Revisa esto del archivo original:</strong>
                  <ul>
                    <For each={upload.warnings()}>
                      {(warning) => <li>{warning}</li>}
                    </For>
                  </ul>
                </div>
              </Show>

              <div class={styles.row}>
                <button
                  type="button"
                  class={styles.button}
                  onClick={upload.close}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  class={`${styles.button} ${styles.primary}`}
                  disabled={upload.publishDisabled()}
                  onClick={() => void upload.publish()}
                >
                  {upload.publishLabel()}
                </button>
              </div>
            </>
          )}
        </Show>
      </div>
    </BottomSheet>
  );
}
