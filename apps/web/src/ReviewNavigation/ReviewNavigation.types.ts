/** Qué conjunto de bloques se recorre desde el resumen. */
export type NavKind = 'threads' | 'pending' | 'approved';

/** Un bloque del documento en la lista de la hoja. */
export type NavItem = {
  id: string;
  /** Primeras palabras del bloque. */
  text: string;
  /** «3. Plazos»: la sección donde está. */
  section: string;
  /** «2 hilos», «✓ 3»; vacío si no aplica. */
  meta: string;
};
