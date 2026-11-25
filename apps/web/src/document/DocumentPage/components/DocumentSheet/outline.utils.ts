export type OutlineItem = {
  level: 1 | 2 | 3;
  text: string;
  /** Id del elemento al que saltar. */
  id: string;
};

/** Índice del documento tal como está en la página: secciones, subtítulos y subtítulos menores. */
export function readOutline(): OutlineItem[] {
  const items: OutlineItem[] = [];
  for (const section of document.querySelectorAll<HTMLElement>(
    '[data-section-id]',
  )) {
    items.push({
      level: 1,
      text: section.dataset.sectionLabel ?? '',
      id: section.id,
    });
    for (const element of section.querySelectorAll<HTMLElement>(
      '[data-outline-level]',
    )) {
      items.push({
        level: element.dataset.outlineLevel === '2' ? 2 : 3,
        text: (element.textContent ?? '').trim(),
        id: element.id,
      });
    }
  }
  return items;
}

export function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView();
}

/** Resalta un momento el término del glosario y su definición. */
export function flashGlossaryTerm(label: string) {
  const term = Array.from(
    document.querySelectorAll<HTMLElement>('[data-glossary-term]'),
  ).find((element) => element.dataset.glossaryTerm === label);
  if (!term) return;
  term.scrollIntoView({ block: 'center' });
  const definition = term.nextElementSibling;
  term.dataset.flash = '';
  if (definition instanceof HTMLElement) definition.dataset.flash = '';
  setTimeout(() => {
    delete term.dataset.flash;
    if (definition instanceof HTMLElement) delete definition.dataset.flash;
  }, 1800);
}
