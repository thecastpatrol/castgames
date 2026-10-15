/* CAST Games: the World Legend reveal (8 Oct 2026), for World Cup mode in both games. The owner: an International
   Legend turns up with a reveal that flashes through the nations' looks, slows, and lands on the player's nation. The
   nation's look is the star: gold is only an accent (the label, the landed badge's edge, its ring, shine and a few
   sparkles), never all gold. Always "World Legend(s)". One full-screen moment, about 2 to 3 seconds plus a hold:
     spin   each reel is a nation badge (CastNations.svg) turning through the looks about 12 a second, slowing over its
            last second (27-0's quarter final draw reveal, wcReveal, is the model)
     land   the reel lands on its own nation: a small pop, a gold ring and flash, a shine across the badge and the nation's
            colour glowing behind it; then the nation's name, the player's name and the line under it come in. With three
            reels the landings come 0.35 s apart, so it builds
     hold   the landed state stays for hold ms, then it finishes by itself
   A tap during the spin lands every reel at once; a tap on the landed state finishes (Escape does the same; the tap
   layer is a real button, so Enter and Space work and the games' Every Tap Lands fix covers it). A phone set to reduce
   motion gets the landed state straight away and it finishes after the hold; a hidden tab finishes straight away with
   nothing shown (and a tab hidden part way through finishes then). Without cast-nations.js, or for a nation it doesn't
   draw, a reel is a plain dark tile with the three-letter code. Anything that goes wrong removes the overlay and goes
   straight on to done(). Timing runs on setTimeout and performance.now, never on requestAnimationFrame (it stops in a
   hidden tab), so done() always comes, and only once.
   CastIntl.reveal(o) returns { skip() }; skip() finishes at once (the overlay goes, done() fires if it hasn't yet)
     sides    optional { key: { name, short, code, c1, c2, glow } }: faces that aren't nations (a club's jersey in its
              colours) for the keys in reels and pool (the 1000TRIES Legends and Immortal Picks). draw(w, h), when
              given, returns the face's <svg> itself: the other CAST Games pass the club's real kit (js/cast-kits.js)
     reels    [{ nation, name, sub }], 1 to 3: 1 for a free World Legend in a spin or an offer, 3 for an
              World Legend Pick's three. nation: a cast-nations key ('aus', 'gbr', 'leb', ...); sub: the line under
              the name ('Halfback/Five-Eighth · 96'; with three reels its ' · ' parts stack, each on one line, so pass
              short ones there: 'HB/FE · 96'). Optional nationName replaces
              the nation's name
     kicker   the gold label at the top (default 'World Legend')       title  an optional heading under it
     tone     'bronze' for 1000TRIES's Legends Pick (its Legend cards are bronze, 8 Oct 2026); gold otherwise
     pool     the nation keys the reels turn through (default: the World Cup sides cast-nations.js draws)
     hold     ms the landed state stays before it finishes (default 1400)
     label    what a screen reader hears for the dialog (default: the title, else the kicker)
     done()   called exactly once: after the hold, after a tap on the landed state or after skip() (the overlay is gone by
              then), or straight away for a hidden tab or a failure; never before reveal() has returned
   A new reveal while one is open finishes the open one first. Styles: .ci-* (in cast-account.css). Master copy:
   shared/cast-account/ (tools/sync_shared.py copies it to both games). */
(function () {
  'use strict';
  // Reel 1 lands LAND ms in and each next one STAGGER later. Before a landing a reel's last gaps are TAIL (ms); before those
  // it turns every FAST ms (about 12 a second). The last face settles over SETTLE; the words under a reel are in TEXT after
  // it lands, and the hold starts then. A tap counts from ARM ms after opening (so the tap that opened it can't skip it)
  // and, on the landed state, from READY ms after the landing (so a double tap on the spin doesn't skip the names too)
  var LAND = 1650, STAGGER = 350, FAST = 83, TAIL = [95, 112, 140, 180, 230, 300], SETTLE = 440, TEXT = 700, HOLD = 1400, ARM = 250, READY = 350;
  var POOL = ['aus', 'nzl', 'eng', 'gbr', 'fra', 'sam', 'ton', 'fij', 'png', 'leb', 'cok'];
  // Each nation: its name, its name three across, its code, the colour that glows behind its badge once it lands
  var NATION = {
    aus: ['Australia', 'Australia', 'AUS', '#00a651'],
    nzl: ['New Zealand', 'New Zealand', 'NZL', '#d9dee8'],
    eng: ['England', 'England', 'ENG', '#e0213a'],
    gbr: ['Great Britain', 'Great Britain', 'GBR', '#d4213d'],
    fra: ['France', 'France', 'FRA', '#3b63ff'],
    ita: ['Italy', 'Italy', 'ITA', '#00a651'],
    sco: ['Scotland', 'Scotland', 'SCO', '#2a7fd4'],
    sam: ['Samoa', 'Samoa', 'SAM', '#d4213d'],
    ton: ['Tonga', 'Tonga', 'TON', '#d01818'],
    fij: ['Fiji', 'Fiji', 'FIJ', '#68bfe5'],
    png: ['Papua New Guinea', 'PNG', 'PNG', '#d4213d'],
    leb: ['Lebanon', 'Lebanon', 'LEB', '#ed1c24'],
    cok: ['Cook Islands', 'Cook Islands', 'COK', '#2e9b3a']
  };
  var active = null; // the reveal on screen (its handle)
  /* Sides that aren't nations (8 Oct 2026, the owner: the 1000TRIES Legends Pick "to match this"): o.sides gives each key
     its colours and words, { name, short, code, c1, c2, glow }, and its face is drawn from them (its jersey's design, or
     its draw(w, h)). A side with no design is plain in its colours, never a guessed V (16 Oct 2026, the owner: "Don't just
     assume always that they are a V-shaped jersey design"); a nation cast-nations.js draws shows its own look */
  var SIDES = null;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }
  function str(s) { return s == null ? '' : String(s).trim(); }
  function clock() { return window.performance && typeof window.performance.now === 'function' ? window.performance.now() : Date.now(); }
  // Straight after the current code (a hidden tab holds timers back, a promise's turn isn't held)
  function soon(fn) { if (window.Promise) window.Promise.resolve().then(fn); else setTimeout(fn, 0); }
  function warn(e) { try { if (window.console && console.warn) console.warn('CastIntl:', e); } catch (x) { /* no console */ } }
  function rgbOf(hex) {
    var m = /^#?([0-9a-f]{6})$/i.exec(str(hex));
    if (!m) return '138, 147, 166';
    var v = parseInt(m[1], 16);
    return (v >> 16) + ', ' + ((v >> 8) & 255) + ', ' + (v & 255);
  }
  function calmNow() {
    try { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; }
  }
  function drawn(k) {
    var N = window.CastNations;
    try { return !!(N && typeof N.has === 'function' && typeof N.svg === 'function' && N.has(k)); } catch (e) { return false; }
  }
  function hex(c, d) { return /^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(str(c)) ? str(c) : d; }
  function nationOf(key, name) {
    var k = str(key).toLowerCase(), sd = SIDES && Object.prototype.hasOwnProperty.call(SIDES, k) ? SIDES[k] : null;
    if (sd) {
      var c1 = hex(sd.c1, '#1a1a2e'), c2 = hex(sd.c2, '#ffffff'), pat = str(sd.pattern), own = typeof sd.draw === 'function' ? sd.draw : null;
      var cols = (Array.isArray(sd.colors) ? sd.colors : []).map(function (c) { return hex(c, ''); }).filter(Boolean);
      // No design given: the nation's own look when cast-nations.js draws it, else plain with a collar in its second colour
      var natLook = !own && !pat && drawn(k);
      if (!own && !pat && !natLook) { pat = 'plain'; if (!cols.length) cols = [c2]; }
      return { key: k, look: natLook, side: !natLook, draw: own, c1: c1, c2: c2, name: name || str(sd.name) || k, short: name || str(sd.short) || str(sd.name) || k,
        code: str(sd.code) || k.slice(0, 3).toUpperCase(), glow: hex(sd.glow, c1),
        pattern: pat, base: hex(sd.base, c1), colors: cols,
        count: Math.max(2, Math.min(12, +sd.count || 5)), dir: str(sd.dir), sizes: Array.isArray(sd.sizes) ? sd.sizes.map(Number) : null, collar: str(sd.collar) };
    }
    var n = Object.prototype.hasOwnProperty.call(NATION, k) ? NATION[k] : null;
    var code = n ? n[2] : k.slice(0, 3).toUpperCase() || '?';
    return { key: k, look: drawn(k), name: name || (n ? n[0] : code), short: name || (n ? n[1] : code), code: code, glow: n ? n[3] : '#8a93a6' };
  }
  // A face: the nation's look with its code in a pill (the way 27-0's big match plates show a side), or a plain dark tile
  // with the code for a nation cast-nations.js doesn't draw (or when it isn't there)
  function face(nt, w, h) {
    var svg = '';
    if (nt.look) { try { svg = String(window.CastNations.svg(nt.key, w, h) || ''); } catch (e) { svg = ''; } }
    if (nt.draw) { try { svg = String(nt.draw(w, h) || ''); } catch (e) { svg = ''; } } // the club's real kit (the game's own drawing)
    if (nt.side && !svg) svg = jersey(nt, w, h);
    var el = document.createElement('div');
    el.className = 'ci-face' + (svg ? ' has-look' : '') + (nt.draw && svg ? ' is-kit' : '');
    el.innerHTML = svg + '<span class="ci-code">' + esc(nt.code) + '</span>';
    return el;
  }
  /* A club's jersey from its design (o.sides: pattern, base, colors, sizes, count, dir), researched per club by the game
     that passes them (JERSEYS below, 8 Oct 2026, the owner: "make the jerseys more accurate"):
       hoops    bands across, colors[0] and colors[1] taking turns, count of them
       bands    bands across in colors[] order, sizes[] their relative heights (equal when not given)
       stripes  bands down, taking turns
       v        a V from the shoulders in colors[0]
       y        the same with a stripe on from its point to the hem (Adelaide)
       v2       the shoulders and upper chest in colors[1] down to a V, a band of colors[0] along it, colors[2] a thin edge
       sash     a diagonal band (dir 'right' starts at the right shoulder)
       yoke     a band across the shoulders in colors[0], colors[1] a thin edge under it
       sides    side panels in colors[0], colors[1] their edge
       split    halves; plain: one colour, with a collar in colors[0] when given (collar 'big': a deep V-neck)
     Any other design is drawn plain (never a V it wasn't given) */
  function jersey(nt, w, h) {
    var c = nt.colors.length ? nt.colors : [nt.c2], n = nt.count, i, y, out = '';
    var r = function (n0) { return Math.round(n0 * 10) / 10; };
    var R = function (x, y0, a, b, f) { return '<rect x="' + r(x) + '" y="' + r(y0) + '" width="' + r(a) + '" height="' + r(b) + '" fill="' + f + '"/>'; };
    var P = function (pts, f) { return '<polygon points="' + pts.map(function (q) { return r(q[0]) + ',' + r(q[1]); }).join(' ') + '" fill="' + f + '"/>'; };
    var side = h * 0.16, point = h * 0.56, m = w / 2; // a V: from the shoulders' edge down to the middle of the chest
    var vBand = function (off, t, f) { return P([[0, side + off], [m, point + off], [w, side + off], [w, side + off + t], [m, point + off + t], [0, side + off + t]], f); };
    out += R(0, 0, w, h, nt.base);
    if (nt.pattern === 'hoops' || nt.pattern === 'bands') {
      var cols = nt.pattern === 'bands' ? c : [], sz = nt.sizes || [];
      if (nt.pattern === 'hoops') for (i = 0; i < n; i++) cols.push(i % 2 ? (c[1] || nt.base) : c[0]);
      var tot = cols.reduce(function (a, x, k) { return a + (+sz[k] > 0 ? +sz[k] : 1); }, 0);
      y = 0;
      cols.forEach(function (col, k) { var bh = h * (+sz[k] > 0 ? +sz[k] : 1) / tot; out += R(0, y, w, bh + 0.6, col); y += bh; });
    } else if (nt.pattern === 'stripes') {
      var bw = w / n; for (i = 0; i < n; i++) out += R(i * bw, 0, bw + 0.6, h, i % 2 ? (c[1] || nt.base) : c[0]);
    } else if (nt.pattern === 'v' || nt.pattern === 'y') {
      var t = h * 0.17;
      if (nt.pattern === 'y') out += R(m - t * 0.45, point, t * 0.9, h - point, c[0]);
      out += P([[0, 0], [t, 0], [m, point - side * 0.2], [w - t, 0], [w, 0], [w, t * 0.6], [m, point - side * 0.2 + t], [0, t * 0.6]], c[0]);
    } else if (nt.pattern === 'v2') {
      out += P([[0, 0], [w, 0], [w, side], [m, point], [0, side]], c[1] || c[0]); // the shoulders, down to the V
      out += vBand(0, h * 0.13, c[0]);
      if (c[2]) out += vBand(h * 0.13, h * 0.04, c[2]);
    } else if (nt.pattern === 'sash') {
      var sw = h * 0.36, lr = nt.dir !== 'right';
      out += P(lr ? [[0, 0], [sw, 0], [w, h - sw], [w, h], [w - sw, h], [0, sw]] : [[w, 0], [w - sw, 0], [0, h - sw], [0, h], [sw, h], [w, sw]], c[0]);
    } else if (nt.pattern === 'yoke') {
      out += R(0, 0, w, h * 0.3, c[0]);
      if (c[1]) out += R(0, h * 0.3, w, h * 0.05, c[1]);
    } else if (nt.pattern === 'sides') {
      out += R(0, 0, w * 0.18, h, c[0]) + R(w * 0.82, 0, w * 0.18, h, c[0]);
      if (c[1]) out += R(w * 0.18, 0, w * 0.025, h, c[1]) + R(w * 0.795, 0, w * 0.025, h, c[1]);
    } else if (nt.pattern === 'split') {
      out += R(m, 0, w - m, h, c[0]);
    } else if (nt.pattern === 'plain') {
      // the collar; collar 'big' is a deep V-neck (the Raiders and the Jets: the owner, 8 Oct 2026)
      if (nt.colors.length) out += nt.collar === 'big' ? P([[m - w * 0.3, 0], [m + w * 0.3, 0], [m, h * 0.46]], c[0]) : P([[m - w * 0.16, 0], [m + w * 0.16, 0], [m, h * 0.2]], c[0]);
    } else {
      // A design this doesn't know: plain with a small collar, never a guessed V (16 Oct 2026)
      out += P([[m - w * 0.16, 0], [m + w * 0.16, 0], [m, h * 0.2]], c[0]);
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" aria-hidden="true">' + out + '</svg>';
  }
  // First names over the surname, split the way 27-0's cards find a surname (cardSurname): 'Hazem' over 'El Masri'
  function nameParts(s) {
    var w = str(s).split(/\s+/), i = w.length - 1;
    if (!w[0]) return ['', ''];
    if (i < 1) return ['', w[0]];
    if (i > 1 && /^(jr|jnr|junior|snr|sr)\.?$/i.test(w[i])) i--;
    while (i > 1 && /^(de|da|di|du|del|le|la|van|von|el|te|ter|ah|yow)$/i.test(w[i - 1])) i--;
    return [w.slice(0, i).join(' '), w.slice(i).join(' ')];
  }
  // Words with a hyphen stay whole (Five-Eighth, Puig-Aubert: the owner's rule) and a line may break after a slash
  function words(s) {
    return str(s).split(/(\s+)/).map(function (w) {
      if (!w || /^\s+$/.test(w)) return w;
      return w.split('/').map(function (p) { p = esc(p); return p.indexOf('-') > 0 ? '<span class="ci-nb">' + p + '</span>' : p; }).join('/<wbr>');
    }).join('');
  }
  // The line under a name, in its ' · ' parts (one line with one reel, stacked with three); a bare number (the rating)
  // is picked out in white
  function subHtml(s) {
    return str(s).split(/\s+\u00b7\s+/).filter(function (x) { return str(x); }).map(function (x) {
      return '<span class="ci-seg' + (/^\d+(\.\d+)?$/.test(str(x)) ? ' is-num' : '') + '">' + words(x) + '</span>';
    }).join('');
  }
  // Words kept to one line get smaller until they fit their column (a long name on a small phone); a title that still
  // can't fit wraps instead (balanced)
  function fit(el, room, min, wrap) {
    if (!el || !(room > 0)) return;
    var w = el.scrollWidth;
    if (w <= room) return;
    var fs = parseFloat(window.getComputedStyle(el).fontSize) || 12, to = Math.floor(fs * room / w * 10) / 10;
    el.style.fontSize = Math.max(min, to) + 'px';
    if (to < min && wrap) el.style.whiteSpace = 'normal';
  }
  // Badge sizes for the screen: one big badge, or two or three side by side across a phone (16px gutters)
  function sizes(n) {
    var de = document.documentElement, vw = window.innerWidth || (de && de.clientWidth) || 375, vh = window.innerHeight || (de && de.clientHeight) || 700, w, h, gap = 12;
    if (n === 1) {
      w = Math.max(150, Math.min(260, vw - 100));
      h = Math.round(w * 2 / 3);
      if (h > vh - 330) { h = Math.max(90, vh - 330); w = Math.round(h * 1.5); }
    } else {
      gap = vw < 420 ? 10 : 16;
      w = Math.max(84, Math.min(n === 2 ? 180 : 150, Math.floor((Math.min(vw, 600) - 32 - gap * (n - 1)) / n)));
      h = Math.round(w * 0.66);
      if (h > vh - 300) { h = Math.max(60, vh - 300); w = Math.round(h / 0.66); }
    }
    return { w: Math.round(w), h: Math.round(h), gap: gap };
  }
  // When a reel changes face, from its first face (0) to its landing (land): every FAST ms, then the TAIL's slower gaps
  function timesFor(land) {
    var t = land, back = [land];
    for (var j = TAIL.length - 1; j >= 0; j--) { t -= TAIL[j]; back.push(t); }
    while (t - FAST >= FAST * 0.6) { t -= FAST; back.push(t); }
    back.push(0);
    return back.reverse();
  }
  // The nations a reel turns through: never the same twice running, never one a reel beside it shows at the same moment
  // (three of a kind would look like a result), not its own just before it lands, then its own
  function keysFor(times, target, pool, others) {
    var out = [], last = null, count = times.length;
    for (var i = 0; i < count - 1; i++) {
      var busy = shownBetween(others, times[i] - 40, times[i + 1] + 40), opts = [], j; // (40 ms either side: timers run late)
      for (j = 0; j < pool.length; j++) if (pool[j] !== last && busy.indexOf(pool[j]) < 0 && (i < count - 2 || pool[j] !== target)) opts.push(pool[j]);
      if (!opts.length) for (j = 0; j < pool.length; j++) if (pool[j] !== last) opts.push(pool[j]);
      if (!opts.length) opts = pool;
      last = opts[Math.floor(Math.random() * opts.length)];
      out.push(last);
    }
    out.push(target);
    return out;
  }
  // The nations the given reels show at any time from a to b (a landed reel keeps showing its own)
  function shownBetween(others, a, b) {
    var out = [];
    others.forEach(function (r) {
      for (var j = 0; j < r.times.length; j++) if (r.times[j] < b && (j + 1 >= r.times.length || r.times[j + 1] > a)) out.push(r.keys[j]);
    });
    return out;
  }
  // The looks to turn through: those given (else the World Cup's) that cast-nations.js draws or o.sides gives (every club,
  // not only the nations among them: 16 Oct 2026); without them, their codes
  function poolOf(p) {
    var keys = (Array.isArray(p) && p.length ? p : POOL).map(function (k) { return str(k).toLowerCase(); })
      .filter(function (k, i, a) { return k && a.indexOf(k) === i; });
    var looks = keys.filter(function (k) { return drawn(k) || !!(SIDES && Object.prototype.hasOwnProperty.call(SIDES, k)); });
    if (looks.length >= 2) return looks;
    if (keys.length >= 2) return keys;
    looks = POOL.filter(drawn);
    return looks.length >= 2 ? looks : POOL.slice();
  }

  function reveal(o) {
    o = o || {};
    if (active) active.skip(); // one at a time: an open reveal finishes first
    var called = false, closed = false, building = true, root = null, timer = 0, prevFocus = null, onKey = null, onVis = null;
    var reels = [], hit = null, hint = null, sr = null, t0 = clock(), landedAll = false, endAt = -1, readyAt = 0, calm = false, hold = HOLD, sz = null, seen = {};
    var handle = { skip: function () { close(); } };

    // done() once; an error in it is the caller's, so it's reported on its own but can't stop the clean-up
    function go() {
      if (called) return;
      called = true;
      if (typeof o.done !== 'function') return;
      try { o.done(); } catch (e) { setTimeout(function () { throw e; }, 0); }
    }
    function close() {
      if (closed) return;
      closed = true;
      try {
        clearTimeout(timer);
        if (onKey) document.removeEventListener('keydown', onKey, true);
        if (onVis) document.removeEventListener('visibilitychange', onVis);
        if (root && root.parentNode) root.parentNode.removeChild(root);
        if (prevFocus && prevFocus !== document.body && prevFocus.isConnected && typeof prevFocus.focus === 'function') prevFocus.focus({ preventScroll: true });
      } catch (e) { warn(e); }
      if (active === handle) active = null;
      if (building) soon(go); else go();
    }
    function safe(fn) {
      return function (e) {
        if (closed) return;
        try { fn(e); } catch (x) { warn(x); close(); }
      };
    }
    function info(k) { return seen[k] || (seen[k] = nationOf(k)); }

    // Shows face idx of reel r. The face before slides down and out as the new one comes in from above, both at the same
    // pace, so it reads as a reel turning; the last one settles with a little bounce. instant: no slide (a skip, calm)
    function show(r, idx, instant) {
      var last = idx === r.keys.length - 1, f = face(last ? r.nt : info(r.keys[idx]), sz.w, sz.h), old = r.face;
      var outs = r.win.querySelectorAll('.ci-face.is-out');
      for (var i = 0; i < outs.length; i++) outs[i].parentNode.removeChild(outs[i]);
      if (instant) {
        if (old && old.parentNode) old.parentNode.removeChild(old);
      } else {
        var dur = last ? SETTLE : Math.min(240, Math.max(60, r.times[idx + 1] - r.times[idx]));
        var ease = last ? 'cubic-bezier(.3, 1.4, .5, 1)' : dur < 110 ? 'linear' : 'cubic-bezier(.25, .7, .35, 1)';
        f.className += ' is-in';
        f.style.animationDuration = dur + 'ms';
        f.style.animationTimingFunction = ease;
        if (old) {
          old.className = old.className.replace(' is-in', '') + ' is-out';
          old.style.animationDuration = dur + 'ms';
          old.style.animationTimingFunction = ease;
        }
      }
      r.win.insertBefore(f, r.win.firstChild);
      r.face = f;
      r.k = idx;
    }
    function land(r, instant) {
      if (r.landed) return;
      r.landed = true;
      show(r, r.keys.length - 1, instant);
      r.el.classList.add('is-landed');
    }
    function announce() {
      if (closed || !sr) return;
      sr.textContent = (str(o.title) || str(o.kicker) || 'World Legend' + (reels.length > 1 ? 's' : '')) + ': ' + reels.map(function (r) {
        return [r.name, r.nt.name, r.sub].filter(Boolean).join(', ');
      }).join('; ') + '.';
    }
    function allLanded(t, quick) {
      if (landedAll) return;
      landedAll = true;
      root.classList.add('is-landed');
      hint.textContent = 'Tap to Continue';
      hit.setAttribute('aria-label', 'Continue');
      readyAt = t + (calm ? ARM : READY);
      endAt = t + (quick ? 0 : TEXT) + hold;
      if (calm) setTimeout(safe(announce), 120); else announce(); // the live region gets the names once they show
    }
    // The clock: lands each reel's faces on time (catching up when timers ran late) and ends after the hold
    function pump() {
      timer = 0;
      var t = clock() - t0, next = Infinity;
      if (!landedAll) {
        reels.forEach(function (r) {
          if (r.landed) return;
          var idx = r.k;
          while (idx + 1 < r.times.length && r.times[idx + 1] <= t + 4) idx++;
          if (idx === r.k) return;
          if (idx === r.times.length - 1) land(r, false); else show(r, idx, idx > r.k + 1);
        });
        if (reels.every(function (r) { return r.landed; })) allLanded(t, false);
      }
      if (endAt >= 0 && t >= endAt) { close(); return; } // (endAt -1: not landed yet; a hold of 0 can end at 0)
      reels.forEach(function (r) { if (!r.landed) next = Math.min(next, r.times[r.k + 1]); });
      if (endAt >= 0) next = Math.min(next, endAt);
      if (next < Infinity) timer = setTimeout(safe(pump), Math.max(0, next - (clock() - t0)));
    }
    function skipToLanded(t) {
      root.classList.add('is-skip');
      reels.forEach(function (r) { land(r, true); });
      allLanded(t, true);
      clearTimeout(timer);
      timer = setTimeout(safe(pump), Math.max(0, endAt - (clock() - t0)));
    }
    function tap() {
      var t = clock() - t0;
      if (t < ARM) return;
      if (!landedAll) skipToLanded(t);
      else if (t >= readyAt) close();
    }

    function start() {
      if (document.hidden) { close(); return; }
      var list = (Array.isArray(o.reels) ? o.reels : []).filter(function (r) { return r && typeof r === 'object'; }).slice(0, 3);
      if (!list.length) { close(); return; }
      SIDES = o.sides && typeof o.sides === 'object' ? o.sides : null;
      var n = list.length, kicker = str(o.kicker) || 'World Legend', title = str(o.title), pool = poolOf(o.pool);
      calm = calmNow();
      hold = typeof o.hold === 'number' && isFinite(o.hold) && o.hold >= 0 ? o.hold : HOLD;
      sz = sizes(n);
      reels = [];
      list.forEach(function (r, i) {
        var times = timesFor(LAND + i * STAGGER), nt = nationOf(r.nation, str(r.nationName));
        reels.push({ i: i, nt: nt, name: str(r.name), sub: str(r.sub), times: times, keys: keysFor(times, nt.key, pool, reels.slice()), k: -1, landed: false, el: null, win: null, face: null });
      });
      root = document.createElement('div');
      root.className = 'ci ' + (n === 1 ? 'ci-n1' : 'ci-nm') + (calm ? ' is-calm' : '') + (str(o.tone) === 'bronze' ? ' is-bronze' : '');
      root.setAttribute('role', 'dialog');
      root.setAttribute('aria-modal', 'true');
      root.setAttribute('aria-label', str(o.label) || title || kicker);
      root.style.setProperty('--ci-w', sz.w + 'px');
      root.style.setProperty('--ci-h', sz.h + 'px');
      root.style.setProperty('--ci-gap', sz.gap + 'px');
      root.innerHTML =
        '<div class="ci-rays" aria-hidden="true"></div>' +
        '<div class="ci-stage" aria-hidden="true">' +
          '<div class="ci-kick"><span>' + esc(kicker) + '</span></div>' + (title ? '<div class="ci-title">' + words(title) + '</div>' : '') +
          '<div class="ci-reels">' + reels.map(function (r) {
            var p = nameParts(r.name);
            return '<div class="ci-reel" style="--i:' + r.i + ';--ci-glow:' + rgbOf(r.nt.glow) + '">' +
              '<div class="ci-badge"><i class="ci-glow"></i><i class="ci-ring"></i>' +
                '<div class="ci-tile"><div class="ci-win"><i class="ci-flash"></i><i class="ci-shine"></i></div></div>' +
                '<i class="ci-spark ci-spark-1"></i><i class="ci-spark ci-spark-2"></i><i class="ci-spark ci-spark-3"></i><i class="ci-spark ci-spark-4"></i>' +
              '</div>' +
              '<div class="ci-nation">' + words(n > 1 ? r.nt.short : r.nt.name) + '</div>' +
              // Side by side, every column keeps every row (a one-word name keeps an empty first-name row),
              // so the names, positions and ratings line up across (the owner, 8 Oct 2026: "not even ... pls fix")
              '<div class="ci-name">' + (p[0] || n > 1 ? '<span class="ci-first">' + (p[0] ? words(p[0]) : '&nbsp;') + '</span>' : '') + '<span class="ci-last">' + words(p[1]) + '</span></div>' +
              (r.sub ? '<div class="ci-sub">' + subHtml(r.sub) + '</div>' : '') +
            '</div>';
          }).join('') + '</div>' +
        '</div>' +
        '<div class="ci-sr" role="status" aria-live="polite"></div>' +
        '<button type="button" class="ci-hit" aria-label="Skip"><span class="ci-hint" aria-hidden="true">Tap to Skip</span></button>';
      var els = root.querySelectorAll('.ci-reel');
      reels.forEach(function (r, i) { r.el = els[i]; r.win = els[i].querySelector('.ci-win'); });
      hit = root.querySelector('.ci-hit');
      hint = root.querySelector('.ci-hint');
      sr = root.querySelector('.ci-sr');

      // The first faces (or, reducing motion, the landed state) are there from the first frame
      if (calm) reels.forEach(function (r) { land(r, true); });
      else reels.forEach(function (r) { show(r, 0, false); });
      prevFocus = document.activeElement;
      document.body.appendChild(root);
      active = handle;
      var room = root.querySelector('.ci-stage').clientWidth, kick = root.querySelector('.ci-kick');
      fit(kick.firstChild, room - 36, 9, false); // the label's words, leaving its gold rules a little room
      if (kick.firstChild.style.fontSize) kick.style.fontSize = kick.firstChild.style.fontSize;
      fit(root.querySelector('.ci-title'), room, 18, true);
      reels.forEach(function (r) {
        var col = r.el.clientWidth;
        fit(r.el.querySelector('.ci-nation'), col, 8, false);
        fit(r.el.querySelector('.ci-first'), col, 9, false);
        fit(r.el.querySelector('.ci-last'), col, 11, false);
        Array.prototype.forEach.call(r.el.querySelectorAll('.ci-seg'), function (seg) { fit(seg, col, 9, false); });
      });
      t0 = clock();
      if (calm) allLanded(0, true);

      hit.addEventListener('click', safe(function (e) { e.preventDefault(); e.stopPropagation(); tap(); }));
      onKey = safe(function (e) { if (e.key === 'Escape' || e.key === 'Esc') { e.preventDefault(); e.stopPropagation(); tap(); } });
      onVis = safe(function () { if (document.hidden) close(); });
      document.addEventListener('keydown', onKey, true);
      document.addEventListener('visibilitychange', onVis);
      try { hit.focus({ preventScroll: true }); } catch (e) { /* older browsers */ }
      timer = setTimeout(safe(pump), calm ? hold : Math.max(0, reels[0].times[1]));
    }

    try { start(); } catch (e) { warn(e); close(); }
    building = false;
    return handle;
  }

  /* Each club's jersey for the faces of a club reveal (the Legends and Immortal Picks: 1000TRIES js/app.js packIntro, 27-0
     js/picks.js; 8 Oct 2026, the owner: "make the jerseys more accurate ... research it online"): each club's best-known
     design, researched from club, Wikipedia and jersey-history sources; colours marked by eye where no official ones were
     found. The owner approved all 28 (Raiders and Newtown Jets with the bigger V-neck) */
  var JERSEYS = {
    adelaide: { pattern: 'y', base: '#E2373F', colors: ['#22409A'] },
    balmain: { pattern: 'v', base: '#F5A623', colors: ['#000000'] },
    bears: { pattern: 'hoops', base: '#E1251B', colors: ['#000000', '#E1251B'], count: 8 },
    broncos: { pattern: 'bands', base: '#650038', colors: ['#650038', '#FFFFFF', '#650038', '#FFFFFF', '#650038', '#FFFFFF', '#FFCE34'], sizes: [3.2, 0.55, 0.55, 0.55, 0.55, 0.55, 3] },
    bulldogs: { pattern: 'v', base: '#FFFFFF', colors: ['#0054A4'] },
    cowboys: { pattern: 'v2', base: '#002B5C', colors: ['#FFDD00', '#FFFFFF'] },
    dolphins: { pattern: 'bands', base: '#E0121A', colors: ['#E0121A', '#FFFFFF', '#D9B77A', '#FFFFFF', '#D9B77A', '#FFFFFF'], sizes: [5, 1, 1, 1, 1, 1] },
    dragons: { pattern: 'v', base: '#FFFFFF', colors: ['#E2231B'] },
    eels: { pattern: 'hoops', base: '#006EB5', colors: ['#006EB5', '#FFD326'], count: 9 },
    knights: { pattern: 'stripes', base: '#0054A6', colors: ['#0054A6', '#E92D2B'], count: 7 },
    northerneagles: { pattern: 'sides', base: '#7A1F47', colors: ['#000000', '#E31B23'] },
    panthers: { pattern: 'bands', base: '#000000', colors: ['#000000', '#FFFFFF', '#000000', '#FFFFFF', '#000000', '#FFFFFF', '#000000'], sizes: [5, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8] },
    rabbitohs: { pattern: 'bands', base: '#007D48', colors: ['#007D48', '#DD042B', '#007D48', '#DD042B', '#007D48', '#DD042B', '#007D48'], sizes: [2, 1, 2, 1, 2, 1, 2] },
    raiders: { pattern: 'plain', base: '#36AD2D', colors: ['#002856'], collar: 'big' },
    roosters: { pattern: 'v2', base: '#00305E', colors: ['#FFFFFF', '#E82C2E', '#E82C2E'] },
    seaeagles: { pattern: 'bands', base: '#6C1D45', colors: ['#6C1D45', '#FFFFFF', '#6C1D45', '#FFFFFF', '#6C1D45', '#FFFFFF', '#6C1D45', '#FFFFFF', '#6C1D45'], sizes: [3, 0.6, 3, 0.6, 3, 0.6, 3, 0.6, 3] },
    sharks: { pattern: 'bands', base: '#00A9D8', colors: ['#00A9D8', '#000000', '#FFFFFF', '#000000', '#00A9D8'], sizes: [1.6, 0.3, 1.1, 0.3, 4] },
    steelers: { pattern: 'plain', base: '#E1251B', colors: ['#FFFFFF'] },
    stgeorge: { pattern: 'v', base: '#FFFFFF', colors: ['#E2231B'] },
    storm: { pattern: 'v2', base: '#592B8C', colors: ['#F5B700', '#0E1F45'] },
    tigers: { pattern: 'yoke', base: '#F68C1A', colors: ['#000000', '#FFFFFF'] },
    titans: { pattern: 'bands', base: '#00A3E0', colors: ['#0C2340', '#FFC72C', '#00A3E0', '#0C2340'], sizes: [1.3, 0.35, 3.4, 0.7] },
    warriors: { pattern: 'v2', base: '#262C68', colors: ['#E31B23', '#008445'] },
    wmagpies: { pattern: 'v', base: '#000000', colors: ['#FFFFFF'] },
    easts: { pattern: 'v2', base: '#1A2360', colors: ['#FFFFFF', '#E31B23', '#E31B23'] },
    glebe: { pattern: 'v2', base: '#7B1E22', colors: ['#FFFFFF', '#FFFFFF'] },
    newtown: { pattern: 'plain', base: '#005DC7', colors: ['#FFFFFF'], collar: 'big' },
    goldcoast: { pattern: 'bands', base: '#FFFFFF', colors: ['#FFFFFF', '#000000', '#FFFFFF', '#E31B23', '#FFFFFF', '#000000', '#FFFFFF', '#E31B23', '#FFFFFF', '#000000', '#FFFFFF'], sizes: [1.4, 0.4, 0.9, 0.25, 1.4, 0.4, 0.9, 0.25, 1.4, 0.4, 1.4] }
  };
  window.CastIntl = { reveal: reveal, JERSEYS: JERSEYS };
})();
