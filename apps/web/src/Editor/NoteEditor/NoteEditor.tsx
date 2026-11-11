import { noteExtensions } from '../editor.extensions';
import { useSectionEditor } from '../SectionEditor/SectionEditor.hooks';
import type { SectionEditorProps } from '../SectionEditor/SectionEditor.types';
import styles from './NoteEditor.module.css';

/** Editor de la nota «Para qué sirve»: un párrafo. Entrega `<p>…</p>`. */
export default function NoteEditor(props: SectionEditorProps) {
  const editor = useSectionEditor(props, noteExtensions);
  return <div ref={editor.setElement} class={styles.editor} />;
}
