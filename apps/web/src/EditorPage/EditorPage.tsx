import { For, Match, Show, Switch } from 'solid-js';
import PageBar from '@/PageBar/PageBar';
import Prose from '@/Prose/Prose';
import EditorSection from './components/EditorSection/EditorSection';
import { useEditorPage } from './EditorPage.hooks';
import styles from './EditorPage.module.css';

type Props = {
  /** Id del documento que se edita. */
  id: string;
  /** Nombre del espacio, en el encabezado. */
  name: string;
};

/** Editor de un documento (solo admins): una sección a la vez, con borrador y publicación. */
export default function EditorPage(props: Props) {
  const page = useEditorPage(() => props.id);

  const statusText = () => {
    if (page.saving()) return 'Guardando…';
    if (page.dirty()) return 'Cambios sin guardar';
    return page.hasDraft() ? 'Borrador guardado' : 'Sin cambios';
  };

  return (
    <>
      <PageBar
        backLabel="← Volver al documento"
        onBack={() => void page.leave()}
        name={props.name}
      />

      <main class={styles.page}>
        <Show
          when={page.isAdmin()}
          fallback={
            <section class={styles.intro}>
              <h1 class={styles.title}>Solo para administradores</h1>
            </section>
          }
        >
          <Switch>
            <Match when={page.status() === 'error'}>
              <section class={styles.intro}>
                <h1 class={styles.title}>No se pudo abrir el editor</h1>
                <p class={styles.hint}>{page.loadError()}</p>
                <button
                  type="button"
                  class={styles.button}
                  onClick={() => void page.reload()}
                >
                  Reintentar
                </button>
              </section>
            </Match>
            <Match when={page.status() === 'ready'}>
              <Show when={page.content()}>
                {(doc) => (
                  <>
                    <section class={styles.intro}>
                      <span class={styles.eyebrow}>Editando</span>
                      <h1 class={styles.title}>{doc().title}</h1>
                      <div class={styles.actions}>
                        <span class={styles.status} role="status">
                          {statusText()}
                        </span>
                        <button
                          type="button"
                          class={styles.button}
                          disabled={page.busy()}
                          onClick={() => page.setPreviewing(!page.previewing())}
                        >
                          {page.previewing()
                            ? 'Seguir editando'
                            : 'Vista previa'}
                        </button>
                        <button
                          type="button"
                          class={styles.button}
                          disabled={
                            !page.dirty() || page.saving() || page.busy()
                          }
                          onClick={() => void page.save()}
                        >
                          Guardar borrador
                        </button>
                        <button
                          type="button"
                          class={`${styles.button} ${styles.primary}`}
                          disabled={
                            (!page.dirty() && !page.hasDraft()) ||
                            page.saving() ||
                            page.busy()
                          }
                          onClick={() => void page.publish()}
                        >
                          Publicar…
                        </button>
                        <button
                          type="button"
                          class={styles.button}
                          disabled={page.busy()}
                          onClick={() => void page.discard()}
                        >
                          Descartar
                        </button>
                      </div>
                    </section>

                    <div class={styles.content}>
                      <Show when={page.stale()}>
                        <p class={styles.warn} role="status">
                          El documento publicado cambió después de que empezaste
                          este borrador. Al publicar se te va a preguntar.
                        </p>
                      </Show>

                      <Show when={page.problem()}>
                        {(current) => (
                          <div class={styles.problem} role="alert">
                            <strong>{current().message}</strong>
                            <Show when={current().details.length > 0}>
                              <ul>
                                <For each={current().details}>
                                  {(detail) => <li>{detail}</li>}
                                </For>
                              </ul>
                            </Show>
                            <Show when={current().code === 'conflict'}>
                              <button
                                type="button"
                                class={styles.button}
                                onClick={() => void page.reload()}
                              >
                                Recargar el borrador
                              </button>
                            </Show>
                          </div>
                        )}
                      </Show>

                      <Show
                        when={!page.previewing()}
                        fallback={
                          <div class={styles.preview}>
                            <For each={doc().sections}>
                              {(section) => (
                                <section class={styles.section}>
                                  <h2 class={styles.previewTitle}>
                                    {section.num}. {section.title}
                                  </h2>
                                  <Prose
                                    section={section}
                                    glossaryTerms={doc().glossaryTerms}
                                    reviewable={false}
                                  />
                                </section>
                              )}
                            </For>
                          </div>
                        }
                      >
                        <For each={page.sectionIds()}>
                          {(sectionId) => (
                            <EditorSection id={sectionId} page={page} />
                          )}
                        </For>
                        <div class={styles.adds}>
                          <button
                            type="button"
                            class={styles.button}
                            onClick={page.addSection}
                          >
                            + Agregar sección
                          </button>
                          <Show when={!page.hasGlossary()}>
                            <button
                              type="button"
                              class={styles.button}
                              onClick={page.addGlossary}
                            >
                              + Agregar glosario
                            </button>
                          </Show>
                        </div>
                      </Show>
                    </div>
                  </>
                )}
              </Show>
            </Match>
            <Match when={page.status() === 'loading'}>
              <section class={styles.intro}>
                <p class={styles.hint}>Cargando…</p>
              </section>
            </Match>
          </Switch>
        </Show>
      </main>
    </>
  );
}
