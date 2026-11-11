import { Button } from '@colaboradocs/review-ui';
import { For, Show } from 'solid-js';
import ArchiveIcon from '@/icons/ArchiveIcon';
import CloseIcon from '@/icons/CloseIcon';
import UploadIcon from '@/icons/UploadIcon';
import { useDocumentsPage } from './DocumentsPage.hooks';
import styles from './DocumentsPage.module.css';

/** Administración de documentos (solo admins): subir, reemplazar y archivar. La página lo enmarca. */
export default function DocumentsPage() {
  const sheet = useDocumentsPage();

  return (
    <div class={styles.content}>
      <Button icon={UploadIcon} class={styles.add} onClick={sheet.startUpload}>
        Subir documento
      </Button>
      <p class={styles.hint}>
        Acepta Word (.docx), Markdown (.md) o el JSON de un documento. Al
        reemplazar uno, se guarda la versión anterior.
      </p>
      <ul class={styles.list}>
        <For
          each={sheet.documents()}
          fallback={<li class={styles.empty}>Todavía no hay documentos.</li>}
        >
          {(document) => (
            <li class={styles.row}>
              <div class={styles.who}>
                <span class={styles.title}>{document.title}</span>
                <span class={styles.meta}>
                  {document.id} · v{document.version} · {document.updated}
                </span>
              </div>
              <div class={styles.actions}>
                <Button
                  icon={UploadIcon}
                  onClick={() => sheet.startReplace(document.id)}
                >
                  Reemplazar
                </Button>
                <Show
                  when={sheet.confirming() === document.id}
                  fallback={
                    <Button
                      icon={ArchiveIcon}
                      variant="danger"
                      onClick={() => sheet.askArchive(document.id)}
                    >
                      Archivar
                    </Button>
                  }
                >
                  <span class={styles.confirm}>
                    Se oculta; sus comentarios se conservan.
                  </span>
                  <Button
                    icon={ArchiveIcon}
                    variant="dangerSolid"
                    disabled={sheet.busy()}
                    onClick={() => void sheet.archive(document.id)}
                  >
                    Archivar
                  </Button>
                  <Button icon={CloseIcon} onClick={sheet.cancelArchive}>
                    Cancelar
                  </Button>
                </Show>
              </div>
            </li>
          )}
        </For>
      </ul>
    </div>
  );
}
