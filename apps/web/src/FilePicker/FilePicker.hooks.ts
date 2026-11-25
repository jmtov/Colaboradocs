import { createSignal } from 'solid-js';
import type { FilePickerProps } from './FilePicker.types';

/** Estado y handlers del selector: arrastre, input oculto y elección del archivo. */
export function useFilePicker(onFile: () => FilePickerProps['onFile']) {
  let input!: HTMLInputElement;
  const [dragging, setDragging] = createSignal(false);
  // dragenter/dragleave se disparan también al cruzar los hijos: se cuentan para no parpadear.
  let depth = 0;

  function setInput(element: HTMLInputElement) {
    input = element;
  }

  function pick(file: File | undefined) {
    if (file) onFile()(file);
    // Para poder volver a elegir el mismo archivo (si no, el navegador no avisa del cambio).
    input.value = '';
  }

  function openPicker() {
    input.click();
  }

  function onDragEnter(event: DragEvent) {
    event.preventDefault();
    depth += 1;
    setDragging(true);
  }

  function onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  function onDragLeave() {
    depth = Math.max(0, depth - 1);
    if (depth === 0) setDragging(false);
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    depth = 0;
    setDragging(false);
    const files = event.dataTransfer?.files;
    pick(files?.[0]);
  }

  return {
    dragging,
    setInput,
    pick,
    openPicker,
    onDragEnter,
    onDragOver,
    onDragLeave,
    onDrop,
  };
}
