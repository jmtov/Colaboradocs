export type FilePickerProps = {
  /** Extensiones que acepta el selector del sistema (el arrastre acepta cualquiera y se valida después). */
  accept: string;
  /** El archivo ya elegido: la zona se reemplaza por su nombre y tamaño. */
  file: { name: string; size: number } | null;
  /** Se está leyendo el archivo. */
  reading: boolean;
  onFile: (file: File) => void;
};
