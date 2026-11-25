const STORAGE_KEY = 'review:howto-dismissed';

/** ¿Ya pidió no volver a ver la guía? Vale para todos los documentos de este navegador. */
export function isHowToDismissed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function dismissHowTo() {
  try {
    localStorage.setItem(STORAGE_KEY, '1');
  } catch {
    // Sin almacenamiento: se vuelve a mostrar la próxima vez.
  }
}
