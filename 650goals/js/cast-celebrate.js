/* CAST Games: the big moment (8 Oct 2026). The owner: 27-0's undefeated screen "should be ultra special", then "yes build
   this" for 1000TRIES's Exactly 1000 too, so both games feel the same. One full-screen celebration, about 8 seconds, and a
   tap anywhere skips to the end:
     count-up  the score climbs with a tile for each step (27-0: the clubs beaten; 1000TRIES: the 13 and their tries)
     slam      the final score lands: a flash, a shockwave, a small shake and a burst in the player's club colours
     trophy    floodlights sweep the dark, the cup rises, then the stamp (Undefeated, Exactly) and the line under it
     the 13    the score moves up and the 13 fan out into formation
     the end   the numbers, a history line, and the button that goes on
   Gold only on the cup and the score (the owner keeps gold for CAST Pass; the Premiers cards were the one exception).
   Phones set to reduce motion get the end straight away. The button is there from the first frame, so 27-0's Quick Draft
   can tap it (it keeps the class cel-continue). Anything that goes wrong goes straight on to done().
   CastCelebrate.show(o):
     id        the overlay's id (27-0: cel27)            label   what a screen reader hears
     from      the count-up's first number               fmt(n)  a number as the score shows it
     steps     [{ n, abbr, bg, fg, label }]: each step's number, its tile and the words under the score
     big       the final score; stamp: the word under it; line: the line under that
     colours   [c1, c2]: the player's club (else the 13's most common club)
     cards     13 x { pos, name, val, vc, abbr, bg, fg }; rows: index rows, fullback first; teamLabel: the team's heading
               (default 'Your 13'; 4000 GOALS passes 'Your 18')
     stats     [{ label, value }] (4 at most); star: { label, value, extra }
     history   { head, text, items: [words], you: words }
     button    its words; done(): after it's tapped (the overlay is gone by then) */
(function () {
  'use strict';
  var COUNT = 1600, SLAM = 1600, TROPHY = 2400, TEAM = 4200, END = 6000, DONE = 7600;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }
  function rgb(hex) {
    var m = /^#?([0-9a-f]{6})$/i.exec(String(hex || '').trim());
    if (!m) return null;
    var v = parseInt(m[1], 16);
    return [v >> 16, (v >> 8) & 255, v & 255];
  }
  function lum(hex) { var c = rgb(hex); return c ? (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255 : 0.5; }
  // A dark club colour can't be seen against the night (Souths' green, the Roosters' navy, black): it lightens toward
  // white, the darker the more
  function lit(hex) {
    var c = rgb(hex);
    if (!c) return '#e8ecf4';
    var l = lum(hex), k = l >= 0.36 ? 0 : (0.36 - l) / 0.36 * 0.72;
    return '#' + c.map(function (x) { return ('0' + Math.round(x + (255 - x) * k).toString(16)).slice(-2); }).join('');
  }

  function cup(id, shine) {
    var g = 'url(#' + id + 'G)';
    return '<svg viewBox="0 0 120 150" aria-hidden="true" focusable="false"><defs>' +
      '<linearGradient id="' + id + 'G" x1="0" x2="1"><stop offset="0" stop-color="#7a5508"/><stop offset=".32" stop-color="#e9bf45"/>' +
      '<stop offset=".5" stop-color="#fff2bf"/><stop offset=".7" stop-color="#e2ad2e"/><stop offset="1" stop-color="#7a5508"/></linearGradient>' +
      '<linearGradient id="' + id + 'B" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#2a1f08"/><stop offset="1" stop-color="#120d03"/></linearGradient>' +
      (shine ? '<linearGradient id="' + id + 'S" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".85"/>' +
        '<stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient><clipPath id="' + id + 'C"><path d="M30 14h60v26c0 22-12 38-30 42c-18-4-30-20-30-42z"/>' +
        '<rect x="54" y="80" width="12" height="24"/><path d="M40 104h40l6 14H34z"/></clipPath>' : '') + '</defs>' +
      '<path d="M31 22H17c0 18 8 30 22 34" fill="none" stroke="' + g + '" stroke-width="6" stroke-linecap="round"/>' +
      '<path d="M89 22h14c0 18-8 30-22 34" fill="none" stroke="' + g + '" stroke-width="6" stroke-linecap="round"/>' +
      '<path d="M30 14h60v26c0 22-12 38-30 42c-18-4-30-20-30-42z" fill="' + g + '"/>' +
      '<rect x="54" y="80" width="12" height="24" fill="' + g + '"/><path d="M40 104h40l6 14H34z" fill="' + g + '"/>' +
      '<rect x="27" y="118" width="66" height="24" rx="3" fill="url(#' + id + 'B)" stroke="' + g + '" stroke-width="2"/>' +
      '<rect x="41" y="125" width="38" height="10" rx="2" fill="' + g + '" opacity=".9"/><ellipse cx="60" cy="14" rx="30" ry="4" fill="#fff2bf" opacity=".55"/>' +
      (shine ? '<g clip-path="url(#' + id + 'C)"><g transform="skewX(-18)"><rect class="cc-shine" x="-10" y="0" width="26" height="150" fill="url(#' + id + 'S)"/></g></g>' : '') + '</svg>';
  }

  function show(o) {
    o = o || {};
    var finished = false;
    function go() { if (finished) return; finished = true; if (typeof o.done === 'function') o.done(); }
    try { run(o, go); } catch (e) {
      var d = document.getElementById(o.id || 'castCel');
      if (d && d.parentNode) d.parentNode.removeChild(d);
      go();
    }
  }

  function run(o, go) {
    var fmt = typeof o.fmt === 'function' ? o.fmt : function (n) { return String(n); };
    var steps = Array.isArray(o.steps) ? o.steps : [];
    var cols = (o.colours || []).filter(Boolean);
    var c1 = lit(cols[0] || '#ffffff'), c2 = lit(cols[1] || cols[0] || '#9aa4b2');
    if (c2 === c1) c2 = '#ffffff';
    var c1rgb = rgb(c1) || [255, 255, 255];
    var calm = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

    var root = document.createElement('div');
    root.id = o.id || 'castCel';
    root.className = 'cc is-count' + (calm ? ' is-calm' : '');
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', o.label || o.big || '');
    root.style.setProperty('--cc1', c1);
    root.style.setProperty('--cc2', c2);
    root.style.setProperty('--cc1-rgb', c1rgb.join(','));
    root.style.setProperty('--cc1-ink', lum(c1) > 0.55 ? '#0b0b14' : '#ffffff');

    // The tiles that light up as the score climbs (27 across nine columns, 13 across seven)
    var tcols = steps.length > 16 ? 9 : Math.min(7, Math.max(1, steps.length));
    var tilesHtml = steps.map(function (s) {
      var a = Math.random() * Math.PI * 2, r = 140 + Math.random() * 220;
      return '<i class="cc-tile" style="--bg:' + esc(s.bg || '#2a2a3a') + ';--fg:' + esc(s.fg || '#fff') + ';--tx:' + Math.round(Math.cos(a) * r) + 'px;--ty:' +
        Math.round(Math.sin(a) * r) + 'px;--tr:' + Math.round((Math.random() - 0.5) * 140) + 'deg">' + esc(s.abbr || '') + '</i>';
    }).join('');

    var cards = Array.isArray(o.cards) ? o.cards : [], rows = Array.isArray(o.rows) ? o.rows : [cards.map(function (c, i) { return i; })];
    var order = 0;
    var xiiiHtml = rows.map(function (row) {
      return '<div class="cc-row">' + row.map(function (i) {
        var c = cards[i];
        if (!c) return '';
        return '<div class="cc-card" style="--bg:' + esc(c.bg || '#3a3a4a') + ';--fg:' + esc(c.fg || '#fff') + ';--vc:' + esc(c.vc || '#fff') + ';--d:' + (order++ * 45) + 'ms">' +
          '<div class="cc-card-top"><span>' + esc(c.pos || '') + '</span>' + (c.abbr ? '<span class="cc-chip">' + esc(c.abbr) + '</span>' : '') + '</div>' +
          '<div class="cc-card-name">' + esc(c.name || '') + '</div><div class="cc-card-val">' + esc(c.val == null ? '' : c.val) + '</div></div>';
      }).join('') + '</div>';
    }).join('');

    var stats = (Array.isArray(o.stats) ? o.stats : []).slice(0, 4);
    var statsHtml = stats.map(function (s, i) {
      var num = typeof s.value === 'number' && isFinite(s.value);
      return '<div class="cc-stat" style="--d:' + (i * 90) + 'ms"><b' + (num ? ' data-n="' + s.value + '"' : '') + '>' + esc(s.value) + '</b>' +
        '<small>' + esc(s.label) + '</small></div>';
    }).join('');
    var st = o.star;
    var starHtml = st ? '<p class="cc-star"><span>' + esc(st.label) + '</span> <b>' + esc(st.value) + '</b>' + (st.extra ? ' <i>' + esc(st.extra) + '</i>' : '') + '</p>' : '';
    var h = o.history;
    var histHtml = h ? '<div class="cc-hist">' + (h.head ? '<h4>' + esc(h.head) + '</h4>' : '') + (h.text ? '<p>' + esc(h.text) + '</p>' : '') +
      (h.items && h.items.length ? '<div class="cc-hist-list">' + h.items.map(function (x, i) { return '<span style="--d:' + (i * 70) + 'ms">' + esc(x) + '</span>'; }).join('') +
        (h.you ? '<span class="is-you" style="--d:' + (h.items.length * 70 + 160) + 'ms">' + esc(h.you) + '</span>' : '') + '</div>' : '') + '</div>' : '';

    root.innerHTML =
      '<div class="cc-lights" aria-hidden="true"><i class="cc-beam cc-beam-l"></i><i class="cc-beam cc-beam-r"></i></div>' +
      '<canvas class="cc-fx" aria-hidden="true"></canvas>' +
      '<div class="cc-flash" aria-hidden="true"></div><div class="cc-wave" aria-hidden="true"></div>' +
      '<div class="cc-tick" aria-hidden="true"></div>' +
      '<div class="cc-tiles" aria-hidden="true" style="--cols:' + tcols + '">' + tilesHtml + '</div>' +
      '<div class="cc-stage" aria-hidden="true"><div class="cc-cup">' + cup('ccA', true) + '</div><div class="cc-big">' + esc(o.big || '') + '</div>' +
        '<div class="cc-under">' + (o.stamp ? '<div class="cc-stamp">' + esc(o.stamp) + '</div>' : '') + (o.line ? '<div class="cc-line">' + esc(o.line) + '</div>' : '') + '</div></div>' +
      '<div class="cc-scroll"><div class="cc-body">' +
        '<div class="cc-head"><div class="cc-head-cup">' + cup('ccB', false) + '</div><div class="cc-head-txt"><div class="cc-big">' + esc(o.big || '') + '</div>' +
          (o.stamp ? '<div class="cc-head-stamp">' + esc(o.stamp) + '</div>' : '') + (o.line ? '<div class="cc-head-line">' + esc(o.line) + '</div>' : '') + '</div></div>' +
        (cards.length ? '<div class="cc-xiii"><div class="cc-sec">' + esc(o.teamLabel || 'Your 13') + '</div>' + xiiiHtml + '</div>' : '') +
        (stats.length ? '<div class="cc-stats" style="--n:' + stats.length + '">' + statsHtml + '</div>' : '') + starHtml + histHtml +
      '</div></div>' +
      '<p class="cc-skip" aria-hidden="true">Tap to Skip</p>' +
      '<div class="cc-foot"><button type="button" class="cc-go cel-continue">' + esc(o.button || 'Continue') + '</button></div>';
    document.body.appendChild(root);

    var $ = function (sel) { return root.querySelector(sel); };
    var stage = $('.cc-stage'), big = stage.querySelector('.cc-big'), tick = $('.cc-tick'), scroll = $('.cc-scroll'), btn = $('.cc-go');
    var tiles = root.querySelectorAll('.cc-tile');
    var timers = [], rainTimer = 0, raf = 0, closed = false, ended = false, counting = steps.length > 0 && !calm;
    var VW = window.innerWidth, VH = window.innerHeight;
    // When the 13 come, the score flies from the middle of the screen into the header
    function flight() {
      var a = big.getBoundingClientRect(), b = $('.cc-head .cc-big').getBoundingClientRect();
      if (!a.height || !b.height) return;
      var s = b.height / a.height, dx = (b.left + b.width / 2) - (a.left + a.width / 2), dy = (b.top + b.height / 2) - (a.top + a.height / 2);
      stage.style.transform = 'translate(-50%, -50%) translate(' + Math.round(dx) + 'px,' + Math.round(dy) + 'px) scale(' + s.toFixed(3) + ')';
    }
    // The 13 fly in from the middle of the formation
    var xiii = $('.cc-xiii');
    if (xiii) {
      var xr = xiii.getBoundingClientRect(), xc = xr.left + xr.width / 2, yc = xr.top + xr.height / 2;
      Array.prototype.forEach.call(root.querySelectorAll('.cc-card'), function (el) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--fx', Math.round(xc - (r.left + r.width / 2)) + 'px');
        el.style.setProperty('--fy', Math.round(yc - (r.top + r.height / 2)) + 'px');
        el.style.setProperty('--fr', Math.round((Math.random() - 0.5) * 50) + 'deg');
      });
    }

    // ---- Particles: confetti in the club's colours and white ----
    var cv = $('.cc-fx'), ctx = null, parts = [], dpr = Math.min(2, window.devicePixelRatio || 1);
    if (!calm && cv.getContext) {
      cv.width = VW * dpr; cv.height = VH * dpr;
      ctx = cv.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);
    }
    var PAL = [c1, c1, c2, '#ffffff'];
    function burst(n, x, y, spread, up) {
      if (!ctx) return;
      for (var i = 0; i < n && parts.length < 700; i++) {
        var a = Math.random() * Math.PI * 2, v = (3 + Math.random() * 14) * spread;
        parts.push({ x: x, y: y, vx: Math.cos(a) * v, vy: (up ? -Math.abs(Math.sin(a)) : Math.sin(a)) * v - (up ? 5 * spread : 0),
          life: 1, dec: 0.006 + Math.random() * 0.011, sz: 3 + Math.random() * 5, g: 0.14 + Math.random() * 0.1,
          rot: Math.random() * 6.28, rv: (Math.random() - 0.5) * 0.3, col: PAL[(Math.random() * PAL.length) | 0], kind: Math.random() < 0.6 ? 0 : 1 });
      }
    }
    function rain(n) {
      if (!ctx) return;
      for (var i = 0; i < n && parts.length < 700; i++) {
        parts.push({ x: Math.random() * VW, y: -12, vx: (Math.random() - 0.5) * 1.6, vy: 2 + Math.random() * 3.5, life: 1, dec: 0.0035 + Math.random() * 0.004,
          sz: 3 + Math.random() * 4, g: 0.015, rot: Math.random() * 6.28, rv: (Math.random() - 0.5) * 0.2, col: PAL[(Math.random() * PAL.length) | 0], kind: 0 });
      }
    }
    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, VW, VH);
      for (var i = parts.length - 1; i >= 0; i--) {
        var p = parts[i];
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.col;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        if (p.kind) { ctx.beginPath(); ctx.arc(0, 0, p.sz * 0.45, 0, 6.283); ctx.fill(); } else ctx.fillRect(-p.sz / 2, -p.sz * 0.3, p.sz, p.sz * 0.6);
        ctx.restore();
        p.x += p.vx; p.y += p.vy; p.vy += p.g; p.vx *= 0.985; p.rot += p.rv; p.life -= p.dec;
        if (p.life <= 0 || p.y > VH + 30) parts.splice(i, 1);
      }
    }

    // ---- The count-up: slow at first, faster and faster ----
    var N = steps.length, at = steps.map(function (s, i) { return Math.round(COUNT * Math.pow((i + 1) / N, 0.55)); });
    var vals = [typeof o.from === 'number' ? o.from : 0].concat(steps.map(function (s) { return s.n; }));
    var lit_ = 0, t0 = 0;
    function frame(now) {
      if (closed) return;
      if (!t0) t0 = now;
      if (counting) {
        var t = now - t0, k = 0;
        while (k < N && at[k] <= t) k++;
        for (; lit_ < k; lit_++) { tiles[lit_].classList.add('is-on'); tick.textContent = steps[lit_].label || ''; }
        var v;
        if (k >= N) { v = vals[N]; counting = false; } else {
          var a = k ? at[k - 1] : 0, b = at[k], f = Math.min(1, Math.max(0, (t - a) / Math.max(1, b - a)));
          v = vals[k] + (vals[k + 1] - vals[k]) * f;
        }
        big.textContent = counting ? fmt(Math.round(v)) : (o.big || fmt(v));
      }
      draw();
      raf = requestAnimationFrame(frame);
    }

    function later(ms, fn) { timers.push(setTimeout(function () { if (!closed && !ended) fn(); }, ms)); }
    function phase(name) { root.classList.add(name); }
    function countStats() {
      Array.prototype.forEach.call(root.querySelectorAll('.cc-stat b[data-n]'), function (el, i) {
        var n = +el.getAttribute('data-n'), s0 = 0, dur = 750, d0 = i * 90;
        if (calm || ended) { el.textContent = String(n); return; }
        var start = null;
        function step(now) {
          if (closed) return;
          if (start === null) start = now + d0;
          var f = Math.min(1, Math.max(0, (now - start) / dur)), e = 1 - Math.pow(1 - f, 3);
          el.textContent = String(Math.round(s0 + (n - s0) * e));
          if (f < 1 && !ended) requestAnimationFrame(step); else el.textContent = String(n);
        }
        el.textContent = '0';
        requestAnimationFrame(step);
      });
    }

    function toEnd() {
      if (ended) return;
      ended = true;
      timers.forEach(clearTimeout); timers = [];
      counting = false;
      big.textContent = o.big || big.textContent;
      Array.prototype.forEach.call(tiles, function (el) { el.classList.add('is-on'); });
      root.classList.remove('is-shake');
      root.classList.add('is-skip', 'is-slam', 'is-trophy', 'is-team', 'is-end', 'is-done');
      Array.prototype.forEach.call(root.querySelectorAll('.cc-stat b[data-n]'), function (el) { el.textContent = el.getAttribute('data-n'); });
      if (ctx && !rainTimer) { rain(30); rainTimer = setInterval(function () { if (!closed) rain(2); }, 240); }
      try { btn.focus({ preventScroll: true }); } catch (e) { /* older browsers */ }
    }
    function close() {
      if (closed) return;
      closed = true;
      timers.forEach(clearTimeout); timers = [];
      clearInterval(rainTimer);
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKey, true);
      if (root.parentNode) root.parentNode.removeChild(root);
      go();
    }
    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); if (ended) close(); else toEnd(); }
    }
    btn.addEventListener('click', function (e) { e.stopPropagation(); close(); });
    root.addEventListener('click', function (e) { if (!ended && !(e.target.closest && e.target.closest('.cc-go'))) toEnd(); });
    document.addEventListener('keydown', onKey, true);

    root.setAttribute('tabindex', '-1');
    try { root.focus({ preventScroll: true }); } catch (e) { /* older browsers */ }
    if (calm) { toEnd(); return; }

    big.textContent = N ? fmt(vals[0]) : (o.big || '');
    raf = requestAnimationFrame(frame);

    later(N ? SLAM : 200, function () {
      counting = false;
      big.textContent = o.big || big.textContent;
      phase('is-slam'); phase('is-shake');
      var r = big.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
      burst(170, x, y, 1.05, true);
      later(160, function () { burst(90, x, y, 0.8, true); });
      later(380, function () { burst(80, VW * 0.12, VH * 0.42, 0.8, true); });
      later(460, function () { burst(80, VW * 0.88, VH * 0.42, 0.8, true); });
      later(460, function () { root.classList.remove('is-shake'); });
    });
    later(TROPHY, function () {
      phase('is-trophy');
      later(500, function () { var r = stage.querySelector('.cc-cup').getBoundingClientRect(); burst(60, r.left + r.width / 2, r.top + r.height * 0.3, 0.7, true); });
      rainTimer = setInterval(function () { if (!closed) rain(ended ? 2 : 4); }, 240);
    });
    later(TEAM, function () { flight(); phase('is-team'); });
    later(END, function () {
      phase('is-end');
      countStats();
      // A small phone: once it's all there, it glides down to the history (the score stays a swipe away)
      later(900, function () { var max = scroll.scrollHeight - scroll.clientHeight; if (max > 8 && scroll.scrollTo) scroll.scrollTo({ top: max, behavior: 'smooth' }); });
    });
    later(DONE, function () {
      phase('is-done');
      ended = true;
      try { btn.focus({ preventScroll: true }); } catch (e) { /* older browsers */ }
    });
  }

  window.CastCelebrate = { show: show };
})();
