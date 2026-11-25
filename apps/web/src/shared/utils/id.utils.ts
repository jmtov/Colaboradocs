const ID_MAX_LENGTH = 64;

/** Un id para la URL a partir del título: minúsculas, sin tildes, con guiones, hasta 64 caracteres. */
export function idFromTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, ID_MAX_LENGTH)
    .replace(/-+$/g, '');
}

/** Un id válido: solo minúsculas, números y guiones, de 1 a 64 caracteres. */
export function isValidId(id: string): boolean {
  return /^[a-z0-9-]{1,64}$/.test(id);
}
