import type {
  AgendaItem,
  Block,
  Person,
  TitleSize,
} from '@colaboradocs/deck-core';
import { cx, el, esc } from '../html.utils';
import { icon } from '../icons.utils';
import type { SlideContext } from '../render.types';
import type { Strings } from '../strings.constants';

/** Atributos de entrada escalonada (`data-r`, `--i`) para el siguiente elemento de la slide. */
export function reveal(
  ctx: SlideContext,
  extraStyle = '',
): Record<string, string | boolean> {
  const style = `--i:${ctx.reveal()};${extraStyle ? ` ${extraStyle}` : ''}`;
  return { 'data-r': true, style };
}

const categoryStyle = (category: number | undefined) =>
  category === undefined ? '' : `--c:var(--cat-${category + 1});`;

function personHtml(person: Person): string {
  const role = person.role
    ? `<span class="mono">${esc(person.role)}</span>`
    : '';
  return `<span class="p"><b>${esc(person.name)}</b>${role}</span>`;
}

function agendaRow(
  item: AgendaItem,
  isLast: boolean,
  strings: Strings,
): string {
  const highlighted = item.type === 'highlight';
  const detail = item.detail ? `<small>${esc(item.detail)}</small>` : '';
  const speaker = item.speaker
    ? [item.speaker.name, item.speaker.role].filter(Boolean).join(' · ')
    : '';
  const meta = [
    item.mode ? strings.modes[item.mode] : '',
    item.minutes ? `${item.minutes} min` : '',
    speaker,
  ]
    .filter(Boolean)
    .join(' · ');
  const metaHtml = meta ? `<small>${esc(meta)}</small>` : '';
  const iconHtml = item.icon ? icon(item.icon) : '';
  const cls = cx(
    highlighted && 'highlight',
    highlighted && isLast && 'last-highlight',
    item.icon && 'has-icon',
  );
  return `<li${cls ? ` class="${cls}"` : ''}><span class="h">${esc(item.time ?? '')}</span><span>${esc(item.title)}${detail}${metaHtml}</span>${iconHtml}</li>`;
}

type Renderers = {
  [K in Block['kind']]: (
    block: Extract<Block, { kind: K }>,
    ctx: SlideContext,
  ) => string;
};

function titleHtml(lines: string[], size: TitleSize): string {
  if (!lines.length) return '';
  const tag = size === 'sm' ? 'h2' : 'h1';
  const spans = lines
    .map(
      (line, i) =>
        `<span class="mask"${i ? ` style="--i:${i}"` : ''}><span>${esc(line)}</span></span>`,
    )
    .join('');
  return `<${tag} class="title t-${size}">${spans}</${tag}>`;
}

const RENDERERS: Renderers = {
  heading: (b, ctx) => {
    const subtitle = b.subtitle
      ? el(
          'p',
          { class: 'lede', 'data-r': true, style: `--i:${ctx.reveal()}` },
          esc(b.subtitle),
        )
      : '';
    const badge = b.icon
      ? el(
          'span',
          { class: 'badge heading-badge', 'data-r': true },
          icon(b.icon),
        )
      : '';
    return `${badge}${titleHtml(b.title, b.titleSize ?? 'sm')}<div class="rule"></div>${subtitle}`;
  },
  note: (b, ctx) => el('p', { class: 'note', ...reveal(ctx) }, esc(b.text)),
  list: (b, ctx) => {
    const items = b.items
      .map((item, i) => {
        const lead = item.icon
          ? `<span class="li-icon">${icon(item.icon)}</span>`
          : '';
        const detail = item.detail ? `<small>${esc(item.detail)}</small>` : '';
        const attributes = {
          class: item.icon ? 'has-icon' : undefined,
          'data-n': b.ordered ? String(i + 1).padStart(2, '0') : '•',
          ...reveal(ctx),
        };
        return el(
          'li',
          attributes,
          `${lead}<span>${esc(item.text)}${detail}</span>`,
        );
      })
      .join('');
    return el('ul', { class: cx('list', b.size === 'md' && 'size-md') }, items);
  },
  card: (b, ctx) => {
    const hasCategory = b.category !== undefined;
    const badge = b.icon ? el('span', { class: 'badge' }, icon(b.icon)) : '';
    const kicker = b.kicker ? `<span class="k">${esc(b.kicker)}</span>` : '';
    const top =
      kicker || badge ? `<div class="top">${kicker}${badge}</div>` : '';
    const text = b.text ? `<p>${esc(b.text)}</p>` : '';
    const people = b.people?.length
      ? `<div class="people">${b.people.map(personHtml).join('')}</div>`
      : '';
    const sources = b.sources?.length
      ? `<ul class="srcs">${b.sources.map((s) => `<li>${s.label ? `<b>${esc(s.label)}</b>` : ''}${esc(s.text)}</li>`).join('')}</ul>`
      : '';
    const footer = b.footer ? `<div class="who">${esc(b.footer)}</div>` : '';
    const cls = cx(
      'card',
      hasCategory && 'has-category',
      b.tone && b.tone !== 'default' && `tone-${b.tone}`,
    );
    return el(
      'div',
      { class: cls, ...reveal(ctx, categoryStyle(b.category)) },
      `${top}<h3>${esc(b.title)}</h3>${text}${people}${sources}${footer}`,
    );
  },
  person: (b, ctx) => {
    const role = b.person.role
      ? `<span class="role">${esc(b.person.role)}</span>`
      : '';
    return el(
      'div',
      { class: 'person', ...reveal(ctx) },
      `<span class="name">${esc(b.person.name)}</span>${role}`,
    );
  },
  figure: (b, ctx) => {
    const unit = b.unit ? `<small>${esc(b.unit)}</small>` : '';
    const caption = b.caption
      ? `<p class="figure-caption">${esc(b.caption)}</p>`
      : '';
    const width = (
      String(b.value).length * 0.62 +
      String(b.unit ?? '').length * 0.15 +
      0.2
    ).toFixed(2);
    return el(
      'div',
      { class: 'figure-wrap', ...reveal(ctx, `--fig-em:${width};`) },
      `<div class="figure">${esc(b.value)}${unit}</div>${caption}`,
    );
  },
  image: (b, ctx) => {
    const style = b.ratio ? `--ratio:${b.ratio};` : '';
    const reveals = reveal(ctx, style);
    return el(
      'figure',
      { class: cx('frame', !b.framed && 'plain'), ...reveals },
      el('img', { src: b.src, alt: b.alt, loading: 'lazy' }),
    );
  },
  qr: (b, ctx) =>
    el(
      'div',
      { class: 'qrcol', 'data-r': 'scale', style: `--i:${ctx.reveal()}` },
      `<div class="qrbox">${el('img', { src: b.src, alt: b.alt })}</div><span class="qrlink">${esc(b.link)}</span>`,
    ),
  countdown: (b, ctx) =>
    el('p', {
      class: 'countdown',
      ...reveal(ctx),
      'data-target': b.target,
      'data-label': b.label,
      hidden: true,
    }),
  notice: (b, ctx) =>
    el(
      'div',
      { class: 'notice', ...reveal(ctx) },
      `${b.icon ? icon(b.icon) : ''}<span>${esc(b.text)}</span>`,
    ),
  agenda: (b, ctx) => {
    const columns = b.columns ?? 1;
    const cut =
      columns === 2
        ? (b.split ?? Math.ceil(b.items.length / 2))
        : b.items.length;
    const groups =
      columns === 2 ? [b.items.slice(0, cut), b.items.slice(cut)] : [b.items];
    const lists = groups
      .map(
        (group) =>
          `<ol>${group.map((item, i) => agendaRowRevealed(item, i === group.length - 1, ctx)).join('')}</ol>`,
      )
      .join('');
    return el('div', { class: `agenda cols-${columns}` }, lists);
  },
  timeline: (b, ctx) => {
    const events = b.events
      .map((e) =>
        el(
          'div',
          { class: cx('event', e.hollow && 'hollow'), ...reveal(ctx) },
          `<div class="d">${esc(e.date)}</div><div class="w"><b>${esc(e.title)}</b>${e.detail ? esc(e.detail) : ''}</div>`,
        ),
      )
      .join('');
    return el('div', { class: 'timeline' }, events);
  },
  'date-box': (b, ctx) =>
    el(
      'div',
      { class: 'datebox', ...reveal(ctx) },
      `<span class="d">${esc(b.day)}</span><span class="m">${esc(b.month)}</span>`,
    ),
  chips: (b, ctx) =>
    el(
      'div',
      { class: 'chips', ...reveal(ctx) },
      b.items
        .map(
          (c) =>
            `<span class="${cx('chip', c.variant === 'solid' && 'solid', c.variant === 'dashed' && 'dashed')}">${esc(c.text)}</span>`,
        )
        .join(''),
    ),
  custom: (b, ctx) => {
    const component = ctx.registry.components[b.component];
    if (!component)
      throw new Error(`Componente no registrado: «${b.component}».`);
    return component(b.props ?? {}, ctx);
  },
};

/** Una fila de agenda con su orden de entrada. */
function agendaRowRevealed(
  item: AgendaItem,
  isLast: boolean,
  ctx: SlideContext,
): string {
  const row = agendaRow(item, isLast, ctx.strings);
  const attrsText = ` data-r style="--i:${ctx.reveal()}"`;
  return row.replace('<li', `<li${attrsText}`);
}

export function renderBlock(block: Block, ctx: SlideContext): string {
  const render = RENDERERS[block.kind] as (b: Block, c: SlideContext) => string;
  return render(block, ctx);
}

export function renderBlocks(
  blocks: Block[] | undefined,
  ctx: SlideContext,
): string {
  return (blocks ?? []).map((block) => renderBlock(block, ctx)).join('\n');
}
