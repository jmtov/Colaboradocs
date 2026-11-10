import { createSignal, Show } from 'solid-js';
import FileTextIcon from '@/icons/FileTextIcon';
import UploadIcon from '@/icons/UploadIcon';
import styles from './FilePicker.module.css';
import { formatSize } from './size.utils';

type Props = {
  /** Extensiones que acepta el selector del sistema (el arrastre acepta cualquiera y se valida después). */
  accept: string;
  /** El archivo ya elegido: la zona se reemplaza por su nombre y tamaño. */
  file: { name: string; size: number } | null;
  /** Se está leyendo el archivo. */
  reading: boolean;
  onFile: (file: File) => void;
};

/**
 * Selector de archivo: una zona para arrastrar o hacer clic. Reemplaza al
 * `<input type="file">` nativo, que sale en el idioma del navegador y no sigue
 * el estilo de la interfaz. El input sigue existiendo (oculto) para abrir el
 * selector del sistema, y el teclado funciona como con cualquier botón.
 */
export default function FilePicker(props: Props) {
  let input!: HTMLInputElement;
  const [dragging, setDragging] = createSignal(false);
  // dragenter/dragleave se disparan también al cruzar los hijos: se cuentan para no parpadear.
  let depth = 0;

  function pick(file: File | undefined) {
    if (file) props.onFile(file);
    // Para poder volver a elegir el mismo archivo (si no, el navegador no avisa del cambio).
    input.value = '';
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    depth = 0;
    setDragging(false);
    pick(event.dataTransfer?.files?.[0]);
  }

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: zona para soltar archivos; el control accesible (teclado, lector de pantalla) es el botón de adentro
    <div
      class={styles.picker}
      onDragEnter={(event) => {
        event.preventDefault();
        depth += 1;
        setDragging(true);
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={() => {
        depth = Math.max(0, depth - 1);
        if (depth === 0) setDragging(false);
      }}
      onDrop={onDrop}
    >
      <input
        ref={input}
        type="file"
        accept={props.accept}
        hidden
        onChange={(event) => pick(event.currentTarget.files?.[0])}
      />

      <Show
        when={props.file}
        fallback={
          <button
            type="button"
            class={styles.zone}
            classList={{ [styles.dragging]: dragging() }}
            data-flat
            onClick={() => input.click()}
          >
            <UploadIcon class={styles.icon} />
            <span class={styles.title}>
              {dragging() ? 'Suéltalo aquí' : 'Arrastra tu archivo aquí'}
            </span>
            <span class={styles.sub}>o haz clic para elegirlo</span>
            <span class={styles.hint}>Word (.docx), Markdown (.md) o JSON</span>
          </button>
        }
      >
        {(file) => (
          <div
            class={styles.chip}
            classList={{ [styles.dragging]: dragging() }}
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
              onClick={() => input.click()}
            >
              Cambiar archivo
            </button>
          </div>
        )}
      </Show>
    </div>
  );
}
