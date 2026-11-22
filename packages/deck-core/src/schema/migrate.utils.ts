type Obj = Record<string, unknown>;

const isObj = (value: unknown): value is Obj =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const MAX_PER_COLUMN = 3;

/**
 * El reparto «de arriba a abajo» que tenían las slides con `flow: 'column'`, escrito como posiciones
 * explícitas (`col`, `row`): cada bloque va a la primera columna con espacio, desde la del anterior,
 * o a una columna nueva si traía `newColumn`.
 */
function pinLegacyColumns(slide: Obj, body: Obj[]): void {
  const columns = typeof slide.columns === 'number' ? slide.columns : 1;
  const hasHeader = Boolean(
    (Array.isArray(slide.title) && slide.title.length) || slide.subtitle,
  );
  const headerSpan = Math.min(
    typeof slide.headerSpan === 'number' ? slide.headerSpan : columns,
    columns,
  );
  const filled = Array.from({ length: columns }, () => 0);
  const count = Array.from({ length: columns }, () => 0);
  if (hasHeader) for (let c = 0; c < headerSpan; c++) filled[c] = 1;
  let from = 0;
  let last: { col: number; span: number } | undefined;
  for (const block of body) {
    const span = 1;
    const start =
      block.newColumn === true && last
        ? Math.min(last.col + last.span, columns - span)
        : from;
    const fit = Array.from(
      { length: Math.max(columns - span - start + 1, 0) },
      (_, c) => start + c,
    ).find((c) => (count[c] ?? 0) < MAX_PER_COLUMN);
    const col = fit ?? 0;
    from = col;
    const row = (filled[col] ?? 0) + 1;
    filled[col] = row;
    count[col] = (count[col] ?? 0) + 1;
    block.col = col + 1;
    block.row = row;
    delete block.newColumn;
    last = { col, span };
  }
}

/** Primer paso: de los tipos anteriores (`cover`, `section`, `stack`, `split`, `grid`) a la slide de contenido. */
function migrateLayout(raw: Obj): Obj {
  const kind = raw.kind;
  if (kind === 'custom') return raw; // lo resuelve `migrateSlide`
  if (kind === 'content') {
    // el flujo (`flow`) se sustituyó por posiciones explícitas
    if (!('flow' in raw)) return raw;
    const { flow, ...slide } = raw;
    if (flow === 'column' && Array.isArray(slide.body))
      pinLegacyColumns(slide, slide.body as Obj[]);
    return slide;
  }
  const { start, end, items, footer, body, lede, figure, columns, ...rest } =
    raw;
  const slide: Obj = { ...rest, kind: 'content' };
  let blocks: Obj[] = [];
  // el primer `lede` pasa a ser el subtítulo; los demás, notas
  const list = (value: unknown): Obj[] =>
    (Array.isArray(value) ? (value as Obj[]) : []).flatMap((block) => {
      if (block.kind !== 'lede' || typeof block.text !== 'string')
        return [block];
      if (slide.subtitle === undefined) {
        slide.subtitle = block.text;
        return [];
      }
      return [{ kind: 'note', text: block.text }];
    });
  switch (kind) {
    case 'cover':
      slide.titleSize = rest.titleSize ?? 'xl';
      if (typeof lede === 'string') slide.subtitle = lede;
      blocks = list(body);
      break;
    case 'section':
      slide.titleSize = rest.titleSize ?? 'xl';
      if (typeof figure === 'string') {
        const eyebrow = isObj(rest.eyebrow) ? rest.eyebrow : {};
        slide.eyebrow = { ...eyebrow, index: figure };
      }
      break;
    case 'stack':
      blocks = list(body);
      break;
    case 'split': {
      // título a la izquierda con lo suyo debajo; lo de la derecha ocupa la otra columna
      slide.columns = 2;
      slide.headerSpan = 1;
      const left = list(start);
      const right = list(end);
      const rows = Math.min(Math.max(left.length + 1, right.length), 4);
      slide.rows = rows;
      blocks = [
        ...left.map((block, i) => ({ ...block, col: 1, row: i + 2 })),
        ...right.map((block, i) => ({
          ...block,
          col: 2,
          row: i + 1,
          ...(i === right.length - 1 ? { rowSpan: Math.max(rows - i, 1) } : {}),
        })),
      ];
      break;
    }
    case 'grid':
      slide.columns = columns;
      blocks = [...list(items), ...list(footer)];
      break;
    default:
      return raw;
  }
  slide.body = blocks;
  return slide;
}

/** Un componente registrado que era una slide pasa a ser un bloque `custom` dentro de una slide de contenido. */
function customToBlock(raw: Obj): Obj {
  if (raw.kind !== 'custom') return raw;
  const { component, props, ...rest } = raw;
  const block: Obj = { kind: 'custom', component };
  if (props !== undefined) block.props = props;
  return { ...rest, kind: 'content', body: [block] };
}

/**
 * Último paso: el título, el subtítulo y su tamaño (campos de la slide) pasan a ser un bloque
 * `heading`, en la esquina de arriba a la izquierda como estaba el encabezado.
 */
function titleToHeading(raw: Obj): Obj {
  const { title, titleSize, subtitle, headerSpan, ...slide } = raw;
  const hasTitle = Array.isArray(title) && title.length > 0;
  if (!hasTitle && !subtitle) return slide;
  const heading: Obj = { kind: 'heading', title: hasTitle ? title : [] };
  if (titleSize !== undefined) heading.titleSize = titleSize;
  if (subtitle !== undefined) heading.subtitle = subtitle;
  heading.col = 1;
  heading.row = 1;
  if (typeof headerSpan === 'number') heading.span = headerSpan;
  const body = Array.isArray(slide.body) ? (slide.body as Obj[]) : [];
  return { ...slide, body: [heading, ...body] };
}

/** De cualquier forma anterior de una slide a la actual: contenido con bloques, el título incluido. Si ya está al día, no cambia. */
export function migrateSlide(raw: Obj): Obj {
  const content = migrateLayout(customToBlock(raw));
  if (!('title' in content || 'subtitle' in content || 'headerSpan' in content))
    return content;
  return titleToHeading(content);
}
