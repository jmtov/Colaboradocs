import type { Editor } from '@tiptap/core';
import { createSignal, lazy, Show, Suspense, untrack } from 'solid-js';
import { sectionKicker } from '@/content/content.utils';
import type { EditorPageState } from '../../EditorPage.hooks';
import { noteInline, splitNote } from '../../note.utils';
import EditorToolbar from '../EditorToolbar/EditorToolbar';
import GlossaryLinks from '../GlossaryLinks/GlossaryLinks';
import styles from './EditorSection.module.css';

// Tiptap/ProseMirror (~350 kB) solo se descarga al abrir el editor.
const SectionEditor = lazy(
  () => import('@/Editor/SectionEditor/SectionEditor'),
);
const NoteEditor = lazy(() => import('@/Editor/NoteEditor/NoteEditor'));

type Props = {
  id: string;
  page: EditorPageState;
};

/** La sección que lleva el glosario: su contenido son términos y definiciones. */
const GLOSSARY_ID = 'glosario';

/** Una sección del documento: título y descripción, la nota «Para qué sirve» y el contenido. */
export default function EditorSection(props: Props) {
  const [noteEditor, setNoteEditor] = createSignal<Editor>();
  const [bodyEditor, setBodyEditor] = createSignal<Editor>();

  const section = () =>
    props.page.sections().find((item) => item.id === props.id);
  const isGlossary = () => props.id === GLOSSARY_ID;
  const number = () => section()?.num.padStart(2, '0') ?? '';
  const kicker = () => {
    const current = section();
    return current ? sectionKicker(current) : '';
  };

  // Solo al crear los editores: después cada editor es el dueño de su texto.
  const initial = untrack(() => splitNote(section()?.html ?? ''));

  return (
    <section id={`edit-${props.id}`} class={styles.section}>
      <div class={styles.header}>
        <span class={styles.number}>{number()}</span>
        <input
          class={styles.title}
          aria-label={`Título: ${kicker()}`}
          value={section()?.title ?? ''}
          maxLength={200}
          placeholder="Título de la sección"
          onInput={(event) =>
            props.page.setSectionField(
              props.id,
              'title',
              event.currentTarget.value,
            )
          }
        />
      </div>
      <input
        class={styles.description}
        aria-label="Descripción: la línea que sale en la tarjeta de la sección"
        value={section()?.description ?? ''}
        maxLength={300}
        placeholder="Descripción para la tarjeta de la sección"
        onInput={(event) =>
          props.page.setSectionField(
            props.id,
            'description',
            event.currentTarget.value,
          )
        }
      />

      <div class={styles.frame}>
        <EditorToolbar variant="note" editor={noteEditor()} />
        <div class={styles.note}>
          <strong class={styles.noteLabel}>Para qué sirve.</strong>
          <Suspense fallback={<p class={styles.hint}>Cargando editor…</p>}>
            <NoteEditor
              html={`<p>${initial.note}</p>`}
              onChange={(html) =>
                props.page.setSectionNote(props.id, noteInline(html))
              }
              onReady={setNoteEditor}
            />
          </Suspense>
        </div>
      </div>

      <div class={styles.frame}>
        <EditorToolbar
          variant={isGlossary() ? 'glossary' : 'section'}
          editor={bodyEditor()}
        />
        <Suspense fallback={<p class={styles.hint}>Cargando editor…</p>}>
          <SectionEditor
            html={initial.body}
            onChange={(html) => props.page.setSectionBody(props.id, html)}
            onReady={setBodyEditor}
          />
        </Suspense>
      </div>

      <Show when={isGlossary()}>
        <GlossaryLinks
          html={section()?.html ?? ''}
          links={props.page.links()}
          onForms={props.page.setGlossaryForms}
          onRemove={props.page.removeGlossaryLink}
        />
      </Show>
    </section>
  );
}
