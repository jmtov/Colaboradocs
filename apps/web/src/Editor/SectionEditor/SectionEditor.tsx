import { useSectionEditor } from './SectionEditor.hooks';
import styles from './SectionEditor.module.css';
import type { SectionEditorProps } from './SectionEditor.types';

/** Editor de una sección, limitado a los tipos de bloque del formato del documento. */
export default function SectionEditor(props: SectionEditorProps) {
  const editor = useSectionEditor(props);
  return <div ref={editor.setElement} class={styles.editor} />;
}
