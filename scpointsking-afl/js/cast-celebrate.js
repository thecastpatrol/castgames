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

/* The GOAT moment (17 Oct 2026, the owner: using the GOAT should feel "like a feature on the pokies"). One full-screen moment
   when the GOAT item is used, about 3 seconds, the same in every CAST draft game (its own greats on the reel, its own
   colours): the screen dims, gold lightning, a reel of the game's greats spins, slows and locks on the GOAT, then his card
   slams in with a shine and a burst of goats. A tap anywhere skips it, phones set to reduce motion get a calm version (the
   card fades in), the game's own Sound On/Off is respected (the page hands over its tone()), and a phone that can buzz
   buzzes as he locks in. Anything that goes wrong goes straight on to done(), so the game never waits on it.
     CastCelebrate.goat(o)       o.tone(freq, dur, type, when, vol): the page's sound (it stays quiet when Sound is off);
                                 o.done(): after it closes. The GOAT, his number and the greats come from the game (window.T)
                                 o.head: the game's own headline on his card ("IT'S TURBO TIME", SC POINTS KING, 17 Oct
                                 2026), else window.T.GOAT_HEADLINE, else none
     CastCelebrate.goatLand(el, o)  as his card goes into its spot: a gold ring and a small burst of goats on that spot */
(function () {
  'use strict';
  var CC = window.CastCelebrate = window.CastCelebrate || {};
  var GOLD = '#f1c073', ROW = 56;
  var CSS = [
    '.cg{position:fixed;inset:0;z-index:99999;overflow:hidden;cursor:pointer;color:#fff;-webkit-tap-highlight-color:transparent;background:rgba(3,3,8,0);transition:background .25s ease,opacity .3s ease;font-family:var(--font,system-ui,-apple-system,sans-serif)}',
    '.cg.is-on{background:rgba(3,3,8,.9)}',
    '.cg.is-out{opacity:0}',
    '.cg-glow{position:absolute;inset:-25%;background:radial-gradient(closest-side,rgba(var(--cg-rgb),.32),rgba(241,192,115,.1) 55%,transparent 75%);opacity:0;transition:opacity .45s ease;pointer-events:none}',
    '.cg.is-on .cg-glow{opacity:1}',
    '.cg-flash{position:absolute;inset:0;background:radial-gradient(circle at 50% 46%,rgba(255,240,190,.95),rgba(255,200,90,.28) 38%,transparent 70%);opacity:0;pointer-events:none}',
    '.cg.is-bolt .cg-flash{animation:cgFlash .5s ease-out}',
    '.cg.is-lock .cg-flash{animation:cgFlash .65s ease-out}',
    '@keyframes cgFlash{0%{opacity:0}12%{opacity:1}30%{opacity:.25}45%{opacity:.8}100%{opacity:0}}',
    '.cg-bolts{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;opacity:0}',
    '.cg-bolts path{fill:none;stroke:#fff7dc;stroke-width:3px;vector-effect:non-scaling-stroke;stroke-linejoin:round;stroke-linecap:round;filter:drop-shadow(0 0 3px #ffd76a) drop-shadow(0 0 10px #f1c073)}',
    '.cg.is-bolt .cg-bolts{animation:cgBolt .5s steps(1)}',
    '.cg.is-lock .cg-bolts{animation:cgBolt .6s steps(1)}',
    '@keyframes cgBolt{0%{opacity:1}16%{opacity:0}32%{opacity:1}50%{opacity:0}66%{opacity:.85}82%,100%{opacity:0}}',
    '.cg-mid{position:absolute;left:50%;top:46%;transform:translate(-50%,-50%);width:min(320px,calc(100vw - 32px))}',
    '.cg-kick{text-align:center;font-weight:900;letter-spacing:.2em;font-size:12px;color:#ffe3a0;margin-bottom:12px;opacity:0;transform:translateY(8px);transition:opacity .3s ease,transform .3s ease}',
    '.cg.is-spin .cg-kick{opacity:1;transform:none}',
    '.cg-reel{position:relative;height:' + (ROW * 3) + 'px;border-radius:16px;overflow:hidden;background:linear-gradient(#0c0c15,#17171f 50%,#0c0c15);box-shadow:0 0 0 2px rgba(241,192,115,.6),0 0 44px rgba(241,192,115,.22),inset 0 0 30px rgba(0,0,0,.85);opacity:0;transform:scale(.9);transition:opacity .25s ease,transform .25s ease}',
    '.cg.is-spin .cg-reel{opacity:1;transform:none}',
    '.cg-reel::before,.cg-reel::after{content:"";position:absolute;left:0;right:0;height:' + ROW + 'px;z-index:2;pointer-events:none}',
    '.cg-reel::before{top:0;background:linear-gradient(#0b0b12,rgba(11,11,18,.15))}',
    '.cg-reel::after{bottom:0;background:linear-gradient(rgba(11,11,18,.15),#0b0b12)}',
    '.cg-win{position:absolute;left:8px;right:8px;top:' + ROW + 'px;height:' + ROW + 'px;border-radius:10px;border:2px solid ' + GOLD + ';box-shadow:0 0 18px rgba(241,192,115,.45);z-index:3;pointer-events:none}',
    '.cg.is-lock .cg-win{animation:cgWin .7s ease-out}',
    '@keyframes cgWin{30%{box-shadow:0 0 44px 10px rgba(255,215,106,.85);background:rgba(255,215,106,.16)}}',
    '.cg-strip{position:absolute;left:0;right:0;top:0;will-change:transform}',
    '.cg.is-spin .cg-strip{filter:blur(1px)}',
    '.cg.is-lock .cg-strip{filter:none}',
    '.cg-row{height:' + ROW + 'px;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:0 20px;font-weight:800;font-size:17px;white-space:nowrap}',
    '.cg-row span{min-width:0;white-space:nowrap}',
    '.cg-row b{flex:none;font-variant-numeric:tabular-nums;font-size:15px;color:var(--cg-acc)}',
    '.cg-row.is-goat{color:#ffe7a8}',
    '.cg-row.is-goat b{color:#ffd76a}',
    '.cg-card{position:absolute;left:50%;top:46%;width:min(270px,calc(100vw - 64px));box-sizing:border-box;padding:22px 18px 22px;border-radius:18px;text-align:center;overflow:hidden;color:var(--cg-ink,#fff);background:linear-gradient(160deg,var(--cg-club,#1a1a2e) 0%,#0c0c14 135%);border:2px solid ' + GOLD + ';box-shadow:inset 0 0 0 1px rgba(255,255,255,.08),0 0 54px rgba(241,192,115,.5),0 22px 60px rgba(0,0,0,.6);opacity:0;transform:translate(-50%,-50%) scale(1.6);pointer-events:none}',
    '.cg.is-card .cg-card{animation:cgSlam .42s cubic-bezier(.2,1.35,.4,1) forwards}',
    '@keyframes cgSlam{0%{opacity:0;transform:translate(-50%,-50%) scale(1.7)}60%{opacity:1;transform:translate(-50%,-50%) scale(.96)}100%{opacity:1;transform:translate(-50%,-50%) scale(1)}}',
    '.cg.is-card .cg-mid{opacity:0;transform:translate(-50%,-50%) scale(.92);transition:opacity .2s ease,transform .2s ease}',
    '.cg-hl{margin:-2px 0 12px;font-size:25px;font-weight:900;font-style:italic;line-height:1.05;letter-spacing:.02em;color:#ffd76a;text-shadow:0 2px 0 rgba(0,0,0,.45),0 0 18px rgba(241,192,115,.6);text-wrap:balance;overflow-wrap:anywhere}',
    '.cg-tag{display:inline-block;font-size:12px;font-weight:900;letter-spacing:.16em;padding:5px 11px;border-radius:999px;background:' + GOLD + ';color:#1a1204}',
    '.cg-name{margin-top:12px;font-size:24px;font-weight:900;line-height:1.12;text-wrap:balance}',
    '.cg-num{margin-top:8px;font-size:52px;font-weight:900;line-height:1;color:#ffd76a;font-variant-numeric:tabular-nums;text-shadow:0 2px 0 rgba(0,0,0,.35)}',
    '.cg-unit{margin-top:6px;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;opacity:.88}',
    '.cg-shine{position:absolute;top:-20%;bottom:-20%;left:-60%;width:38%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.75),transparent);transform:skewX(-18deg);opacity:0}',
    '.cg.is-card .cg-shine{animation:cgShine .85s .32s ease-out forwards}',
    '@keyframes cgShine{0%{left:-60%;opacity:1}100%{left:135%;opacity:1}}',
    '.cg-bits{position:absolute;left:50%;top:46%;width:0;height:0;pointer-events:none}',
    '.cg-bit{position:absolute;left:0;top:0;font-size:28px;line-height:1;opacity:0;transform:translate(-50%,-50%)}',
    '.cg-bit.is-dot{width:8px;height:12px;border-radius:2px;background:var(--c)}',
    '.cg.is-card .cg-bit,.cg-lbits .cg-bit{animation:cgPop var(--t,1.3s) var(--d) cubic-bezier(.15,.7,.3,1) forwards}',
    '@keyframes cgPop{0%{opacity:1;transform:translate(-50%,-50%) scale(.4) rotate(0deg)}70%{opacity:1}100%{opacity:0;transform:translate(calc(-50% + var(--x)),calc(-50% + var(--y))) scale(1) rotate(var(--r))}}',
    '.cg.is-shake{animation:cgShake .34s linear}',
    '@keyframes cgShake{20%{transform:translate(-4px,2px)}40%{transform:translate(4px,-2px)}60%{transform:translate(-3px,1px)}80%{transform:translate(2px,-1px)}}',
    '.cg-skip{position:absolute;left:0;right:0;bottom:calc(18px + env(safe-area-inset-bottom));text-align:center;font-size:12px;color:rgba(255,255,255,.55);letter-spacing:.04em}',
    '.cg.is-calm .cg-mid,.cg.is-calm .cg-bolts,.cg.is-calm .cg-bits,.cg.is-calm .cg-shine{display:none}',
    '.cg.is-calm.is-card .cg-card{animation:cgFade .4s ease-out forwards}',
    '@keyframes cgFade{from{opacity:0;transform:translate(-50%,-50%)}to{opacity:1;transform:translate(-50%,-50%)}}',
    '.cg-ring{position:fixed;z-index:99998;pointer-events:none;border-radius:12px;animation:cgRing 1.1s ease-out forwards}',
    '@keyframes cgRing{0%{box-shadow:0 0 0 0 rgba(255,215,106,.95),inset 0 0 0 2px rgba(255,215,106,.9)}40%{box-shadow:0 0 0 7px rgba(255,215,106,.45),0 0 34px 8px rgba(255,215,106,.55),inset 0 0 0 2px rgba(255,215,106,.9)}100%{box-shadow:0 0 0 14px rgba(255,215,106,0),inset 0 0 0 2px rgba(255,215,106,0)}}',
    '.cg-lbits{position:fixed;z-index:99999;width:0;height:0;pointer-events:none}',
    '@media (min-width:900px){.cg-mid{width:400px}.cg-row{font-size:19px}.cg-card{width:340px;padding:28px 22px}.cg-name{font-size:30px}.cg-hl{font-size:32px}.cg-num{font-size:68px}.cg-kick{font-size:14px}}'
  ].join('\n');

  function addCss() {
    if (document.getElementById('cgoatCss')) return;
    var s = document.createElement('style');
    s.id = 'cgoatCss'; s.textContent = CSS;
    (document.head || document.documentElement).appendChild(s);
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }
  function calm() { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }
  function hexRgb(h) {
    var m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(h || '').trim());
    if (!m) return null;
    var x = m[1].length === 3 ? m[1].replace(/./g, function (c) { return c + c; }) : m[1], v = parseInt(x, 16);
    return [v >> 16, (v >> 8) & 255, v & 255];
  }
  // The game's own colour (each page's --gold: 1000TRIES gold, 4000 GOALS red, G1 WINNER blue ...)
  function accent() {
    var a = '';
    try { a = getComputedStyle(document.documentElement).getPropertyValue('--gold').trim(); } catch (e) { /* no styles yet */ }
    return hexRgb(a) ? a : GOLD;
  }
  function buzz(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) { /* not on this device */ } }
  // A name never splits at its hyphen (the owner's rule): a non-breaking one
  function name(p) { return String((p && (p.name || p.record_name)) || '').replace(/\s*\((goat|legend|immortal)\)$/i, '').replace(/-/g, '\u2011'); }
  function num(p) { var T = window.T || {}, n = (p && p.tries_1998_plus) || 0; return T.fmt ? T.fmt(n) : String(n); }
  // The game's greats for the reel: its biggest numbers, pack and Legends together, never the GOAT himself
  function greats(g) {
    var T = window.T || {}, seen = {}, gk = name(g).toLowerCase();
    return (T.players || []).concat(T.LEGENDS || []).filter(function (p) {
      if (!p || typeof p.tries_1998_plus !== 'number' || p === g || (T.isGoat && T.isGoat(p)) || p.id === T.GOAT_SRC || /^goat-/.test(p.id || '')) return false;
      var k = name(p).toLowerCase();
      if (!k || k === gk || seen[k]) return false;
      seen[k] = 1;
      return true;
    }).sort(function (a, b) { return b.tries_1998_plus - a.tries_1998_plus; }).slice(0, 12);
  }
  function bits(n, emoji, spread, dot) {
    var out = '';
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, r = spread * (0.45 + Math.random() * 0.55), isDot = dot && i % 3 !== 0;
      out += '<i class="cg-bit' + (isDot ? ' is-dot' : '') + '" style="--x:' + Math.round(Math.cos(a) * r) + 'px;--y:' + Math.round(Math.sin(a) * r * 0.85 + 30) + 'px;--r:' +
        Math.round((Math.random() - 0.5) * 300) + 'deg;--d:' + Math.round(Math.random() * 140) + 'ms;--c:' + (i % 2 ? GOLD : '#fff3cf') + '">' + (isDot ? '' : emoji) + '</i>';
    }
    return out;
  }

  CC.goat = function (o) {
    o = o || {};
    var finished = false, root = null, timers = [];
    function done() {
      if (finished) return;
      finished = true;
      timers.forEach(clearTimeout);
      if (root && root.parentNode) root.parentNode.removeChild(root);
      if (typeof o.done === 'function') { try { o.done(); } catch (e) { /* the page's own step */ } }
    }
    try {
      var T = window.T || {}, g = o.player || (T.goatPlayer && T.goatPlayer());
      if (!g || !document.body) { done(); return; }
      addCss();
      var still = calm(), acc = accent(), accRgb = hexRgb(acc) || [241, 192, 115];
      var club = T.club && T.lastClub ? T.club(T.lastClub(g)) : null;
      var tone = typeof o.tone === 'function' ? o.tone : null;
      function play(f, d, ty, v) { if (tone) { try { tone(f, d, ty, 0, v); } catch (e) { /* audio unavailable */ } } }
      function later(ms, fn) { timers.push(setTimeout(function () { if (!finished) { try { fn(); } catch (e) { done(); } } }, ms)); }

      // The reel: the greats shuffled, three times round, then the GOAT (and one more under him)
      var gs = greats(g), list = [];
      for (var k = 0; k < 3 && gs.length; k++) list = list.concat(gs.slice().sort(function () { return Math.random() - 0.5; }));
      list = list.slice(0, 24);
      var at = list.length;
      list.push(g);
      var under = gs.filter(function (p) { return p !== list[at - 1]; })[0];
      if (under) list.push(under);
      var rows = list.map(function (p, i) {
        return '<div class="cg-row' + (i === at ? ' is-goat' : '') + '"><span>' + esc(name(p)) + (i === at ? ' &#x1F410;' : '') + '</span><b>' + esc(num(p)) + '</b></div>';
      }).join('');
      var unit = o.unit || T.TRY_LABEL || '';
      var head = String(o.head || T.GOAT_HEADLINE || '');
      var label = (head ? head + '. ' : '') + 'The GOAT: ' + name(g) + ', ' + num(g) + (unit ? ' ' + unit : '');

      root = document.createElement('div');
      root.className = 'cg' + (still ? ' is-calm' : '');
      root.setAttribute('role', 'dialog');
      root.setAttribute('aria-modal', 'true');
      root.setAttribute('aria-label', label);
      root.style.setProperty('--cg-acc', acc);
      root.style.setProperty('--cg-rgb', accRgb.join(','));
      if (club) { root.style.setProperty('--cg-club', club.primary); root.style.setProperty('--cg-ink', club.text || '#fff'); }
      root.innerHTML = '<div class="cg-glow"></div><div class="cg-flash"></div>' +
        '<svg class="cg-bolts" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">' +
        '<path d="M16 0 L21 9 L17 10 L24 21 L19 22 L27 36 L22 37 L30 52"/><path d="M85 2 L80 12 L84 13 L77 25 L81 26 L73 40 L77 41 L70 55"/></svg>' +
        '<div class="cg-mid" aria-hidden="true"><div class="cg-kick">&#x1F410; THE GOAT</div><div class="cg-reel"><div class="cg-strip">' + rows + '</div><div class="cg-win"></div></div></div>' +
        '<div class="cg-card">' + (head ? '<div class="cg-hl">' + esc(head) + '</div>' : '') + '<span class="cg-tag">&#x1F410; THE GOAT</span><div class="cg-name">' + esc(name(g)) + '</div>' +
        '<div class="cg-num">' + esc(num(g)) + '</div>' + (unit ? '<div class="cg-unit">' + esc(unit) + '</div>' : '') + '<i class="cg-shine"></i></div>' +
        '<div class="cg-bits" aria-hidden="true">' + (still ? '' : bits(26, '&#x1F410;', Math.min(window.innerWidth, 520) * 0.62, true)) + '</div>' +
        '<div class="cg-skip">Tap to skip</div>';
      document.body.appendChild(root);
      root.addEventListener('click', function () {
        if (finished) return;
        root.classList.add('is-out');
        timers.push(setTimeout(done, 160));
      });
      var strip = root.querySelector('.cg-strip');
      // A long name gets smaller until it fits its row (never cut off)
      Array.prototype.forEach.call(root.querySelectorAll('.cg-row span'), function (s) {
        for (var fs = 17; s.scrollWidth > s.clientWidth + 1 && fs > 11; fs--) s.style.fontSize = fs + 'px';
      });
      later(5200, done); // never longer than this, whatever happens

      if (still) {
        later(30, function () { root.classList.add('is-on', 'is-card'); buzz(40); play(523, 0.2, 'triangle', 0.3); play(784, 0.4, 'triangle', 0.3); });
        later(1900, function () { root.classList.add('is-out'); });
        later(2250, done);
        return;
      }
      var SPIN = 1650, LOCK = 260 + SPIN;
      later(20, function () { root.classList.add('is-on', 'is-bolt'); buzz(15); play(98, 0.3, 'sawtooth', 0.12); });
      later(260, function () {
        root.classList.remove('is-bolt');
        root.classList.add('is-spin');
        strip.style.transition = 'transform ' + SPIN + 'ms cubic-bezier(.1,.62,.16,1)';
        strip.style.transform = 'translateY(' + (-(at - 1) * ROW) + 'px)';
      });
      // The reel's clicks, slowing as it does
      for (var i = 0; i < 16; i++) later(260 + Math.round(SPIN * Math.pow(i / 16, 1.9)), function () { play(1500, 0.025, 'square', 0.05); });
      later(LOCK, function () {
        root.classList.add('is-lock', 'is-shake');
        buzz([25, 35, 25, 35, 80]);
        play(110, 0.3, 'sine', 0.5);
        [392, 523, 659, 784].forEach(function (f, n) { later(n * 75, function () { play(f, n === 3 ? 0.55 : 0.18, 'triangle', 0.32); }); });
      });
      later(LOCK + 380, function () { root.classList.remove('is-shake'); root.classList.add('is-card'); play(1046, 0.5, 'sine', 0.18); });
      later(LOCK + 1500, function () { root.classList.add('is-out'); });
      later(LOCK + 1820, done);
    } catch (e) { done(); }
  };

  // His card going into its spot: a gold ring round the spot and a small burst of goats
  CC.goatLand = function (el, o) {
    try {
      if (!el || !el.getBoundingClientRect || !document.body) return;
      addCss();
      var r = el.getBoundingClientRect();
      if (!r.width) return;
      var ring = document.createElement('div');
      ring.className = 'cg-ring';
      ring.style.cssText = 'left:' + Math.round(r.left) + 'px;top:' + Math.round(r.top) + 'px;width:' + Math.round(r.width) + 'px;height:' + Math.round(r.height) + 'px';
      document.body.appendChild(ring);
      setTimeout(function () { if (ring.parentNode) ring.parentNode.removeChild(ring); }, 1200);
      buzz(30);
      if (o && typeof o.tone === 'function') { try { o.tone(784, 0.14, 'triangle', 0, 0.3); o.tone(1175, 0.3, 'triangle', 0.09, 0.3); } catch (e) { /* audio unavailable */ } }
      if (calm()) return;
      var b = document.createElement('div');
      b.className = 'cg-lbits';
      b.style.cssText = 'left:' + Math.round(r.left + r.width / 2) + 'px;top:' + Math.round(r.top + r.height / 2) + 'px;--t:1s';
      b.innerHTML = bits(12, '&#x1F410;', 90, true);
      document.body.appendChild(b);
      setTimeout(function () { if (b.parentNode) b.parentNode.removeChild(b); }, 1300);
    } catch (e) { /* only a flourish */ }
  };
})();
