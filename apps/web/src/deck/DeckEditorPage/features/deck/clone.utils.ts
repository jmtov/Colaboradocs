/**
 * Copia profunda de un valor JSON. `structuredClone` no existe en Safari < 15.4; el deck es JSON
 * puro (se guarda como JSON), así que la vuelta por JSON da lo mismo.
 */
export function cloneJson<T>(value: T): T {
  return typeof structuredClone === 'function'
    ? structuredClone(value)
    : (JSON.parse(JSON.stringify(value)) as T);
}
