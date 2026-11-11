import { Button } from '@colaboradocs/review-ui';
import type { JSX } from 'solid-js';
import ArrowLeftIcon from '@/icons/ArrowLeftIcon';
import { navigate } from '@/router/router';
import UserMenu from '@/UserMenu/UserMenu';
import styles from './PageBar.module.css';

type Props = {
  /** Texto del botón de regreso («Inicio»). */
  backLabel: string;
  /** Enlace de regreso; sin él, el botón llama a `onBack` (p. ej. para preguntar antes de salir). */
  backHref?: string;
  onBack?: () => void;
  /** Nombre del espacio. */
  name: string;
  /** Estado a la derecha, antes del menú de la sesión (p. ej. «Sin conexión»). */
  children?: JSX.Element;
};

/** La barra superior de las páginas de administración y del editor: regreso, nombre del espacio y sesión. */
export default function PageBar(props: Props) {
  return (
    <header class={styles.bar}>
      <div class={styles.inner}>
        <div class={styles.start}>
          <Button
            icon={ArrowLeftIcon}
            size="sm"
            aria-label={props.backLabel}
            title={props.backLabel}
            href={props.backHref}
            onClick={() => {
              const href = props.backHref;
              if (href) navigate(href);
              else props.onBack?.();
            }}
          ></Button>
          <span class={styles.name}>{props.name}</span>
        </div>
        <div class={styles.account}>
          {props.children}
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
