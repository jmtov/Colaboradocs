import { For, type JSX, Show } from 'solid-js';
import { Portal } from 'solid-js/web';
import BlockActionBar from '../BlockActionBar/BlockActionBar';
import BlockBadges from '../BlockBadges/BlockBadges';
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
                  mine={layer.isMine(id())}
                  openThreads={layer.openThreadsFor(id())}
                  onComment={() => layer.openComments(id())}
                  onToggleApproval={() => layer.toggleApproval(id())}
                  onClose={layer.clearSelection}
                />
              </Portal>
            )}
          </Show>
        )}
      </Show>
      <For each={layer.badgedIds()}>
        {(id) => (
          <Show when={layer.blockElement(id)}>
            {(element) => (
              <Portal
                mount={element()}
                ref={(container) => container.classList.add(styles.badgeHost)}
              >
                <BlockBadges
                  approvals={layer.approvalCount(id)}
                  mine={layer.isMine(id)}
                  openThreads={layer.openThreadsFor(id)}
                  onOpenApprovals={() => layer.openApprovals(id)}
                  onOpenComments={() => layer.openComments(id)}
                />
              </Portal>
            )}
          </Show>
        )}
      </For>
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
