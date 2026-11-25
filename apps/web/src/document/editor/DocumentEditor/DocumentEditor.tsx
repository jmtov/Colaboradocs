import { useDocumentEditor } from './DocumentEditor.hooks';
import styles from './DocumentEditor.module.css';
import type { DocumentEditorProps } from './DocumentEditor.types';

/** El documento entero en un editor: cada título de sección abre una sección nueva. */
export default function DocumentEditor(props: DocumentEditorProps) {
  const editor = useDocumentEditor(props);
  return <div ref={editor.setElement} class={styles.editor} />;
}
