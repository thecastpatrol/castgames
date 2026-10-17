/* NRL Bingo (17 Oct 2026, the owner's BUILD IT; based on The Cast Patrol's 2023 TikTok filter). A 4 x 5 card: the 17 NRL
   clubs, one State of Origin tile, the Kangaroos and the Kiwis, each in its club's jersey (our kit fills, never a logo or a
   photo). A player comes up with his position and career years: tap a tile he played for and it fills with his name. A
   wrong tap costs one of 3 lives; 3 skips are free; a player who fits no open tile goes by himself. Fill all 20 for a
   Full House. Boards rank the tiles filled, then the time (only the time a card was waiting on you counts).

   Daily Bingo: the same order of players for everyone on a Sydney date, one go a day (it counts to the CAST streak like
   any game). Free Play: a new order every board. A guest's Free Play uses one of the site's 2 free games a day; the Daily
   is for CAST Profiles, like 1000TRIES' Daily.

   Money (the standard wildcard names, nothing free, CAST Pass included): Reroll, an extra skip once the 3 free ones are
   gone; Reveal, the open tiles he fits light up; Run It Back, one more life after the last one; the Wild Tile (A$2.99),
   any one open tile you choose. Vault ones first, then the Shop's own flow. Each one used on a card is noted on the
   server (CastAccount.useFor('bingo')), and the server replays every saved board from its seed and moves
   (functions lib/bingo.js), so a board can't claim a tile, a skip, a life or a Wild Tile it didn't have.

   The engine is shared (js/bingo-engine.js = shared/bingo-engine.js); the players are data/bingo.json (tools/build_bingo.py).
   Hidden until the owner presses Launch in Admin, or on a device that opened the private link (CastAccount.bingoOn) */
(function () {
  'use strict';
  var T = window.T, E = window.BINGO_ENGINE;
  if (!T || !E) return;
  var LS_RUN = 'bingo_run_v1', LS_DAILY = 'bingo_daily_v1', LS_BEST = 'bingo_best_v1', LS_MODE = 'bingo_mode_v1';
  var DATA_URL = 'data/bingo.json?v=20261017.1';
  var D = null, loading = null;
  var st = { view: 'start', mode: 'daily' };
  var POS = T.POS_NAMES || { FB: 'Fullback', W: 'Winger', C: 'Centre', FE: 'Five-Eighth', HB: 'Halfback', P: 'Prop', HK: 'Hooker', SR: 'Second Row', LK: 'Lock' };
  var PRICE = { reroll: '$0.99', reveal: '$0.99', wild: '$2.99', rib: '$0.99' };

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { /* storage blocked */ } }
  function lsJson(k) { try { return JSON.parse(lsGet(k) || 'null'); } catch (e) { return null; } }
  function root() { return document.getElementById('bgRoot'); }
  function A() { return window.CastAccount || null; }
  function track(e, p) { if (T.track) T.track(e, p || {}); }
  function load() {
    if (D) return Promise.resolve(D);
    if (!loading) loading = fetch(DATA_URL).then(function (r) { return r.json(); }).then(function (d) { D = d; return d; });
    return loading;
  }
  var SYD = window.Intl && Intl.DateTimeFormat ? new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Sydney', year: 'numeric', month: '2-digit', day: '2-digit' }) : null;
  function today() { return SYD ? SYD.format(new Date()) : new Date().toISOString().slice(0, 10); }
  function newSeed() { var s = '', c = 'abcdefghijkmnpqrstuvwxyz23456789'; for (var i = 0; i < 12; i++) s += c[Math.floor(Math.random() * c.length)]; return s; }
  function clock(ms) { var s = Math.max(0, Math.round((ms || 0) / 1000)); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
  function surname(n) { var w = String(n || '').trim().split(/\s+/); return w.length > 1 ? w.slice(1).join(' ') : w[0] || ''; }
  // "Halfback, 2009 to 2021" (one season: "Prop, 2024")
  function subLine(p) {
    var pos = POS[p[1]] || '', a = p[2], b = p[3], y = !a ? '' : !b || b === a ? String(a) : a + ' to ' + b;
    return pos && y ? pos + ', ' + y : pos || y;
  }
  function tileName(t) { return E.TILES[t][1]; }
  function andList(a) { return a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]; }

  /* ---------- Tiles: each club in its real 2026 home jersey (js/cast-intl.js CastIntl.fill, our kit fills), Origin split
     maroon and blue, the Kangaroos green and gold, the Kiwis black and white. Never a logo ---------- */
  var KIT_W = 100, KIT_H = 76;
  var REP = {
    origin: '<rect width="100" height="76" fill="#1f63b8"/><polygon points="0,0 100,0 0,76" fill="#7b1435"/><polygon points="100,0 104,0 4,76 0,76" fill="#fff" opacity=".85"/>',
    aus: '<rect width="100" height="76" fill="#00843d"/><polygon points="22,0 50,34 78,0 92,0 50,48 8,0" fill="#ffcd00"/>',
    nzl: '<rect width="100" height="76" fill="#0b0b0e"/><polygon points="20,0 50,36 80,0 94,0 50,52 6,0" fill="#f5f5f5"/>'
  };
  var kitCache = {};
  function kitSvg(key) {
    if (kitCache[key]) return kitCache[key];
    var inner = REP[key], CI = window.CastIntl;
    if (!inner && CI && CI.fill && CI.JERSEYS && CI.JERSEYS[key]) { try { inner = CI.fill(CI.JERSEYS[key], KIT_W, KIT_H); } catch (e) { inner = ''; } }
    if (!inner) { var c = T.club ? T.club(key) : { primary: '#1a1a2e', accent: '#fff' }; inner = '<rect width="100" height="76" fill="' + c.primary + '"/><rect y="56" width="100" height="6" fill="' + c.accent + '"/>'; }
    kitCache[key] = '<svg class="bg-kit" viewBox="0 0 ' + KIT_W + ' ' + KIT_H + '" preserveAspectRatio="none" aria-hidden="true" focusable="false">' + inner + '</svg>';
    return kitCache[key];
  }
  function tileHtml(t, opts) {
    var o = opts || {}, b = st.board, key = E.TILES[t][0], g = b ? b.grid[t] : -1, P = D ? D.players : [];
    var cls = 'bg-tile is-' + key + (g >= 0 ? ' is-filled' : g === -2 ? ' is-filled is-wild' : ' is-open');
    if (!o.still && st.hint && st.hint.indexOf(t) >= 0 && g === -1) cls += ' is-hint';
    if (!o.still && st.wildPick && g === -1) cls += ' is-pick';
    if (!o.still && st.flash && st.flash.t === t) cls += st.flash.ok ? ' is-good' : ' is-bad';
    var label = tileName(t) + (g >= 0 ? ', filled by ' + P[g][0] : g === -2 ? ', a Wild Tile' : '');
    var fill = g >= 0 ? '<span class="bg-fill"><i aria-hidden="true">&#x2705;</i><b>' + esc(surname(P[g][0])) + '</b></span>'
      : g === -2 ? '<span class="bg-fill"><i aria-hidden="true">&#x1F0CF;</i><b>Wild Tile</b></span>' : '';
    var tag = o.still ? 'div' : 'button';
    return '<' + tag + (o.still ? '' : ' type="button" data-bg="tile" data-t="' + t + '"' + (g !== -1 ? ' aria-disabled="true"' : '')) + ' class="' + cls + '" aria-label="' + esc(label) + '">' +
      kitSvg(key) + '<span class="bg-tname">' + esc(tileName(t)) + '</span>' + fill + '</' + tag + '>';
  }
  function gridHtml(opts) {
    var h = '';
    for (var t = 0; t < E.N; t++) h += tileHtml(t, opts);
    return '<div class="bg-grid' + (opts && opts.still ? ' is-still' : '') + (st.wildPick && !(opts && opts.still) ? ' is-picking' : '') + '" role="group" aria-label="Your card">' + h + '</div>';
  }

  /* ---------- Daily Bingo: one go a day on any device (meta/daily gbg, like the draft Dailies' goes) ---------- */
  function dailyLocal(date) { var x = lsJson(LS_DAILY); return x && x.date === date ? x : null; }
  function dailyMark(o) { lsSet(LS_DAILY, JSON.stringify(o)); }
  var acctDaily = { date: null, n: 0, asked: false };
  function askAccountDaily() {
    var CA = A(), date = today();
    if (!CA || !CA.dailyAccount || !(CA.isSignedIn && CA.isSignedIn()) || (acctDaily.asked && acctDaily.date === date)) return;
    acctDaily = { date: date, n: 0, asked: true };
    CA.dailyAccount(date, 'bingo').then(function (r) { if (r && acctDaily.date === date) { acctDaily.n = r.n || 0; acctDaily.slots = r.slots || []; if (st.view === 'start') render(); } }, function () {});
  }
  // Today's Daily already used: { filled, won, ms } (what we know of it) or null
  function dailyDone() {
    var date = today(), loc = dailyLocal(date), run = savedRun();
    if (run && run.mode === 'daily' && run.date === date) return null; // part way through: it picks up again
    if (loc) return loc;
    if (acctDaily.date === date && acctDaily.n > 0) {
      var g = (acctDaily.slots || []).map(function (s) { return s.g; }).filter(Boolean)[0];
      return g ? { filled: g.total, won: !!g.win } : { filled: null };
    }
    return null;
  }
  var dRank = { at: 0, r: null };
  function askRank() {
    var CA = A();
    if (!CA || !CA.dailyRank || Date.now() - dRank.at < 30000) return;
    dRank.at = Date.now();
    CA.dailyRank('bgdaily').then(function (r) { dRank.r = r; if (st.view === 'start' || st.view === 'done') render(); }, function () {});
  }

  /* ---------- A board part way through is kept on the device, so a reload (or a dead phone) picks it up again ---------- */
  function savedRun() { var r = lsJson(LS_RUN); return r && D && r.bv === D.v && typeof r.mv === 'string' ? r : null; }
  function keepRun() {
    if (!st.board || st.done) return;
    lsSet(LS_RUN, JSON.stringify({ mode: st.mode, date: st.date || null, seed: st.seed, bv: D.v, mv: st.board.moves, ms: Math.round(st.ms), at: Date.now() }));
  }
  function dropRun() { lsSet(LS_RUN, null); }
  function bests() { return lsJson(LS_BEST) || {}; }

  /* ---------- The board ---------- */
  function start(mode, resume) {
    var CA = A(), daily = mode === 'daily';
    if (!D) return;
    if (!resume) {
      if (daily && dailyDone()) { st = { view: 'start', mode: 'daily' }; render(); return; }
      // The Daily is for CAST Profiles (like 1000TRIES'); Free Play uses one of a guest's 2 free games a day, across the site
      if (daily && CA && CA.needsSignIn && CA.needsSignIn()) { CA.requireSignIn(function () { if (T.bingo) T.bingo.open('daily'); }, 'daily'); return; }
      if (!daily && CA && CA.guestGate && !CA.guestGate(function () { start('free'); }, 'bingo')) { st = { view: 'start', mode: mode }; render(); return; }
    }
    var date = today(), seed = resume ? resume.seed : daily ? E.dailySeed(date) : newSeed();
    var board;
    if (resume) {
      var x = E.build(D.players, resume.seed, resume.mv);
      if (!x.ok) { dropRun(); start(mode); return; }
      board = x.board;
    } else board = new E.Board(D.players, seed);
    st = { view: 'play', mode: mode, date: daily ? (resume ? resume.date : date) : null, seed: seed, board: board, ms: resume ? resume.ms || 0 : 0,
      busy: false, done: false, hint: null, flash: null, note: '', wildPick: false, cardAt: 0, started: Date.now() };
    lsSet(LS_MODE, mode);
    if (CA && CA.useFor) CA.useFor('bingo'); // this board's Rerolls, Reveals, Run It Backs and Wild Tiles are noted on the server
    primeVault();
    if (!resume) {
      track('bingo_start', { mode: mode });
      if (daily) {
        dailyMark({ date: date, started: Date.now() }); // used from the moment it starts (everyone has the same order)
        if (CA && CA.dailyStarted) CA.dailyStarted(date, 'bingo', 1, [Date.now()]);
      }
      keepRun();
    }
    if (board.out) { out(); return; }
    nextCard();
  }
  function primeVault() { var CA = A(); if (CA && CA.rerollsSaved) { CA.rerollsSaved(); if (CA.itemSaved) { CA.itemSaved('reveal'); CA.itemSaved('wild'); CA.itemSaved('rib'); } } }
  function saved(item) { var CA = A(); if (!CA) return 0; return item === 'reroll' ? (CA.rerollsSaved ? CA.rerollsSaved() : 0) || 0 : (CA.itemSaved ? CA.itemSaved(item) : 0) || 0; }
  function priceTag(item) { var n = saved(item); return n ? n + ' saved' : PRICE[item]; }
  // The Vault's counts changed: the labels change in place
  window.addEventListener('cast:rerolls', function () {
    if (st.view !== 'play') return;
    [['reveal', 'reveal'], ['wild', 'wild']].forEach(function (x) { var el = document.querySelector('#bgRoot [data-bg="' + x[0] + '"] small'); if (el) el.innerHTML = priceTag(x[1]); });
    var sk = document.querySelector('#bgRoot [data-bg="skip"] small');
    if (sk && st.board && !st.board.freeSkips()) sk.innerHTML = priceTag('reroll');
  });

  // The next player: everyone who fits no open tile goes by first ("No open tile for him"), a moment each, then the card
  function nextCard() {
    var b = st.board;
    st.hint = null; st.flash = null; st.wildPick = false;
    if (b.won() || b.empty()) { finish(); return; }
    var gone = b.settle();
    if (b.won() || b.empty()) { finish(); return; }
    if (!gone.length) { showCard(); return; }
    st.busy = true; st.auto = { list: gone, i: 0 };
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // the first one long enough to read, the rest flick past with a count (at most about a second and a half)
    var step = function () {
      if (st.view !== 'play' || !st.auto) return;
      render();
      var i = Math.min(st.auto.i, st.auto.list.length - 1), left = st.auto.list.length - 1 - i;
      if (left <= 0) { setTimeout(function () { if (st.view === 'play') { st.auto = null; showCard(); } }, reduce ? 300 : i ? 220 : 750); return; }
      st.auto.i += i ? Math.max(1, Math.ceil(left / 7)) : 1;
      setTimeout(step, reduce ? 120 : i ? 75 : 750);
    };
    step();
  }
  function showCard() { st.busy = false; st.auto = null; st.cardAt = Date.now(); st.fresh = true; render(); st.fresh = false; tick(); }
  // The time only runs while a card waits on you
  var tickT = null;
  function tick() {
    clearInterval(tickT);
    tickT = setInterval(function () {
      if (st.view !== 'play') { clearInterval(tickT); return; }
      var el = document.querySelector('#bgRoot .bg-time b');
      if (el) el.textContent = clock(st.ms + (st.cardAt && !st.busy ? Date.now() - st.cardAt : 0));
    }, 250);
  }
  function took() { var t = st.cardAt && !st.busy ? Date.now() - st.cardAt : 0; st.cardAt = 0; return t; }
  function tap(t) {
    var b = st.board;
    if (st.view !== 'play' || st.busy) return;
    if (st.wildPick) { wildOn(t); return; }
    if (!b.open(t)) return;
    st.ms += took();
    var p = b.card(), r = b.tap(t);
    if (!r.ok) return;
    st.busy = true; st.hint = null;
    st.flash = { t: t, ok: r.right, p: p };
    if (!r.right) {
      var his = E.tilesOf(D.players, p).map(tileName);
      st.note = 'Wrong tile. ' + D.players[p][0] + '\u2019s tiles: ' + andList(his) + '.';
      track('bingo_wrong', { mode: st.mode, lives: b.lives });
    } else st.note = '';
    keepRun();
    render();
    setTimeout(function () {
      if (st.view !== 'play') return;
      st.flash = null;
      if (b.out) { out(); return; }
      if (b.won()) { finish(); return; }
      if (!r.right) setTimeout(function () { if (st.view === 'play') { st.note = ''; if (!st.busy) render(); } }, 2600);
      nextCard();
    }, r.right ? 420 : 1100);
  }
  // Skip: a free one while there are, then a Reroll (the Vault's first, then buy)
  function skip() {
    var b = st.board, CA = A();
    if (st.view !== 'play' || st.busy || st.wildPick) return;
    if (b.freeSkips() > 0) { st.ms += took(); b.skip(); keepRun(); track('bingo_skip', { mode: st.mode, free: 1 }); nextCard(); return; }
    if (!CA || !CA.buyReroll) return;
    var spent = took();
    track('bingo_reroll_tap', { mode: st.mode });
    shopWait(function (done) {
      CA.buyReroll('1000tries', function () {
        if (!done() || st.view !== 'play' || st.done) return;
        b.skip(); keepRun();
        track('bingo_reroll', { mode: st.mode });
        nextCard();
      }, { title: 'Don’t Know Him?', line: 'Your free skips are gone. Use a Reroll to skip him and see the next player.' });
    }, spent);
  }
  // Reveal: his open tiles light up (the Vault's first, then buy)
  function reveal() {
    var b = st.board, CA = A();
    if (st.view !== 'play' || st.busy || st.wildPick || st.hint) return;
    if (!CA || !CA.buyItem) return;
    var spent = took();
    track('bingo_reveal_tap', { mode: st.mode });
    shopWait(function (done) {
      CA.buyItem('reveal', '1000tries', function () {
        if (!done() || st.view !== 'play' || st.done) return;
        var r = b.reveal();
        if (!r.ok) return;
        st.hint = r.tiles; st.cardAt = Date.now(); keepRun();
        track('bingo_reveal', { mode: st.mode, tiles: r.tiles.length });
        render();
      }, { kicker: 'Reveal', title: 'Where Did He Play?', line: 'The open tiles he played for light up. Then you tap one.', foot: 'Reveals work in every CAST game. Saved ones stay on your CAST Profile.' });
    }, spent);
  }
  // The Wild Tile: pick the tile first, then it's used (or bought), so one is never spent on nothing
  function wildStart() {
    if (st.view !== 'play' || st.busy) return;
    st.wildPick = !st.wildPick; st.hint = st.wildPick ? null : st.hint;
    track('bingo_wild_tap', { mode: st.mode });
    render();
  }
  function wildOn(t) {
    var b = st.board, CA = A();
    if (!b.open(t) || !CA || !CA.buyItem) return;
    var spent = took();
    shopWait(function (done) {
      CA.buyItem('wild', '1000tries', function () {
        done(); // a Wild Tile fills a tile, not a player, so a later card is fine
        if (st.view !== 'play' || st.done || !b.open(t)) return;
        st.wildPick = false;
        var r = b.wild(t);
        if (!r.ok) return;
        st.flash = { t: t, ok: true, wild: true }; keepRun();
        track('bingo_wild', { mode: st.mode, tile: E.TILES[t][0] });
        st.busy = true; render();
        setTimeout(function () {
          if (st.view !== 'play') return;
          st.flash = null;
          if (b.won()) { finish(); return; }
          // the same player stays, unless the tile was the only one he fitted
          if (b.openFits(b.order[b.pos]).length) showCard(); else nextCard();
        }, 520);
      }, { kicker: 'Wild Tile', title: 'Fill ' + tileName(t) + ' Now', line: 'Your Wild Tile fills ' + tileName(t) + ', no player needed. The player on your card stays.', foot: 'Wild Tiles work in NRL Bingo. Saved ones stay on your CAST Profile.' });
    }, spent, function () { st.wildPick = false; render(); });
  }
  /* The Shop or a sign-in pop-up may open (or a Vault item is used at once). While it is open the board waits and the time
     stops; it carries on when the pop-up closes without a buy. run(done): done() once the item is in hand */
  function shopWait(run, spent, cancelled) {
    st.busy = true; render();
    var finished = false, watch = null, counted = false, pos = st.board ? st.board.pos : -1;
    var once = function () { if (counted) return 0; counted = true; return spent || 0; };
    // done(): the item is in hand. It says whether the card is still the one it was asked for (a slow Vault answer after
    // the board carried on is never used on the next player), and adds the time spent on the card once
    var done = function () { finished = true; if (watch) clearInterval(watch); st.busy = false; st.ms += once(); return !!st.board && st.board.pos === pos; };
    run(done);
    setTimeout(function () {
      if (finished) return;
      watch = setInterval(function () {
        if (finished) { clearInterval(watch); return; }
        if (!document.querySelector('.ca-rr:not([hidden])') && !document.documentElement.classList.contains('ca-open')) {
          clearInterval(watch); finished = true; st.busy = false;
          if (st.view === 'play') { st.ms += once(); st.cardAt = Date.now(); if (cancelled) cancelled(); else render(); }
        }
      }, 400);
    }, 2500);
  }

  // The last life gone: Run It Back (one more life) or End Board, which drains over OFFER_SECS and ends it by itself
  var OFFER_SECS = 10;
  function out() {
    clearInterval(tickT);
    st.view = 'out'; st.busy = false; st.hold = false; st.offer = OFFER_SECS;
    track('bingo_out', { mode: st.mode, tiles: st.board.filled });
    if (!st.board.filled) { finish(); return; } // nothing on the card to keep going for
    render(); startOffer();
  }
  function paintOffer() {
    var f = document.querySelector('#bgRoot .lock-fill'), n = document.querySelector('#bgRoot .lock-secs');
    if (f) f.style.transform = 'scaleX(' + Math.max(st.offer - 1, 0) / OFFER_SECS + ')';
    if (n) n.textContent = st.offer;
  }
  function startOffer() {
    clearInterval(st.offerT);
    requestAnimationFrame(function () { requestAnimationFrame(paintOffer); });
    st.offerT = setInterval(function () {
      if (st.view !== 'out' || !st.offer || st.hold || st.done) { clearInterval(st.offerT); return; }
      st.offer--; paintOffer();
      if (!st.offer) { track('bingo_rib_offer_timeout', { mode: st.mode }); finish(); }
    }, 1000);
  }
  function runItBack() {
    var CA = A(), b = st.board;
    if (!CA || !CA.buyItem || st.view !== 'out') return;
    clearInterval(st.offerT); st.hold = true; render();
    track('bingo_rib_tap', { mode: st.mode, tiles: b.filled });
    CA.buyItem('rib', '1000tries', function () {
      if (st.view !== 'out' || st.done) return;
      var r = b.runItBack();
      if (!r.ok) return;
      keepRun();
      track('bingo_rib', { mode: st.mode, tiles: b.filled });
      st.view = 'rewind'; render();
      setTimeout(function () { if (st.view === 'rewind') { st.view = 'play'; st.note = ''; nextCard(); } }, 1500);
    }, { kicker: 'Run It Back', title: 'One More Life', line: 'Keep your ' + b.filled + (b.filled === 1 ? ' tile' : ' tiles') + ' and play on with a new player.',
      foot: 'Run It Backs work in NRL Bingo, HIGHER OR LOWER: NRL and 27-0. Saved ones stay on your CAST Profile.' });
    // The Shop closed without a buy: the countdown carries on
    var w = setInterval(function () {
      if (st.view !== 'out' || st.done) { clearInterval(w); return; }
      if (!document.querySelector('.ca-rr:not([hidden])') && !document.documentElement.classList.contains('ca-open')) { clearInterval(w); st.hold = false; render(); startOffer(); }
    }, 600);
  }

  // The board is over for good (a Full House, End Board, the countdown, Home, or leaving the page): saved once
  function finish() {
    clearInterval(tickT); clearInterval(st.offerT);
    var CA = A(), b = st.board;
    if (CA && CA.useFor) CA.useFor(null);
    if (!b || st.done) { if (b) { st.view = 'done'; render(); } return; }
    st.done = true; st.view = 'done';
    dropRun();
    var won = b.won(), ms = Math.round(st.ms);
    var best = bests(), key = st.mode === 'daily' ? 'daily' : 'free', was = best[key];
    st.newBest = !was || b.filled > was.f || (b.filled === was.f && ms < was.ms);
    if (st.newBest) { best[key] = { f: b.filled, ms: ms }; lsSet(LS_BEST, JSON.stringify(best)); }
    if (st.mode === 'daily') dailyMark({ date: st.date, done: true, filled: b.filled, won: won, ms: ms });
    track('bingo_end', { mode: st.mode, tiles: b.filled, won: won ? 1 : 0, secs: Math.round(ms / 1000) });
    if (b.moves.replace(/[VB]|W[a-t]/g, '').length || b.wilds) {
      var d = { seed: st.seed, mv: b.moves, bv: D.v, ms: ms, bgv: E.VERSION };
      if (st.mode === 'daily') d.date = st.date;
      if (b.ribs) d.rib = b.ribs;
      if (b.paidSkips()) d.rr = b.paidSkips();
      if (b.reveals) d.rv = b.reveals;
      if (b.wilds) d.wt = b.wilds;
      try {
        if (CA && CA.record) CA.record({ game: '1000tries', mode: st.mode === 'daily' ? 'bingod' : 'bingo', score: b.filled, result: won ? 'full' : 'out', win: won, top: false, picks: [], d: d });
        var tr = [], help = b.wilds || b.reveals || b.paidSkips() || b.ribs, rep = ['origin', 'aus', 'nzl'].every(function (k) { return b.grid[E.INDEX[k]] >= 0; });
        if (b.filled >= 15) tr.push('bg15');
        if (won) tr.push('bgfull');
        if (won && !b.wrong && !b.ribs) tr.push('bgclean');
        if (won && ms < 120000) tr.push('bgspeed');
        if (rep) tr.push('bgrep');
        if (won && !help) tr.push('bgnohelp');
        if (won && st.mode === 'daily') tr.push('bgdaily');
        if (tr.length && CA && CA.unlock) CA.unlock(tr);
        if (CA && CA.refresh) CA.refresh();
      } catch (e) { /* the board stays on this device */ }
    }
    if (st.mode === 'daily') { dRank.at = 0; setTimeout(askRank, 2500); }
    if (st.quiet) return;
    render();
    makeCard();
  }
  window.addEventListener('pagehide', function () { if (st.view === 'out') finish(); else if (st.view === 'play') keepRun(); });

  /* ---------- Share: the card as a picture (made as the results show, so a tap shares it straight away), else words ---------- */
  var shareFile = null;
  function shareText() {
    var b = st.board, rows = [];
    for (var r = 0; r < 5; r++) {
      var line = '';
      for (var c = 0; c < 4; c++) { var g = b.grid[r * 4 + c]; line += g >= 0 ? '🟩' : g === -2 ? '🃏' : '⬛'; }
      rows.push(line);
    }
    var head = 'NRL Bingo · ' + (st.mode === 'daily' ? 'Daily Bingo ' + st.date : 'Free Play');
    var line2 = b.won() ? '🎉 Full House in ' + clock(st.ms) : b.filled + ' of 20 tiles in ' + clock(st.ms);
    return head + '\n' + line2 + '\n' + rows.join('\n') + '\nCan you fill the card?';
  }
  function shareUrl() {
    var u = window.CG && window.CG.url ? window.CG.url('nrl-bingo/') : 'https://castgames.com.au/1000tries/?play=bingo';
    var CA = A();
    return CA && CA.inviteLink ? CA.inviteLink(u) : u;
  }
  function share() {
    var txt = shareText(), url = shareUrl();
    track('bingo_share', { mode: st.mode, tiles: st.board.filled, card: shareFile ? 1 : 0 });
    var desktop = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (shareFile && navigator.canShare && navigator.share && !desktop) {
      var withFile = { files: [shareFile], text: txt + '\n' + url };
      var ok = false; try { ok = navigator.canShare(withFile); } catch (e) { ok = false; }
      if (ok) { navigator.share(withFile).catch(function () {}); return; }
    }
    if (navigator.share && !desktop) { navigator.share({ text: txt, url: url }).catch(function () {}); return; }
    try { navigator.clipboard.writeText(txt + '\n' + url); flash('Copied. Paste it anywhere.'); } catch (e) { /* no clipboard */ }
  }
  function flash(msg) { st.toast = msg; render(); setTimeout(function () { st.toast = ''; render(); }, 2200); }
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  // The card's tiles as pictures: each jersey drawn from its SVG, then the grid on a 1080 x 1350 post
  function makeCard() {
    shareFile = null;
    if (!window.Blob || !document.createElement('canvas').getContext) return;
    var b = st.board, P = D.players, W = 1080, H = 1350, imgs = [], left = E.N;
    var cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    var ctx = cv.getContext('2d');
    var draw = function () {
      var g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#16210d'); g.addColorStop(1, '#07090a');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(163,230,53,.12)'; ctx.beginPath(); ctx.arc(W / 2, 120, 520, 0, Math.PI * 2); ctx.fill();
      ctx.textAlign = 'center'; ctx.fillStyle = '#ffffff';
      ctx.font = '900 92px Inter, Arial, sans-serif'; ctx.fillText('NRL BINGO', W / 2, 132);
      ctx.font = '800 32px Inter, Arial, sans-serif'; ctx.fillStyle = '#c8f08a';
      ctx.fillText((st.mode === 'daily' ? 'DAILY BINGO · ' + st.date : 'FREE PLAY').toUpperCase(), W / 2, 186);
      ctx.fillStyle = '#ffffff'; ctx.font = '900 72px Inter, Arial, sans-serif';
      ctx.fillText(b.won() ? 'FULL HOUSE · ' + clock(st.ms) : b.filled + ' OF 20 · ' + clock(st.ms), W / 2, 280);
      var gx = 70, gy = 318, tw = 220, th = 160, gap = 13;
      for (var t = 0; t < E.N; t++) {
        var x = gx + (t % 4) * (tw + gap), y = gy + Math.floor(t / 4) * (th + gap), cell = b.grid[t];
        ctx.save(); rr(ctx, x, y, tw, th, 18); ctx.clip();
        if (imgs[t] && imgs[t].ok) ctx.drawImage(imgs[t].img, x, y, tw, th); else { ctx.fillStyle = '#1c1c2e'; ctx.fillRect(x, y, tw, th); }
        ctx.fillStyle = cell === -1 ? 'rgba(6,8,12,.62)' : 'rgba(6,8,12,.35)'; ctx.fillRect(x, y, tw, th);
        ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(x, y + th - 46, tw, 46);
        ctx.fillStyle = '#ffffff'; ctx.font = '800 26px Inter, Arial, sans-serif'; ctx.fillText(tileName(t), x + tw / 2, y + th - 14);
        if (cell !== -1) {
          var fz = 30, nm = cell === -2 ? 'WILD TILE' : surname(P[cell][0]).toUpperCase();
          ctx.fillStyle = '#ffffff'; ctx.font = '900 ' + fz + 'px Inter, Arial, sans-serif';
          while (ctx.measureText(nm).width > tw - 20 && fz > 16) { fz -= 2; ctx.font = '900 ' + fz + 'px Inter, Arial, sans-serif'; }
          var nw = ctx.measureText(nm).width;
          ctx.fillStyle = 'rgba(0,0,0,.62)'; rr(ctx, x + tw / 2 - nw / 2 - 10, y + 56, nw + 20, fz + 14, 8); ctx.fill();
          ctx.fillStyle = cell === -2 ? '#fbcfe8' : '#ffffff'; ctx.fillText(nm, x + tw / 2, y + 63 + fz * .82);
          ctx.font = '38px sans-serif'; ctx.fillText(cell === -2 ? '🃏' : '✅', x + tw / 2, y + 46);
        }
        ctx.restore();
        ctx.strokeStyle = cell === -1 ? 'rgba(255,255,255,.12)' : 'rgba(163,230,53,.9)'; ctx.lineWidth = cell === -1 ? 2 : 5; rr(ctx, x, y, tw, th, 18); ctx.stroke();
      }
      ctx.fillStyle = '#c8f08a'; ctx.font = '900 34px Inter, Arial, sans-serif'; ctx.fillText('CAN YOU FILL THE CARD?', W / 2, 1250);
      ctx.fillStyle = '#ffffff'; ctx.font = '800 30px Inter, Arial, sans-serif'; ctx.fillText('1000TRIES.COM.AU', W / 2, 1300); // the graphics rule: the game's own address
      try { cv.toBlob(function (bl) { if (bl && window.File) shareFile = new File([bl], 'nrl-bingo.png', { type: 'image/png' }); }, 'image/png'); } catch (e) { /* no picture: words only */ }
    };
    for (var t = 0; t < E.N; t++) (function (t) {
      var img = new Image(), svg = kitSvg(E.TILES[t][0]).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="220" height="160" ');
      imgs[t] = { img: img, ok: false };
      img.onload = function () { imgs[t].ok = true; if (!--left) draw(); };
      img.onerror = function () { if (!--left) draw(); };
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    })(t);
  }

  /* ---------- Screens ---------- */
  function hearts(n) { var h = ''; for (var i = 0; i < E.LIVES; i++) h += '<i class="' + (i < n ? 'is-on' : 'is-off') + '">' + (i < n ? '&#x2764;&#xFE0F;' : '&#x1F5A4;') + '</i>'; return h; }
  function stars(n) { var h = ''; for (var i = 0; i < E.SKIPS; i++) h += '<i class="' + (i < n ? 'is-on' : 'is-off') + '">&#x2B50;</i>'; return h; }
  function modeName(m) { return m === 'daily' ? 'Daily Bingo' : 'Free Play'; }
  function startView() {
    var dd = dailyDone(), best = bests(), sel = st.mode === 'free' ? 'free' : 'daily', run = savedRun();
    askAccountDaily(); if (dd) askRank();
    var rk = dRank.r && dRank.r.who === 'player' && dRank.r.rank ? '&#x1F3C6; #' + dRank.r.rank + ' of ' + dRank.r.players + ' today' : '';
    var dStatus = dd ? (dd.filled == null ? '&#x2714;&#xFE0F; Played today' : '&#x2714;&#xFE0F; Played: ' + (dd.won ? 'Full House' : dd.filled + ' of 20') + (dd.ms ? ' in ' + clock(dd.ms) : '')) + (rk ? ' &middot; ' + rk : '')
      : run && run.mode === 'daily' && run.date === today() ? '&#x23F8;&#xFE0F; Part way through' : 'One go today';
    var fb = best.free;
    var tile = function (m, kicker, title, line, status) {
      var on = m === sel;
      return '<button type="button" role="tab" aria-selected="' + on + '" class="bg-mode is-' + m + (on ? ' is-on' : '') + '" data-bg="mode" data-v="' + m + '">' +
        (kicker ? '<span class="bg-mode-k">' + kicker + '</span>' : '') + '<b>' + title + '</b><small>' + line + '</small><em>' + status + '</em></button>';
    };
    var played = sel === 'daily' && dd, resume = run && run.mode === sel && (sel !== 'daily' || run.date === today());
    var fresh = resume && sel === 'free' ? '<button type="button" class="ou-link bg-link" data-bg="newcard">&#x1F195; Start a New Card</button>' : '';
    return '<div class="bg-start"><h1 class="bg-logo"><span>NRL</span> Bingo</h1>' +
      '<div class="bg-demo" aria-hidden="true">' + demoGrid() + '</div>' +
      '<p class="bg-lede">A player comes up. Tap a tile he played for. Fill all <b>20 tiles</b> for a Full House.</p>' +
      '<div class="bg-modes" role="tablist" aria-label="Mode">' +
        tile('daily', 'Daily Challenge', 'Daily Bingo', 'The same players for everyone today.', dStatus) +
        tile('free', '', 'Free Play', 'A new order of players every card.', fb ? 'Best: ' + (fb.f === 20 ? 'Full House' : fb.f + ' of 20') + ' in ' + clock(fb.ms) : 'Play as often as you like') +
      '</div>' +
      (played ? '<button type="button" class="btn btn-primary bg-play" data-bg="free">Play Free Play <i aria-hidden="true">&#x25B6;</i></button>'
        : '<button type="button" class="btn btn-primary bg-play" data-bg="play">' + (resume ? 'Carry On ' : 'Play ') + modeName(sel) + ' <i aria-hidden="true">&#x25B6;</i></button>') + fresh +
      '<ul class="bg-rules"><li><i aria-hidden="true">&#x2705;</i>Tap a tile he played for</li><li><i aria-hidden="true">&#x2764;&#xFE0F;</i>A wrong tap costs a life</li><li><i aria-hidden="true">&#x2B50;</i>3 free skips</li></ul>' +
      '<button type="button" class="ou-link bg-link" data-bg="board">&#x1F3C6; NRL Bingo Leaderboard</button></div>';
  }
  // The start screen's small card: a few tiles filled, in their jerseys
  function demoGrid() {
    var fill = { 2: 'Thurston', 7: 'Cleary', 8: 'Inglis', 13: 'Smith', 17: 'Lockyer', 19: 'Marshall' }, h = '';
    for (var t = 0; t < E.N; t++) h += '<span class="bg-mini is-' + E.TILES[t][0] + (fill[t] ? ' is-filled' : '') + '">' + kitSvg(E.TILES[t][0]) + (fill[t] ? '<i>&#x2705;</i>' : '') + '</span>';
    return h;
  }
  function pinHtml() {
    // never b.card() here: drawing must not move the board on (the players passed over are shown by nextCard)
    var b = st.board, P = D.players, a = st.auto, p = st.flash && st.flash.p != null ? st.flash.p : a ? a.list[Math.min(a.i, a.list.length - 1)] : b.over() ? -1 : b.order[b.pos], pl = p >= 0 ? P[p] : null;
    var dis = st.busy || !!a ? ' disabled' : '', free = b.freeSkips();
    var card = pl ? '<div class="bg-card' + (a ? ' is-auto' : '') + (st.fresh ? ' is-new' : '') + (st.flash && !st.flash.ok ? ' is-bad' : st.flash && st.flash.ok && !st.flash.wild ? ' is-good' : '') + '" aria-live="polite">' +
        '<b class="bg-card-name">' + esc(pl[0]) + '</b><small class="bg-card-sub">' + esc(subLine(pl)) + '</small>' +
        (a ? '<em class="bg-stamp">No Open Tile for Him' + (a.list.length > 1 ? ' <span>' + (Math.min(a.i, a.list.length - 1) + 1) + ' of ' + a.list.length + '</span>' : '') + '</em>' : '') + '</div>'
      : '<div class="bg-card is-empty"><b class="bg-card-name">&nbsp;</b></div>';
    var note = st.wildPick ? '<p class="bg-note is-pick">&#x1F0CF; Tap the open tile your Wild Tile fills. <button type="button" class="bg-x" data-bg="wild">Cancel</button></p>'
      : st.note ? '<p class="bg-note is-bad">' + esc(st.note) + '</p>' : st.hint ? '<p class="bg-note is-hint">&#x1F440; ' + (st.hint.length === 1 ? 'He fits the lit tile.' : 'He fits the ' + st.hint.length + ' lit tiles.') + '</p>' : '';
    return '<div class="bg-pin">' +
      '<div class="bg-status"><span class="bg-lives" aria-label="' + b.lives + ' lives left">' + hearts(b.lives) + '</span>' +
        '<span class="bg-skips" aria-label="' + free + ' free skips left">' + stars(free) + '</span>' +
        '<span class="bg-count" aria-label="' + b.filled + ' of 20 tiles"><b>' + b.filled + '</b>/20</span>' +
        '<span class="bg-time" aria-label="Time"><i aria-hidden="true">&#x23F1;&#xFE0F;</i><b>' + clock(st.ms) + '</b></span></div>' +
      card + note +
      '<div class="bg-acts">' +
        '<button type="button" class="bg-act ' + (free ? 'is-skip' : 'is-rr') + '" data-bg="skip"' + dis + '><span>' + (free ? '&#x2B50; Skip' : '&#x1F504; Reroll') + '</span><small>' + (free ? free + ' free' : priceTag('reroll')) + '</small></button>' +
        '<button type="button" class="bg-act is-rv" data-bg="reveal"' + (dis || (st.hint ? ' disabled' : '')) + '><span>&#x1F440; Reveal</span><small>' + priceTag('reveal') + '</small></button>' +
        '<button type="button" class="bg-act is-wild' + (st.wildPick ? ' is-on' : '') + '" data-bg="wild"' + dis + ' aria-pressed="' + !!st.wildPick + '"><span>&#x1F0CF; Wild Tile</span><small>' + priceTag('wild') + '</small></button>' +
      '</div></div>';
  }
  function playView() { return pinHtml() + gridHtml(); }
  function outView() {
    var b = st.board;
    return '<div class="bg-out"><div class="bg-out-h">&#x1F494; Out of Lives</div>' +
      '<p class="bg-out-why">' + b.filled + ' of 20 tiles filled. One more life keeps your card going.</p>' +
      gridHtml({ still: true }) +
      '<div class="panel ou-decide bg-decide"><div class="panel-head"><span class="panel-title">Run It Back?</span><span class="panel-meta">' + modeName(st.mode) + '</span></div>' +
        '<div class="decision is-over"><p class="decision-big">' + b.filled + ' <small>of 20</small></p><p>Play on with one more life and a new player.</p>' +
        '<div class="btn-row">' +
          '<button type="button" class="btn btn-decide btn-decide-remove ou-decide-rib" data-bg="rib"><span class="btn-decide-lbl">&#x23EA; Run It Back</span><small>' + priceTag('rib') + '</small></button>' +
          '<button type="button" class="btn btn-decide btn-decide-lock" data-bg="end" aria-label="End the board' + (st.hold ? '' : ' (ends by itself in ' + OFFER_SECS + ' seconds)') + '">' +
            '<span class="lock-fill" aria-hidden="true" style="transform:scaleX(' + (st.hold ? 1 : st.offer / OFFER_SECS) + ')"></span>' +
            '<span class="btn-decide-lbl">&#x1F3C1; End Board' + (st.hold ? '' : ' <b class="lock-secs">' + st.offer + '</b>') + '</span></button>' +
        '</div></div></div></div>';
  }
  function rewindView() {
    return outView() + '<div class="ou-rewind" role="status"><div class="ou-rw-rays" aria-hidden="true"></div><span class="ou-rw-ico" aria-hidden="true">&#x23EA;</span><b class="ou-rw-t">Run It Back</b>' +
      '<span class="ou-rw-s"><i aria-hidden="true">&#x2764;&#xFE0F;</i>1 <small>more life</small></span></div>';
  }
  function doneView() {
    var b = st.board, won = b.won(), help = [];
    if (b.wilds) help.push('&#x1F0CF; ' + b.wilds);
    if (b.reveals) help.push('&#x1F440; ' + b.reveals);
    if (b.paidSkips()) help.push('&#x1F504; ' + b.paidSkips());
    if (b.ribs) help.push('&#x23EA; ' + b.ribs);
    var best = bests()[st.mode === 'daily' ? 'daily' : 'free'];
    var rk = st.mode === 'daily' && dRank.r && dRank.r.who === 'player' && dRank.r.rank ? '<p class="bg-rank">&#x1F3C6; You are <b>#' + dRank.r.rank + '</b> of ' + dRank.r.players + ' on today&rsquo;s Daily Bingo</p>' : '';
    var again = st.mode === 'daily' ? '<button type="button" class="btn btn-res btn-res-again btn-block" data-bg="mode" data-v="free"><span aria-hidden="true">&#x1F3B2;</span> Play Free Play</button>'
      : '<button type="button" class="btn btn-res btn-res-again btn-block" data-bg="again"><span aria-hidden="true">&#x1F504;</span> Play Again</button>';
    return '<div class="bg-res">' +
      '<div class="bg-hero' + (won ? ' is-won' : '') + '"><span class="bg-hero-k">' + (won ? '&#x1F389; Full House' : '&#x1F494; Out of Lives') + ' &middot; ' + modeName(st.mode) + '</span>' +
        '<span class="bg-hero-n">' + b.filled + '<small>/20</small></span>' +
        '<span class="bg-hero-s">tiles in ' + clock(st.ms) + (st.newBest ? '<em class="ou-best">New Best</em>' : best ? '<em class="ou-best is-old">Best ' + best.f + ' in ' + clock(best.ms) + '</em>' : '') + '</span></div>' +
      rk +
      '<div class="bg-stats"><span><b>' + clock(st.ms) + '</b><small>Time</small></span><span><b>' + b.lives + '</b><small>Lives Left</small></span>' +
        '<span><b>' + (help.length ? help.join(' ') : '&#x2714;') + '</b><small>' + (help.length ? 'Help Used' : 'No Help') + '</small></span></div>' +
      '<div class="res-acts bg-acts-res">' + again +
        '<div class="res-two"><button type="button" class="btn btn-res btn-res-share" data-bg="share"><span aria-hidden="true">&#x1F4E4;</span> Share</button>' +
        '<button type="button" class="btn btn-res btn-res-mode" data-bg="board"><span aria-hidden="true">&#x1F3C6;</span> Leaderboard</button></div>' +
        '<button type="button" class="btn btn-res btn-res-mode btn-block" data-bg="home"><span aria-hidden="true">&#x1F3AE;</span> Change Mode</button></div>' +
      '<div class="panel bg-yours"><div class="panel-head"><span class="panel-title">Your Card</span><span class="panel-meta">' + b.filled + ' of 20</span></div>' + gridHtml({ still: true }) + '</div>' +
      '</div>';
  }
  // A long tile name ("Wests Tigers", "Sea Eagles") steps down in size to stay on one line, never cut
  function fitNames(el) {
    Array.prototype.forEach.call(el.querySelectorAll('.bg-tname, .bg-fill b'), function (c) {
      c.style.fontSize = '';
      var fs = parseFloat(getComputedStyle(c).fontSize) || 12;
      while (c.scrollWidth > c.clientWidth + 1 && fs > 8.5) { fs -= .5; c.style.fontSize = fs + 'px'; }
    });
  }
  window.addEventListener('resize', function () { var r = root(); if (r && r.offsetParent) fitNames(r); });
  function render() {
    var el = root();
    if (!el) return;
    var h = '<div class="bg-head"><button type="button" class="ou-back" data-bg="home" aria-label="Back">&larr;</button>' + (st.view === 'start' ? '' : '<span>NRL Bingo &middot; ' + modeName(st.mode) + '</span>') + '</div>';
    if (!D) h += '<div class="ou-load">Loading the players&hellip;</div>';
    else h += st.view === 'play' ? playView() : st.view === 'out' ? outView() : st.view === 'rewind' ? rewindView() : st.view === 'done' ? doneView() : startView();
    if (st.toast) h += '<p class="ou-note" role="status">' + esc(st.toast) + '</p>';
    el.className = 'wrap bg-v-' + st.view;
    el.innerHTML = h;
    fitNames(el);
  }

  // A Free Play card left part way through, given up for a new one: it is saved as it is (its Vault items with it)
  function abandon() {
    var run = savedRun();
    if (!run || run.mode !== 'free') return;
    var x = E.build(D.players, run.seed, run.mv);
    dropRun();
    if (!x.ok) return;
    st = { view: 'play', mode: 'free', seed: run.seed, board: x.board, ms: run.ms || 0, quiet: true };
    finish();
  }
  function boardId() { return st.mode === 'daily' ? 'bgdaily' : 'bgfree'; }
  document.addEventListener('click', function (e) {
    var bn = e.target.closest && e.target.closest('[data-bingo-open]');
    if (bn && T.bingo.on()) { e.preventDefault(); T.bingo.open(); return; }
    var t = e.target.closest && e.target.closest('[data-bg]');
    if (!t || !root() || !root().contains(t)) return;
    var a = t.getAttribute('data-bg');
    if (a === 'tile') tap(+t.getAttribute('data-t'));
    else if (a === 'skip') skip();
    else if (a === 'reveal') reveal();
    else if (a === 'wild') wildStart();
    else if (a === 'rib') runItBack();
    else if (a === 'end') { track('bingo_rib_offer_no', { mode: st.mode }); finish(); }
    else if (a === 'mode') { var m = t.getAttribute('data-v') === 'free' ? 'free' : 'daily'; if (st.view === 'done') { st = { view: 'start', mode: m }; start(m); return; } st.mode = m; lsSet(LS_MODE, m); render(); }
    else if (a === 'free') { st = { view: 'start', mode: 'free' }; var fr = savedRun(); start('free', fr && fr.mode === 'free' ? fr : null); }
    else if (a === 'newcard') { abandon(); start('free'); }
    else if (a === 'play') { var rn = savedRun(); start(st.mode, rn && rn.mode === st.mode && (st.mode !== 'daily' || rn.date === today()) ? rn : null); }
    else if (a === 'again') { st = { view: 'start', mode: 'free' }; start('free'); }
    else if (a === 'share') share();
    else if (a === 'board') { if (st.view === 'out') finish(); var CA = A(); if (CA && CA.openBoards) CA.openBoards([boardId(), st.mode === 'daily' ? 'today' : 'week']); }
    else if (a === 'home') {
      if (st.view === 'play' && st.board && !st.board.over() && st.board.moves) {
        // a Daily can't be played again, so leaving it is final; a Free Play board waits on this device to carry on
        if (st.mode === 'daily' && !window.confirm('Leave today’s Daily Bingo? Your card ends here and counts as it is.')) return;
        if (st.mode === 'daily') finish(); else { keepRun(); clearInterval(tickT); var CA2 = A(); if (CA2 && CA2.useFor) CA2.useFor(null); }
      } else if (st.view === 'out') finish();
      var m2 = st.mode; st = { view: 'start', mode: m2 };
      if (T.bingoHome) T.bingoHome(); else if (T.ouHome) T.ouHome();
    }
  });

  // The 1000TRIES home card (js/app.js placeBingo), under HIGHER OR LOWER: NRL's: a small card of jerseys with a few ticks
  if (T.render) T.render.bingoCard = function () {
    var fill = { 1: 1, 6: 1, 8: 1, 13: 1, 17: 1 }, h = '';
    for (var t = 0; t < E.N; t++) h += '<span class="bg-mini' + (fill[t] ? ' is-filled' : '') + '">' + kitSvg(E.TILES[t][0]) + (fill[t] ? '<i>&#x2705;</i>' : '') + '</span>';
    return '<button type="button" class="bgp" data-bingo-open aria-label="Play NRL Bingo"><span class="bgp-new">New</span><span class="bgp-grid" aria-hidden="true">' + h + '</span>' +
      '<span class="bgp-t"><b>NRL Bingo</b><small>Tap the clubs he played for. Fill all 20 tiles.</small></span><span class="bgp-go" aria-hidden="true">&#x25B6;</span></button>';
  };
  T.bingo = {
    // Open the start screen (the home card, ?play=bingo, a board's Play button). mode: 'daily' or 'free' to start on
    open: function (mode) {
      if ((st.view === 'play' || st.view === 'out' || st.view === 'rewind') && !st.done) { if (T.showScreen) T.showScreen('bingo'); render(); return; }
      var m = mode === 'free' || mode === 'daily' ? mode : lsGet(LS_MODE) === 'free' ? 'free' : 'daily';
      st = { view: 'start', mode: m };
      if (T.showScreen) T.showScreen('bingo');
      primeVault(); render();
      load().then(function () {
        render();
        // a board part way through picks up where it was (a Daily only on its own day)
        var run = savedRun();
        if (run && (run.mode !== 'daily' || run.date === today()) && run.mode === m && mode) start(m, run);
      }, function () { var el = root(); if (el) el.innerHTML = '<div class="ou-load">Could not load the players. Check your connection and try again.</div>'; });
    },
    on: function () { var CA = A(); return !!(CA && CA.bingoOn && CA.bingoOn()); },
    // a card under way (the page's CAST_ACCOUNT.inGame: pop-ups wait, and a sign-in keeps the card)
    playing: function () { return (st.view === 'play' || st.view === 'out' || st.view === 'rewind') && !st.done; }
  };
  // Tests on the preview only (localhost): the current card's open tiles
  if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) T.bingo._card = function () { return shareFile; };
  if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) T.bingo._fits = function () { var b = st.board; return b && st.view === 'play' && !st.auto && !st.busy && !b.over() ? b.openFits(b.order[b.pos]) : null; };
  // ?play=bingo (a board's Play button, a share, CAST Games' /nrl-bingo/) or the owner's private link (?bingo=...): straight
  // in once the account module (which knows if it's on) has loaded; the rest of the page stays hidden until it opens
  // (or CAST Games' page for it, window.CG_MODE 'bingo' or 'bingo-daily', 17 Oct 2026: every mode its own page)
  var want = /[?&](play=(bingo|bingod|bingo-daily)|bingo=[a-z0-9]+)(?=&|#|$)/.exec(location.search) || (/^bingo/.test(window.CG_MODE || '') ? [0, 0, window.CG_MODE] : null);
  if (T.bingoWanted || want) {
    var docEl = document.documentElement, boot = document.createElement('style'), tries = 0, mode = want && (want[2] === 'bingo-daily' || want[2] === 'bingod') ? 'daily' : null;
    boot.textContent = 'html.bg-boot .screen:not(#screen-bingo) { display: none !important; }';
    document.head.appendChild(boot);
    docEl.classList.add('bg-boot');
    (function go() {
      if (T.showScreen && T.bingo.on()) { T.bingo.open(mode || T.bingoWanted || undefined); docEl.classList.remove('bg-boot'); return; }
      if (++tries < 80) setTimeout(go, 100); else docEl.classList.remove('bg-boot');
    })();
  }
})();
