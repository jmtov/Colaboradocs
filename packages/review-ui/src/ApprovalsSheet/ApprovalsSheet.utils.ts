const formatter = new Intl.DateTimeFormat('es', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

/** «10 nov 2026, 19:42»; vacío si la fecha no sirve. */
export function formatApprovalTime(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '' : formatter.format(date);
}
