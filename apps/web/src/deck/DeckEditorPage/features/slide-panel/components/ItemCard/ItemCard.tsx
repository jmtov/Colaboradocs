import { Button } from '@colaboradocs/review-ui';
import type { JSX } from 'solid-js';
import ChevronDownIcon from '@/shared/icons/ChevronDownIcon';
import ChevronUpIcon from '@/shared/icons/ChevronUpIcon';
import TrashIcon from '@/shared/icons/TrashIcon';
import styles from './ItemCard.module.css';

interface ItemCardProps {
  name: string;
  index: number;
  count: number;
  canRemove?: boolean;
  onMove: (to: number) => void;
  onRemove: () => void;
  children: JSX.Element;
}

/** Un elemento de una lista o un bloque: su nombre, subirlo, bajarlo, quitarlo, y sus campos debajo. */
export default function ItemCard(props: ItemCardProps) {
  return (
    <details class={styles.item} open>
      <summary class={styles.bar}>
        <span class={styles.name}>{props.name}</span>
        {/* Dentro de un <summary>: parar el clic evita que el botón pliegue o despliegue la tarjeta. */}
        {/* biome-ignore lint/a11y/noStaticElementInteractions: solo detiene el clic de los botones de adentro */}
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: los botones de adentro tienen el teclado */}
        <span
          class={styles.actions}
          onClick={(event) => event.preventDefault()}
        >
          <Button
            icon={ChevronUpIcon}
            size="sm"
            disabled={props.index === 0}
            title="Subir"
            aria-label="Subir"
            onClick={() => props.onMove(props.index - 1)}
          />
          <Button
            icon={ChevronDownIcon}
            size="sm"
            disabled={props.index === props.count - 1}
            title="Bajar"
            aria-label="Bajar"
            onClick={() => props.onMove(props.index + 1)}
          />
          <Button
            icon={TrashIcon}
            size="sm"
            variant="danger"
            disabled={props.canRemove === false}
            title="Quitar"
            aria-label="Quitar"
            onClick={props.onRemove}
          />
        </span>
      </summary>
      <div class={styles.body}>{props.children}</div>
    </details>
  );
}
