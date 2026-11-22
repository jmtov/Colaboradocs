/**
 * CSS base de todos los decks. No define colores ni medidas: todo sale de las variables que genera
 * `styleToCss` (tema, variante, deck). Los componentes registrados traen su propio CSS.
 * No lleva comillas invertidas ni `${`: se escribe como texto plano.
 */
export const BASE_CSS = `
:root { --surface-inverse: var(--ink); --on-inverse: var(--bg); }
/* Transición de lo que cambia al elegir otra variante o modo: tamaños, colores y espacios. */
:root { --vary: font-size var(--dur-vary) var(--ease), color var(--dur-vary) var(--ease), background-color var(--dur-vary) var(--ease), border-color var(--dur-vary) var(--ease), border-width var(--dur-vary) var(--ease), padding var(--dur-vary) var(--ease), gap var(--dur-vary) var(--ease), margin var(--dur-vary) var(--ease); }
* { box-sizing: border-box; }
html, body { margin: 0; height: 100%; }
body { background: var(--bg); color: var(--ink); font-family: var(--font-sans); overflow: hidden; -webkit-font-smoothing: antialiased; }

/* ---------- Deck ---------- */
.slide {
  position: fixed; inset: 0; display: flex; flex-direction: column; justify-content: center;
  padding: var(--pad-top) var(--pad-x) var(--pad-bottom); background: var(--bg); color: var(--ink);
  opacity: 0; visibility: hidden; transform: translateX(var(--slide-shift));
  transition: transform var(--dur-slide) var(--ease), opacity .5s ease, visibility 0s var(--dur-slide), var(--vary);
}
.slide.is-active { opacity: 1; visibility: visible; transform: none; transition: transform var(--dur-slide) var(--ease), opacity .5s ease, visibility 0s, var(--vary); z-index: 2; }
.slide.is-past { transform: translateX(calc(var(--slide-shift) * -1)); }

/* Fondo de la slide: capas detrás de todo el contenido, sin bloquear clics. Cada capa se coloca con variables (% de la slide). */
.bg { position: absolute; inset: 0; z-index: -1; overflow: hidden; pointer-events: none; }
.bg-layer {
  position: absolute; left: calc(var(--x) * 1%); top: calc(var(--y) * 1%); width: calc(var(--w) * 1%); aspect-ratio: var(--ratio);
  transform: translate(calc(var(--ax) * -1%), calc(var(--ay) * -1%)); opacity: var(--o);
  background: var(--src) center / 100% 100% no-repeat;
}
.bg-layer.is-silhouette { background: var(--tint); -webkit-mask: var(--src) center / 100% 100% no-repeat; mask: var(--src) center / 100% 100% no-repeat; }
.heading-badge { margin-bottom: clamp(.6rem, 1.6vh, 1.2rem); }

/* Tono de la slide: el relleno de acento o la inversión de claro/oscuro. Se vuelven a declarar los derivados para que se recalculen aquí. */
.tone-accent, .tone-inverse {
  --muted: color-mix(in srgb, var(--ink) 62%, var(--bg));
  --faint: color-mix(in srgb, var(--ink) 45%, var(--bg));
  --tint: color-mix(in srgb, var(--ink) 8%, var(--bg));
  --line: color-mix(in srgb, var(--ink) 18%, var(--bg));
  --line-strong: color-mix(in srgb, var(--ink) 38%, var(--bg));
}
.tone-accent { --bg: var(--accent-surface); --ink: var(--on-accent); --accent: var(--on-accent); }
.tone-inverse { --bg: var(--surface-inverse); --ink: var(--on-inverse); --accent: var(--on-inverse); }

/* Todo lo de dentro de una slide anima su cambio de variante; lo que tiene entrada propia suma var(--vary) a su lista. */
.slide * { transition: var(--vary); }
[data-r] { opacity: 0; transform: translateY(28px); transition: opacity .4s ease, transform .4s ease, var(--vary); }
.is-active [data-r] { opacity: 1; transform: none; transition: opacity .7s ease, transform .9s var(--ease), var(--vary); transition-delay: calc(var(--i, 0) * var(--stagger) + var(--reveal-delay)); }
[data-r="scale"] { transform: scale(.9); }
.mask { display: block; overflow: hidden; padding-bottom: .1em; margin-bottom: -.1em; }
.mask > span { display: block; transform: translateY(110%); transition: transform .5s ease; }
.is-active .mask > span { transform: none; transition: transform .95s var(--ease); transition-delay: calc(var(--i, 0) * var(--stagger) + var(--mask-delay)); }
.rule { height: 0; width: 0; border-top: var(--rule-h) solid var(--accent); margin: clamp(1.1rem, 3vh, 2rem) 0; transition: width .4s ease, border-color var(--dur-vary) var(--ease), border-width var(--dur-vary) var(--ease); }
.is-active .rule { width: var(--rule-w); transition: width .9s var(--ease-io) .4s, border-color var(--dur-vary) var(--ease), border-width var(--dur-vary) var(--ease); }
/* La categoría de la slide colorea el filete, el borde de las personas y el cuadro de los iconos; nunca el texto. */
.slide.has-category .rule { border-top-color: var(--c); }

/* ---------- Tipografía ---------- */
h1, h2, h3, p { margin: 0; }
.title { font-family: var(--font-title); font-weight: var(--title-weight); letter-spacing: var(--title-tracking); line-height: var(--title-leading); text-transform: var(--title-transform); }
.t-xl { font-size: var(--h1); } .t-lg { font-size: var(--h1-lg); } .t-md { font-size: var(--h1-md); } .t-sm { font-size: var(--h2); }
.eyebrow {
  position: absolute; top: var(--eyebrow-top); left: var(--pad-x); z-index: 3; margin: 0; display: flex; align-items: center;
  font: 500 var(--text-eyebrow)/1 var(--eyebrow-font); letter-spacing: var(--eyebrow-tracking); text-transform: var(--eyebrow-transform); color: var(--muted);
}
.eyebrow b { color: var(--accent); font-weight: 500; margin-right: .9em; }
.eyebrow .t { display: inline-flex; align-items: center; gap: .45em; margin-left: 1.4em; color: var(--ink); line-height: 1; }
.eyebrow .t svg { width: 1.15em; height: 1.15em; }
.eyebrow .mode { display: var(--eyebrow-mode-display); align-items: center; margin-left: 1.2em; padding: .35em .9em; border: 2px solid var(--ink); border-radius: var(--radius-pill); color: var(--ink); font-weight: 700; }
.eyebrow .mode[data-mode="decide"] { background: var(--ink); color: var(--bg); }
.eyebrow .mode[data-mode="discuss"] { border-style: dashed; }
.lede { font-size: var(--text-lede); line-height: 1.25; color: var(--muted); max-width: 34ch; }
.lede b { color: var(--ink); font-weight: 600; }
.mono { font: 500 var(--text-mono)/1.3 var(--font-mono); letter-spacing: .04em; color: var(--muted); }
.note { font: 400 var(--text-note)/1.4 var(--font-mono); color: var(--muted); border-top: var(--line-w) var(--line-style) var(--line-strong); padding-top: .9rem; max-width: 60ch; }

/* ---------- Layouts ---------- */
.compact { --gap-scale: var(--gap-scale-compact); } .spacious { --gap-scale: var(--gap-scale-spacious); }
.content { display: grid; grid-template-columns: repeat(var(--cols, 1), minmax(0, 1fr)); grid-template-rows: repeat(var(--rows, 1), auto); column-gap: calc(var(--gap-x) * var(--gap-scale, 1)); row-gap: calc(var(--gap-y) * var(--gap-scale, 1)); align-items: start; }
.content.cols-3, .content.cols-4 { column-gap: calc(var(--gap-x-dense) * var(--gap-scale, 1)); }
.content > .cell { min-width: 0; display: flex; flex-direction: column; gap: calc(var(--gap-y) * var(--gap-scale, 1)); }
.content > .cell.head { display: block; }
.content > .cell.grow { align-self: stretch; }
.content > .cell.grow > * { flex: 1; align-self: stretch; }

/* ---------- Vista previa del editor: «ver celdas» (nunca en el deck ni en el PDF) ---------- */
.show-cells .content { outline: 1px dashed rgb(220 38 38 / .35); outline-offset: 6px; }
.show-cells .content > .cell { position: relative; outline: 1px solid rgb(220 38 38 / .5); outline-offset: 2px; background: rgb(220 38 38 / .05); }
.is-preview .content > .cell { position: relative; cursor: pointer; }
.cell-delete { all: unset; box-sizing: border-box; position: absolute; top: 4px; right: 4px; z-index: 3; display: none; place-items: center; width: 2.2em; height: 2.2em; border-radius: var(--radius-badge); background: #b3261e; color: #fff; font-size: var(--text-hud); cursor: pointer; }
.cell-delete svg { width: 1.2em; height: 1.2em; }
.cell-delete:hover { background: #8c1d18; }
.content > .cell:hover > .cell-delete, .content > .cell.hl > .cell-delete { display: grid; }
.cell.add { min-height: var(--row-min); }
.add-cell { all: unset; box-sizing: border-box; display: grid; place-items: center; width: 100%; height: 100%; min-height: var(--row-min); border: 2px dashed var(--line-strong); border-radius: var(--radius-card); color: var(--muted); font-size: var(--text-hud); cursor: pointer; }
.add-cell:hover { border-style: solid; color: var(--ink); background: var(--tint); }
.content > .cell.hl { outline: 2px solid rgb(220 38 38 / .9); outline-offset: 2px; background: rgb(220 38 38 / .1); }
.show-cells [data-cell]::before { content: attr(data-cell); position: absolute; top: 0; right: 0; z-index: 2; padding: .1em .4em; background: rgb(220 38 38 / .85); color: #fff; font: 500 var(--text-hud)/1.2 var(--font-mono); pointer-events: none; }

/* ---------- Bloques ---------- */
.list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: clamp(.7rem, 2vh, 1.4rem); }
.list li { display: grid; grid-template-columns: 2.4ch 1fr; gap: .3em 1rem; align-items: baseline; font-size: var(--text-list); line-height: 1.2; font-weight: 500; letter-spacing: -.015em; }
.list li::before { content: attr(data-n); font: 500 var(--text-index) var(--font-mono); color: var(--accent); }
.list li.has-icon { grid-template-columns: 2.4ch auto 1fr; }
.list li small { display: block; margin-top: .3em; font-size: var(--text-list-detail); line-height: 1.3; color: var(--muted); font-weight: 400; letter-spacing: 0; }
.list.size-md li { font-size: var(--text-list-md); }
.list.size-md li small { font-size: var(--text-list-md-detail); }
.li-icon { align-self: start; display: grid; place-items: center; height: 1.2em; }
.li-icon svg { width: .9em; height: .9em; }
.compact .list { gap: clamp(.5rem, 1.6vh, 1rem); } .compact .list li { font-size: var(--text-list-compact); } .compact .list li small { font-size: var(--text-list-detail-compact); }

.card { border: var(--line-w) solid var(--line-strong); border-radius: var(--radius-card); padding: clamp(1rem, 2vw, 1.8rem); display: flex; flex-direction: column; gap: .8rem; background: var(--bg); color: var(--ink); }
.compact .card { gap: .35rem; padding: clamp(.7rem, 1.4vw, 1.2rem); }
.card .top { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
.card .k { font: 500 var(--text-card-kicker) var(--font-mono); color: var(--muted); }
.card h3 { font-size: var(--text-card-title); line-height: 1.1; letter-spacing: -.025em; font-weight: 600; }
.compact .card h3 { font-size: var(--text-card-title-compact); }
.card p { font-size: var(--text-card-text); line-height: 1.4; color: var(--muted); }
.card .who { margin-top: auto; padding-top: .8rem; border-top: var(--line-w) var(--line-style) var(--line-strong); font: 500 var(--text-card-footer)/1.3 var(--font-mono); color: var(--ink); }
.card .people { display: grid; gap: .6rem; }
.card.has-category { --accent: var(--c); border-top: 5px solid var(--c); }
.card.tone-accent { border-color: transparent; }
.srcs { list-style: none; margin: auto 0 0; padding: .9rem 0 0; border-top: var(--line-w) solid var(--line-strong); display: grid; gap: .6rem; font-size: var(--text-source); line-height: 1.35; color: var(--muted); }
.srcs b { margin-right: .45em; font-size: var(--text-source-label); letter-spacing: .06em; text-transform: uppercase; padding: .12rem .5rem; border: 1.5px solid var(--ink); border-radius: var(--radius-badge); color: var(--ink); }
.badge { display: grid; place-items: center; box-sizing: content-box; width: clamp(1.4rem, 2.4vw, 2.4rem); height: clamp(1.4rem, 2.4vw, 2.4rem); padding: clamp(.4rem, .65vw, .65rem); flex: none; background: color-mix(in srgb, var(--c, var(--accent)) 12%, var(--bg)); border: 1px solid color-mix(in srgb, var(--c, var(--accent)) 50%, var(--bg)); color: color-mix(in srgb, var(--c, var(--accent)) 70%, var(--ink)); border-radius: var(--radius-badge); }
.badge svg { width: 100%; height: 100%; display: block; }
.compact .badge { width: clamp(1.1rem, 1.8vw, 1.8rem); height: clamp(1.1rem, 1.8vw, 1.8rem); padding: clamp(.35rem, .5vw, .5rem); }

.person { border: var(--line-w) solid var(--line-strong); border-radius: var(--radius-card); padding: clamp(1rem, 1.8vw, 1.6rem); display: grid; gap: .4rem; align-self: start; }
.has-category .person { border-top: 5px solid var(--c); }
.person .name { font-size: var(--text-person-name); font-weight: 600; letter-spacing: -.025em; line-height: 1.1; }
.person .role { font-size: var(--text-person-role); color: var(--muted); }

.figure-wrap { container-type: inline-size; min-width: 0; --fig-size: min(var(--text-figure), calc(100cqw / var(--fig-em, 3))); --fig-unit: min(var(--text-figure-unit), calc(26cqw / var(--fig-em, 3))); }
.figure { font: 800 var(--fig-size)/.8 var(--font-title); letter-spacing: -.07em; font-variant-numeric: tabular-nums; }
.figure small { font-size: var(--fig-unit); letter-spacing: -.02em; font-weight: 700; margin-left: .1em; }
.figure-caption { font-size: var(--text-figure-caption); color: var(--muted); margin-top: .6rem; }
.frame { position: relative; margin: 0; overflow: hidden; border: 1.5px solid var(--ink); border-radius: var(--radius-frame); aspect-ratio: var(--ratio, 4 / 3); max-height: 70vh; }
.frame.plain { border: 0; }
.frame img { width: 100%; height: 100%; object-fit: cover; display: block; }

.qrcol { display: grid; gap: 1rem; justify-items: center; }
.qrbox { width: min(38vh, 30vw); aspect-ratio: 1; border: var(--line-w) solid var(--line-strong); background: #fff; padding: .7rem; }
.qrbox img { width: 100%; height: 100%; display: block; }
.qrlink { font: 500 var(--text-qr-link) var(--font-mono); color: var(--ink); text-decoration: none; }
.countdown { font: 500 var(--text-countdown) var(--font-mono); font-variant-numeric: tabular-nums; letter-spacing: -.02em; }
.countdown[hidden] { display: none; }
.notice { display: flex; align-items: center; gap: .8rem; padding: .7rem 1rem; background: var(--tint); border: var(--line-w) var(--line-style) var(--line-strong); border-radius: var(--radius-card); font-size: var(--text-notice); line-height: 1.35; color: var(--muted); }
.notice svg { width: 1.3em; height: 1.3em; flex: none; }

.agenda { display: grid; grid-template-columns: 1fr 1fr; gap: 0 clamp(2rem, 5vw, 6rem); align-items: stretch; }
.agenda.cols-1 { grid-template-columns: 1fr; }
.agenda ol { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; }
.agenda li { display: grid; grid-template-columns: 5.2ch 1fr; gap: 1rem; align-items: baseline; padding: clamp(.45rem, 1.5vh, .95rem) 0; border-bottom: var(--line-w) var(--line-style) var(--line-strong); font-size: var(--text-agenda); font-weight: 500; line-height: 1.15; letter-spacing: -.01em; }
.agenda .h { font: 500 var(--text-agenda-time) var(--font-mono); color: var(--accent); font-variant-numeric: tabular-nums; }
.agenda small { display: block; font: 400 var(--text-agenda-detail) var(--font-mono); color: var(--muted); margin-top: .3em; letter-spacing: .02em; }
.agenda li.has-icon { grid-template-columns: 5.2ch 1fr auto; align-items: center; }
.agenda li svg { width: 1.2em; height: 1.2em; color: var(--muted); }
.agenda li.highlight { background: var(--tint); border: var(--line-w) var(--line-style) var(--line-strong); border-radius: var(--radius-card); padding: clamp(.3rem, 1vh, .6rem) 1rem; margin: 0 -1rem; }
.agenda li.last-highlight { margin-top: .5rem; }
/* La línea del ítem de arriba no se dobla con el borde del descanso. */
.agenda li:has(+ .highlight) { border-bottom-color: transparent; }

.timeline { position: relative; display: grid; grid-auto-flow: column; grid-auto-columns: 1fr; margin-top: clamp(2rem, 6vh, 4rem); }
.timeline::before { content: ""; position: absolute; left: 0; right: 0; top: .55rem; height: 2px; background: var(--ink); transform: scaleX(0); transform-origin: left; transition: transform .4s ease; }
.is-active .timeline::before { transform: none; transition: transform 1.8s var(--ease-io) .4s; }
.event { padding-right: 1rem; }
.event::before { content: ""; display: block; width: 1.1rem; height: 1.1rem; border-radius: 50%; background: var(--ink); margin-bottom: 1.4rem; position: relative; }
.event.hollow::before { background: var(--bg); border: 2px solid var(--ink); }
.event .d { font-size: var(--text-event-date); font-weight: 800; letter-spacing: -.03em; line-height: 1; }
.event .w { font-size: var(--text-event-text); color: var(--muted); margin-top: .5rem; line-height: 1.3; }
.event .w b { color: var(--ink); font-weight: 600; display: block; font-size: var(--text-event-title); margin-bottom: .15em; }
.datebox { flex: none; background: var(--accent-surface); color: var(--on-accent); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: .2rem; padding: clamp(.9rem, 2vh, 1.6rem) clamp(1rem, 2vw, 2rem); min-width: clamp(6rem, 10vw, 10rem); border-radius: var(--radius-card); }
.datebox .d { font: 800 var(--text-datebox-day)/.9 var(--font-title); letter-spacing: -.03em; }
.datebox .m { font-size: var(--text-datebox-month); font-weight: 800; text-transform: uppercase; letter-spacing: .06em; }
.chips { display: flex; flex-wrap: wrap; gap: .6rem; }
.chip { font-size: var(--text-chip); font-weight: 600; padding: .5em 1.1em; border-radius: var(--radius-pill); border: 1.5px solid var(--ink); }
.chip.solid { background: var(--ink); color: var(--bg); } .chip.dashed { border-style: dashed; }

.speaker { position: absolute; left: calc(var(--pad-x) + 10ch); bottom: var(--hud-bottom); z-index: 3; white-space: nowrap; font: 400 var(--text-speaker)/1 var(--font-mono); color: var(--muted); }
.speaker b { font-weight: 500; color: var(--ink); }
.speaker svg { width: 1.15em; height: 1.15em; vertical-align: -.2em; margin-right: .5em; color: var(--ink); }
.pg { display: none; }

/* ---------- HUD ---------- */
.progress { position: fixed; top: 0; left: 0; height: var(--progress-h); width: 100%; z-index: 10; }
.progress i { display: block; height: 100%; width: 100%; background: var(--accent); transform: scaleX(0); transform-origin: left; transition: transform var(--dur-slide) var(--ease); }
.hud { position: fixed; left: var(--pad-x); right: var(--pad-x); bottom: var(--hud-bottom); z-index: 10; display: flex; justify-content: space-between; align-items: center; font: 400 var(--text-hud)/1 var(--font-mono); color: var(--muted); font-variant-numeric: tabular-nums; pointer-events: none; }
.controls { position: fixed; top: var(--controls-top); right: var(--pad-x); z-index: 11; display: flex; gap: 1.4rem; align-items: center; font: 400 var(--text-controls) var(--font-mono); color: var(--muted); opacity: 0; pointer-events: none; transition: opacity .25s ease; }
.controls kbd { font: inherit; border: 1px solid var(--line-strong); padding: .05em .5em; color: var(--ink); }
body.top .controls { opacity: 1; pointer-events: auto; }
.nav { position: fixed; inset: 0; z-index: 5; display: grid; grid-template-columns: 1fr 3fr; }
.nav button, .themebtn { all: unset; cursor: pointer; }

@media screen and (max-width: 860px) {
  .agenda { grid-template-columns: 1fr; }
  .content { grid-template-columns: minmax(0, 1fr); }
  .content > .cell { grid-column: 1 / -1 !important; grid-row: auto !important; }
  .timeline { grid-auto-flow: row; row-gap: 1.5rem; } .timeline::before { display: none; }
  .slide { overflow-y: auto; justify-content: flex-start; padding-top: 4.2rem; padding-bottom: 4rem; }
  .controls span { display: none; }
}

/* ---------- Impresión: una slide por página ---------- */
@page { size: 13.333in 7.5in; margin: 0; }
@media print {
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  html, body { height: auto !important; overflow: visible !important; }
  main#deck { display: block !important; }
  .progress, .hud, .nav, .controls { display: none !important; }
  .pg { display: block; position: absolute; left: var(--pad-x); bottom: var(--hud-bottom); z-index: 3; font: 400 var(--text-hud)/1 var(--font-mono); color: var(--muted); font-variant-numeric: tabular-nums; }
  .countdown { display: none !important; }
  .slide, .slide.is-active, .slide.is-past { position: relative !important; inset: auto !important; width: 13.333in !important; height: 7.5in !important; display: flex !important; opacity: 1 !important; visibility: visible !important; transform: none !important; transition: none !important; break-after: page !important; break-inside: avoid; overflow: hidden; }
  main#deck > .slide:last-of-type { break-after: auto !important; }
  [data-r], .is-active [data-r], .mask > span, .is-active .mask > span { opacity: 1 !important; transform: none !important; transition: none !important; }
  .rule { width: var(--rule-w) !important; transition: none !important; }
  .slide, .slide * { transition: none !important; }
  .timeline::before { transform: none !important; transition: none !important; }
}
@media (prefers-reduced-motion: reduce) {
  :root { --vary: color 0s; }
  .slide, .slide.is-active, .slide.is-past { transform: none; transition: opacity .3s ease, visibility 0s; }
  [data-r], .is-active [data-r], .mask > span, .is-active .mask > span { transform: none; transition: opacity .3s ease; }
  .rule, .is-active .rule { width: var(--rule-w); transition: none; }
  .timeline::before, .is-active .timeline::before { transform: none; transition: none; }
}
`;
