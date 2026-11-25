import PlusIcon from 'lucide-solid/icons/plus';
import styles from './AddCard.module.css';

type Props = {
  label: string;
  hint: string;
  onClick: () => void;
};

/** La celda «Subir documento» / «Nueva presentación»: una más de la grilla. */
export default function AddCard(props: Props) {
  return (
    <li class={styles.item}>
      <button type="button" class={styles.add} onClick={props.onClick}>
        <PlusIcon class={styles.icon} />
        <span class={styles.label}>{props.label}</span>
        <span class={styles.hint}>{props.hint}</span>
      </button>
    </li>
  );
}
