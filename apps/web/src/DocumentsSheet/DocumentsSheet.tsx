import { BottomSheet, useReview } from '@juntanza/review-ui';
import { createEffect, createSignal, For, Show, untrack } from 'solid-js';
import UploadSheet from './components/UploadSheet/UploadSheet';
import styles from './DocumentsSheet.module.css';
import {
  documentsOpen,
  setDocumentsOpen,
  setUploadTarget,
  uploadTarget,
} from './documentsSheet.state';

/** Administración de documentos (solo admins): subir, reemplazar y archivar. */
export default function DocumentsSheet() {
  const review = useReview();
  const isAdmin = () =>
    (review.snapshot()?.me ?? review.session()?.reviewer)?.isAdmin === true;
  const [confirming, setConfirming] = createSignal<string | null>(null);
  const [busy, setBusy] = createSignal(false);

  // Solo depende de abrir o cerrar la hoja. Si siguiera a `isAdmin()` (que lee la
  // revisión), cada recarga de la revisión volvería a pedir la lista, sin fin.
  createEffect(() => {
    if (documentsOpen()) {
      if (untrack(isAdmin)) void review.loadDocuments();
    } else {
      setConfirming(null);
    }
  });

  async function archive(id: string) {
    setBusy(true);
    const result = await review.archiveDocument(id);
    setBusy(false);
    setConfirming(null);
    review.flash(result.ok ? 'Documento archivado.' : result.message);
  }

  return (
    <Show when={isAdmin()}>
      <BottomSheet
        open={documentsOpen()}
        kicker="Administración"
        title="Documentos"
        compact
        onClose={() => setDocumentsOpen(false)}
      >
        <div class={styles.content}>
          <button
            type="button"
            class={styles.add}
            onClick={() => setUploadTarget({})}
          >
            Subir documento
          </button>
          <p class={styles.hint}>
            Acepta Word (.docx), Markdown (.md) o el JSON de un documento. Al
            reemplazar uno, se guarda la versión anterior.
          </p>
          <ul class={styles.list}>
            <For
              each={review.documents() ?? []}
              fallback={
                <li class={styles.empty}>Todavía no hay documentos.</li>
              }
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
                      onClick={() =>
                        setUploadTarget({ replaceId: document.id })
                      }
                    >
                      Reemplazar
                    </button>
                    <Show
                      when={confirming() === document.id}
                      fallback={
                        <button
                          type="button"
                          class={`${styles.action} ${styles.danger}`}
                          onClick={() => setConfirming(document.id)}
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
                        disabled={busy()}
                        onClick={() => void archive(document.id)}
                      >
                        Archivar
                      </button>
                      <button
                        type="button"
                        class={styles.action}
                        onClick={() => setConfirming(null)}
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
      </BottomSheet>
      <UploadSheet
        target={uploadTarget()}
        onClose={() => setUploadTarget(null)}
      />
    </Show>
  );
}
