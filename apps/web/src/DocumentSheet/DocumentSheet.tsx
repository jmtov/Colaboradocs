import { BottomSheet } from '@juntanza/review-ui';
import { createMemo, Match, Switch } from 'solid-js';
import type { DocumentContent } from '@/content/content.types';
import { sectionKicker } from '@/content/content.utils';
import ArrowDownToLineIcon from '@/icons/ArrowDownToLineIcon';
import ArrowRightIcon from '@/icons/ArrowRightIcon';
import BookOpenIcon from '@/icons/BookOpenIcon';
import { citeKey, parseCite } from '@/Prose/cite.utils';
import Prose from '@/Prose/Prose';
import CiteList from './CiteList';
import styles from './DocumentSheet.module.css';
import OutlineList from './OutlineList';
import { flashGlossaryTerm, scrollToId } from './outline.utils';
import type { SheetState } from './sheet.types';

type Props = {
  sheet: SheetState;
  content: DocumentContent;
  glossary: Map<string, string>;
  onClose: () => void;
};

/** Hoja inferior del documento: índice, glosario, fuentes o una sección vecina. */
export default function DocumentSheet(props: Props) {
  const section = createMemo(() => {
    const sheet = props.sheet;
    if (sheet.kind !== 'section') return null;
    return (
      props.content.sections.find((item) => item.num === sheet.sectionNumber) ??
      null
    );
  });
  const cite = createMemo(() => {
    const sheet = props.sheet;
    if (sheet.kind !== 'cite') return null;
    return {
      key: citeKey(sheet.text),
      groups: parseCite(sheet.text, props.content.sources.length),
    };
  });

  const kicker = () => {
    const sheet = props.sheet;
    switch (sheet.kind) {
      case 'contents':
        return 'Documento';
      case 'term':
        return 'Glosario';
      case 'cite':
        return (cite()?.groups.length ?? 0) > 0 ? 'Fuentes' : 'Nota';
      case 'section': {
        const found = section();
        return found ? sectionKicker(found) : '';
      }
      default:
        return '';
    }
  };
  const title = () => {
    const sheet = props.sheet;
    switch (sheet.kind) {
      case 'contents':
        return 'Contenido';
      case 'term':
        return sheet.label;
      case 'cite':
        return `Nota [${cite()?.key ?? ''}]`;
      case 'section':
        return section()?.title ?? '';
      default:
        return '';
    }
  };

  function closeThen(action: () => void) {
    props.onClose();
    action();
  }

  return (
    <BottomSheet
      open={props.sheet.kind !== 'none'}
      kicker={kicker()}
      title={title()}
      onClose={props.onClose}
    >
      <Switch>
        <Match when={props.sheet.kind === 'contents'}>
          <OutlineList onPick={(id) => closeThen(() => scrollToId(id))} />
        </Match>
        <Match when={props.sheet.kind === 'term'}>
          <p class={styles.text}>
            {props.sheet.kind === 'term'
              ? (props.glossary.get(props.sheet.label) ?? '')
              : ''}
          </p>
          <button
            type="button"
            class={styles.action}
            onClick={() => {
              const sheet = props.sheet;
              if (sheet.kind === 'term') {
                closeThen(() => flashGlossaryTerm(sheet.label));
              }
            }}
          >
            <BookOpenIcon class={styles.icon} />
            Ver en el glosario
          </button>
        </Match>
        <Match when={props.sheet.kind === 'cite'}>
          <CiteList
            groups={cite()?.groups ?? []}
            sources={props.content.sources}
          />
          <button
            type="button"
            class={styles.action}
            onClick={() => closeThen(() => scrollToId('fuentes'))}
          >
            <ArrowDownToLineIcon class={styles.icon} />
            Ver en el pie de página
          </button>
        </Match>
        <Match when={section()}>
          {(found) => (
            <>
              <Prose section={found()} reviewable={false} />
              <button
                type="button"
                class={styles.action}
                onClick={() => closeThen(() => scrollToId(`sec-${found().id}`))}
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
