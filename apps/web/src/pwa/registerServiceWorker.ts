/** Registra el service worker (el que hace instalable la página) solo en la versión publicada: en desarrollo cachearía nada, pero estorbaría con la recarga en caliente. */
export function registerServiceWorker(
  isProduction = import.meta.env.PROD,
  container:
    | Pick<ServiceWorkerContainer, 'register'>
    | undefined = navigator.serviceWorker,
): void {
  if (!isProduction || !container) return;
  window.addEventListener('load', () => {
    // Si falla (un navegador sin soporte o sin HTTPS), la página sigue funcionando igual.
    void container.register('/sw.js').catch(() => undefined);
  });
}
