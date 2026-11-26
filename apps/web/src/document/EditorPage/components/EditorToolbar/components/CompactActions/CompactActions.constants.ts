import Heading1Icon from 'lucide-solid/icons/heading-1';
import Heading2Icon from 'lucide-solid/icons/heading-2';
import Heading3Icon from 'lucide-solid/icons/heading-3';
import ListIcon from 'lucide-solid/icons/list';
import ListOrderedIcon from 'lucide-solid/icons/list-ordered';
import PilcrowIcon from 'lucide-solid/icons/pilcrow';
import SectionIcon from 'lucide-solid/icons/separator-horizontal';
import type { BlockStyle } from '@/document/editor/style.commands';
import type { Option } from '../OptionSheet/OptionSheet.types';

export const STYLE_OPTIONS: Option<BlockStyle>[] = [
  {
    id: 'text',
    label: 'Texto normal',
    description: 'Un párrafo corriente.',
    icon: PilcrowIcon,
  },
  {
    id: 'section',
    label: 'Sección',
    description: 'Este renglón empieza una sección nueva.',
    icon: SectionIcon,
  },
  {
    id: 'group',
    label: 'Título de grupo',
    description: 'Encabeza un grupo de ideas.',
    icon: Heading1Icon,
  },
  {
    id: 'subtitle',
    label: 'Subtítulo',
    description: 'Divide lo que hay dentro de un grupo.',
    icon: Heading2Icon,
  },
  {
    id: 'minor',
    label: 'Título menor',
    description: 'El más pequeño de los títulos.',
    icon: Heading3Icon,
  },
  {
    id: 'bullet',
    label: 'Lista con viñetas',
    description: 'Elementos sin un orden.',
    icon: ListIcon,
  },
  {
    id: 'ordered',
    label: 'Lista numerada',
    description: 'Pasos o elementos en orden.',
    icon: ListOrderedIcon,
  },
];

/** El nombre corto que muestra el botón de estilo, para que quepa en una fila. */
export const STYLE_NAMES: Record<BlockStyle, string> = {
  text: 'Texto',
  section: 'Sección',
  group: 'Título',
  subtitle: 'Subtítulo',
  minor: 'Menor',
  bullet: 'Viñetas',
  ordered: 'Números',
};
