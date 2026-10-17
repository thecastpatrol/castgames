/* The CAST Games home page (the owner's "box of games" design, 17 Oct 2026; phone first, 390 wide). Top to bottom:
     Hero          a thin 110px banner that turns by itself: CAST Pass (non-members), the Gameday Bag, new games, the
                   World Cup while it's on, the account's promos (Team of the Week, World Champions), Player of the Week
     All Games     one row per sport (CG.SPORTS order): every card, most played first, Coming Soon last, See All to the
                   sport's page. A game in progress says "Continue: 7 of 13" on its own card
     Leaderboards  this week's #1 on each live game's main board, and the signed-in player's place
     Most Popular  real players this week (the same board reads), a daily turn among the top seven
     Daily         each game's Daily Challenge today, and its reward
   Everything comes from shared/cg.js (sports and cards), the account (js/cast-account.js: Pass, Shop, promos, sign-in)
   and the weekly board summaries (boards/<board>_<week>, public, one read each, kept 10 minutes on the device).
   A sport page (window.CG_SPORT, made by tools/build.py) is the same file drawing that sport's cards as a grid. */
(function () {
  'use strict';
  var CG = window.CG, el = document.getElementById('cgHome');
  if (!CG || !el) return;
  var SPORT = window.CG_SPORT || '';
  function A() { return window.CastAccount || null; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); }
  function lsJson(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  function lsPut(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage full or blocked */ } }
  function call(f, d) { var a = A(); try { return a && typeof a[f] === 'function' ? a[f]() : d; } catch (e) { return d; } }
  function fmt(n) { return String(n); } // no commas in numbers (the owner, 16 Oct 2026)
  function still() { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }
  // Title Case for a card's line used as a heading ("Draft 13 to 1000 tries" -> "Draft 13 to 1000 Tries")
  var SMALL = { a: 1, an: 1, the: 1, and: 1, or: 1, of: 1, to: 1, in: 1, on: 1, for: 1, vs: 1 };
  function tc(s) { return String(s).split(' ').map(function (w, i) { return i && SMALL[w.toLowerCase()] ? w : w.charAt(0).toUpperCase() + w.slice(1); }).join(' '); }
  function soon(g) { return g.status === 'soon' || (g.status === 'live' && !!g.launch && !CG.launched(g.launch)); }
  function live(g) { return g.status === 'live' && !soon(g); }
  function sportOf(g) { return CG.sportOf(g.sport) || { name: '', c: '255,255,255', hex: '#141420', ink: '#fff' }; }
  function vars(g) { return 'style="--c1:' + g.c1 + ';--ink:' + g.ink + ';--sc:' + g.sc + '"'; }
  // The account's state, from its own 'cast-account' events ('loading', 'guest', 'signed-in', 'needs-age')
  var acct = '';
  function signedIn() { return call('isSignedIn', false) === true; }
  function guest() {
    if (signedIn()) return false;
    if (acct) return acct === 'guest';
    var w = call('contactWho', null);
    return !!w && w.state === 'out';
  }
  function uname() { return signedIn() ? call('username', null) : null; }

  /* ---------------- This week's boards ----------------
     Each live card's main board (g.board) has a public summary for the week, boards/<board>_<ISO week in Sydney>, with
     its top 100 and how many players are on it (firestore.rules: anyone may get one). They are read together in one
     request (one read each), only once the Leaderboards are close to the screen and only for live games, and kept on
     this device for 10 minutes: { at, wk, u, b: { <board>: { p, n, s, t, all, me } } }. The order of the cards and
     Most Popular use the last copy kept, even an older one, until a new one comes in. The player's place comes from the
     same top 100 (no extra reads): "#14" when they're in it, "not played yet" when the board lists everyone */
  var FS_PROJECT = 'cast-games-bd641', FS_KEY = 'AIzaSyC76_SWOqYJbwfqPWhx0eVX2WwruE5ryRU'; // public by design (the account's own), locked to our domains
  var EMU = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) && /[?&]castemu=1(&|$)/.test(location.search);
  var LS_B = 'cg_home_boards_v1', TTL = 600000;
  var bd = lsJson(LS_B), bdBusy = false, bdFailed = false, bdNear = false;
  if (!bd || typeof bd !== 'object' || !bd.b) bd = null;
  function sydDate(ms) {
    try { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Sydney', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(ms)); } catch (e) { return new Date(ms).toISOString().slice(0, 10); }
  }
  // ISO week of the Sydney date, weeks from Monday, the same as the server and the account: 2026-W42
  function sydWeek(ms) {
    var d = sydDate(ms).split('-'), t = new Date(Date.UTC(+d[0], d[1] - 1, +d[2])), dow = t.getUTCDay() || 7;
    t.setUTCDate(t.getUTCDate() + 4 - dow);
    var wk = Math.ceil(((t - Date.UTC(t.getUTCFullYear(), 0, 1)) / 864e5 + 1) / 7);
    return t.getUTCFullYear() + '-W' + (wk < 10 ? '0' : '') + wk;
  }
  function boardGames() { return CG.liveGames().filter(function (g) { return g.board && live(g); }); }
  function thisWeek() { return bd && bd.wk === sydWeek(Date.now()) ? bd : null; }
  function players(g) { var b = bd && g.board && bd.b[g.board]; return b ? b.p || 0 : -1; } // any week kept, for the order
  function fsVal(v) {
    if (!v) return null;
    if ('stringValue' in v) return v.stringValue;
    if ('integerValue' in v) return +v.integerValue;
    if ('doubleValue' in v) return +v.doubleValue;
    if ('booleanValue' in v) return !!v.booleanValue;
    if ('arrayValue' in v) return (v.arrayValue.values || []).map(fsVal);
    if ('mapValue' in v) { var o = {}, f = v.mapValue.fields || {}; Object.keys(f).forEach(function (k) { o[k] = fsVal(f[k]); }); return o; }
    return null;
  }
  // A name's place in a board's top 100: equal scores share a place, as on the boards
  function placeOf(top, name) {
    var rank = 0, prev = null;
    for (var i = 0; i < top.length; i++) {
      var r = top[i];
      if (!prev || r.s !== prev.s || r.t !== prev.t) rank = i + 1;
      prev = r;
      if (name && r.n === name) return { r: rank, s: r.s, t: r.t };
    }
    return null;
  }
  // The boards still to read: all of them when the copy is old, from another week or for another player
  function boardsDue() {
    var wk = sydWeek(Date.now()), u = uname() || '', list = boardGames().map(function (g) { return g.board; });
    if (!bd || bd.wk !== wk || Date.now() - bd.at > TTL || (u && bd.u !== u)) return list;
    return list.filter(function (b) { return !bd.b[b]; });
  }
  // A returning player's sign-in is still on its way: wait for it (up to 6 s), so the boards are read once, with their place
  var acctWait = 0;
  function acctLoading() { var w = call('contactWho', null); return !!w && w.state === 'loading'; }
  function loadBoards() {
    if (bdBusy || bdFailed || !window.fetch) return;
    if (acctLoading() && acctWait !== 2) { if (!acctWait) { acctWait = 1; setTimeout(function () { acctWait = 2; loadBoards(); }, 6000); } return; }
    var due = boardsDue();
    if (!due.length) return;
    var wk = sydWeek(Date.now()), u = uname() || '', all = due.length === boardGames().length;
    var proj = EMU ? 'demo-cast-games' : FS_PROJECT, base = 'projects/' + proj + '/databases/(default)/documents';
    var url = (EMU ? 'http://127.0.0.1:8085/v1/' : 'https://firestore.googleapis.com/v1/') + base + ':batchGet' + (EMU ? '' : '?key=' + FS_KEY + '&prettyPrint=false');
    bdBusy = true;
    fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ documents: due.map(function (b) { return base + '/boards/' + b + '_' + wk; }) }) })
      .then(function (r) { if (!r.ok) throw new Error('boards ' + r.status); return r.json(); })
      .then(function (list) {
        var got = {};
        (Array.isArray(list) ? list : []).forEach(function (x) {
          var name = (x.found && x.found.name) || x.missing || '', id = name.split('/').pop(), b = id.slice(0, id.lastIndexOf('_'));
          if (!b) return;
          var f = (x.found && x.found.fields) || {}, top = fsVal(f.top) || [], p = fsVal(f.players) || 0, one = top[0] || null;
          got[b] = { p: p, n: one ? one.n : '', s: one ? one.s : 0, t: one ? one.t || 0 : 0, all: top.length >= p, me: u ? placeOf(top, u) : null };
        });
        bd = all || !bd || bd.wk !== wk ? { at: Date.now(), wk: wk, u: u, b: {} } : bd;
        if (all) { bd.at = Date.now(); bd.u = u; }
        Object.keys(got).forEach(function (b) { bd.b[b] = got[b]; });
        lsPut(LS_B, bd);
      })
      .catch(function () { bdFailed = true; }) // the cards offer the full board instead; no second try this visit
      .then(function () { bdBusy = false; paint(); });
  }
  // Read once the Leaderboards are within about two-thirds of a screen of the view (after the page has painted)
  var near = null;
  function watchBoards() {
    var sec = document.getElementById('cgBoards');
    if (!sec || near) return;
    if (!('IntersectionObserver' in window)) { bdNear = true; setTimeout(loadBoards, 1200); return; }
    near = new IntersectionObserver(function (es) {
      if (!es.some(function (e) { return e.isIntersecting; })) return;
      bdNear = true; near.disconnect();
      if (window.requestIdleCallback) requestIdleCallback(loadBoards, { timeout: 1500 }); else setTimeout(loadBoards, 200);
    }, { rootMargin: '0px 0px 600px 0px' });
    near.observe(sec);
  }

  /* A board's score in a few characters, as the boards show it: [big, small] */
  var EXACT = { '1000exact': 1000, '4000exact': 4000, bbexact: 25000, tsexact: 60000, nflexact: 777, rcexact: 550, eplexact: 650 };
  function scoreOf(b, r) {
    var s = r.s || 0, t = r.t || 0;
    if (/^(1000plus|nrlw|1000spin|1000wc)$/.test(b)) return [fmt(s), 'tries'];
    if (/^(4000plus|aflw|4000spin|eplplus|eplspin)$/.test(b)) return [fmt(s), 'goals'];
    if (/^(bbplus|bbspin|tsplus|tsspin)$/.test(b)) return [fmt(s), 'runs'];
    if (/^(nflplus|nflspin)$/.test(b)) return [fmt(s), 'TDs'];
    if (/^(rcplus|rcspin)$/.test(b)) return [fmt(s), 'G1 wins'];
    if (EXACT[b]) return s ? ['🎯 ' + s, '× ' + EXACT[b]] : [fmt(t), 'closest'];
    if (b === '270wc') { var st = Math.floor(s / 10), w = s % 10, l = Math.max(0, 5 + Math.min(st, 3) - w); return [w + '-' + l, st === 4 ? '🏆' : '']; }
    if (b === '270best' || b === '270pack' || b === '270hard') { var L = t <= 0 && t >= -30 ? -t : Math.max(0, Math.ceil(-t / 1000)); return [s + '-' + L, '']; }
    if (/ou/.test(b)) return [fmt(s), 'in a row'];
    if (b === 'bgfree') { var secs = Math.max(0, Math.round(-t / 10)); return [fmt(s), (s === 1 ? 'tile' : 'tiles') + ' · ' + Math.floor(secs / 60) + ':' + ('0' + (secs % 60)).slice(-2)]; }
    return [fmt(s), ''];
  }

  /* ---------------- Order ----------------
     Most played first (this week's players on each card's board, once read), else the registry's popular order */
  function popRank() { var m = {}; CG.popular(0).forEach(function (g, i) { m[g.id] = i; }); return m; }
  function byPlays(list) {
    var pr = popRank(), any = !!bd;
    return list.slice().sort(function (a, b) {
      var d = any ? players(b) - players(a) : 0;
      return d || (pr[a.id] == null ? 99 : pr[a.id]) - (pr[b.id] == null ? 99 : pr[b.id]);
    });
  }
  // A sport's cards: games in progress first (newest), then most played, then Coming Soon
  function sportCards(sid) {
    var gs = CG.GAMES.filter(function (g) { return g.sport === sid && g.status !== 'hidden'; });
    var on = byPlays(gs.filter(live)), cont = [], rest = [];
    on.forEach(function (g) { var c = CG.continueOf(g); if (c) cont.push([g, c.at || 0]); else rest.push(g); });
    cont.sort(function (a, b) { return b[1] - a[1]; });
    return { live: cont.map(function (x) { return x[0]; }).concat(rest), soon: gs.filter(soon) };
  }

  /* ---------------- Cards ----------------
     The sport's colour, the game's logo (placeholders for now, so a plain box) and one short line. A card that shares
     its logo with another says its mode in a chip (Exactly 1000, Team Spin, Pack Mode, Hard). Over/unders have no logo:
     the arrows and HIGHER OR LOWER (their sport as a chip outside their own row). Coming Soon: dashed, no link */
  function card(g, where) {
    var sp = sportOf(g), off = soon(g), c = off ? null : CG.continueOf(g), name = g.ou ? 'HIGHER OR LOWER' : g.name;
    var art = g.logo ? '<span class="cg-art"><img src="' + esc(CG.url(g.logo)) + '" alt="' + esc(g.name) + '" loading="lazy" decoding="async"></span>'
      : '<span class="cg-art is-mark" aria-hidden="true">' + (g.mark || '') + '</span><b class="cg-nm">' + esc(name) + '</b>';
    var chips = (g.tag ? '<span class="cg-tag">' + esc(g.tag) + '</span>' : '') + (g.ou && !g.logo && where !== 'row' ? '<span class="cg-tag">' + esc(sp.chip || sp.name) + '</span>' : '');
    var inner = art + (chips ? '<span class="cg-tags">' + chips + '</span>' : '') +
      (c ? '<small class="cg-ln is-cont">' + esc(c.label) + '</small>' : '<small class="cg-ln">' + esc(g.line) + '</small>');
    if (off) return '<div class="cg-c is-soon" ' + vars(g) + ' aria-label="' + esc(g.name) + ', coming soon">' + inner + '<span class="cg-soon-chip">Coming Soon</span></div>';
    return '<a class="cg-c" href="' + esc(CG.url(g.path)) + '" ' + vars(g) + ' data-tap="' + where + '" data-g="' + esc(g.id) + '"' + (g.logo ? '' : ' aria-label="' + esc(g.name) + '"') + '>' + inner + '</a>';
  }

  /* ---------------- Hero ----------------
     Money first (the owner's rule): CAST Pass for anyone without it, then the Gameday Bag, then what's new, the World
     Cup while it's on, the account's promos and the Player of the Week. Each slide is a link or opens the account */
  var NEW = ['nrl-bingo', '777tds', '650goals']; // the newest games, until a card in shared/cg.js carries its own badge
  function slides() {
    var a = A(), out = [], pass = call('hasPass', false) === true;
    if (!pass) out.push({ k: 'CAST Pass', t: 'More Wildcards, Every Game, Every Day', b: 'Join', open: 'pass', s1: '#3a2a0c', s2: '#1a1206', ac: '241,192,115', ai: '#1a1204', pass: true });
    // The bag's real discounts (functions lib/bag.js): 5% off from $10, 10% from $20, and a member another 5%
    out.push({ k: 'Gameday Bag', t: 'Bag It All, Save Up to ' + (pass ? '15%' : '10%'), b: 'Shop', open: 'shop', s1: '#16351f', s2: '#08160f', ac: '74,222,128', ai: '#052e12' });
    var fresh = CG.liveGames().filter(function (g) { return g.badge && g.badge !== 'World Cup' && live(g); });
    if (!fresh.length) fresh = NEW.map(CG.game).filter(function (g) { return g && live(g); });
    fresh.slice(0, 2).forEach(function (g) {
      var sp = sportOf(g);
      out.push({ k: 'New Game · ' + g.name, t: tc(g.line), b: 'Play', href: CG.url(g.path), g: g.id, s1: 'rgba(' + sp.c + ',.55)', s2: 'rgba(' + sp.c + ',.12)', ac: sp.c, ai: sp.ink, ak: 'color-mix(in srgb, rgb(' + sp.c + ') 45%, #fff)' });
    });
    var WC = { s1: '#0f4c8a', s2: '#081a33', ac: '125,211,252', ai: '#04121f' };
    if (CG.launched('wc')) {
      [['world-cup-8-0', 'Spin a Nation, Win All Eight'], ['world-cup-200', 'Draft Test Greats to 200 Tries']].forEach(function (x) {
        var g = CG.game(x[0]);
        if (g && live(g)) out.push(Object.assign({ k: g.name, t: x[1], b: 'Play', href: CG.url(g.path), g: g.id }, WC));
      });
      var w = call('totw', null), g80 = CG.game('world-cup-8-0');
      if (w && g80 && live(g80)) out.push(Object.assign({ k: 'Team of the Week', t: '13 Players Boosted in World Cup 8-0', b: 'Play', href: CG.url(g80.path), g: g80.id }, WC));
    }
    var ch = call('wch', null);
    if (ch) {
      var nat = a && a.teamColours ? a.teamColours(ch.nation) : null;
      out.push(Object.assign({ k: 'World Champions' + (nat && nat.name ? ' · ' + nat.name : ''), t: 'Pick From the World Champions', b: 'Shop', open: 'shop' }, WC));
    }
    // The CAST Player of the Week, once the account says who it is (a public potw() and openPotw(); none yet)
    var pw = call('potw', null);
    if (pw && pw.name) out.push({ k: 'CAST Player of the Week', t: String(pw.name), b: 'See', open: 'potw', s1: '#1d1d33', s2: '#0d0d18', ac: '255,255,255', ai: '#0a0a0f' });
    return out;
  }
  function slideHtml(p, i) {
    var st = ' style="--s1:' + p.s1 + ';--s2:' + p.s2 + ';--ac:' + p.ac + ';--ai:' + p.ai + (p.ak ? ';--ak:' + p.ak : '') + '"', cls = 'cg-slide' + (p.pass ? ' is-pass' : '');
    var inner = '<span class="cg-slide-t"><span class="cg-k">' + esc(p.k) + '</span><b>' + esc(p.t) + '</b></span><span class="cg-slide-btn" aria-hidden="true">' + esc(p.b) + '</span>';
    var lab = ' aria-label="' + esc(p.k + ': ' + p.t) + '" data-slide="' + i + '"';
    return p.open ? '<button type="button" class="' + cls + '" data-open="' + p.open + '"' + lab + st + '>' + inner + '</button>'
      : '<a class="' + cls + '" href="' + esc(p.href) + '" data-tap="hero" data-g="' + esc(p.g || '') + '"' + lab + st + '>' + inner + '</a>';
  }
  function heroHtml() {
    var ps = slides();
    return '<div class="cg-strip cg-hero-track cg-n' + Math.min(ps.length, 4) + '" data-strip="hero" aria-roledescription="carousel" aria-label="Featured">' + ps.map(slideHtml).join('') + '</div><div class="cg-dots" role="group" aria-label="Featured slides"></div>';
  }
  // Turning: every 6 s, held while a finger, the mouse or the keyboard is on it, never for reduced motion. The dots are
  // the places the banner can stop (one per slide on phones; fewer on desktop, where three show at once)
  var heroAt = 0, heroTimer = null, heroHeld = 0;
  function heroStops(tr) {
    var kids = tr.children, max = tr.scrollWidth - tr.clientWidth, out = [];
    for (var i = 0; i < kids.length; i++) { var x = Math.min(max, kids[i].offsetLeft - kids[0].offsetLeft); if (!out.length || x > out[out.length - 1] + 4) out.push(x); }
    return out.length ? out : [0];
  }
  function heroDots(tr) {
    var stops = heroStops(tr), box = tr.parentNode.querySelector('.cg-dots');
    if (!box) return stops;
    heroAt = Math.min(heroAt, stops.length - 1);
    var h = stops.length < 2 ? '' : stops.map(function (x, i) { return '<button type="button" class="cg-dot' + (i === heroAt ? ' is-on' : '') + '" data-dot="' + i + '" aria-label="Slide ' + (i + 1) + ' of ' + stops.length + '"' + (i === heroAt ? ' aria-current="true"' : '') + '></button>'; }).join('');
    if (box.innerHTML !== h) box.innerHTML = h;
    return stops;
  }
  function heroGo(i, smooth) {
    var tr = el.querySelector('.cg-hero-track');
    if (!tr) return;
    var stops = heroStops(tr);
    heroAt = (i + stops.length) % stops.length;
    tr.scrollTo({ left: stops[heroAt], behavior: smooth && !still() ? 'smooth' : 'auto' });
    heroDots(tr);
  }
  function heroWire() {
    var tr = el.querySelector('.cg-hero-track');
    if (!tr) return;
    heroDots(tr);
    tr.scrollLeft = heroStops(tr)[heroAt] || 0;
    if (tr.getAttribute('data-wired')) return;
    tr.setAttribute('data-wired', '1');
    var hold = function (ms) { heroHeld = Date.now() + ms; };
    tr.addEventListener('touchstart', function () { hold(60000); }, { passive: true });
    tr.addEventListener('touchend', function () { hold(4000); }, { passive: true });
    tr.addEventListener('touchcancel', function () { hold(4000); }, { passive: true });
    tr.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') hold(6e7); });
    tr.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') hold(3000); });
    tr.addEventListener('focusin', function () { hold(6e7); });
    tr.addEventListener('focusout', function () { hold(3000); });
    var t = 0;
    tr.addEventListener('scroll', function () {
      clearTimeout(t);
      t = setTimeout(function () {
        var stops = heroStops(tr), best = 0;
        stops.forEach(function (x, i) { if (Math.abs(x - tr.scrollLeft) < Math.abs(stops[best] - tr.scrollLeft)) best = i; });
        if (best !== heroAt) { heroAt = best; heroDots(tr); }
      }, 90);
    }, { passive: true });
  }
  function heroTurn() {
    clearInterval(heroTimer); heroTimer = null;
    if (still()) return;
    heroTimer = setInterval(function () {
      var tr = el.querySelector('.cg-hero-track');
      if (!tr || document.hidden || Date.now() < heroHeld || heroStops(tr).length < 2) return;
      heroGo(heroAt + 1, true);
    }, 6000);
  }

  /* ---------------- Sections ---------------- */
  function head(title, sub, arrows) {
    return '<div class="cg-h"><h2>' + title + '</h2>' + (sub ? '<small>' + sub + '</small>' : '') +
      (arrows ? '<span class="cg-arw"><button type="button" data-arw="-1" aria-label="Scroll back">&#x2039;</button><button type="button" data-arw="1" aria-label="Scroll on">&#x203A;</button></span>' : '') + '</div>';
  }
  function gamesHtml() {
    return '<div class="cg-h"><h2 class="is-big">All Games</h2></div><div class="cg-rows">' + CG.SPORTS.filter(function (s) { return s.status !== 'hidden'; }).map(function (s) {
      var c = sportCards(s.id), n = c.live.length;
      if (!n && !c.soon.length) return '';
      return '<div class="cg-row" style="--c1:' + s.hex + ';--sc:' + s.c + '"><div class="cg-row-h"><i aria-hidden="true"></i><h3>' + esc(s.name) + '</h3>' +
        '<small>' + (n ? n + (n === 1 ? ' Game' : ' Games') : 'Coming Soon') + '</small>' +
        (n && s.status === 'live' && s.path ? '<a class="cg-pill" href="' + esc(CG.url(s.path)) + '" data-tap="seeall" data-g="' + s.id + '">See All</a>' : '') + '</div>' +
        '<div class="cg-strip is-cards" data-strip="row-' + s.id + '">' + c.live.map(function (g) { return card(g, 'row'); }).join('') + c.soon.map(function (g) { return card(g, 'row'); }).join('') + '</div></div>';
    }).join('') + '</div>';
  }
  function lbCard(g, wkData) {
    var b = wkData && wkData.b[g.board], sp = sportOf(g), u = uname(), body, me = '';
    var logo = g.logo ? '<img src="' + esc(CG.url(g.logo)) + '" alt="" loading="lazy" decoding="async">' : '<span class="cg-mk" aria-hidden="true">' + (g.mark || '') + '</span>';
    var name = g.ou ? 'HIGHER OR LOWER: ' + (sp.chip || sp.name).toUpperCase() : g.name, go = 'Beat It';
    if (b && b.n) {
      var sc = scoreOf(g.board, b);
      body = '<span class="cg-lb-1"><b class="cg-lb-n">' + esc(b.n) + '</b><b class="cg-lb-s">' + esc(sc[0]) + (sc[1] ? ' <small>' + esc(sc[1]) + '</small>' : '') + '</b></span>';
    } else if (b) { body = '<span class="cg-lb-1 is-none">No one yet. Be the first!</span>'; go = 'Be the First'; }
    else if (bdFailed) body = '<span class="cg-lb-1 is-none">Tap to see the board</span>';
    else body = '<span class="cg-lb-1 is-wait" aria-label="Loading"><i></i><i></i></span>';
    if (u && b) {
      if (b.me) me = 'You: #' + b.me.r + ' · ' + scoreOf(g.board, b.me)[0];
      else me = b.all ? 'You: not played yet' : 'You: not in the top 100 yet';
    }
    return '<div class="cg-lb" ' + vars(g) + '><button type="button" class="cg-lb-top" data-board="' + esc(g.board) + '" aria-label="' + esc(g.name) + ' leaderboard, this week">' +
      '<span class="cg-lb-h">' + logo + '</span><b class="cg-lb-g">' + esc(name) + '</b><span class="cg-lb-k">#1 This Week</span>' + body + '</button>' +
      (me ? '<span class="cg-lb-me">' + esc(me) + '</span>' : '') +
      '<a class="cg-lb-go" href="' + esc(CG.url(g.path)) + '" data-tap="board" data-g="' + esc(g.id) + '">' + go + '</a></div>';
  }
  function boardsHtml() {
    var gs = byPlays(boardGames()), wk = thisWeek();
    if (!gs.length) return '';
    var signIn = guest() ? '<div class="cg-lb is-in"><span class="cg-lb-ico" aria-hidden="true">&#x1F3C6;</span><b>Get Your Name Up Here</b><small>Sign in free and your best scores go up on the boards.</small><button type="button" class="cg-lb-go" data-open="signin">Sign In</button></div>' : '';
    return head('&#x1F3C6; Leaderboards', 'This Week', true) + '<div class="cg-strip is-lb" data-strip="boards">' + signIn + gs.map(function (g) { return lbCard(g, wk); }).join('') + '</div>';
  }
  // Most Popular: the seven most played this week (one over/under at most: they earn less, the owner), taking turns
  // to lead a day at a time; before any board is read, the registry's popular order
  function popularList() {
    var gs = bd ? byPlays(CG.liveGames().filter(live)) : CG.popular(0).filter(live), out = [], ou = 0;
    gs.forEach(function (g) { if (out.length >= 7 || (g.ou && ou)) return; if (g.ou) ou++; out.push(g); });
    if (bd && out.length > 1) { var day = Math.floor(Date.parse(sydDate(Date.now())) / 864e5) % out.length; out = out.slice(day).concat(out.slice(0, day)); }
    return out;
  }
  function popularHtml() {
    var gs = popularList();
    return gs.length ? head('&#x1F525; Most Popular') + '<div class="cg-strip is-cards is-pop" data-strip="popular">' + gs.map(function (g) { return card(g, 'pop'); }).join('') + '</div>' : '';
  }

  /* Today's Daily Challenge for a game, in its own words (the owner, 15 Oct 2026: "pull through in smaller text what the
     daily challenge is, or the reward"): the headline each game's home card shows (js/daily.js themeFor), and the reward */
  // Each game's calendar (index.html loads them) and the name its rewards go under
  var CAL = { '27-0': ['CG_DAILY_NRL', '27-0'], '1000tries': ['CG_DAILY_NRL', '1000tries'], '4000goals': ['CG_DAILY_AFL', '4000goals'],
    '25000runs': ['CG_DAILY_BBL', 'bigbash'], '60000runs': ['CG_DAILY_TESTS', 'tests'], '777tds': ['CG_DAILY_NFL', 'nfl'], 'g1winner': ['CG_DAILY_RACING', 'racing'], '650goals': ['CG_DAILY_EPL', 'epl'], '100000points': ['CG_DAILY_NBA', 'nba'], scpointsking: ['CG_DAILY_SC', 'sc'] };
  function dailyOf(id) {
    var cal = CAL[id], C = cal && window[cal[0]];
    if (!C || !C.day) return null;
    try {
      var d = C.day(sydDate(Date.now())), era = d.key.indexOf('era:') === 0, head, lead;
      if (id === '27-0') {
        var g = d.g270, region = d.key === 'sydney' || d.key === 'queensland';
        head = (era ? d.short.replace(/^The /, '') : region ? d.short.replace(/ Clubs$/, '') : d.short) + (g.wins ? ' 13 with ' + g.wins + '+ wins' : ' 13 rated ' + g.goal + '+');
      } else {
        // the words each game's own home card uses (its js/daily.js themeFor): "525+ From the 2010s", "46250+ With Australia"
        if (id === 'g1winner') lead = /^(era|dec):/.test(d.key) ? (/^Since /.test(d.short) ? '' : d.key.indexOf('dec:') === 0 ? 'From the ' : 'From ') : d.g1000.ds ? '' : 'With ';
        else lead = d.lead != null ? d.lead : era ? 'From ' : 'With ';
        head = fmt(d.g1000.target) + '+ ' + lead + d.short;
      }
      var items = (d.reward || {})[cal[1]] || {}, k = Object.keys(items)[0];
      return { head: head, reward: k ? ((C.itemIcons && C.itemIcons[k]) || '') + ' ' + C.itemsText(items) : '' };
    } catch (e) { return null; }
  }
  // Midnight in Sydney, when the next Dailies drop
  function nextDaily() {
    try {
      var p = {};
      new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Sydney', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
      // numbers, never strings (on the hour "00" made it "New in -1776h 0m", 17 Oct 2026)
      var left = (24 * 60) - ((parseInt(p.hour, 10) || 0) * 60 + (parseInt(p.minute, 10) || 0)), h = Math.floor(left / 60), m = left % 60;
      return 'New in ' + (h ? h + 'h ' : '') + m + 'm';
    } catch (e) { return ''; }
  }
  function dailyCard(g) {
    var x = dailyOf(g.id);
    var art = g.logo ? '<img class="cg-d-logo" src="' + esc(CG.url(g.logo)) + '" alt="" loading="lazy" decoding="async">' : '<span class="cg-d-logo cg-mk" aria-hidden="true">' + (g.mark || '') + '</span>';
    return '<a class="cg-d" href="' + esc(CG.url(g.path + '?play=' + (g.dplay || 'daily'))) + '" ' + vars(g) + ' data-tap="daily" data-g="' + esc(g.id) + '">' + art +
      '<b>' + esc(g.name) + '</b><small class="cg-d-h">' + esc(x ? x.head : 'A new challenge today') + '</small>' +
      '<span class="cg-d-f">' + (x && x.reward ? '<small class="cg-d-r">' + esc(x.reward.trim()) + '</small>' : '<i></i>') + '<span class="cg-d-go">Play</span></span></a>';
  }
  var dailyMin = '';
  function dailyHtml() {
    var gs = byPlays(CG.liveGames().filter(function (g) { return g.daily && live(g); }));
    dailyMin = nextDaily();
    return gs.length ? head('&#x1F5D3;&#xFE0F; Daily Challenges', esc(dailyMin)) + '<div class="cg-strip is-daily" data-strip="daily">' + gs.map(dailyCard).join('') + '</div>' : '';
  }

  /* A sport's own page (nrl/, afl/, ...): its cards in a grid, in its colour, Coming Soon last; then All Games and its
     Leaderboards (the page names its boards for the account: tools/build.py SPORT_BOARDS) */
  function sportHtml(id) {
    var sp = CG.sportOf(id);
    if (!sp) return '';
    var c = sportCards(id), n = c.live.length;
    return '<section class="cg-sport-page" style="--c1:' + sp.hex + ';--sc:' + sp.c + '"><div class="cg-row-h is-page"><i aria-hidden="true"></i><span class="cg-sp-t"><h1>' + esc(sp.name) + '</h1><small>' + esc(sp.long) + '</small></span>' +
      '<span class="cg-count">' + (n ? n + (n === 1 ? ' Game' : ' Games') : 'Coming Soon') + '</span></div>' +
      '<div class="cg-grid">' + c.live.map(function (g) { return card(g, 'row'); }).join('') + c.soon.map(function (g) { return card(g, 'row'); }).join('') + '</div>' +
      '<div class="cg-two"><a class="cg-wide" href="' + esc(CG.url('')) + '"><span aria-hidden="true">&#x1F3E0;</span><b>All Games</b><small>Every sport on CAST Games</small></a>' +
      '<button type="button" class="cg-wide" data-open="boards"><span aria-hidden="true">&#x1F3C6;</span><b>Leaderboards</b><small>Top scores this week and all time</small></button></div></section>';
  }

  /* ---------------- Drawing ----------------
     Each section is drawn on its own and only replaced when it changes (a sign-in, a launch, the boards arriving), so
     a row someone is swiping keeps its place */
  var SECTIONS = [['cgHero', 'cg-hero', heroHtml], ['cgGames', 'cg-sec cg-games', gamesHtml], ['cgBoards', 'cg-sec cg-boards', boardsHtml], ['cgPopular', 'cg-sec cg-popular', popularHtml], ['cgDaily', 'cg-sec cg-daily', dailyHtml]];
  var built = false, drawn = {};
  function keepScroll(box, fn) {
    var at = {};
    Array.prototype.forEach.call(box.querySelectorAll('[data-strip]'), function (s) { at[s.getAttribute('data-strip')] = s.scrollLeft; });
    fn();
    Array.prototype.forEach.call(box.querySelectorAll('[data-strip]'), function (s) { var x = at[s.getAttribute('data-strip')]; if (x) s.scrollLeft = x; });
  }
  function paint() {
    if (SPORT) { var sh = sportHtml(SPORT); if (drawn.sport !== sh) { el.innerHTML = sh; drawn.sport = sh; } return; }
    if (!built) {
      el.innerHTML = SECTIONS.map(function (s) { return '<section id="' + s[0] + '" class="' + s[1] + '"></section>'; }).join('');
      built = true;
    }
    SECTIONS.forEach(function (s) {
      var box = document.getElementById(s[0]), h = '';
      try { h = s[2](); } catch (e) { h = drawn[s[0]] || ''; } // a section that can't draw keeps what it had
      if (drawn[s[0]] === h) return;
      drawn[s[0]] = h;
      keepScroll(box, function () { box.innerHTML = h; });
      box.hidden = !h;
      if (s[0] === 'cgHero') heroWire();
    });
    watchBoards();
    if (bdNear) loadBoards(); // a launch or a sign-in since: any board not read yet
  }
  el.addEventListener('click', function (e) {
    var dot = e.target.closest('[data-dot]');
    if (dot) { heroHeld = Date.now() + 8000; heroGo(+dot.getAttribute('data-dot'), true); return; }
    var arw = e.target.closest('[data-arw]');
    if (arw) { var st = arw.closest('.cg-sec').querySelector('[data-strip]'); if (st) st.scrollBy({ left: (+arw.getAttribute('data-arw')) * Math.max(240, st.clientWidth * 0.8), behavior: still() ? 'auto' : 'smooth' }); return; }
    var tap = e.target.closest('[data-tap]');
    if (tap) CG.track('cg_home_tap', { where: tap.getAttribute('data-tap'), game: tap.getAttribute('data-g') || '' });
    var a = A(), o = e.target.closest('[data-open]'), bt = e.target.closest('[data-board]');
    if (!a || (!o && !bt)) return;
    if (bt) { CG.track('cg_home_tap', { where: 'board_top', game: bt.getAttribute('data-board') }); a.openBoards([bt.getAttribute('data-board'), 'week']); return; }
    var k = o.getAttribute('data-open');
    CG.track('cg_home_tap', { where: 'open', game: k });
    if (k === 'pass') { if (a.openPass) a.openPass('home_hero'); else a.open('pass'); }
    else if (k === 'shop') { if (a.openShop) a.openShop('home_hero'); else a.open('shop'); }
    else if (k === 'boards') a.openBoards(null);
    else if (k === 'signin') { if (a.requireSignIn) a.requireSignIn(null, 'boards'); else if (a.openProfile) a.openProfile(); }
    else if (k === 'potw' && a.openPotw) a.openPotw();
  });
  paint();
  heroTurn();
  ['cast:launch', 'cast:totw', 'cast:promo', 'cast:wch'].forEach(function (ev) { window.addEventListener(ev, paint); });
  window.addEventListener('cast-account', function (e) { acct = (e && e.detail && e.detail.status) || acct; paint(); });
  window.addEventListener('load', function () { setTimeout(paint, 300); });
  window.addEventListener('resize', function () { var tr = el.querySelector('.cg-hero-track'); if (tr) heroDots(tr); });
  // The Daily countdown and a game finished in another tab (its Continue line): a quiet redraw each minute
  setInterval(function () { if (!document.hidden) paint(); }, 60000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) paint(); });
})();
