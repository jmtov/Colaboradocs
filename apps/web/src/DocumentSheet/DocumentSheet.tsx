import { BottomSheet, type SheetLayerProps } from '@colaboradocs/review-ui';
import { Match, Switch } from 'solid-js';
import type { DocumentContent } from '@/content/content.types';
import ArrowDownToLineIcon from '@/icons/ArrowDownToLineIcon';
import ArrowRightIcon from '@/icons/ArrowRightIcon';
import BookOpenIcon from '@/icons/BookOpenIcon';
import Prose from '@/Prose/Prose';
import CiteList from './components/CiteList/CiteList';
import OutlineList from './components/OutlineList/OutlineList';
import { useDocumentSheet } from './DocumentSheet.hooks';
import styles from './DocumentSheet.module.css';
import type { SheetState } from './sheet.types';

type Props = SheetLayerProps & {
  state: SheetState;
  content: DocumentContent;
  glossary: Map<string, string>;
};

/** Hoja inferior del documento: índice, glosario, fuentes o una sección vecina. */
export default function DocumentSheet(props: Props) {
  const sheet = useDocumentSheet({
    state: () => props.state,
    content: () => props.content,
    glossary: () => props.glossary,
    close: () => props.close(),
  });

  return (
    <BottomSheet
      open={props.open}
      kicker={sheet.kicker()}
      title={sheet.title()}
      onClose={props.onClose}
    >
      <Switch>
        <Match when={sheet.kind() === 'contents'}>
          <OutlineList onPick={sheet.pickOutlineItem} />
        </Match>
        <Match when={sheet.kind() === 'term'}>
          <p class={styles.text}>{sheet.termText()}</p>
          <button
            type="button"
            class={styles.action}
            onClick={sheet.openGlossaryTerm}
          >
            <BookOpenIcon class={styles.icon} />
            Ver en el glosario
          </button>
        </Match>
        <Match when={sheet.kind() === 'cite'}>
          <CiteList
            groups={sheet.cite()?.groups ?? []}
            sources={props.content.sources}
          />
          <button
            type="button"
            class={styles.action}
            onClick={sheet.openSources}
          >
            <ArrowDownToLineIcon class={styles.icon} />
            Ver en el pie de página
          </button>
        </Match>
        <Match when={sheet.section()}>
          {(found) => (
            <>
              <Prose section={found()} reviewable={false} />
              <button
                type="button"
                class={styles.action}
                onClick={() => sheet.goToSection(found().id)}
              >
                <ArrowRightIcon class={styles.icon} />
                Ir a la sección
              </button>
            </>
          )}
        </Match>
      </Switch>
    </BottomSheet>
  );
}
