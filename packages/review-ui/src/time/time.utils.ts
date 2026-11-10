const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const MONTHS = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
];

/** "hace 5 min", "hace 3 h", "ayer"; pasados unos días, la fecha ("4 nov"). */
export function formatRelativeTime(iso: string, now: number): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const elapsed = Math.max(0, now - then);
  if (elapsed < MINUTE) return 'hace un momento';
  if (elapsed < HOUR) return `hace ${Math.floor(elapsed / MINUTE)} min`;
  if (elapsed < DAY) return `hace ${Math.floor(elapsed / HOUR)} h`;
  if (elapsed < 2 * DAY) return 'ayer';
  const date = new Date(then);
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}
