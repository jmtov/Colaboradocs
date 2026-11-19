/** Suma a una persona: cómo se escribe en el texto (sin importar mayúsculas) -> su nombre registrado. */
export function addPerson(
  terms: Record<string, string>,
  text: string,
  name: string,
): Record<string, string> {
  const key = text.trim().toLowerCase();
  if (!key || terms[key] === name) return terms;
  return { ...terms, [key]: name };
}

/** Las mismas personas, sin importar el orden. */
export function samePeople(
  a: Record<string, string>,
  b: Record<string, string>,
): boolean {
  const keys = Object.keys(a);
  return (
    keys.length === Object.keys(b).length && keys.every((k) => a[k] === b[k])
  );
}

/** Quita a una persona (por cómo se escribe); el texto no cambia, solo deja de ser una mención. */
export function withoutPerson(
  terms: Record<string, string>,
  key: string,
): Record<string, string> {
  if (!(key in terms)) return terms;
  const { [key]: _removed, ...rest } = terms;
  return rest;
}
