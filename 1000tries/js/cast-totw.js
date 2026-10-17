/* World Cup Team of the Week on the home page (15 Oct 2026, the owner's BUILD IT; js/cast-account.js totw, published by an
   admin). A card in the home spot with five of the week's players on World Cup blue cards (rating and boost); a tap opens
   all 13 on a field with Play World Cup 8-0 pinned. Shared by both games (tools/sync_shared.py):
     27-0: second in the spot's turn; the pop-up also opens by itself once a week on the home page (the owner: "dont spam
           people show once on pop up for 27-0"); Play World Cup 8-0 starts it
     1000TRIES: in the spot's turn only (never opens by itself); Play on 27-0 opens 27-0's World Cup
   Only while a week is on: it comes and goes with 'cast:totw'. GA (game: the page's): totw_view (once a visit, when the
   spot shows it), totw_tap, totw_auto (opened by itself), totw_play, totw_close. */
(function () {
  'use strict';
  var box = document.querySelector('[data-cast-totw]');
  if (!box) return;
  var CA = window.CAST_ACCOUNT || {}, IS27 = CA.game === '27-0';
  var URL27 = 'https://castgames.com.au/27-0/?play=wc&utm_source=' + encodeURIComponent(CA.game || '') + '&utm_medium=totw&utm_campaign=team_of_the_week';
  var POS = ['FB', 'W', 'C', 'C', 'W', 'FE', 'HB', 'P', 'HK', 'P', 'SR', 'SR', 'LK'];
  var ROWS = [[1], [2, 3, 4, 5], [6, 7], [8, 9, 10], [11, 12], [13]];
  var NAT = { aus: ['#00843D', 'AUS'], nzl: ['#111111', 'NZL'], eng: ['#F4F4F4', 'ENG'], fra: ['#1B3A8C', 'FRA'], sam: ['#0B2D7A', 'SAM'],
    ton: ['#C10F1F', 'TON'], fij: ['#5DB8E6', 'FIJ'], png: ['#C8102E', 'PNG'], leb: ['#008D45', 'LEB'], cok: ['#0A2A66', 'COK'] };
  var LS_SEEN = 'cast_totw_seen_', sq = null, sqP = null;

  function A() { return window.CastAccount || null; }
  function week() { var a = A(); return a && a.totw ? a.totw() : null; }
  function ga(ev, x) {
    x = x || {}; x.game = CA.game || '';
    try { if (typeof CA.track === 'function') CA.track(ev, x); else if (typeof gtag === 'function') gtag('event', ev, x); } catch (e) { /* no analytics */ }
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); }
  function light(h) { var c = parseInt(String(h).slice(1), 16); return ((c >> 16) * 299 + ((c >> 8) & 255) * 587 + (c & 255) * 114) / 1000 > 150; }
  function surname(n) { var p = String(n).split(' '); return p.length > 1 ? p.slice(1).join(' ') : n; }
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage blocked */ } }
  function syd(ms) {
    try { return new Date(ms).toLocaleString('en-AU', { timeZone: 'Australia/Sydney', weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).replace(/\s?(am|pm)/i, function (m) { return m.trim().toLowerCase(); }); } catch (e) { return ''; }
  }
  // The squads' own ratings (27-0's data/wc-squads.json, which the other sites may read), for each card's number
  function squads() {
    if (sq) return Promise.resolve(sq);
    if (sqP) return sqP;
    sqP = fetch(IS27 ? 'data/wc-squads.json' : '/27-0/data/wc-squads.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : {}; }).then(function (j) {
      var out = {};
      Object.keys(j.nations || {}).forEach(function (k) { (j.nations[k].players || []).forEach(function (p) { out[p[0]] = Math.max(67, Math.round(p[2] || 67)); }); });
      sq = out; return out;
    }, function () { sqP = null; return {}; });
    return sqP;
  }
  function rating(e) { var r = sq && sq[e.n]; return r ? Math.min(99, r + e.b) : null; }
  // One player's card: his nation's colour on the tag, the new rating, the boost and his name
  function card(e, big, full) {
    var n = NAT[e.k] || ['#333333', String(e.k || '').toUpperCase()], r = rating(e);
    return '<div class="cp-totw-c' + (big ? ' is-big' : '') + '" aria-label="' + esc(e.n + ', ' + POS[e.s - 1] + (r ? ', ' + r : '') + ', boosted ' + e.b) + '">' +
      '<span class="ct-add" aria-hidden="true">+' + e.b + '</span>' +
      (full ? '<span class="ct-top"><b>' + POS[e.s - 1] + '</b><i style="background:' + n[0] + ';color:' + (light(n[0]) ? '#111' : '#fff') + '">' + n[1] + '</i></span>' : '') +
      '<span class="ct-r">' + (r == null ? '-' : r) + '</span>' +
      '<span class="ct-n">' + esc(surname(e.n)).replace('-', '-<wbr>') + '</span></div>';
  }
  // The five on the card: the best rated now, the best in the middle
  function five(w) {
    var by = w.set.slice().sort(function (a, b) { return (rating(b) || 0) - (rating(a) || 0) || a.s - b.s; }).slice(0, 5);
    return [by[3], by[1], by[0], by[2], by[4]].filter(Boolean);
  }
  function draw() {
    var w = week();
    if (!w) { box.hidden = true; box.removeAttribute('data-spot-pos'); box.innerHTML = ''; return; }
    box.innerHTML = '<button type="button" class="cp-totw-spot" data-totw="open" aria-label="Team of the Week: see all 13">' +
      '<span class="cp-totw-head"><b>Team of the <span>Week</span></b><span class="cp-totw-all">' + esc(w.label) + ' &rsaquo;</span></span>' +
      '<span class="cp-totw-row">' + five(w).map(function (e, i) { return card(e, i === 2, false); }).join('') + '</span></button>';
    box.setAttribute('data-spot-pos', IS27 ? '2' : 'mid');
    box.hidden = false;
    if (pop && !pop.hidden) fill();
  }

  var pop = null;
  function shut() { if (pop && !pop.hidden) { pop.hidden = true; document.documentElement.classList.remove('cp-totw-open'); } }
  function fill() {
    var w = week();
    if (!w || !pop) return;
    var at = {}; w.set.forEach(function (e) { at[e.s] = e; });
    pop.querySelector('.cp-totw-k').textContent = 'World Cup · ' + w.label;
    pop.querySelector('.cp-totw-s').innerHTML = 'Boosted in 27-0 World Cup 8-0 until ' + esc(syd(w.until)) + '. Spin their nation and draft them while they&rsquo;re in&nbsp;form.';
    pop.querySelector('.cp-totw-field').innerHTML = ROWS.map(function (row) {
      return '<div class="cp-totw-line">' + row.map(function (s) { return at[s] ? card(at[s], false, true) : ''; }).join('') + '</div>';
    }).join('');
  }
  function open(auto) {
    if (!week()) return;
    if (!pop) {
      pop = document.createElement('div');
      pop.className = 'cp-totw';
      pop.hidden = true;
      pop.setAttribute('role', 'dialog');
      pop.setAttribute('aria-modal', 'true');
      pop.setAttribute('aria-label', 'Team of the Week');
      pop.innerHTML = '<div class="cp-totw-box"><button type="button" class="cp-totw-x" data-totw="close" aria-label="Close">&#x2715;</button>' +
        '<div class="cp-totw-top"><p class="cp-totw-k"></p><h2 class="cp-totw-t">Team of the Week</h2><p class="cp-totw-s"></p></div>' +
        '<div class="cp-totw-field"></div>' +
        '<div class="cp-totw-foot">' + (IS27 ? '<button type="button" class="cp-totw-go" data-totw="play">Play World Cup 8-0</button>'
          : '<a class="cp-totw-go" data-totw="play" href="' + URL27 + '" target="_blank" rel="noopener">Play World Cup 8-0 on 27-0</a>') + '</div></div>';
      document.body.appendChild(pop);
      pop.addEventListener('click', function (e) {
        var b = e.target.closest('[data-totw]');
        if (!b && e.target !== pop) return;
        var act = b ? b.getAttribute('data-totw') : 'close';
        shut();
        if (act === 'play') {
          ga('totw_play');
          if (IS27) { try { CA.promoPlay('wc'); } catch (x) { /* the page's own start */ } }
        } else ga('totw_close');
      });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') shut(); });
    }
    fill();
    pop.hidden = false;
    document.documentElement.classList.add('cp-totw-open');
    if (pop.nextElementSibling) document.body.appendChild(pop); // last on the page, so it opens on top
    var w = week();
    lsSet(LS_SEEN + w.id, '1');
    if (auto) ga('totw_auto', { week: w.id });
  }
  box.addEventListener('click', function (e) { if (e.target.closest('[data-totw="open"]')) { ga('totw_tap'); open(false); } });

  // Once a week on 27-0's home page, when nothing else is open (another pop-up, the account panel, a game)
  function quiet() {
    var h = document.documentElement.classList;
    if (h.contains('ca-open') || h.contains('cp-upg-open') || h.contains('cp-dual-open') || h.contains('cp-totw-open')) return false;
    if (typeof CA.onHome === 'function' && !CA.onHome()) return false;
    return !Array.prototype.some.call(document.querySelectorAll('[role="dialog"], [aria-modal="true"]'), function (d) { return d.offsetParent !== null && !d.hidden; });
  }
  var autoT = null;
  function maybeAuto() {
    clearTimeout(autoT);
    var w = week();
    if (!IS27 || !w || lsGet(LS_SEEN + w.id)) return;
    autoT = setTimeout(function () {
      var w2 = week();
      if (!w2 || lsGet(LS_SEEN + w2.id)) return;
      if (quiet()) open(true); else maybeAuto(); // try again in a moment
    }, 4000);
  }

  // Seen: the spot shows it (the spot marks every other card data-spot-off)
  var seen = false;
  new MutationObserver(function () {
    if (seen || box.hidden || box.hasAttribute('data-spot-off') || !box.offsetParent) return;
    seen = true;
    var w = week();
    ga('totw_view', { pos: box.getAttribute('data-spot-pos') || '', week: w ? w.id : '' });
  }).observe(box, { attributes: true, attributeFilter: ['data-spot-off', 'hidden'] });

  function go() { squads().then(function () { draw(); }); draw(); maybeAuto(); }
  window.addEventListener('cast:totw', go);
  go();
  window.cpTotw = { open: open, draw: draw };
})();
