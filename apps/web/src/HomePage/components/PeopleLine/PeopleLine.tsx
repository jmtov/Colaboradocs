import { summarizePeople } from '@colaboradocs/review-core';
import styles from './PeopleLine.module.css';

/** «Participantes: Ana, Luis, Eva y 4 más»: tres nombres como mucho, para que la tarjeta no crezca. */
export default function PeopleLine(props: { label: string; people: string }) {
  const summary = () => summarizePeople(props.people);
  const text = () => {
    const { shown, more } = summary();
    return more > 0 ? `${shown.join(', ')} y ${more} más` : shown.join(', ');
  };

  return (
    <span class={styles.people} title={props.people}>
      {props.label}: {text()}
    </span>
  );
}
