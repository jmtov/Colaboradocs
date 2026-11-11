import { For, Match, Show, Switch } from 'solid-js';
import DocumentEditor from '@/Editor/DocumentEditor/DocumentEditor';
import SaveIcon from '@/icons/SaveIcon';
import TrashIcon from '@/icons/TrashIcon';
import UploadIcon from '@/icons/UploadIcon';
import PageBar from '@/PageBar/PageBar';
import ChangeWarnings from './components/ChangeWarnings/ChangeWarnings';
import EditorOutline from './components/EditorOutline/EditorOutline';
import EditorToolbar from './components/EditorToolbar/EditorToolbar';
import GlossaryLinks from './components/GlossaryLinks/GlossaryLinks';
import SourcesEditor from './components/SourcesEditor/SourcesEditor';
import { useEditorPage } from './EditorPage.hooks';
import styles from './EditorPage.module.css';

type Props = {
  /** Id del documento que se edita. */
  id: string;
  /** Nombre del espacio, en el encabezado. */
  name: string;
};

/** Editor de un documento (solo admins): todo el documento en un editor, con borrador y publicación. */
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
                      <div class={styles.head}>
                        <h1 class={styles.title}>{doc().title}</h1>
                        <div class={styles.actions}>
                          <span class={styles.status} role="status">
                            {statusText()}
                          </span>
                          <button
                            type="button"
                            class={styles.button}
                            disabled={
                              !page.dirty() || page.saving() || page.busy()
                            }
                            onClick={() => void page.save()}
                          >
                            <SaveIcon class={styles.icon} />
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
                            <UploadIcon class={styles.icon} />
                            Publicar…
                          </button>
                          <button
                            type="button"
                            class={styles.button}
                            disabled={page.busy()}
                            onClick={() => void page.discard()}
                          >
                            <TrashIcon class={styles.icon} />
                            Descartar
                          </button>
                        </div>
                      </div>
                    </section>

                    <div class={styles.layout}>
                      <aside class={styles.side}>
                        <EditorOutline
                          sections={page.sections()}
                          currentId={page.currentId()}
                          onSelect={page.goTo}
                          sourcesCount={page.sources().length}
                          onSources={page.goToSources}
                        />
                      </aside>

                      <div class={styles.content}>
                        <Show when={page.stale()}>
                          <p class={styles.warn} role="status">
                            El documento publicado cambió después de que
                            empezaste este borrador. Al publicar se te va a
                            preguntar.
                          </p>
                        </Show>

                        <ChangeWarnings
                          affected={page.losses()}
                          renumbered={page.renumbered()}
                        />

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

                        <div class={styles.editing}>
                          <DocumentEditor
                            sections={page.sections()}
                            onChange={page.setSections}
                            onSettings={(id) => void page.openSettings(id)}
                            onReady={page.ready}
                          />
                          <GlossaryLinks
                            html={
                              page
                                .sections()
                                .find((item) => item.id === 'glosario')?.html ??
                              ''
                            }
                            links={page.links()}
                            onForms={page.setGlossaryForms}
                            onRemove={page.removeGlossaryLink}
                          />
                          <SourcesEditor
                            sources={page.sources()}
                            onChange={page.setSourceField}
                            onAdd={page.addSource}
                            onRemoveLast={() => void page.removeLastSource()}
                          />
                          <div class={styles.toolbar}>
                            <EditorToolbar
                              variant={
                                page.inGlossary() ? 'glossary' : 'section'
                              }
                              editor={page.editor()}
                              onCite={() => void page.cite()}
                            />
                          </div>
                        </div>
                      </div>
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
