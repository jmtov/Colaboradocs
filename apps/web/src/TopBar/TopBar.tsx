import { useReview } from '@juntanza/review-ui';
import { Show } from 'solid-js';
import ChevronDownIcon from '@/icons/ChevronDownIcon';
import PrinterIcon from '@/icons/PrinterIcon';
import Link from '@/router/Link';
import UserMenu from '@/UserMenu/UserMenu';
import styles from './TopBar.module.css';

type Props = {
  documentName: string;
  /** Enlace de regreso a la home de documentos. */
  showBack?: boolean;
  /** Sección que se está leyendo, o "Inicio". */
  currentLabel: string;
  /** Título de grupo (h3) que se está leyendo dentro de la sección, si hay. */
  currentHeading: string;
  onOpenContents: () => void;
  /** Imprimir el documento o guardarlo como PDF. */
  onPrint: () => void;
};

export default function TopBar(props: Props) {
  const review = useReview();

  const statusText = () => {
    switch (review.status()) {
      case 'loading':
        return 'Cargando revisión…';
      case 'error':
        return 'Sin conexión';
      default:
        return '';
    }
  };

  return (
    <header class={styles.top}>
      <div class={styles.inner}>
        <Show when={props.showBack}>
          <Link href="/" class={styles.back} lift>
            ← Documentos
          </Link>
        </Show>
        <button
          type="button"
          class={styles.contents}
          data-flat
          aria-haspopup="dialog"
          title="Ver el contenido del documento"
          onClick={props.onOpenContents}
        >
          <span class={styles.prefix}>{props.documentName} /</span>
          <span class={styles.current}>{props.currentLabel}</span>
          <Show when={props.currentHeading}>
            <span class={styles.separator} aria-hidden="true">
              /
            </span>
            <span class={styles.heading}>{props.currentHeading}</span>
          </Show>
          <ChevronDownIcon class={`${styles.icon} ${styles.chevron}`} />
        </button>
        <div class={styles.account}>
          <Show when={statusText()}>
            <span role="status">{statusText()}</span>
          </Show>
          <button
            type="button"
            class={styles.print}
            aria-label="Imprimir o guardar como PDF"
            title="Imprimir o guardar como PDF"
            onClick={props.onPrint}
          >
            <PrinterIcon class={styles.icon} />
          </button>
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
