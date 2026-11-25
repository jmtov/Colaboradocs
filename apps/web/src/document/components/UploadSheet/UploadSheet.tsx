import { BottomSheet, Button } from '@colaboradocs/review-ui';
import { For, Show } from 'solid-js';
import CloseIcon from '@/shared/icons/CloseIcon';
import UploadIcon from '@/shared/icons/UploadIcon';
import {
  FieldGroup,
  FieldRow,
  FieldTitle,
} from '@/shared/ui/FieldGroup/FieldGroup';
import fieldStyles from '@/shared/ui/FieldGroup/FieldInput.module.css';
import FilePicker from '@/shared/ui/FilePicker/FilePicker';
import NewDocumentForm from '../../DocumentsPage/components/NewDocumentForm/NewDocumentForm';
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
          : 'Nuevo documento'
      }
      compact
      onClose={props.onClose}
    >
      <div class={styles.content}>
        {/* Sin archivo y sin reemplazar nada, también se puede crear uno desde cero. */}
        <Show when={!upload.replaceId() && !upload.parsed()}>
          <NewDocumentForm onCreated={props.close} />
          <FieldTitle>Subir documento</FieldTitle>
        </Show>
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
              <FieldGroup
                title="Datos del documento"
                hint="La descripción es la línea de la tarjeta en la home."
              >
                <FieldRow label="Título">
                  <input
                    class={fieldStyles.input}
                    value={upload.title()}
                    maxLength={200}
                    onInput={(event) =>
                      upload.setTitle(event.currentTarget.value)
                    }
                  />
                </FieldRow>
                <FieldRow label="Id (va en la URL: /d/…)">
                  <input
                    class={fieldStyles.input}
                    value={upload.id()}
                    maxLength={64}
                    disabled={upload.replaceId() !== undefined}
                    onInput={(event) => upload.setId(event.currentTarget.value)}
                  />
                </FieldRow>
                <FieldRow label="Descripción">
                  <input
                    class={fieldStyles.input}
                    value={upload.description()}
                    maxLength={500}
                    onInput={(event) =>
                      upload.setDescription(event.currentTarget.value)
                    }
                  />
                </FieldRow>
                <FieldRow label="Versión">
                  <input
                    class={fieldStyles.input}
                    value={upload.version()}
                    maxLength={40}
                    onInput={(event) =>
                      upload.setVersion(event.currentTarget.value)
                    }
                  />
                </FieldRow>
              </FieldGroup>

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
                <Button icon={CloseIcon} onClick={upload.close}>
                  Cancelar
                </Button>
                <Button
                  icon={UploadIcon}
                  variant="primary"
                  disabled={upload.publishDisabled()}
                  onClick={() => void upload.publish()}
                >
                  {upload.publishLabel()}
                </Button>
              </div>
            </>
          )}
        </Show>
      </div>
    </BottomSheet>
  );
}
