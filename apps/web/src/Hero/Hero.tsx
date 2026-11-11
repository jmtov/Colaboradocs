import { Button } from '@colaboradocs/review-ui';
import { Show } from 'solid-js';
import ArrowDownIcon from '@/icons/ArrowDownIcon';
import ListChecksIcon from '@/icons/ListChecksIcon';
import styles from './Hero.module.css';

type Props = {
  title: string;
  version: string;
  firstSectionId: string;
  eyebrow?: string;
  lead?: string;
  highlight?: { id: string; label: string };
  onGo: (sectionId: string) => void;
};

export default function Hero(props: Props) {
  return (
    <section class={styles.hero}>
      <div class={styles.main}>
        <span class={styles.eyebrow}>
          {(props.eyebrow ?? 'Borrador · versión {version}').replace(
            '{version}',
            props.version,
          )}
        </span>
        <h1 class={styles.title}>{props.title}</h1>
        <Show when={props.lead}>
          <p class={styles.lead}>{props.lead}</p>
        </Show>
        <div class={styles.actions}>
          <Button
            icon={ArrowDownIcon}
            variant="primary"
            onClick={() => props.onGo(props.firstSectionId)}
          >
            Leer el documento
          </Button>
          <Show when={props.highlight}>
            {(highlight) => (
              <Button
                icon={ListChecksIcon}
                onClick={() => props.onGo(highlight().id)}
              >
                {highlight().label}
              </Button>
            )}
          </Show>
        </div>
      </div>
    </section>
  );
}
