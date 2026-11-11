import {
  BottomSheet,
  Button,
  type SheetLayerProps,
} from '@colaboradocs/review-ui';
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
          <Button icon={BookOpenIcon} onClick={sheet.openGlossaryTerm}>
            Ver en el glosario
          </Button>
        </Match>
        <Match when={sheet.kind() === 'cite'}>
          <CiteList
            groups={sheet.cite()?.groups ?? []}
            sources={props.content.sources}
          />
          <Button icon={ArrowDownToLineIcon} onClick={sheet.openSources}>
            Ver en el pie de página
          </Button>
        </Match>
        <Match when={sheet.section()}>
          {(found) => (
            <>
              <Prose section={found()} reviewable={false} />
              <Button
                icon={ArrowRightIcon}
                onClick={() => sheet.goToSection(found().id)}
              >
                Ir a la sección
              </Button>
            </>
          )}
        </Match>
      </Switch>
    </BottomSheet>
  );
}
