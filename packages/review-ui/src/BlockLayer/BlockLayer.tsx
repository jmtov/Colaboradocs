import { type JSX, Show } from 'solid-js';
import { Portal } from 'solid-js/web';
import BlockActionBar from '../BlockActionBar/BlockActionBar';
import { useBlockLayer } from './BlockLayer.hooks';
import styles from './BlockLayer.module.css';

type Props = {
  /** Contenido con elementos `data-block-id` (uno por bloque revisable). */
  children: JSX.Element;
};

/**
 * Hace revisable el contenido de sus hijos: al tocar un bloque aparece la barra
 * de Comentar / OK, y cada bloque muestra cuántos OK e hilos abiertos tiene.
 * Los elementos con `data-interactive`, enlaces y botones no seleccionan.
 */
export default function BlockLayer(props: Props) {
  const layer = useBlockLayer();

  return (
    <>
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: la selección por teclado se resuelve con los botones de la barra */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: delegación de clics sobre el contenido */}
      <div ref={layer.setRoot} class={styles.layer} onClick={layer.onClick}>
        {props.children}
      </div>
      <Show when={layer.selectedId()}>
        {(id) => (
          <Show when={layer.barHost()}>
            {(host) => (
              <Portal mount={host()}>
                <BlockActionBar
                  approvedBy={layer.approvedNames()}
                  mine={layer.isMine()}
                  openThreads={layer.openThreadsFor(id())}
                  onComment={layer.openComments}
                  onToggleApproval={() => layer.toggleApproval(id())}
                  onClose={layer.clearSelection}
                />
              </Portal>
            )}
          </Show>
        )}
      </Show>
      <Show when={layer.notice()}>
        {(message) => (
          <p class={styles.notice} role="alert">
            {message()}
          </p>
        )}
      </Show>
    </>
  );
}
