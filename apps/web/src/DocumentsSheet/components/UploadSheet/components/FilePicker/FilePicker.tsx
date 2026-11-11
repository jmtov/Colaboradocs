import { Show } from 'solid-js';
import FileTextIcon from '@/icons/FileTextIcon';
import UploadIcon from '@/icons/UploadIcon';
import { useFilePicker } from './FilePicker.hooks';
import styles from './FilePicker.module.css';
import type { FilePickerProps } from './FilePicker.types';
import { formatSize } from './size.utils';

/**
 * Selector de archivo: una zona para arrastrar o hacer clic. Reemplaza al
 * `<input type="file">` nativo, que sale en el idioma del navegador y no sigue
 * el estilo de la interfaz. El input sigue existiendo (oculto) para abrir el
 * selector del sistema, y el teclado funciona como con cualquier botón.
 */
export default function FilePicker(props: FilePickerProps) {
  const picker = useFilePicker(() => props.onFile);

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: zona para soltar archivos; el control accesible (teclado, lector de pantalla) es el botón de adentro
    <div
      class={styles.picker}
      onDragEnter={picker.onDragEnter}
      onDragOver={picker.onDragOver}
      onDragLeave={picker.onDragLeave}
      onDrop={picker.onDrop}
    >
      <input
        ref={picker.setInput}
        type="file"
        accept={props.accept}
        hidden
        onChange={(event) => picker.pick(event.currentTarget.files?.[0])}
      />

      <Show
        when={props.file}
        fallback={
          <button
            type="button"
            class={styles.zone}
            classList={{ [styles.dragging]: picker.dragging() }}
            data-flat
            onClick={picker.openPicker}
          >
            <UploadIcon class={styles.icon} />
            <span class={styles.title}>
              {picker.dragging() ? 'Suéltalo aquí' : 'Arrastra tu archivo aquí'}
            </span>
            <span class={styles.sub}>o haz clic para elegirlo</span>
            <span class={styles.hint}>Word (.docx), Markdown (.md) o JSON</span>
          </button>
        }
      >
        {(file) => (
          <div
            class={styles.chip}
            classList={{ [styles.dragging]: picker.dragging() }}
          >
            <FileTextIcon class={styles.chipIcon} />
            <span class={styles.name}>
              {file().name}
              <span class={styles.size}>
                {props.reading ? 'Leyendo…' : formatSize(file().size)}
              </span>
            </span>
            <button
              type="button"
              class={styles.change}
              disabled={props.reading}
              onClick={picker.openPicker}
            >
              Cambiar archivo
            </button>
          </div>
        )}
      </Show>
    </div>
  );
}
