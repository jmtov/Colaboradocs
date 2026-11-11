/** `1234567` -> «1,2 MB». Con coma decimal, como se lee en español. */
export function formatSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const text = value >= 10 ? Math.round(value).toString() : value.toFixed(1);
  return `${text.replace('.', ',')} ${units[unit]}`;
}
