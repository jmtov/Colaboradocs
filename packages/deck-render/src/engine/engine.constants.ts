/**
 * Motor de navegación del deck (se incrusta en el HTML). Se configura con `window.DECK_CONFIG`.
 * Sin comillas invertidas ni `${`: se escribe como texto plano.
 */
export const ENGINE_JS = `
(function () {
  var C = Object.assign({
    themeKey: 'theme', baseMode: 'light', themeToggle: true, topZone: 96, swipePx: 50, idleMs: 3500, countdownMaxHours: 24,
    keys: { next: ['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'], prev: ['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'], theme: ['t', 'T'], fullscreen: ['f', 'F'] }
  }, window.DECK_CONFIG || {});
  var slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
  var bar = document.getElementById('bar');
  var counter = document.getElementById('counter');
  var cur = -1;
  var pad = function (n) { return String(n).padStart(2, '0'); };

  function go(n) {
    n = Math.max(0, Math.min(slides.length - 1, n));
    if (n === cur) return;
    var first = cur < 0;
    slides.forEach(function (s, i) {
      s.classList.toggle('is-active', i === n);
      s.classList.toggle('is-past', i < n);
      s.setAttribute('aria-hidden', i === n ? 'false' : 'true');
    });
    cur = n;
    bar.style.transform = 'scaleX(' + (n + 1) / slides.length + ')';
    counter.textContent = pad(n + 1) + ' / ' + pad(slides.length);
    history.replaceState(null, '', '#' + (n + 1));
    // Si el deck está dentro de otra página (la galería), le avisa en qué slide va. La primera vez no: es la de arranque, y la página puede haber pedido otra (?slide=N) que aún no llega.
    if (!first && window.parent !== window) window.parent.postMessage({ deckSlide: n + 1 }, '*');
  }
  // La página que contiene el deck puede llevarlo a una slide (el editor, al volver a la presentación).
  addEventListener('message', function (e) {
    if (e.source !== window.parent) return;
    if (e.data && typeof e.data.deckGo === 'number') go(e.data.deckGo - 1);
  });
  // Solo en la galería: la página que contiene el deck cambia las variantes de la slide actual para verlas.
  if (C.preview) {
    // El editor cambia el HTML de una slide sin recargar la página (la animación de entrada no se repite).
    addEventListener('message', function (e) {
      var r = e.data && e.data.deckReplace;
      if (!r) return;
      var old = slides[r.index];
      if (!old) return;
      var holder = document.createElement('div');
      holder.innerHTML = r.html;
      var fresh = holder.firstElementChild;
      if (!fresh) return;
      if (old.classList.contains('is-active')) fresh.classList.add('is-active');
      if (old.classList.contains('is-past')) fresh.classList.add('is-past');
      fresh.setAttribute('aria-hidden', old.getAttribute('aria-hidden') || 'true');
      old.replaceWith(fresh);
      slides[r.index] = fresh;
      timers = Array.prototype.slice.call(document.querySelectorAll('.countdown'));
      tick();
    });
    // Pulsar una celda avisa al editor qué bloque es (abre su edición); pasar el cursor lo resalta allá.
    document.body.classList.add('is-preview');
    var hovered = null;
    var blockOf = function (target) {
      var c = target && target.closest ? target.closest('.cell[data-block]') : null;
      return c ? Number(c.getAttribute('data-block')) : null;
    };
    document.addEventListener('click', function (ev) {
      var del = ev.target.closest ? ev.target.closest('.cell-delete') : null;
      if (del) {
        var owner = blockOf(del);
        if (owner !== null) parent.postMessage({ deckDelete: owner }, '*');
        return;
      }
      var add = ev.target.closest ? ev.target.closest('.add-cell') : null;
      if (add) {
        parent.postMessage({ deckAdd: { col: Number(add.getAttribute('data-add-col')), row: Number(add.getAttribute('data-add-row')) } }, '*');
        return;
      }
      var index = blockOf(ev.target);
      if (index !== null) parent.postMessage({ deckBlock: index }, '*');
    }, true);
    document.addEventListener('mouseover', function (ev) {
      var index = blockOf(ev.target);
      if (index === hovered) return;
      hovered = index;
      parent.postMessage({ deckHover: index }, '*');
    });
    var original = null;
    addEventListener('message', function (e) {
      if (e.data && 'deckHighlight' in e.data && cur >= 0) {
        var lit = slides[cur].querySelectorAll('.cell.hl');
        for (var i = 0; i < lit.length; i++) lit[i].classList.remove('hl');
        var h = e.data.deckHighlight;
        var target = h === null ? null : slides[cur].querySelector('.cell[data-block="' + h + '"]');
        if (target) target.classList.add('hl');
      }
      if (e.data && 'deckCells' in e.data) document.body.classList.toggle('show-cells', !!e.data.deckCells);
      var v = e.data && e.data.deckPreview;
      if (!v || cur < 0) return;
      var s = slides[cur];
      var title = s.querySelector('.title');
      if (!original || original.slide !== s) original = { slide: s, cls: s.className, style: s.getAttribute('style'), titleCls: title ? title.className : null };
      if (v.reset) {
        s.className = original.cls;
        if (original.style === null) s.removeAttribute('style'); else s.setAttribute('style', original.style);
        if (title && original.titleCls) title.className = original.titleCls;
        return;
      }
      if ('tone' in v) { s.classList.remove('tone-accent', 'tone-inverse'); if (v.tone !== 'default') s.classList.add('tone-' + v.tone); }
      if ('density' in v) { s.classList.toggle('compact', v.density === 'compact'); s.classList.toggle('spacious', v.density === 'spacious'); }
      if ('titleSize' in v && title) { ['xl', 'lg', 'md', 'sm'].forEach(function (z) { title.classList.remove('t-' + z); }); title.classList.add('t-' + v.titleSize); }
      if ('category' in v) {
        if (v.category === null) { s.style.removeProperty('--c'); s.classList.remove('has-category'); }
        else { s.style.setProperty('--c', 'var(--cat-' + (v.category + 1) + ')'); s.classList.add('has-category'); }
      }
    });
  }
  var next = function () { go(cur + 1); };
  var prev = function () { go(cur - 1); };

  var toggleTheme = function () {
    if (!C.themeToggle) return;
    var d = document.documentElement;
    var now = d.dataset.theme || C.baseMode;
    var other = now === 'dark' ? 'light' : 'dark';
    d.dataset.theme = other;
    try { localStorage.setItem(C.themeKey, other); } catch (e) {}
  };
  var themeBtn = document.getElementById('theme');
  if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var k = e.key;
    if (C.keys.next.indexOf(k) >= 0) { e.preventDefault(); next(); }
    else if (C.keys.prev.indexOf(k) >= 0) { e.preventDefault(); prev(); }
    else if (k === 'Home') go(0);
    else if (k === 'End') go(slides.length - 1);
    else if (C.keys.theme.indexOf(k) >= 0) toggleTheme();
    else if (C.keys.fullscreen.indexOf(k) >= 0) { if (document.fullscreenElement) document.exitFullscreen(); else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen(); }
  });
  // en la vista previa no hay zonas de clic para pasar de slide: estorban al editar
  var nextZone = document.getElementById('next');
  var prevZone = document.getElementById('prev');
  if (nextZone) nextZone.addEventListener('click', next);
  if (prevZone) prevZone.addEventListener('click', prev);
  // La navegación no cubre la slide (así se puede desplazar): el clic en la slide avanza, y en su cuarto izquierdo vuelve.
  // No cuentan los clics en enlaces o botones ni los que terminan una selección de texto.
  if (!C.preview) document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('a, button, input, textarea, select, kbd')) return;
    if (String(window.getSelection())) return;
    if (e.clientX < innerWidth / 4) prev(); else next();
  });

  var x0 = null;
  addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  addEventListener('touchend', function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > C.swipePx) { if (dx < 0) next(); else prev(); }
    x0 = null;
  }, { passive: true });

  var idle;
  var wake = function () { document.body.classList.remove('idle'); clearTimeout(idle); idle = setTimeout(function () { document.body.classList.add('idle'); }, C.idleMs); };
  ['mousemove', 'keydown', 'touchstart'].forEach(function (ev) { addEventListener(ev, wake, { passive: true }); });
  wake();
  addEventListener('mousemove', function (e) { document.body.classList.toggle('top', e.clientY < C.topZone); }, { passive: true });
  document.addEventListener('mouseleave', function () { document.body.classList.remove('top'); });

  var timers = Array.prototype.slice.call(document.querySelectorAll('.countdown'));
  var tick;
  tick = function () {
    timers.forEach(function (cd) {
      var ms = new Date(cd.dataset.target).getTime() - Date.now();
      if (ms <= 0 || (!C.preview && ms > C.countdownMaxHours * 3600 * 1000)) { cd.hidden = true; return; }
      var s = Math.floor(ms / 1000);
      cd.hidden = false;
      cd.textContent = cd.dataset.label + ' ' + pad(Math.floor(s / 3600)) + ':' + pad(Math.floor(s % 3600 / 60)) + ':' + pad(s % 60);
    });
  };
  tick(); setInterval(tick, 1000);

  var fromHash = function () { return (parseInt(location.hash.slice(1), 10) || 1) - 1; };
  addEventListener('hashchange', function () { go(fromHash()); });
  document.fonts.ready.then(function () { go(fromHash()); });
})();
`;
