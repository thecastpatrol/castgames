/* World Champions on the home page (15 Oct 2026, the owner's calls; js/cast-account.js wch, launched by the owner in Admin
   on World Cup final night; the rules are the server's lib/wch.js). The final winner's whole World Cup squad is boosted to
   95+ in 27-0 World Cup 8-0 and the Player of the Final to 99, until 11:59pm Sun 22 Nov (Sydney). Premium World Cup blue
   foil (never gold: gold is the CAST Pass's), a trophy after every champion's name, the medal after the Player of the
   Final's. Shared by both games (tools/sync_shared.py):
     27-0: a card in the home spot ([data-cast-wch]) with five of the champions; a tap opens the pop-up with the starting
           13 (never the interchange: the whole squad is still boosted), the World Champions Pick and Play World Cup 8-0.
           The pop-up opens by itself once per device for each stage (the launch, then its last 24 hours), on the home page
           when nothing else is open
     1000TRIES: the card links to 27-0's World Cup (no pop-up there)
   Both: in its last 24 hours a countdown banner above the home spot (the card leaves the spot then, like the Premiers'),
   and every [data-wch-clock] on the page (the Shop's line too) ticks. Admin's Preview Pop-Up opens it with the launch it
   would make (open('preview', w)), on this phone only, changing nothing.
   GA (game: the page's): wch_spot_view, wch_spot_tap, wch_view (from: auto, spot, banner), wch_play, wch_close,
   wch_pick_tap, wch_last_view, wch_last_tap. */
(function () {
  'use strict';
  var CA = window.CAST_ACCOUNT || {}, IS27 = CA.game === '27-0';
  var URL27 = 'https://castgames.com.au/27-0/?play=wc&utm_source=' + encodeURIComponent(CA.game || '') + '&utm_medium=wch&utm_campaign=world_champions';
  var POS = ['FB', 'W', 'C', 'C', 'W', 'FE', 'HB', 'P', 'HK', 'P', 'SR', 'SR', 'LK'];
  var ROWS = [[1], [2, 3, 4, 5], [6, 7], [8, 9, 10], [11, 12], [13]];
  var NAT = { aus: ['#00843D', 'AUS', 'Australia'], nzl: ['#111111', 'NZL', 'New Zealand'], eng: ['#F4F4F4', 'ENG', 'England'], fra: ['#1B3A8C', 'FRA', 'France'], sam: ['#0B2D7A', 'SAM', 'Samoa'],
    ton: ['#C10F1F', 'TON', 'Tonga'], fij: ['#5DB8E6', 'FIJ', 'Fiji'], png: ['#C8102E', 'PNG', 'Papua New Guinea'], leb: ['#008D45', 'LEB', 'Lebanon'], cok: ['#0A2A66', 'COK', 'Cook Islands'] };
  var LS_SEEN = 'cast_wch_seen', LAST = 864e5;
  var sq = null, sqP = null, pop = null, shown = null, tickT = null, spotSeen = false, lastSeen = false;

  function A() { return window.CastAccount || null; }
  function live() { var a = A(); return a && a.wch ? a.wch() : null; }
  function ga(ev, x) {
    x = x || {}; x.game = CA.game || '';
    try { if (typeof CA.track === 'function') CA.track(ev, x); else if (typeof gtag === 'function') gtag('event', ev, x); } catch (e) { /* no analytics */ }
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); }
  function light(h) { var c = parseInt(String(h).slice(1), 16); return ((c >> 16) * 299 + ((c >> 8) & 255) * 587 + (c & 255) * 114) / 1000 > 150; }
  function surname(n) { var p = String(n).split(' '); return p.length > 1 ? p.slice(1).join(' ') : n; }
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage blocked */ } }
  function endText(w) { var a = A(); return a && a.wchEndText ? a.wchEndText(w && w.until) : '11:59pm Sun 22 Nov'; }
  function left(w) { return w ? w.until - Date.now() : 0; }
  function isLast(w) { var l = left(w); return l > 0 && l <= LAST; }
  function clock(ms) { var s = Math.max(0, Math.ceil(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m + ':' + (x < 10 ? '0' : '') + x; }
  function hours(ms) { var m = Math.ceil(Math.max(0, ms) / 60000); return m > 60 ? Math.ceil(m / 60) + 'h left' : m + 'm left'; }

  // Every World Cup squad player (27-0's data/wc-squads.json, which the other sites may read): name -> { r, k, pos }
  function squads() {
    if (sq) return Promise.resolve(sq);
    if (sqP) return sqP;
    sqP = fetch(IS27 ? 'data/wc-squads.json' : '/27-0/data/wc-squads.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : {}; }).then(function (j) {
      var out = {};
      Object.keys(j.nations || {}).forEach(function (k) { (j.nations[k].players || []).forEach(function (p) { out[p[0]] = { r: Math.max(67, Math.round(p[2] || 67)), k: k, pos: (p[1] || []).slice(0, 2) }; }); });
      sq = out; return out;
    }, function () { sqP = null; return {}; });
    return sqP;
  }
  function own(n) { return sq && sq[n] ? sq[n].r : 0; }
  // A champion's rating: 95, or his own if higher; the Player of the Final 99
  function rating(w, n) { return n === w.potf ? 99 : Math.max(95, own(n) || 0); }
  // The 13 to show: the owner's starting 13, or (a localhost preview with none) the winner's best at each spot
  function team(w) {
    if (w.team && w.team.length) return w.team;
    if (!sq) return [];
    var used = {}, mine = Object.keys(sq).filter(function (n) { return sq[n].k === w.nation; }).sort(function (a, b) { return sq[b].r - sq[a].r; });
    return POS.map(function (pos, i) {
      var n = mine.filter(function (x) { return !used[x] && sq[x].pos.indexOf(pos) >= 0; })[0];
      if (n) used[n] = 1;
      return n ? { s: i + 1, n: n } : null;
    }).filter(Boolean);
  }
  // After the name: the medal for the Player of the Final, the trophy for a champion (the Player of the Final from the
  // losing side gets the medal only)
  function marks(w, n) {
    var champ = sq && sq[n] ? sq[n].k === w.nation : n !== w.potf || w.pnat === w.nation || !w.pnat;
    return (n === w.potf ? '&#x1F3C5;' : '') + (champ ? '&#x1F3C6;' : '');
  }
  // One champion's card: premium blue foil, his spot and nation's tag, the filled foil rating box, his name and marks
  function card(w, e, big, full) {
    var k = (sq && sq[e.n] && sq[e.n].k) || w.nation, n = NAT[k] || ['#333333', String(k).toUpperCase()], r = rating(w, e.n), med = e.n === w.potf;
    var sur = surname(e.n), mk = marks(w, e.n), fs = Math.max(7, Math.min(9.5, Math.floor(64 / (0.6 * sur.length + 1.25 * (mk.match(/&#x/g) || []).length) * 2) / 2));
    return '<div class="cp-wch-c' + (big ? ' is-big' : '') + (med ? ' is-medal' : '') + '" aria-label="' + esc(e.n + ', ' + POS[e.s - 1] + ', ' + r + (med ? ', Player of the Final' : ', World Champion')) + '">' +
      '<span class="cw-shine" aria-hidden="true"></span>' +
      (full ? '<span class="cw-top"><b>' + POS[e.s - 1] + '</b><i style="background:' + n[0] + ';color:' + (light(n[0]) ? '#111' : '#fff') + '">' + n[1] + '</i></span>' : '') +
      '<span class="cw-r">' + r + '</span>' +
      // a long name shrinks to fit with its marks on one line (never a mark alone on the next)
      '<span class="cw-n"' + (full ? ' style="font-size:' + fs + 'px"' : '') + '>' + esc(sur) + '<span class="cw-mk">' + mk + '</span></span></div>';
  }
  // Five on the home card: the Player of the Final in the middle when he's in the 13, the best rated around him
  function five(w) {
    var t = team(w), mid = t.filter(function (e) { return e.n === w.potf; })[0];
    var by = t.filter(function (e) { return e !== mid; }).sort(function (a, b) { return rating(w, b.n) - rating(w, a.n) || own(b.n) - own(a.n) || a.s - b.s; });
    var top = (mid ? [mid] : []).concat(by).slice(0, 5);
    return [top[3], top[1], top[0], top[2], top[4]].filter(Boolean);
  }

  /* ---------- The home card ---------- */
  function drawSpot() {
    var w = live();
    Array.prototype.forEach.call(document.querySelectorAll('[data-cast-wch]'), function (box) {
      // Its last 24 hours: the banner above the spot says it instead (never twice)
      if (!w || isLast(w) || !team(w).length) { box.hidden = true; box.removeAttribute('data-spot-pos'); box.innerHTML = ''; return; }
      var nm = (NAT[w.nation] || [])[2] || '', inner = '<span class="cp-wch-head"><b>World <span>Champions</span> &#x1F3C6;</b><span class="cp-wch-all">' + esc(nm) + (IS27 ? ' &rsaquo;' : ' &middot; 27-0 &rsaquo;') + '</span></span>' +
        '<span class="cp-wch-row">' + five(w).map(function (e, i) { return card(w, e, i === 2, false); }).join('') + '</span>';
      var html = IS27 ? '<button type="button" class="cp-wch-spot" data-wch="open" aria-label="World Champions: ' + esc(nm) + '. See the 13">' + inner + '</button>'
        : '<a class="cp-wch-spot" data-wch="link" href="' + URL27 + '" target="_blank" rel="noopener" aria-label="World Champions: ' + esc(nm) + ', boosted in 27-0 World Cup 8-0">' + inner + '</a>';
      if (box.getAttribute('data-wch-h') !== html) { box.innerHTML = html; box.setAttribute('data-wch-h', html); }
      box.setAttribute('data-spot-pos', IS27 ? '2' : '3');
      box.hidden = false;
      if (!box.getAttribute('data-wch-init')) {
        box.setAttribute('data-wch-init', '1');
        box.addEventListener('click', function (e) {
          var b = e.target.closest('[data-wch]');
          if (!b) return;
          ga('wch_spot_tap', { to: IS27 ? 'popup' : '27-0' });
          if (b.getAttribute('data-wch') === 'open') open('spot');
        });
        // Seen: the spot shows it (the spot marks every other card data-spot-off)
        new MutationObserver(function () {
          if (spotSeen || box.hidden || box.hasAttribute('data-spot-off') || !box.offsetParent) return;
          spotSeen = true;
          ga('wch_spot_view', { pos: box.getAttribute('data-spot-pos') || '' });
        }).observe(box, { attributes: true, attributeFilter: ['data-spot-off', 'hidden'] });
      }
    });
    var a = A();
    if (a && a.spot) { try { a.spot(); } catch (e) { /* the spot turns on its own */ } }
  }

  /* ---------- The last 24 hours: the banner above the spot, and every clock ---------- */
  function pickSt() { var a = A(); return IS27 && a && a.pickState ? a.pickState('wch') : null; }
  function drawBanner() {
    var w = live(), html = '';
    if (w && isLast(w)) {
      var fin = left(w) <= 36e5, st = pickSt(), free = !!(st && st.free && !st.bought), act = free ? 'play' : st && (st.canBuy || st.guest) ? 'pick' : 'play';
      var txt = '<span class="cp-wch-tl-ico" aria-hidden="true">&#x23F3;</span><span class="cp-wch-tl-txt"><b>' + (free ? 'Your Free World Champions Pick' : (fin ? 'Final Hour' : 'Last 24 Hours') + ': World Champions') + '</b>' +
        '<small>' + (free ? 'Use it before it&rsquo;s gone: ' : IS27 ? 'Picks and 95+ ratings end in ' : 'Boosted in 27-0 World Cup 8-0 for ') + '<span class="cp-wch-tl-clock" data-wch-clock>' + clock(left(w)) + '</span></small></span>';
      html = IS27 ? '<div class="cp-wch-tl' + (fin ? ' is-final' : '') + '" data-wch-final data-wtl="open" role="button" tabindex="0" aria-label="See the World Champions">' + txt +
          '<button type="button" class="cp-wch-tl-go" data-wtl="' + act + '">' + (free ? 'Use It' : act === 'pick' ? 'Get a Pick' : 'Play Now') + '</button></div>'
        : '<a class="cp-wch-tl' + (fin ? ' is-final' : '') + '" data-wch-final data-wtl="link" href="' + URL27 + '" target="_blank" rel="noopener">' + txt + '<span class="cp-wch-tl-go">Play on 27-0</span></a>';
    }
    Array.prototype.forEach.call(document.querySelectorAll('[data-cast-spot]'), function (spot) {
      var el = spot.parentNode ? spot.parentNode.querySelector(':scope > .cp-wch-tl-box') : null;
      if (!el) {
        if (!html) return;
        el = document.createElement('div');
        el.className = 'cp-wch-tl-box';
        el.setAttribute('role', 'status');
        // Before the spot, and before the Premiers' banner if it's there (it finds itself just above the spot)
        var at = spot.previousElementSibling && spot.previousElementSibling.classList.contains('ca-tl-box') ? spot.previousElementSibling : spot;
        spot.parentNode.insertBefore(el, at);
        el.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('cp-wch-tl') && live()) { e.preventDefault(); open('banner'); } });
        el.addEventListener('click', function (e) {
          var b = e.target.closest('[data-wtl]');
          if (!b || !live()) return;
          var a = b.getAttribute('data-wtl'), acc = A();
          ga('wch_last_tap', { act: a });
          if (a === 'link') return; // the link opens 27-0
          if (a === 'open') { open('banner'); return; }
          e.stopPropagation();
          if (a === 'pick' && acc && acc.pickBuy) acc.pickBuy('wch', CA.game, null, hook('Last 24 Hours'));
          else play();
        });
      }
      if (el.innerHTML !== html) el.innerHTML = html;
      el.hidden = !html;
    });
    if (html && !lastSeen) { lastSeen = true; ga('wch_last_view', {}); }
    tickStart();
  }
  function tick() {
    var w = live(), l = left(w), on = !!w && l > 0 && l <= LAST, fin = l <= 36e5;
    Array.prototype.forEach.call(document.querySelectorAll('[data-wch-clock]'), function (n) { n.textContent = clock(l); });
    Array.prototype.forEach.call(document.querySelectorAll('[data-wch-hours], .cpw-wch [data-dm-hours]'), function (n) { n.textContent = hours(l); });
    Array.prototype.forEach.call(document.querySelectorAll('[data-wch-final]'), function (n) { n.classList.toggle('is-final', on && fin); });
    if (on && fin && document.querySelector('.cp-wch-tl:not(.is-final)')) drawBanner(); // the final hour's words, the moment it starts
    if (!on) { clearInterval(tickT); tickT = null; }
  }
  function tickStart() { if (!tickT && isLast(live())) { tickT = setInterval(tick, 1000); tick(); } }

  /* ---------- The pop-up ---------- */
  // The Pick's payment pop-up words (kicker: where it was opened from)
  function hook(kicker) { return { kicker: kicker || 'World Champions Pick', title: 'Choose a World Champion', line: 'Pick from three of the World Champions. He joins your World Cup 13 at 95+.' }; }
  function play() {
    if (IS27) { try { if (typeof CA.promoPlay === 'function') CA.promoPlay('wc'); } catch (x) { /* the page's own start */ } }
    else window.open(URL27, '_blank', 'noopener');
  }
  function pickRow() {
    var st = pickSt();
    if (!st || (!st.have && !st.canBuy && !st.guest)) return '';
    if (st.free && !st.bought) return '<p class="cp-wch-pick is-have"><span aria-hidden="true">&#x1F3C6;</span><span><b>Thank you, CAST Pass member.</b> Your free World Champions Pick is waiting in your wildcards.</span></p>';
    if (st.have) return '<p class="cp-wch-pick is-have"><span aria-hidden="true">&#x1F3C6;</span><span>You have <b>' + st.have + ' World Champions Pick' + (st.have === 1 ? '' : 's') + '</b> waiting in your wildcards.</span></p>';
    return '<div class="cp-wch-pick"><span class="cp-wch-pick-t"><b>&#x1F3C6; New: World Champions Pick</b><small>Choose a champion and he joins your World Cup 13 at 95+.</small></span>' +
      '<button type="button" class="cp-wch-pick-go" data-wch="pick">' + esc(st.price || '') + '</button></div>';
  }
  function fill(w) {
    if (!pop) return;
    var t = team(w), at = {}, nm = (NAT[w.nation] || [])[2] || '', pm = sq && sq[w.potf] ? sq[w.potf].k : w.pnat, last = isLast(w) && !w.preview;
    t.forEach(function (e) { at[e.s] = e; });
    var box = pop.querySelector('.cp-wch-box');
    box.innerHTML = '<button type="button" class="cp-wch-x" data-wch="close" aria-label="Close">&#x2715;</button>' +
      '<div class="cp-wch-top">' +
        (last ? '<p class="cp-wch-k is-last" data-wch-final>Last Chance &middot; Ends in <span data-wch-clock>' + clock(left(w)) + '</span></p>' : '<p class="cp-wch-k">Rugby League World Cup 2026</p>') +
        '<h2 class="cp-wch-t" id="cpWchT">World Champions</h2>' +
        '<p class="cp-wch-nm"><span>' + esc(nm) + ' &#x1F3C6;</span></p>' +
        '<p class="cp-wch-s">Congratulations to ' + esc(nm) + ', the 2026 World Champions. To celebrate, their whole World Cup squad is boosted to 95+ in 27-0 World Cup 8-0' +
          (w.potf ? ', and Player of the Final ' + esc(w.potf) + ' to 99' : '') + '. Find them in your nation spins until ' + esc(endText(w)) + '.</p></div>' +
      '<div class="cp-wch-field">' + ROWS.map(function (row) {
        return '<div class="cp-wch-line">' + row.map(function (s) { return at[s] ? card(w, at[s], false, true) : ''; }).join('') + '</div>';
      }).join('') + '</div>' +
      (w.potf ? '<p class="cp-wch-medal"><span>&#x1F3C5; Player of the Final</span><b>' + esc(w.potf) + (pm === w.nation ? ' &#x1F3C6;' : '') + '</b></p>' : '') +
      '<div class="cp-wch-foot">' + (IS27 ? pickRow() : '') +
        (IS27 ? '<button type="button" class="cp-wch-go" data-wch="play">Play World Cup 8-0</button>' : '<a class="cp-wch-go" data-wch="play" href="' + URL27 + '" target="_blank" rel="noopener">Play World Cup 8-0 on 27-0</a>') +
        '<p class="cp-wch-end">Ends ' + esc(endText(w)) + '</p></div>';
  }
  function shut() { if (pop && !pop.hidden) { pop.hidden = true; document.documentElement.classList.remove('cp-wch-open'); } }
  // from: 'auto', 'spot', 'banner' or 'preview' (Admin's look at a launch, w: the launch it would make)
  function open(from, wv) {
    var w = wv || live();
    if (!w || !w.nation) return;
    if (!pop) {
      pop = document.createElement('div');
      pop.className = 'cp-wch';
      pop.hidden = true;
      pop.setAttribute('role', 'dialog');
      pop.setAttribute('aria-modal', 'true');
      pop.setAttribute('aria-labelledby', 'cpWchT');
      pop.innerHTML = '<div class="cp-wch-box"></div>';
      document.body.appendChild(pop);
      pop.addEventListener('click', function (e) {
        var b = e.target.closest('[data-wch]');
        if (!b && e.target !== pop) return;
        var act = b ? b.getAttribute('data-wch') : 'close', prev = shown && shown.preview;
        if (act === 'play' && !IS27) { shut(); if (!prev) ga('wch_play', {}); return; } // the link opens 27-0
        shut();
        if (prev) return; // Admin's preview: nothing counted
        if (act === 'play') { ga('wch_play', {}); play(); }
        else if (act === 'pick') { ga('wch_pick_tap', { from: 'popup' }); var a = A(); if (a && a.pickBuy) a.pickBuy('wch', CA.game, null, hook()); }
        else ga('wch_close', {});
      });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') shut(); });
    }
    shown = from === 'preview' ? Object.assign({}, w, { preview: true }) : w;
    squads().then(function () { if (pop && !pop.hidden && shown) fill(shown); });
    fill(shown);
    pop.hidden = false;
    document.documentElement.classList.add('cp-wch-open');
    if (pop.nextElementSibling) document.body.appendChild(pop); // last on the page, so it opens on top (over Admin too)
    if (from === 'preview') return;
    lsSet(LS_SEEN, stage(w));
    tickStart();
    ga('wch_view', { from: from || 'auto', stage: isLast(w) ? 'last' : 'launch' });
  }
  // Once per device for each stage: the launch, then its last 24 hours
  function stage(w) { return w.at + '|' + (isLast(w) ? 'last' : 'launch'); }
  function quiet() {
    var h = document.documentElement.classList;
    if (h.contains('ca-open') || h.contains('cp-upg-open') || h.contains('cp-dual-open') || h.contains('cp-totw-open') || h.contains('cp-wch-open')) return false;
    if (typeof CA.onHome === 'function' && !CA.onHome()) return false;
    if (typeof CA.inGame === 'function' && CA.inGame()) return false;
    return !Array.prototype.some.call(document.querySelectorAll('[role="dialog"], [aria-modal="true"]'), function (d) { return d.offsetParent !== null && !d.hidden; });
  }
  var autoT = null, autoN = 0;
  function maybeAuto() {
    clearTimeout(autoT);
    var w = live();
    if (!IS27 || !w || w.preview || lsGet(LS_SEEN) === stage(w)) return;
    autoT = setTimeout(function () {
      var w2 = live();
      if (!w2 || lsGet(LS_SEEN) === stage(w2)) return;
      if (quiet() && team(w2).length) { autoN = 0; open('auto'); } else if (autoN++ < 60) maybeAuto(); // try again in a moment
    }, 4500);
  }

  function go() {
    squads().then(function () { drawSpot(); drawBanner(); });
    drawSpot(); drawBanner(); maybeAuto();
  }
  window.addEventListener('cast:wch', go);
  window.addEventListener('cast:rerolls', function () { if (isLast(live())) drawBanner(); if (pop && !pop.hidden && shown && !shown.preview) fill(shown); });
  window.addEventListener('cast-account', function () { setTimeout(drawBanner, 0); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
  setTimeout(go, 1800); // the account's launch answer may come in a moment after the page
  window.CastWch = { open: open, draw: go, own: own, squads: squads, rating: function (n) { var w = live(); return w ? rating(w, n) : 0; } };
})();
