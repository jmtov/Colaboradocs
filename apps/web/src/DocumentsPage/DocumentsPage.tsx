import { For, Show } from 'solid-js';
import { useDocumentsPage } from './DocumentsPage.hooks';
import styles from './DocumentsPage.module.css';

/** Administración de documentos (solo admins): subir, reemplazar y archivar. La página lo enmarca. */
export default function DocumentsPage() {
  const sheet = useDocumentsPage();

  return (
    <div class={styles.content}>
      <button type="button" class={styles.add} onClick={sheet.startUpload}>
        Subir documento
      </button>
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
                <button
                  type="button"
                  class={styles.action}
                  onClick={() => sheet.startReplace(document.id)}
                >
                  Reemplazar
                </button>
                <Show
                  when={sheet.confirming() === document.id}
                  fallback={
                    <button
                      type="button"
                      class={`${styles.action} ${styles.danger}`}
                      onClick={() => sheet.askArchive(document.id)}
                    >
                      Archivar
                    </button>
                  }
                >
                  <span class={styles.confirm}>
                    Se oculta; sus comentarios se conservan.
                  </span>
                  <button
                    type="button"
                    class={`${styles.action} ${styles.dangerSolid}`}
                    disabled={sheet.busy()}
                    onClick={() => void sheet.archive(document.id)}
                  >
                    Archivar
                  </button>
                  <button
                    type="button"
                    class={styles.action}
                    onClick={sheet.cancelArchive}
                  >
                    Cancelar
                  </button>
                </Show>
              </div>
            </li>
          )}
        </For>
      </ul>
    </div>
  );
}
