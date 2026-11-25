import type { DocumentKind } from '@colaboradocs/review-core';
import { BottomSheet, Button } from '@colaboradocs/review-ui';
import CheckIcon from 'lucide-solid/icons/check';
import CloseIcon from 'lucide-solid/icons/x';
import ChoiceGroup from '@/home/HomePage/components/ChoiceGroup/ChoiceGroup';
import { useFiltersSheet } from './FiltersSheet.hooks';
import styles from './FiltersSheet.module.css';
import type { FiltersSheetProps } from './FiltersSheet.types';

/** Filtros de la lista de documentos. Resuelve con lo elegido, o sin resultado si se cierra sin aplicar. */
export default function FiltersSheet(props: FiltersSheetProps) {
  const sheet = useFiltersSheet(props);
  const total = () => props.kinds.reduce((sum, entry) => sum + entry.count, 0);

  return (
    <BottomSheet
      open={props.open}
      kicker="Documentos"
      title="Filtros"
      compact
      onClose={props.onClose}
    >
      <div class={styles.content}>
        <ChoiceGroup
          label="Tipo de documento"
          options={props.kinds.map((entry) => ({
            value: entry.kind,
            label: entry.title,
            count: entry.count,
          }))}
          selected={sheet.kind()}
          onChange={(selected) =>
            sheet.setKind(selected as DocumentKind | null)
          }
          allLabel="Todos"
          allCount={total()}
        />
        <div class={styles.row}>
          <Button icon={CloseIcon} onClick={sheet.clear}>
            Quitar filtros
          </Button>
          <Button icon={CheckIcon} variant="primary" onClick={sheet.apply}>
            Aplicar
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
