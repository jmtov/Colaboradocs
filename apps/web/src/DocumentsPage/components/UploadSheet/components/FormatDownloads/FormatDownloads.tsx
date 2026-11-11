import ArrowDownToLineIcon from '@/icons/ArrowDownToLineIcon';
import { useFormatDownloads } from './FormatDownloads.hooks';
import styles from './FormatDownloads.module.css';

/**
 * Para quien no tiene su documento en un formato que la página lea: dos
 * archivos para llevarle a Claude (u otro asistente) y pedirle la conversión.
 */
export default function FormatDownloads() {
  const downloads = useFormatDownloads();

  return (
    <div class={styles.box}>
      <p class={styles.text}>
        <strong>¿Tu documento está en otro formato?</strong> Descarga la guía,
        adjúntala a una conversación con Claude junto con tu documento y pídele
        que lo convierta. Luego sube aquí el JSON que te dé.
      </p>
      <div class={styles.actions}>
        <button
          type="button"
          class={styles.button}
          onClick={() => void downloads.downloadGuide()}
        >
          <ArrowDownToLineIcon class={styles.icon} />
          Guía para Claude (.md)
        </button>
        <button
          type="button"
          class={styles.button}
          onClick={() => void downloads.downloadExample()}
        >
          <ArrowDownToLineIcon class={styles.icon} />
          Ejemplo (.json)
        </button>
      </div>
    </div>
  );
}
