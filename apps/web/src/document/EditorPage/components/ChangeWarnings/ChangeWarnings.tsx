import { Show } from 'solid-js';
import type { AffectedBlock } from '../../affected.utils';
import styles from './ChangeWarnings.module.css';

type Props = {
  /** Bloques con comentarios u OK que ya no existirían tal cual si se publicara ahora. */
  affected: AffectedBlock[];
  /** Secciones que cambian de número, si algún texto remite a «sección N». */
  renumbered: string[];
};

const plural = (n: number, one: string, many: string) =>
  `${n} ${n === 1 ? one : many}`;

/** Avisa, sin bloquear, de lo que estos cambios dejarían atrás. Ctrl+Z los deshace. */
export default function ChangeWarnings(props: Props) {
  const comments = () =>
    props.affected.reduce((sum, block) => sum + block.comments, 0);
  const approvals = () =>
    props.affected.reduce((sum, block) => sum + block.approvals, 0);

  return (
    <>
      <Show when={props.affected.length > 0}>
        <p class={styles.warn} role="status">
          Con estos cambios,{' '}
          {plural(props.affected.length, 'bloque', 'bloques')} pierden{' '}
          {plural(comments(), 'comentario', 'comentarios')} y{' '}
          {plural(approvals(), 'OK', 'OK')}. Deshacer (Ctrl+Z) los recupera.
        </p>
      </Show>
      <Show when={props.renumbered.length > 0}>
        <p class={styles.warn} role="status">
          Cambia el número de {props.renumbered.join(', ')}. Los textos que
          dicen «sección N» siguen apuntando al número de antes: revísalos.
        </p>
      </Show>
    </>
  );
}
