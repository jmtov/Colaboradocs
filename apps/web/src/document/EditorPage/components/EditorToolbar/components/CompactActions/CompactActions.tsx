import { Button } from '@colaboradocs/review-ui';
import ChevronDownIcon from 'lucide-solid/icons/chevron-down';
import PlusIcon from 'lucide-solid/icons/plus';
import { STYLE_NAMES, STYLE_OPTIONS } from './CompactActions.constants';
import { useCompactActions } from './CompactActions.hooks';
import styles from './CompactActions.module.css';
import type { CompactActionsProps } from './CompactActions.types';

/** En pantallas angostas, el estilo del renglón y lo que se inserta se abren en hojas con nombres. */
export default function CompactActions(props: CompactActionsProps) {
  const actions = useCompactActions(props);
  const styleLabel = () =>
    STYLE_OPTIONS.find((option) => option.id === props.current)?.label;

  return (
    <div class={`${styles.actions} ${props.class ?? ''}`}>
      <Button
        icon={ChevronDownIcon}
        class={styles.picker}
        aria-label={`Estilo del renglón: ${styleLabel()}`}
        aria-haspopup="true"
        disabled={!props.editor}
        keepFocus
        onClick={() => void actions.pickStyle()}
      >
        <span class={styles.name}>{STYLE_NAMES[props.current]}</span>
      </Button>
      <Button
        icon={PlusIcon}
        aria-label="Insertar"
        aria-haspopup="true"
        disabled={!props.editor}
        keepFocus
        onClick={() => void actions.pickInsert()}
      />
    </div>
  );
}
