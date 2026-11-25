import { BottomSheet, type SheetLayerProps } from '@colaboradocs/review-ui';
import { For, Show } from 'solid-js';
import { useVersionsSheet } from './VersionsSheet.hooks';
import styles from './VersionsSheet.module.css';
import { describeVersion } from './VersionsSheet.utils';

type Props = SheetLayerProps & {
  documentId: string;
};

/** Hoja con las versiones del documento: la actual y las que se reemplazaron. */
export default function VersionsSheet(props: Props) {
  const sheet = useVersionsSheet({
    documentId: () => props.documentId,
  });

  return (
    <BottomSheet
      open={props.open}
      kicker="Documento"
      title="Versiones"
      onClose={props.onClose}
    >
      <Show
        when={!sheet.versions.error}
        fallback={<p class={styles.note}>No pude cargar las versiones.</p>}
      >
        <Show
          when={sheet.versions()}
          fallback={<p class={styles.note}>Cargando…</p>}
        >
          {(items) => (
            <ol class={styles.list}>
              <For each={items()}>
                {(item) => (
                  <li class={styles.item}>
                    <span class={styles.version}>
                      {item.version}
                      <Show when={item.current}>
                        <span class={styles.badge}>Actual</span>
                      </Show>
                    </span>
                    <span class={styles.detail}>{describeVersion(item)}</span>
                  </li>
                )}
              </For>
            </ol>
          )}
        </Show>
      </Show>
    </BottomSheet>
  );
}
