import styles from './WarningDot.module.css';

interface WarningDotProps {
  /** Los problemas que avisa: salen al pasar el cursor. */
  messages: string[];
}

/** Un punto de aviso: algo de esto (una slide, un bloque) tiene problemas. */
export default function WarningDot(props: WarningDotProps) {
  return (
    <span
      class={styles.dot}
      role="img"
      aria-label="Tiene problemas"
      title={props.messages.join('\n')}
    />
  );
}
