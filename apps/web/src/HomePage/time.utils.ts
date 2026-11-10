const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['day', 86_400_000],
  ['hour', 3_600_000],
  ['minute', 60_000],
];

/** «hace 3 horas», «ayer»… Con menos de un minuto: «justo ahora». */
export function timeAgo(iso: string, now: number = Date.now()): string {
  const elapsed = now - new Date(iso).getTime();
  if (Number.isNaN(elapsed)) return '';
  const formatter = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });
  for (const [unit, size] of UNITS) {
    if (Math.abs(elapsed) >= size) {
      return formatter.format(-Math.round(elapsed / size), unit);
    }
  }
  return 'justo ahora';
}
