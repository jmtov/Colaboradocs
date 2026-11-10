import { For, type JSX } from 'solid-js';
import type { DocumentSource } from '@/content/content.types';
import { isSourceLink } from '@/content/source.utils';
import ThemeSwitch from '@/ThemeSwitch/ThemeSwitch';
import styles from './SourcesFooter.module.css';

type Props = {
  title: string;
  version: string;
  updated: string;
  sources: DocumentSource[];
};

export default function SourcesFooter(props: Props): JSX.Element {
  return (
    <footer class={styles.footer}>
      <div>
        <span class={styles.eyebrow}>Documento</span>
        <b class={styles.strong}>{props.title}</b>
        <br />
        Versión {props.version}, actualizada el {props.updated}.
      </div>
      <div id="fuentes" data-sources>
        <span class={styles.eyebrow}>Fuentes</span>
        <ul class={styles.sources}>
          <For each={props.sources}>
            {(source, index) => (
              <li class={styles.source}>
                <span class={styles.sourceNumber}>[{index() + 1}]</span>
                <span>
                  {isSourceLink(source.url) ? (
                    <a
                      class={styles.link}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {source.label}
                    </a>
                  ) : (
                    <>
                      {source.label}{' '}
                      <span class={styles.soon}>· enlace pendiente</span>
                    </>
                  )}
                </span>
              </li>
            )}
          </For>
        </ul>
        <p class={styles.note}>
          Los números entre corchetes del texto remiten a esta lista.
        </p>
      </div>
      <div>
        <span class={styles.eyebrow}>Tema</span>
        <ThemeSwitch />
      </div>
    </footer>
  );
}
