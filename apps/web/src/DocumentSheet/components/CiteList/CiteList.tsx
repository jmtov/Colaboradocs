import { For, Show } from 'solid-js';
import type { DocumentSource } from '@/content/content.types';
import { isSourceLink } from '@/content/source.utils';
import type { CiteGroup } from '@/Prose/cite.utils';
import styles from './CiteList.module.css';

type Props = {
  groups: CiteGroup[];
  sources: DocumentSource[];
};

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export default function CiteList(props: Props) {
  return (
    <For each={props.groups}>
      {(group) => (
        <div class={styles.group}>
          <Show when={group.label}>
            <p class={styles.label}>{capitalize(group.label)}</p>
          </Show>
          <ul class={styles.list}>
            <For each={group.items}>
              {(item) => {
                const source = props.sources[item.number - 1];
                return (
                  <li>
                    <span class={styles.number}>[{item.number}] </span>
                    <Show when={source}>
                      {(found) =>
                        isSourceLink(found().url) ? (
                          <a
                            class={styles.link}
                            href={found().url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {found().label}
                          </a>
                        ) : (
                          <>
                            {found().label}
                            <span class={styles.soon}> · enlace pendiente</span>
                          </>
                        )
                      }
                    </Show>
                    <Show when={item.details.length > 0}>
                      <div class={styles.detail}>
                        {item.details
                          .join(', ')
                          .replace(/^princ\. /, 'Principio ')}
                      </div>
                    </Show>
                  </li>
                );
              }}
            </For>
          </ul>
        </div>
      )}
    </For>
  );
}
