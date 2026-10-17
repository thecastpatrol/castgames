/* NRL Bingo (17 Oct 2026, the owner's BUILD IT; based on The Cast Patrol's 2023 TikTok filter). A 4 x 6 card: the 17 NRL
   clubs and seven rep tiles (NSW Blues, QLD Maroons, Australia, New Zealand, England, Samoa and Tonga), each in its own
   colours (our kit fills and plain rep colours, never a logo or a photo). A player comes up with his position and career
   years: tap a tile he played for and it fills with his name. Fill all 24 for a Full House. Boards rank the tiles filled,
   then the time (only the time a card was waiting on you counts).

   One endless game (the owner, 17 Oct 2026: no Daily Bingo): a new order of players every card, as many cards as you like.
   A guest's card uses one of the site's 2 free games a day.

   The rules (the owner, 17 Oct 2026, after playing it; shared/bingo-engine.js VERSION 2): pot luck, players are dealt with
   no help towards your open tiles. 3 lives. A wrong tap costs one. A player who fits none of your open tiles is offered a
   Reroll; without one he costs a life by himself. No free skips. After every turn (a right tap, a wrong one, or a life lost
   to a player with no open tile) a pop-up shows every team he played for, and the game waits on its Next Player button.

   Money (the standard wildcard names, nothing free, CAST Pass included): Reroll, skip the player on the card; Reveal, the
   open tiles he fits light up; Run It Back, one more life after the last one; the Wild Tile (A$2.99, or 3 for A$6.99), any
   one open tile you choose. Vault ones first, then the Shop's own flow. Each one used on a card is noted on the server
   (CastAccount.useFor('bingo')), and the server replays every saved board from its seed and moves (functions
   lib/bingo.js), so a board can't claim a tile, a skip, a life or a Wild Tile it didn't have.

   The engine is shared (js/bingo-engine.js = shared/bingo-engine.js); the players are data/bingo.json (tools/build_bingo.py).
   Hidden until the owner presses Launch in Admin, or on a device that opened the private link (CastAccount.bingoOn) */
(function () {
  'use strict';
  var T = window.T, E = window.BINGO_ENGINE;
  if (!T || !E) return;
  var LS_RUN = 'bingo_run_v1', LS_BEST = 'bingo_best_v2'; // v2: the 24 tile card (bests on the old 20 tile card don't carry)
  var DATA_URL = 'data/bingo.json?v=20261017.3';
  var D = null, loading = null;
  var st = { view: 'start' };
  var POS = T.POS_NAMES || { FB: 'Fullback', W: 'Winger', C: 'Centre', FE: 'Five-Eighth', HB: 'Halfback', P: 'Prop', HK: 'Hooker', SR: 'Second Row', LK: 'Lock' };
  var PRICE = { reroll: '$0.99', reveal: '$0.99', wild: '$2.99', rib: '$0.99' };
  var NOFIT_SECS = 6; // a player with no open tile: this long to use a Reroll before he costs a life by himself

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { /* storage blocked */ } }
  function lsJson(k) { try { return JSON.parse(lsGet(k) || 'null'); } catch (e) { return null; } }
  function root() { return document.getElementById('bgRoot'); }
  /* The turn pop-up lives in its own box on the page's body: the screens animate in with a transform, which would pin a
     fixed pop-up to the screen instead of the phone's own bottom edge */
  function host() {
    var h = document.getElementById('bgSheetHost');
    if (!h) { h = document.createElement('div'); h.id = 'bgSheetHost'; h.className = 'bg-host'; document.body.appendChild(h); }
    return h;
  }
  function inBingo(el) { var r = root(), h = document.getElementById('bgSheetHost'); return !!((r && r.contains(el)) || (h && h.contains(el))); }
  function A() { return window.CastAccount || null; }
  function track(e, p) { if (T.track) T.track(e, p || {}); }
  function load() {
    if (D) return Promise.resolve(D);
    if (!loading) loading = fetch(DATA_URL).then(function (r) { return r.json(); }).then(function (d) { D = d; return d; });
    return loading;
  }
  function newSeed() { var s = '', c = 'abcdefghijkmnpqrstuvwxyz23456789'; for (var i = 0; i < 12; i++) s += c[Math.floor(Math.random() * c.length)]; return s; }
  function clock(ms) { var s = Math.max(0, Math.round((ms || 0) / 1000)); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
  function surname(n) { var w = String(n || '').trim().split(/\s+/); return w.length > 1 ? w.slice(1).join(' ') : w[0] || ''; }
  // "Halfback, 2009 to 2021" (one season: "Prop, 2024")
  function subLine(p) {
    var pos = POS[p[1]] || '', a = p[2], b = p[3], y = !a ? '' : !b || b === a ? String(a) : a + ' to ' + b;
    return pos && y ? pos + ', ' + y : pos || y;
  }
  function tileName(t) { return E.TILES[t][1]; }
  // "the Broncos", but "NSW Blues", "Australia"
  function theName(t) { return t < 17 ? 'the ' + tileName(t) : tileName(t); }

  /* ---------- Tiles: each club in its real 2026 home jersey (js/cast-intl.js CastIntl.fill, our kit fills), the rep sides
     in plain colours of their own. Never a logo ---------- */
  var KIT_W = 100, KIT_H = 76;
  var REP = {
    nsw: '<rect width="100" height="76" fill="#3a8fd6"/><polygon points="24,0 50,30 76,0 90,0 50,44 10,0" fill="#0b2d63"/>',
    qld: '<rect width="100" height="76" fill="#7b1435"/><polygon points="24,0 50,30 76,0 90,0 50,44 10,0" fill="#f2b632"/>',
    aus: '<rect width="100" height="76" fill="#00843d"/><polygon points="22,0 50,34 78,0 92,0 50,48 8,0" fill="#ffcd00"/>',
    nzl: '<rect width="100" height="76" fill="#0b0b0e"/><polygon points="20,0 50,36 80,0 94,0 50,52 6,0" fill="#f5f5f5"/>',
    eng: '<rect width="100" height="76" fill="#f4f4f4"/><rect y="30" width="100" height="14" fill="#c8102e"/>',
    sam: '<rect width="100" height="76" fill="#0b3f91"/><polygon points="22,0 50,32 78,0 92,0 50,46 8,0" fill="#ffffff"/>',
    ton: '<rect width="100" height="76" fill="#c10000"/><rect y="28" width="100" height="8" fill="#ffffff"/><rect y="40" width="100" height="8" fill="#ffffff"/>'
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
    var hinted = !o.still && st.hint && st.hint.indexOf(t) >= 0 && g === -1;
    if (hinted) cls += ' is-hint';
    if (!o.still && st.wildPick && g === -1) cls += ' is-pick';
    if (!o.still && st.flash && st.flash.t === t) cls += st.flash.ok ? ' is-good' : ' is-bad';
    var label = tileName(t) + (g >= 0 ? ', filled by ' + P[g][0] : g === -2 ? ', a Wild Tile' : hinted ? ', revealed: he played here' : '');
    var fill = g >= 0 ? '<span class="bg-fill"><i aria-hidden="true">&#x2705;</i><b>' + esc(surname(P[g][0])) + '</b></span>'
      : g === -2 ? '<span class="bg-fill"><i aria-hidden="true">&#x1F0CF;</i><b>Wild Tile</b></span>' : '';
    var tag = o.still ? 'div' : 'button';
    return '<' + tag + (o.still ? '' : ' type="button" data-bg="tile" data-t="' + t + '"' + (g !== -1 ? ' aria-disabled="true"' : '')) + ' class="' + cls + '" aria-label="' + esc(label) + '">' +
      kitSvg(key) + '<span class="bg-tname">' + esc(tileName(t)) + '</span>' + fill + (hinted ? '<span class="bg-hint-eye" aria-hidden="true">&#x1F440;</span>' : '') + '</' + tag + '>';
  }
  function gridHtml(opts) {
    var h = '';
    for (var t = 0; t < E.N; t++) h += tileHtml(t, opts);
    var still = opts && opts.still;
    return '<div class="bg-grid' + (still ? ' is-still' : '') + (st.wildPick && !still ? ' is-picking' : '') + (st.hint && !still ? ' has-hint' : '') + '" role="group" aria-label="Your card">' + h + '</div>';
  }

  /* ---------- A board part way through is kept on the device, so a reload (or a dead phone) picks it up again. One on the
     old rules (or from the dropped Daily Bingo) is left behind ---------- */
  function savedRun() { var r = lsJson(LS_RUN); return r && D && r.bv === D.v && r.rv === E.VERSION && r.mode !== 'daily' && typeof r.mv === 'string' ? r : null; }
  function keepRun() {
    if (!st.board || st.done) return;
    lsSet(LS_RUN, JSON.stringify({ mode: 'free', seed: st.seed, bv: D.v, rv: E.VERSION, mv: st.board.moves, ms: Math.round(st.ms), at: Date.now() }));
  }
  function dropRun() { lsSet(LS_RUN, null); }
  function best() { return lsJson(LS_BEST); }

  /* ---------- The board ---------- */
  function start(resume) {
    var CA = A();
    if (!D) return;
    // A guest's card uses one of the site's 2 free games a day (across CAST Games)
    if (!resume && CA && CA.guestGate && !CA.guestGate(function () { start(); }, 'bingo')) { st = { view: 'start' }; render(); return; }
    var seed = resume ? resume.seed : newSeed(), board;
    if (resume) {
      var x = E.build(D.players, resume.seed, resume.mv);
      if (!x.ok) { dropRun(); start(); return; }
      board = x.board;
    } else board = new E.Board(D.players, seed);
    st = { view: 'play', seed: seed, board: board, ms: resume ? resume.ms || 0 : 0, busy: false, done: false, hint: null, flash: null,
      pop: null, nofit: null, wildPick: false, cardAt: 0, started: Date.now() };
    if (CA && CA.useFor) CA.useFor('bingo'); // this board's Rerolls, Reveals, Run It Backs and Wild Tiles are noted on the server
    primeVault();
    if (!resume) { track('bingo_start', {}); keepRun(); }
    if (board.out) { out(); return; }
    showCard();
  }
  function primeVault() { var CA = A(); if (CA && CA.rerollsSaved) { CA.rerollsSaved(); if (CA.itemSaved) { CA.itemSaved('reveal'); CA.itemSaved('wild'); CA.itemSaved('rib'); } } }
  function saved(item) { var CA = A(); if (!CA) return 0; return item === 'reroll' ? (CA.rerollsSaved ? CA.rerollsSaved() : 0) || 0 : (CA.itemSaved ? CA.itemSaved(item) : 0) || 0; }
  // (as this device shows it, local currency 17 Oct 2026: CastAccount.price, by the item's single pack)
  var PRICE_PACK = { reroll: 'one', reveal: 'reveal1', wild: 'wild1', rib: 'rib1' };
  function priceTag(item) { var n = saved(item), CA = window.CastAccount; return n ? n + ' saved' : CA && CA.price ? CA.price(PRICE_PACK[item], PRICE[item]) : PRICE[item]; }
  // A Reroll can be had: one saved, or the player can buy (a guest is asked to sign in, so he can too)
  function rerollPossible() {
    var CA = A();
    if (!CA || !CA.buyReroll) return false;
    if (saved('reroll') > 0) return true;
    if (CA.isSignedIn && !CA.isSignedIn()) return true;
    return !!(CA.canBuyReroll && CA.canBuyReroll());
  }
  // The Vault's counts changed: the labels change in place
  window.addEventListener('cast:rerolls', function () {
    if (st.view !== 'play') return;
    [['reveal', 'reveal'], ['wild', 'wild'], ['skip', 'reroll']].forEach(function (x) {
      Array.prototype.forEach.call(document.querySelectorAll('#bgRoot [data-bg="' + x[0] + '"] small, #bgSheetHost [data-bg="' + x[0] + '"] small'), function (el) { el.innerHTML = priceTag(x[1]); });
    });
  });

  // The next player on the card. One who fits none of the open tiles: a Reroll, or he costs a life when the count runs out
  function showCard() {
    var b = st.board;
    st.busy = false; st.hint = null; st.flash = null; st.pop = null; st.wildPick = false; st.nofit = null;
    if (b.won() || b.empty()) { finish(); return; }
    if (b.out) { out(); return; }
    st.cur = b.card(); // the player on the card until the next one shows (never the next one during a tap's tick)
    st.cardAt = Date.now(); st.fresh = true;
    if (b.noFit()) {
      if (!rerollPossible()) { render(); st.fresh = false; takeLife(); return; }
      st.nofit = { secs: NOFIT_SECS, hold: false };
      track('bingo_nofit_offer', { tiles: b.filled });
      startNofit();
    }
    render(); st.fresh = false; tick();
  }
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
  // The no open tile count: it drains, and at nothing the life goes. It waits while the Shop (or a sign-in) is open
  var nofitT = null;
  function paintNofit() {
    var f = document.querySelector('#bgSheetHost .bg-sheet .lock-fill'), n = document.querySelector('#bgSheetHost .bg-sheet .lock-secs');
    if (f && st.nofit) f.style.transform = 'scaleX(' + Math.max(st.nofit.secs - 1, 0) / NOFIT_SECS + ')';
    if (n && st.nofit) n.textContent = st.nofit.secs;
  }
  function startNofit() {
    clearInterval(nofitT);
    requestAnimationFrame(function () { requestAnimationFrame(paintNofit); });
    nofitT = setInterval(function () {
      if (st.view !== 'play' || !st.nofit) { clearInterval(nofitT); return; }
      if (st.nofit.hold) return;
      st.nofit.secs--; paintNofit();
      if (st.nofit.secs <= 0) { clearInterval(nofitT); track('bingo_nofit_timeout', {}); takeLife(); }
    }, 1000);
  }
  // He fits no open tile and no Reroll: a life, and the pop-up with his teams
  function takeLife() {
    var b = st.board;
    clearInterval(nofitT);
    if (st.view !== 'play' || !b || b.over() || !b.noFit()) return;
    st.ms += took();
    var p = b.card(), r = b.pass();
    if (!r.ok) return;
    st.nofit = null; st.busy = true;
    keepRun();
    track('bingo_nofit_life', { lives: b.lives });
    if (b.out) { st.last = { kind: 'nofit', p: p }; out(); return; } // the last life: Game Over
    st.pop = { kind: 'nofit', p: p };
    render();
  }
  function tap(t) {
    var b = st.board;
    if (st.view !== 'play' || st.busy || st.pop || st.nofit) return;
    if (st.wildPick) { wildOn(t); return; }
    if (!b.open(t)) return;
    st.ms += took();
    var p = b.card(), r = b.tap(t);
    if (!r.ok) return;
    st.busy = true; st.hint = null;
    st.flash = { t: t, ok: r.right };
    if (!r.right) track('bingo_wrong', { lives: b.lives });
    keepRun();
    render();
    // the tile's tick (or shake) first, then the pop-up with his teams
    setTimeout(function () {
      if (st.view !== 'play' || st.board !== b) return;
      if (b.out) { st.last = { kind: 'bad', p: p, t: t }; out(); return; } // the last life: Game Over
      st.pop = { kind: r.right ? 'good' : 'bad', p: p, t: t }; render();
    }, r.right ? 380 : 480);
  }
  // Next Player: the pop-up closes and the game carries on (or ends)
  function nextPlayer() {
    if (st.view !== 'play' || !st.pop) return;
    st.pop = null; st.flash = null;
    showCard();
  }
  // Reroll: skip the player on the card (the Vault's first, then buy). From the buttons, or from the no open tile pop-up
  function skip() {
    var b = st.board, CA = A();
    if (st.view !== 'play' || st.busy || st.pop || st.wildPick || !CA || !CA.buyReroll) return;
    var spent = took(), nf = !!st.nofit;
    if (nf) st.nofit.hold = true;
    track('bingo_reroll_tap', { nofit: nf ? 1 : 0 });
    shopWait(function (done) {
      CA.buyReroll('1000tries', function () {
        if (!done() || st.view !== 'play' || st.done) return;
        clearInterval(nofitT);
        b.skip(); keepRun();
        track('bingo_reroll', { nofit: nf ? 1 : 0 });
        showCard();
      }, nf ? { title: 'No Open Tile for Him', line: 'Use a Reroll to skip him and see the next player, or he costs a life.' }
        : { title: 'Don’t Know Him?', line: 'Use a Reroll to skip him and see the next player.' });
    }, spent, function () { if (st.nofit) { st.nofit.hold = false; render(); paintNofit(); } else render(); });
  }
  // Reveal: his open tiles light up (the Vault's first, then buy)
  function reveal() {
    var b = st.board, CA = A();
    if (st.view !== 'play' || st.busy || st.pop || st.nofit || st.wildPick || st.hint) return;
    if (!CA || !CA.buyItem) return;
    var spent = took();
    track('bingo_reveal_tap', {});
    shopWait(function (done) {
      CA.buyItem('reveal', '1000tries', function () {
        if (!done() || st.view !== 'play' || st.done) return;
        var r = b.reveal();
        if (!r.ok) return;
        st.hint = r.tiles; st.cardAt = Date.now(); keepRun();
        track('bingo_reveal', { tiles: r.tiles.length });
        render();
      }, { kicker: 'Reveal', title: 'Where Did He Play?', line: 'The open tiles he played for light up. Then you tap one.', foot: 'Reveals work in every CAST game. Saved ones stay on your CAST Profile.' });
    }, spent);
  }
  // The Wild Tile: pick the tile first, then it's used (or bought), so one is never spent on nothing
  function wildStart() {
    if (st.view !== 'play' || st.busy || st.pop || st.nofit) return;
    st.wildPick = !st.wildPick; st.hint = st.wildPick ? null : st.hint;
    track('bingo_wild_tap', {});
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
        track('bingo_wild', { tile: E.TILES[t][0] });
        st.busy = true; render();
        // the same player stays (a fresh look at him: if the tile was the only one he fitted, he now fits none)
        setTimeout(function () { if (st.view !== 'play') return; st.flash = null; if (b.won()) { finish(); return; } showCard(); }, 520);
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
    clearInterval(tickT); clearInterval(nofitT);
    st.view = 'out'; st.busy = false; st.hold = false; st.offer = OFFER_SECS; st.pop = null; st.nofit = null;
    track('bingo_out', { tiles: st.board.filled });
    if (!st.board.filled) { finish(); return; } // nothing on the card to keep going for
    render(); startOffer();
  }
  function paintOffer() {
    var f = document.querySelector('#bgSheetHost .bg-over .lock-fill'), n = document.querySelector('#bgSheetHost .bg-over .lock-secs');
    if (f) f.style.transform = 'scaleX(' + Math.max(st.offer - 1, 0) / OFFER_SECS + ')';
    if (n) n.textContent = st.offer;
  }
  function startOffer() {
    clearInterval(st.offerT);
    requestAnimationFrame(function () { requestAnimationFrame(paintOffer); });
    st.offerT = setInterval(function () {
      if (st.view !== 'out' || !st.offer || st.hold || st.done) { clearInterval(st.offerT); return; }
      st.offer--; paintOffer();
      if (!st.offer) { track('bingo_rib_offer_timeout', {}); finish(); }
    }, 1000);
  }
  function runItBack() {
    var CA = A(), b = st.board;
    if (!CA || !CA.buyItem || st.view !== 'out') return;
    clearInterval(st.offerT); st.hold = true; render();
    track('bingo_rib_tap', { tiles: b.filled });
    CA.buyItem('rib', '1000tries', function () {
      if (st.view !== 'out' || st.done) return;
      var r = b.runItBack();
      if (!r.ok) return;
      keepRun();
      track('bingo_rib', { tiles: b.filled });
      st.view = 'rewind'; render();
      setTimeout(function () { if (st.view === 'rewind') { st.view = 'play'; showCard(); } }, 1500);
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
    clearInterval(tickT); clearInterval(st.offerT); clearInterval(nofitT);
    var CA = A(), b = st.board;
    if (CA && CA.useFor) CA.useFor(null);
    if (!b || st.done) { if (b) { st.view = 'done'; render(); } return; }
    st.done = true; st.view = 'done'; st.pop = null; st.nofit = null;
    dropRun();
    var won = b.won(), ms = Math.round(st.ms);
    var was = best();
    st.newBest = !was || b.filled > was.f || (b.filled === was.f && ms < was.ms);
    if (st.newBest) lsSet(LS_BEST, JSON.stringify({ f: b.filled, ms: ms }));
    track('bingo_end', { tiles: b.filled, won: won ? 1 : 0, secs: Math.round(ms / 1000) });
    if (b.moves.replace(/[VB]|W[a-x]/g, '').length || b.wilds) {
      var d = { seed: st.seed, mv: b.moves, bv: D.v, ms: ms, bgv: E.VERSION };
      if (b.ribs) d.rib = b.ribs;
      if (b.paidSkips()) d.rr = b.paidSkips();
      if (b.reveals) d.rv = b.reveals;
      if (b.wilds) d.wt = b.wilds;
      try {
        if (CA && CA.record) CA.record({ game: '1000tries', mode: 'bingo', score: b.filled, result: won ? 'full' : 'out', win: won, top: false, picks: [], d: d });
        var tr = [], help = b.wilds || b.reveals || b.paidSkips() || b.ribs;
        var rep = E.TILES.slice(17).every(function (x) { return b.grid[E.INDEX[x[0]]] >= 0; }); // every rep tile, by players
        if (b.filled >= 18) tr.push('bg15');
        if (won) tr.push('bgfull');
        if (won && !b.wrong && !b.nofit && !b.ribs) tr.push('bgclean');
        if (won && ms < 120000) tr.push('bgspeed');
        if (rep) tr.push('bgrep');
        if (won && !help) tr.push('bgnohelp');
        if (tr.length && CA && CA.unlock) CA.unlock(tr);
        if (CA && CA.refresh) CA.refresh();
      } catch (e) { /* the board stays on this device */ }
    }
    if (st.quiet) return;
    try { window.scrollTo(0, 0); } catch (e) { /* old browser */ } // the results from the top (Game Over's pop-up may have left the page scrolled)
    render();
    makeCard();
  }
  window.addEventListener('pagehide', function () { if (st.view === 'out') finish(); else if (st.view === 'play') keepRun(); });

  /* ---------- Share: the card as a picture (made as the results show, so a tap shares it straight away), else words ---------- */
  var shareFile = null;
  function shareText() {
    var b = st.board, rows = [];
    for (var r = 0; r < E.N / 4; r++) {
      var line = '';
      for (var c = 0; c < 4; c++) { var g = b.grid[r * 4 + c]; line += g >= 0 ? '🟩' : g === -2 ? '🃏' : '⬛'; }
      rows.push(line);
    }
    var line2 = b.won() ? '🎉 Full House in ' + clock(st.ms) : b.filled + ' of ' + E.N + ' tiles in ' + clock(st.ms);
    return 'NRL Bingo\n' + line2 + '\n' + rows.join('\n') + '\nCan you fill the card?';
  }
  function shareUrl() {
    var u = window.CG && window.CG.url ? window.CG.url('nrl-bingo/') : 'https://castgames.com.au/nrl-bingo/'; // CAST Games only
    var CA = A();
    return CA && CA.inviteLink ? CA.inviteLink(u) : u;
  }
  function share() {
    var txt = shareText(), url = shareUrl(), CA = A();
    track('bingo_share', { tiles: st.board.filled, card: shareFile ? 1 : 0 });
    /* The shared share-picker (the owner, 18 Oct 2026: Portrait or Story on every Share), once the account code has it:
       the words, the address and a renderer for each size (Promise of a PNG Blob). HOOK: CastAccount.sharePicker */
    if (CA && typeof CA.sharePicker === 'function') {
      CA.sharePicker({ game: '1000tries', mode: 'bingo', title: 'NRL Bingo', text: txt, url: url, file: 'nrl-bingo',
        render: { portrait: function () { return drawShare('portrait'); }, story: function () { return drawShare('story'); } } });
      return;
    }
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
  /* The card as a picture, in either size (the owner, 18 Oct 2026: every Share offers Portrait and Story). Portrait is the
     1080 x 1350 post; Story is 1080 x 1920, laid out for the tall space with everything that matters between 250 and 1670
     (clear of the Stories bar at the top and the reply box at the bottom), never the Portrait stretched. Each jersey is
     drawn from its SVG first. -> Promise of a PNG Blob (null where the browser can't) */
  var SHARE_SIZE = { portrait: { W: 1080, H: 1350 }, story: { W: 1080, H: 1920 } };
  function drawShare(size) {
    var S = SHARE_SIZE[size] || SHARE_SIZE.portrait, b = st.board, P = D.players, W = S.W, H = S.H, story = size === 'story';
    if (!window.Blob || !document.createElement('canvas').getContext) return Promise.resolve(null);
    // where things go: Story pushes everything into the safe middle and gives the tiles more height
    var L = story ? { title: 340, sub: 392, score: 478, gx: 70, gy: 536, tw: 220, th: 150, gap: 13, ask: 1576, url: 1626, glowY: 340 }
      : { title: 118, sub: 168, score: 252, gx: 70, gy: 290, tw: 220, th: 138, gap: 13, ask: 1258, url: 1306, glowY: 120 };
    return new Promise(function (resolve) {
      var cv = document.createElement('canvas'); cv.width = W; cv.height = H;
      var ctx = cv.getContext('2d'), imgs = [], left = E.N;
      var draw = function () {
        var g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#16210d'); g.addColorStop(1, '#07090a');
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = 'rgba(163,230,53,.12)'; ctx.beginPath(); ctx.arc(W / 2, L.glowY, 520, 0, Math.PI * 2); ctx.fill();
        ctx.textAlign = 'center'; ctx.fillStyle = '#ffffff';
        ctx.font = '900 88px Inter, Arial, sans-serif'; ctx.fillText('NRL BINGO', W / 2, L.title);
        ctx.font = '800 30px Inter, Arial, sans-serif'; ctx.fillStyle = '#c8f08a';
        ctx.fillText('FILL ALL ' + E.N + ' TILES', W / 2, L.sub);
        ctx.fillStyle = '#ffffff'; ctx.font = '900 66px Inter, Arial, sans-serif';
        ctx.fillText(b.won() ? 'FULL HOUSE · ' + clock(st.ms) : b.filled + ' OF ' + E.N + ' · ' + clock(st.ms), W / 2, L.score);
        var tw = L.tw, th = L.th, gap = L.gap;
        for (var t = 0; t < E.N; t++) {
          var x = L.gx + (t % 4) * (tw + gap), y = L.gy + Math.floor(t / 4) * (th + gap), cell = b.grid[t];
          ctx.save(); rr(ctx, x, y, tw, th, 18); ctx.clip();
          if (imgs[t] && imgs[t].ok) ctx.drawImage(imgs[t].img, x, y, tw, th); else { ctx.fillStyle = '#1c1c2e'; ctx.fillRect(x, y, tw, th); }
          // an open tile dark, a filled one in Bingo's lime, so the card reads right at a glance
          ctx.fillStyle = cell === -1 ? 'rgba(6,8,12,.62)' : 'rgba(6,8,12,.3)'; ctx.fillRect(x, y, tw, th);
          if (cell !== -1) { ctx.fillStyle = 'rgba(132,204,22,.42)'; ctx.fillRect(x, y, tw, th); }
          ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(x, y + th - 42, tw, 42);
          ctx.fillStyle = '#ffffff'; ctx.font = '800 24px Inter, Arial, sans-serif'; ctx.fillText(tileName(t), x + tw / 2, y + th - 13);
          if (cell !== -1) {
            var fz = 28, nm = cell === -2 ? 'WILD TILE' : surname(P[cell][0]).toUpperCase(), my = y + (th - 42) / 2 + 6;
            ctx.fillStyle = '#ffffff'; ctx.font = '900 ' + fz + 'px Inter, Arial, sans-serif';
            while (ctx.measureText(nm).width > tw - 20 && fz > 16) { fz -= 2; ctx.font = '900 ' + fz + 'px Inter, Arial, sans-serif'; }
            var nw = ctx.measureText(nm).width;
            ctx.fillStyle = 'rgba(0,0,0,.62)'; rr(ctx, x + tw / 2 - nw / 2 - 10, my - 4, nw + 20, fz + 12, 8); ctx.fill();
            ctx.fillStyle = cell === -2 ? '#fbcfe8' : '#ffffff'; ctx.fillText(nm, x + tw / 2, my + 2 + fz * .82);
            ctx.font = '34px sans-serif'; ctx.fillText(cell === -2 ? '🃏' : '✅', x + tw / 2, my - 10);
          }
          ctx.restore();
          ctx.strokeStyle = cell === -1 ? 'rgba(255,255,255,.12)' : 'rgba(163,230,53,.95)'; ctx.lineWidth = cell === -1 ? 2 : 5; rr(ctx, x, y, tw, th, 18); ctx.stroke();
        }
        ctx.fillStyle = '#c8f08a'; ctx.font = '900 34px Inter, Arial, sans-serif'; ctx.fillText('CAN YOU FILL THE CARD?', W / 2, L.ask);
        ctx.fillStyle = '#ffffff'; ctx.font = '800 30px Inter, Arial, sans-serif'; ctx.fillText('CASTGAMES.COM.AU', W / 2, L.url); // the game's own address
        try { cv.toBlob(function (bl) { resolve(bl || null); }, 'image/png'); } catch (e) { resolve(null); }
      };
      for (var t = 0; t < E.N; t++) (function (t) {
        var img = new Image(), svg = kitSvg(E.TILES[t][0]).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="' + L.tw + '" height="' + L.th + '" ');
        imgs[t] = { img: img, ok: false };
        img.onload = function () { imgs[t].ok = true; if (!--left) draw(); };
        img.onerror = function () { if (!--left) draw(); };
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
      })(t);
    });
  }
  // The Portrait picture is made as the results show, so a plain Share has it ready straight away
  function makeCard() {
    shareFile = null;
    var b = st.board;
    drawShare('portrait').then(function (bl) { if (bl && window.File && st.board === b) shareFile = new File([bl], 'nrl-bingo.png', { type: 'image/png' }); });
  }

  /* ---------- The pop-up after each turn: what happened, his teams, Next Player (the owner: "reveal the teams he played
     with as a pop up, otherwise goes too quick"). The button sits in the same place every time ---------- */
  // Teams that are no tile (data/bingo.json's 7th field), their short names and colours
  var OTHER = { northerneagles: 'Northern Eagles', stgeorge: 'St George', steelers: 'Steelers', balmain: 'Balmain', wmagpies: 'Wests Magpies', bears: 'Bears', adelaide: 'Rams', chargers: 'Chargers' };
  var OTHER_COL = { chargers: ['#00788c', '#ffffff'] };
  var REP_COL = { nsw: ['#3a8fd6', '#ffffff'], qld: ['#7b1435', '#ffffff'], aus: ['#00843d', '#ffcd00'], nzl: ['#0b0b0e', '#ffffff'], eng: ['#f4f4f4', '#c8102e'], sam: ['#0b3f91', '#ffffff'], ton: ['#c10000', '#ffffff'] };
  function teamColours(key) {
    var x = REP_COL[key] || OTHER_COL[key];
    if (x) return { bg: x[0], fg: x[1], tx: x[0] === '#f4f4f4' ? '#111111' : '#ffffff' };
    var c = T.club ? T.club(key) : { primary: '#1a1a2e', accent: '#ffffff', text: '#ffffff' };
    return { bg: c.primary, fg: c.accent, tx: c.text };
  }
  function teamsHtml(p, placed) {
    var b = st.board, pl = D.players[p], h = '';
    var chip = function (key, name, state) {
      var c = teamColours(key), tag = state === 'placed' ? '&#x2705; Placed' : state === 'open' ? 'Open' : state === 'filled' ? 'Filled' : '';
      return '<li class="bg-team' + (state ? ' is-' + state : '') + '" style="--tb:' + c.bg + ';--tf:' + c.fg + ';--tt:' + c.tx + '"><b>' + esc(name) + '</b>' + (tag ? '<em>' + tag + '</em>' : '') + '</li>';
    };
    var tiles = E.tilesOf(D.players, p);
    tiles.filter(function (t) { return t < 17; }).forEach(function (t) {
      h += chip(E.TILES[t][0], tileName(t), t === placed ? 'placed' : b.open(t) ? 'open' : 'filled');
    });
    (pl[6] || []).forEach(function (k) { if (OTHER[k]) h += chip(k, OTHER[k], ''); });
    tiles.filter(function (t) { return t >= 17; }).forEach(function (t) {
      h += chip(E.TILES[t][0], tileName(t), t === placed ? 'placed' : b.open(t) ? 'open' : 'filled');
    });
    return '<ul class="bg-teams" aria-label="Every team he played for">' + h + '</ul>';
  }
  /* Icons drawn in code (17 Oct 2026, the owner: "looks cheap"; never emoji hearts): a heart in two halves along a crack,
     so a lost life breaks; a tick, a cross and a no-entry sign for the pop-up's badge */
  var HEART_L = 'M12 4.6C10.9 3.4 9.3 2.6 7.6 2.6 4.5 2.6 2 5 2 8.1c0 3.9 3.4 7 8.6 11.7L12 21.1l-1-4.4 2-3.6-2-3.6z';
  var HEART_R = 'M12 4.6c1.1-1.2 2.7-2 4.4-2 3.1 0 5.6 2.4 5.6 5.5 0 3.9-3.4 7-8.6 11.7L12 21.1l-1-4.4 2-3.6-2-3.6z';
  var HEART = 'M12 21.1l-1.4-1.3C5.4 15.1 2 12 2 8.1 2 5 4.5 2.6 7.6 2.6c1.7 0 3.3.8 4.4 2 1.1-1.2 2.7-2 4.4-2 3.1 0 5.6 2.4 5.6 5.5 0 3.9-3.4 7-8.6 11.7L12 21.1z';
  // whole (hf) while it's a life; the two halves once it's lost, so it breaks along the crack
  function heart(state) { return '<i class="bg-heart is-' + state + '" aria-hidden="true"><svg viewBox="0 0 24 22" focusable="false"><path class="hf" d="' + HEART + '"/><path class="hl" d="' + HEART_L + '"/><path class="hr" d="' + HEART_R + '"/></svg></i>'; }
  // The lives: full, then empty; lost: the one just lost breaks as it shows
  function hearts(n, lost) { var h = ''; for (var i = 0; i < E.LIVES; i++) h += heart(i < n ? 'on' : lost && i === n ? 'lost' : 'off'); return h; }
  var ICON = {
    good: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    bad: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/></svg>',
    nofit: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="8" fill="none" stroke="#fff" stroke-width="3"/><path d="M6.6 17.4L17.4 6.6" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg>',
    over: '<svg viewBox="0 0 24 22" aria-hidden="true" focusable="false"><path class="hl" d="' + HEART_L + '" fill="#fff"/><path class="hr" d="' + HEART_R + '" fill="#fff"/></svg>'
  };
  function livesLine(b, lost) {
    return '<div class="bg-pop-lives"><span class="bg-lives is-big">' + hearts(b.lives, lost) + '</span>' + (b.lives ? '<b>' + b.lives + (b.lives === 1 ? ' Life Left' : ' Lives Left') + '</b>' : '') + '</div>';
  }
  /* The pop-up's top: the tile's own colours and kit (the tile he went on, or the one tapped wrongly), the badge, the
     headline and its chip. key: the tile's team, or none (a plain red band) */
  function band(kind, key, h, chip) {
    var c = key ? teamColours(key) : null;
    return '<div class="bg-pop-band' + (key ? '' : ' is-plain') + '"' + (c ? ' style="--cb:' + c.bg + ';--cf:' + c.fg + '"' : '') + '>' + (key ? kitSvg(key) : '') +
      '<span class="bg-pop-badge is-' + kind + '">' + ICON[kind] + '</span><h2 class="bg-pop-h" id="bgPopH">' + h + '</h2>' + (chip ? '<span class="bg-pop-chip is-' + kind + '">' + chip + '</span>' : '') + '</div>';
  }
  function popHtml() {
    var b = st.board, x = st.pop, pl = D.players[x.p], name = esc(pl[0]);
    var top = x.kind === 'good' ? band('good', E.TILES[x.t][0], 'Correct!', esc(tileName(x.t)))
      : x.kind === 'bad' ? band('bad', E.TILES[x.t][0], 'Wrong', '1 Life Lost') : band('nofit', null, 'No Open Tile', '1 Life Lost');
    var line = x.kind === 'good' ? name + ' played for ' + esc(theName(x.t)) + '.' : x.kind === 'bad' ? name + ' never played for ' + esc(theName(x.t)) + '.'
      : name + ' fits none of your open tiles.';
    var go = b.won() ? 'See Your Card' : 'Next Player';
    return '<div class="bg-sheet is-' + x.kind + '" role="dialog" aria-modal="true" aria-labelledby="bgPopH"><div class="bg-sheet-in">' + top +
      '<div class="bg-pop-body"><p class="bg-pop-who"><b>' + name + '</b><small>' + esc(subLine(pl)) + '</small></p>' +
      '<p class="bg-pop-line">' + line + '</p>' + (x.kind === 'good' ? '' : livesLine(b, true)) +
      '<p class="bg-teams-h">His Teams</p>' + teamsHtml(x.p, x.kind === 'good' ? x.t : -1) + '</div></div>' +
      '<div class="bg-sheet-foot"><button type="button" class="btn btn-primary bg-next" data-bg="next">' + go + ' <i aria-hidden="true">&#x25B6;</i></button></div></div>';
  }
  // The no open tile pop-up: a Reroll, or the life goes when the bar runs out (the same pinned spot as Next Player)
  function nofitHtml() {
    var b = st.board, p = b.card(), pl = D.players[p], name = esc(pl[0]);
    return '<div class="bg-sheet is-nofit is-offer" role="dialog" aria-modal="true" aria-labelledby="bgPopH"><div class="bg-sheet-in">' + band('nofit', null, 'No Open Tile', 'Reroll or Lose a Life') +
      '<div class="bg-pop-body"><p class="bg-pop-who"><b>' + name + '</b><small>' + esc(subLine(pl)) + '</small></p>' +
      '<p class="bg-pop-line">' + name + ' fits none of your open tiles. Use a Reroll to skip him, or he costs a life.</p>' + livesLine(b) +
      '<button type="button" class="bg-act is-rr bg-offer-rr" data-bg="skip"' + (st.busy ? ' disabled' : '') + '><span>&#x1F504; Use a Reroll</span><small>' + priceTag('reroll') + '</small></button></div></div>' +
      '<div class="bg-sheet-foot"><button type="button" class="btn btn-decide btn-decide-lock bg-next" data-bg="takelife">' +
        '<span class="lock-fill" aria-hidden="true" style="transform:scaleX(' + (st.nofit.hold ? 1 : st.nofit.secs / NOFIT_SECS) + ')"></span>' +
        '<span class="btn-decide-lbl">' + heart('off') + ' Take the Life' + (st.nofit.hold ? '' : ' <b class="lock-secs">' + st.nofit.secs + '</b>') + '</span></button></div></div>';
  }
  /* Game Over (the owner, 17 Oct 2026: "a real Game Over moment"): the turn that took the last life, the card's score and
     time, his teams, then Run It Back (one more life, its bar running down the time to decide) or Play Again. Left alone,
     the board ends by itself and the results show */
  function overHtml() {
    var b = st.board, x = st.last, pl = x ? D.players[x.p] : null, name = pl ? esc(pl[0]) : '', bs = best();
    var top = band('over', x && x.kind === 'bad' ? E.TILES[x.t][0] : null, 'Game Over', 'Out of Lives');
    var why = !x ? '' : '<p class="bg-pop-who"><b>' + name + '</b><small>' + esc(subLine(pl)) + '</small></p><p class="bg-pop-line">' +
      (x.kind === 'bad' ? name + ' never played for ' + esc(theName(x.t)) + '.' : name + ' fits none of your open tiles.') + '</p>';
    return '<div class="bg-sheet is-over is-bad" role="dialog" aria-modal="true" aria-labelledby="bgPopH"><div class="bg-sheet-in bg-over">' + top +
      '<div class="bg-pop-body">' + why + livesLine(b, !!x) +
      '<div class="bg-over-stats"><span><b>' + b.filled + '<small>/' + E.N + '</small></b><em>Tiles</em></span><span><b>' + clock(st.ms) + '</b><em>Time</em></span>' +
        '<span><b>' + (bs ? bs.f + '<small>/' + E.N + '</small>' : 'New') + '</b><em>Your Best</em></span></div>' +
      (x ? '<p class="bg-teams-h">His Teams</p>' + teamsHtml(x.p, -1) : '') +
      '<p class="bg-over-offer">One more life keeps your card going.</p>' +
      '<button type="button" class="ou-link bg-link bg-over-see" data-bg="end">See Your Card</button></div></div>' +
      '<div class="bg-sheet-foot bg-over-foot">' +
        '<button type="button" class="btn btn-decide btn-decide-lock bg-over-rib" data-bg="rib" aria-label="Run It Back' + (st.hold ? '' : ' (the offer ends in ' + OFFER_SECS + ' seconds)') + '">' +
          '<span class="lock-fill" aria-hidden="true" style="transform:scaleX(' + (st.hold ? 1 : st.offer / OFFER_SECS) + ')"></span>' +
          '<span class="btn-decide-lbl">&#x23EA; Run It Back' + (st.hold ? '' : ' <b class="lock-secs">' + st.offer + '</b>') + '</span><small>' + priceTag('rib') + '</small></button>' +
        '<button type="button" class="btn btn-primary bg-next bg-over-again" data-bg="replay">Play Again <i aria-hidden="true">&#x25B6;</i></button></div></div>';
  }

  /* ---------- Screens ---------- */
  function startView() {
    var b = best(), run = savedRun();
    var fresh = run ? '<button type="button" class="ou-link bg-link" data-bg="newcard">&#x1F195; Start a New Card</button>' : '';
    return '<div class="bg-start"><h1 class="bg-logo"><span>NRL</span> Bingo</h1>' +
      '<div class="bg-demo" aria-hidden="true">' + demoGrid() + '</div>' +
      '<p class="bg-lede">A player comes up. Tap a tile he played for. Fill all <b>' + E.N + ' tiles</b> for a Full House.</p>' +
      '<p class="bg-best">' + (b ? '&#x1F3C6; Your best: ' + (b.f === E.N ? 'Full House' : b.f + ' of ' + E.N) + ' in ' + clock(b.ms) : 'A new order of players every card. Play as often as you like.') + '</p>' +
      '<button type="button" class="btn btn-primary bg-play" data-bg="play">' + (run ? 'Carry On Your Card' : 'Play NRL Bingo') + ' <i aria-hidden="true">&#x25B6;</i></button>' + fresh +
      '<ul class="bg-rules"><li><i aria-hidden="true">&#x2705;</i>Tap a tile he played for</li><li>' + heart('on') + 'A wrong tap costs a life</li><li><i aria-hidden="true">&#x1F6AB;</i>No open tile for him costs a life</li></ul>' +
      '<button type="button" class="ou-link bg-link" data-bg="board">&#x1F3C6; NRL Bingo Leaderboard</button></div>';
  }
  // The start screen's small card: a few tiles filled, in their colours
  function demoGrid() {
    var fill = { 2: 1, 7: 1, 8: 1, 13: 1, 18: 1, 19: 1, 21: 1 }, h = '';
    for (var t = 0; t < E.N; t++) h += '<span class="bg-mini is-' + E.TILES[t][0] + (fill[t] ? ' is-filled' : '') + '">' + kitSvg(E.TILES[t][0]) + (fill[t] ? '<i>&#x2705;</i>' : '') + '</span>';
    return h;
  }
  function pinHtml() {
    // the player whose turn it is: through a tap's tick, its pop-up and Game Over, never the next one (the owner, 17 Oct 2026)
    var b = st.board, P = D.players, p = st.pop ? st.pop.p : st.cur != null ? st.cur : b.over() ? -1 : b.order[b.pos], pl = p >= 0 ? P[p] : null;
    var dis = st.busy || st.pop || st.nofit || st.view !== 'play' ? ' disabled' : '';
    var card = pl ? '<div class="bg-card' + (st.fresh ? ' is-new' : '') + (st.flash && !st.flash.ok ? ' is-bad' : st.flash && st.flash.ok && !st.flash.wild ? ' is-good' : '') + '" aria-live="polite">' +
        '<b class="bg-card-name">' + esc(pl[0]) + '</b><small class="bg-card-sub">' + esc(subLine(pl)) + '</small></div>'
      : '<div class="bg-card is-empty"><b class="bg-card-name">&nbsp;</b></div>';
    // a Reveal shows on the card itself (the lit tiles), never as words (the owner, 17 Oct 2026)
    var note = st.wildPick ? '<p class="bg-note is-pick">&#x1F0CF; Tap the open tile your Wild Tile fills. <button type="button" class="bg-x" data-bg="wild">Cancel</button></p>' : '';
    return '<div class="bg-pin">' +
      '<div class="bg-status"><span class="bg-lives" aria-label="' + b.lives + ' lives left">' + hearts(b.lives) + '</span>' +
        '<span class="bg-count" aria-label="' + b.filled + ' of ' + E.N + ' tiles"><b>' + b.filled + '</b>/' + E.N + '</span>' +
        '<span class="bg-time" aria-label="Time"><i aria-hidden="true">&#x23F1;&#xFE0F;</i><b>' + clock(st.ms) + '</b></span></div>' +
      card + note +
      '<div class="bg-acts">' +
        '<button type="button" class="bg-act is-rr" data-bg="skip"' + dis + '><span>&#x1F504; Reroll</span><small>' + priceTag('reroll') + '</small></button>' +
        '<button type="button" class="bg-act is-rv" data-bg="reveal"' + (dis || (st.hint ? ' disabled' : '')) + '><span>&#x1F440; Reveal</span><small>' + priceTag('reveal') + '</small></button>' +
        '<button type="button" class="bg-act is-wild' + (st.wildPick ? ' is-on' : '') + '" data-bg="wild"' + dis + ' aria-pressed="' + !!st.wildPick + '"><span>&#x1F0CF; Wild Tile</span><small>' + priceTag('wild') + '</small></button>' +
      '</div></div>';
  }
  function playView() { return pinHtml() + gridHtml(); }
  function sheetHtml() { return !D || !st.board ? '' : st.view === 'play' ? (st.pop ? popHtml() : st.nofit ? nofitHtml() : '') : st.view === 'out' ? overHtml() : ''; }
  // Game Over and its Run It Back: the card as it stands behind the Game Over pop-up (overHtml)
  function outView() { return pinHtml() + gridHtml({ still: true }); }
  function rewindView() {
    return outView() + '<div class="ou-rewind" role="status"><div class="ou-rw-rays" aria-hidden="true"></div><span class="ou-rw-ico" aria-hidden="true">&#x23EA;</span><b class="ou-rw-t">Run It Back</b>' +
      '<span class="ou-rw-s">' + heart('on') + '1 <small>more life</small></span></div>';
  }
  function doneView() {
    var b = st.board, won = b.won(), help = [], bs = best();
    if (b.wilds) help.push('&#x1F0CF; ' + b.wilds);
    if (b.reveals) help.push('&#x1F440; ' + b.reveals);
    if (b.paidSkips()) help.push('&#x1F504; ' + b.paidSkips());
    if (b.ribs) help.push('&#x23EA; ' + b.ribs);
    return '<div class="bg-res">' +
      '<div class="bg-hero' + (won ? ' is-won' : '') + '"><span class="bg-hero-k">' + (won ? '&#x1F389; Full House' : heart('off') + ' Game Over') + '</span>' +
        '<span class="bg-hero-n">' + b.filled + '<small>/' + E.N + '</small></span>' +
        '<span class="bg-hero-s">tiles in ' + clock(st.ms) + (st.newBest ? '<em class="ou-best">New Best</em>' : bs ? '<em class="ou-best is-old">Best ' + bs.f + ' in ' + clock(bs.ms) + '</em>' : '') + '</span></div>' +
      '<div class="bg-stats"><span><b>' + clock(st.ms) + '</b><small>Time</small></span><span><b>' + b.lives + '</b><small>Lives Left</small></span>' +
        '<span><b>' + (help.length ? help.join(' ') : '&#x2714;') + '</b><small>' + (help.length ? 'Help Used' : 'No Help') + '</small></span></div>' +
      '<div class="res-acts bg-acts-res"><button type="button" class="btn btn-res btn-res-again btn-block" data-bg="again"><span aria-hidden="true">&#x1F504;</span> Play Again</button>' +
        '<div class="res-two"><button type="button" class="btn btn-res btn-res-share" data-bg="share"><span aria-hidden="true">&#x1F4E4;</span> Share</button>' +
        '<button type="button" class="btn btn-res btn-res-mode" data-bg="board"><span aria-hidden="true">&#x1F3C6;</span> Leaderboard</button></div>' +
        '<button type="button" class="btn btn-res btn-res-mode btn-block" data-bg="home"><span aria-hidden="true">&#x1F3AE;</span> Change Mode</button></div>' +
      '<div class="panel bg-yours"><div class="panel-head"><span class="panel-title">Your Card</span><span class="panel-meta">' + b.filled + ' of ' + E.N + '</span></div>' + gridHtml({ still: true }) + '</div>' +
      '</div>';
  }
  // A long tile name ("Wests Tigers", "QLD Maroons") steps down in size to stay on one line, never cut
  function fitNames(el) {
    Array.prototype.forEach.call(el.querySelectorAll('.bg-tname, .bg-fill b'), function (c) {
      c.style.fontSize = ''; c.classList.remove('is-wrap');
      var fs = parseFloat(getComputedStyle(c).fontSize) || 12;
      while (c.scrollWidth > c.clientWidth + 1 && fs > 8) { fs -= .5; c.style.fontSize = fs + 'px'; }
      // a name still too long for one line (a two-word surname) takes two
      if (c.scrollWidth > c.clientWidth + 1 && c.tagName === 'B') c.classList.add('is-wrap');
    });
  }
  window.addEventListener('resize', function () { var r = root(); if (r && r.offsetParent) fitNames(r); });
  function render() {
    var el = root();
    if (!el) return;
    var h = '<div class="bg-head"><button type="button" class="ou-back" data-bg="home" aria-label="Back">&larr;</button>' + (st.view === 'start' ? '' : '<span>NRL Bingo</span>') + '</div>';
    if (!D) h += '<div class="ou-load">Loading the players&hellip;</div>';
    else h += st.view === 'play' ? playView() : st.view === 'out' ? outView() : st.view === 'rewind' ? rewindView() : st.view === 'done' ? doneView() : startView();
    if (st.toast) h += '<p class="ou-note" role="status">' + esc(st.toast) + '</p>';
    el.className = 'wrap bg-v-' + st.view;
    el.innerHTML = h;
    fitNames(el);
    var sh = sheetHtml(), hb = host();
    hb.innerHTML = sh;
    document.documentElement.classList.toggle('bg-sheet-open', !!sh);
    var nx = hb.querySelector('.bg-sheet .bg-next');
    if (nx && st.pop) { try { nx.focus({ preventScroll: true }); } catch (e) { /* old browser */ } }
  }

  // A card left part way through, given up for a new one: it is saved as it is (its Vault items with it)
  function abandon() {
    var run = savedRun();
    if (!run) return;
    var x = E.build(D.players, run.seed, run.mv);
    dropRun();
    if (!x.ok) return;
    st = { view: 'play', seed: run.seed, board: x.board, ms: run.ms || 0, quiet: true };
    finish();
  }
  document.addEventListener('click', function (e) {
    var bn = e.target.closest && e.target.closest('[data-bingo-open]');
    if (bn && T.bingo.on()) { e.preventDefault(); T.bingo.open(); return; }
    var t = e.target.closest && e.target.closest('[data-bg]');
    if (!t || !inBingo(t)) return;
    var a = t.getAttribute('data-bg');
    if (a === 'tile') tap(+t.getAttribute('data-t'));
    else if (a === 'next') nextPlayer();
    else if (a === 'skip') skip();
    else if (a === 'takelife') { track('bingo_nofit_take', {}); takeLife(); }
    else if (a === 'reveal') reveal();
    else if (a === 'wild') wildStart();
    else if (a === 'rib') runItBack();
    else if (a === 'end') { track('bingo_rib_offer_no', {}); finish(); }
    else if (a === 'replay') { track('bingo_over_again', {}); finish(); st = { view: 'start' }; start(); } // Game Over's Play Again
    else if (a === 'newcard') { abandon(); start(); }
    else if (a === 'play') start(savedRun());
    else if (a === 'again') { st = { view: 'start' }; start(); }
    else if (a === 'share') share();
    else if (a === 'board') { if (st.view === 'out') finish(); var CA = A(); if (CA && CA.openBoards) CA.openBoards(['bgfree', 'week']); }
    else if (a === 'home') {
      if (st.view === 'play' && st.board && !st.board.over() && st.board.moves) {
        // the card waits on this device to carry on (a player with no open tile is offered again, with a fresh count)
        keepRun(); clearInterval(tickT); clearInterval(nofitT); var CA2 = A(); if (CA2 && CA2.useFor) CA2.useFor(null);
      } else if (st.view === 'out') finish();
      st = { view: 'start' };
      host().innerHTML = ''; document.documentElement.classList.remove('bg-sheet-open');
      if (T.bingoHome) T.bingoHome(); else if (T.ouHome) T.ouHome();
    }
  });
  // The pop-up's button by keyboard too (Enter or Space on a focused button already work; Escape is Next Player)
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && st.view === 'play' && st.pop) nextPlayer(); });

  // The 1000TRIES home card (js/app.js placeBingo, CAST Games only), under HIGHER OR LOWER: NRL's: a small card of jerseys with a few ticks
  if (T.render) T.render.bingoCard = function () {
    var fill = { 1: 1, 6: 1, 8: 1, 13: 1, 17: 1, 20: 1 }, h = '';
    for (var t = 0; t < E.N; t++) h += '<span class="bg-mini' + (fill[t] ? ' is-filled' : '') + '">' + kitSvg(E.TILES[t][0]) + (fill[t] ? '<i>&#x2705;</i>' : '') + '</span>';
    return '<button type="button" class="bgp" data-bingo-open aria-label="Play NRL Bingo"><span class="bgp-new">New</span><span class="bgp-grid" aria-hidden="true">' + h + '</span>' +
      '<span class="bgp-t"><b>NRL Bingo</b><small>Tap the teams he played for. Fill all ' + E.N + ' tiles.</small></span><span class="bgp-go" aria-hidden="true">&#x25B6;</span></button>';
  };
  T.bingo = {
    // Open the start screen (the home card, ?play=bingo, a board's Play button). go: straight back into a card part way through
    open: function (go) {
      if ((st.view === 'play' || st.view === 'out' || st.view === 'rewind') && !st.done) { if (T.showScreen) T.showScreen('bingo'); render(); if (st.view === 'play' && st.nofit && !st.nofit.hold) startNofit(); return; }
      st = { view: 'start' };
      if (T.showScreen) T.showScreen('bingo');
      primeVault(); render();
      load().then(function () {
        render();
        var run = savedRun();
        if (run && go) start(run);
      }, function () { var el = root(); if (el) el.innerHTML = '<div class="ou-load">Could not load the players. Check your connection and try again.</div>'; });
    },
    on: function () { var CA = A(); return !!(CA && CA.bingoOn && CA.bingoOn()); },
    // a card under way (the page's CAST_ACCOUNT.inGame: pop-ups wait, and a sign-in keeps the card)
    playing: function () { return (st.view === 'play' || st.view === 'out' || st.view === 'rewind') && !st.done; },
    // The share pictures for the shared share-picker (the owner, 18 Oct 2026): 'portrait' (1080 x 1350) or 'story'
    // (1080 x 1920) of the card on the results screen -> Promise of a PNG Blob, or null with no card to draw
    shareImage: function (size) { return st.board && D ? drawShare(size) : Promise.resolve(null); }
  };
  // Tests on the preview only (localhost): the share picture, the current card's open tiles, and the state
  if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {
    T.bingo._card = function () { return shareFile; };
    T.bingo._story = function () { return drawShare('story'); };
    T.bingo._fits = function () { var b = st.board; return b && st.view === 'play' && !st.busy && !st.pop && !st.nofit && !b.over() ? b.openFits(b.order[b.pos]) : null; };
    T.bingo._hint = function () { var b = st.board; if (!b || st.view !== 'play' || st.pop || st.nofit || st.busy) return null; st.hint = b.openFits(b.order[b.pos]); render(); return st.hint; };
    T.bingo._state = function () { var b = st.board; return { view: st.view, pop: st.pop && st.pop.kind, nofit: !!st.nofit, lives: b && b.lives, filled: b && b.filled, moves: b && b.moves }; };
  }
  // ?play=bingo (a board's Play button, a share, CAST Games' /nrl-bingo/) or the owner's private link (?bingo=...): straight
  // in once the account module (which knows if it's on) has loaded; the rest of the page stays hidden until it opens
  // (or CAST Games' page for it, window.CG_MODE 'bingo', 17 Oct 2026: every mode its own page). An old Daily Bingo link
  // (?play=bingo-daily) opens the game the same way
  var want = /[?&](play=(bingo|bingod|bingo-daily)|bingo=[a-z0-9]+)(?=&|#|$)/.exec(location.search) || (/^bingo/.test(window.CG_MODE || '') ? [0, 0, window.CG_MODE] : null);
  if (T.bingoWanted || want) {
    var docEl = document.documentElement, boot = document.createElement('style'), tries = 0;
    boot.textContent = 'html.bg-boot .screen:not(#screen-bingo) { display: none !important; }';
    document.head.appendChild(boot);
    docEl.classList.add('bg-boot');
    (function go() {
      if (T.showScreen && T.bingo.on()) { T.bingo.open(T.bingoWanted || undefined); docEl.classList.remove('bg-boot'); return; }
      if (++tries < 80) setTimeout(go, 100); else docEl.classList.remove('bg-boot');
    })();
  }
})();
