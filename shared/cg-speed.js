/* CAST Games speed helpers (speed pass, 18 Oct 2026). Loaded after shared/cg.js on the home page, the sport pages and
   every game page (tools/build.py adds it to the game pages).

   Art before it is needed. The All Games switcher fetches every game's logo while it is open (the sport it opened on
   first, the rest after), and a finger on a sport chip starts that sport's logos straight away, so a tap on Racing shows
   its games' art and not empty boxes (the owner's screen recording, 17 Oct 2026). Each one is decoded as well, so it is
   ready to paint the moment its row is drawn.

   A game before it is opened. A finger on a game's card, row or banner (or the mouse resting on it) starts that game's
   files: its styles and scripts, in the page's own order and with their own versions (FILES, written by tools/build.py
   from the built pages). They are on their way while the finger is still down, and the game's page finds them waiting.
   A finger that turns into a scroll stops them. Chrome also fetches the page itself (speculation rules). A phone on Data
   Saver only gets what its own taps ask for. */
(function () {
  'use strict';
  var CG = window.CG;
  if (!CG || window.CG_SPEED) return;
  window.CG_SPEED = true;
  var FILES = {"27-0":["/1000tries/js/cast-promo.js?v=8fe0a4ed","/27-0/js/game-core.js?v=ce48d74c","/27-0/js/ga.js?v=896743d6","/1000tries/js/cast-contact.js?v=76e04347","/27-0/css/legacy-1.css?v=b80a9de9","/27-0/css/legacy-2.css?v=79d4c997","/27-0/css/theme.css?v=c9a9ba37","/1000tries/css/cast-account.css?v=4066998e","/27-0/js/faq.js?v=87933fdb","/27-0/js/game-data-sim.js?v=454f152f","/27-0/js/finals-live.js?v=b0abaf96","/1000tries/js/cast-celebrate.js?v=2fc44216","/27-0/js/celebration.js?v=7f7940c4","/27-0/js/share-story.js?v=069ccc94","/27-0/js/site-extras.js?v=13c08d57","/1000tries/js/upgrades-data.js?v=3e734230","/1000tries/js/cast-upgrades.js?v=97bdb0f0","/1000tries/js/cast-dual.js?v=ffefa095","/1000tries/js/cast-picks.js?v=e56579c0","/1000tries/js/cast-prices.js?v=d1be5481","/1000tries/js/cast-account.js?v=2c27e6e5","/1000tries/js/cast-totw.js?v=513cc917","/1000tries/js/cast-wch.js?v=8dd07687","/27-0/js/theme-fx.js?v=36e7ed0c","/1000tries/js/cast-daily.js?v=f0b9cc73","/27-0/js/daily.js?v=7dfbcb41","/27-0/js/daily-wild.js?v=f5d9ae3e","/27-0/js/picks.js?v=a320be47","/27-0/js/hard-mode.js?v=560ff4f1","/27-0/js/mode-skin.js?v=4a7cd9bd","/1000tries/js/cast-nations.js?v=4c4e8435","/1000tries/js/cast-intl.js?v=5f7b4f7d","/27-0/js/wc-engine.js?v=5f6145b5","/27-0/js/world-cup.js?v=5c13d7be","/27-0/js/draft-save.js?v=b02a4712","/27-0/data/players.json"],"1000tries":["/1000tries/js/cast-contact.js?v=76e04347","/1000tries/css/main.css?v=90df2817","/1000tries/css/cast-account.css?v=4066998e","/1000tries/css/bingo.css?v=d29b19bf","/1000tries/js/analytics.js?v=e394c5dd","/1000tries/js/cast-promo.js?v=8fe0a4ed","/1000tries/js/data.js?v=5cbcee3e","/1000tries/js/draft.js?v=765e1606","/1000tries/js/team-spin.js?v=44fdda98","/1000tries/js/wildcards.js?v=56432226","/1000tries/js/cast-nations.js?v=4c4e8435","/1000tries/js/cast-intl.js?v=5f7b4f7d","/1000tries/js/render.js?v=f7f3088f","/1000tries/js/share-card.js?v=30674101","/1000tries/js/cast-celebrate.js?v=2fc44216","/1000tries/js/app.js?v=8db13d1c","/1000tries/js/ou-engine.js?v=d4a50fcd","/1000tries/js/overunder.js?v=be0ed257","/1000tries/js/bingo-engine.js?v=4441ecbf","/1000tries/js/bingo.js?v=111299a4","/1000tries/js/cast-daily.js?v=f0b9cc73","/1000tries/js/daily.js?v=a6c275d7","/1000tries/js/upgrades-data.js?v=3e734230","/1000tries/js/cast-upgrades.js?v=97bdb0f0","/1000tries/js/cast-dual.js?v=ffefa095","/1000tries/js/cast-prices.js?v=d1be5481","/1000tries/js/cast-picks.js?v=e56579c0","/1000tries/js/cast-account.js?v=2c27e6e5","/1000tries/js/cast-totw.js?v=513cc917","/1000tries/js/cast-wch.js?v=8dd07687","/1000tries/data/players.json"],"25000runs":["/1000tries/js/cast-contact.js?v=76e04347","/25000runs/css/main.css?v=0ed48e94","/1000tries/css/cast-account.css?v=4066998e","/25000runs/js/analytics.js?v=d49bd1b0","/1000tries/js/cast-promo.js?v=8fe0a4ed","/25000runs/js/data.js?v=c3440b34","/25000runs/js/draft.js?v=4f9b76f2","/25000runs/js/team-spin.js?v=28fbe6dd","/25000runs/js/wildcards.js?v=37ac69ae","/1000tries/js/cast-nations.js?v=4c4e8435","/1000tries/js/cast-intl.js?v=5f7b4f7d","/25000runs/js/kits-data.js?v=96e28210","/25000runs/js/cast-kits.js?v=50a9fce9","/25000runs/js/render.js?v=d3eafead","/25000runs/js/share-card.js?v=dc412ece","/1000tries/js/cast-celebrate.js?v=2fc44216","/25000runs/js/app.js?v=6a4c5f38","/1000tries/js/cast-daily.js?v=f0b9cc73","/25000runs/js/bbl-daily.js?v=af4172cf","/25000runs/js/daily.js?v=2c0c22a7","/1000tries/js/cast-picks.js?v=e56579c0","/25000runs/js/ou-engine.js?v=d7305536","/25000runs/js/overunder.js?v=7377b201","/1000tries/js/cast-prices.js?v=d1be5481","/1000tries/js/cast-account.js?v=2c27e6e5","/25000runs/data/players.json"],"60000runs":["/1000tries/js/cast-contact.js?v=76e04347","/60000runs/css/main.css?v=eb7c830c","/1000tries/css/cast-account.css?v=4066998e","/60000runs/js/analytics.js?v=d49bd1b0","/1000tries/js/cast-promo.js?v=8fe0a4ed","/60000runs/js/data.js?v=8078139f","/60000runs/js/draft.js?v=f73cf169","/60000runs/js/team-spin.js?v=5207619f","/60000runs/js/wildcards.js?v=37ac69ae","/1000tries/js/cast-nations.js?v=4c4e8435","/1000tries/js/cast-intl.js?v=5f7b4f7d","/60000runs/js/kits-data.js?v=1f42fb05","/60000runs/js/cast-kits.js?v=50a9fce9","/60000runs/js/render.js?v=6e8598ec","/60000runs/js/share-card.js?v=3d13e087","/1000tries/js/cast-celebrate.js?v=2fc44216","/60000runs/js/app.js?v=17468af7","/1000tries/js/cast-daily.js?v=f0b9cc73","/60000runs/js/tests-daily.js?v=5501ae7a","/60000runs/js/daily.js?v=5645e649","/1000tries/js/cast-picks.js?v=e56579c0","/60000runs/js/ou-engine.js?v=d7305536","/60000runs/js/overunder.js?v=9b0876d2","/1000tries/js/cast-prices.js?v=d1be5481","/1000tries/js/cast-account.js?v=2c27e6e5","/60000runs/data/players.json"],"g1winner":["/1000tries/js/cast-contact.js?v=76e04347","/g1winner/css/main.css?v=1314330e","/1000tries/css/cast-account.css?v=4066998e","/g1winner/js/analytics.js?v=d49bd1b0","/1000tries/js/cast-promo.js?v=8fe0a4ed","/g1winner/js/data.js?v=826fd760","/g1winner/js/draft.js?v=59a633f9","/g1winner/js/wildcards.js?v=40caa202","/1000tries/js/cast-nations.js?v=4c4e8435","/1000tries/js/cast-intl.js?v=5f7b4f7d","/g1winner/js/render.js?v=2941da08","/g1winner/js/share-card.js?v=4c0cc9d9","/1000tries/js/cast-celebrate.js?v=2fc44216","/g1winner/js/app.js?v=96b44fdf","/1000tries/js/cast-daily.js?v=f0b9cc73","/g1winner/js/racing-daily.js?v=c7213b46","/g1winner/js/daily.js?v=6881d3dc","/1000tries/js/cast-picks.js?v=e56579c0","/g1winner/js/ou-engine.js?v=d7305536","/g1winner/js/overunder.js?v=4bc4b5bc","/1000tries/js/cast-prices.js?v=d1be5481","/1000tries/js/cast-account.js?v=2c27e6e5","/g1winner/data/players.json"],"777tds":["/1000tries/js/cast-contact.js?v=76e04347","/777tds/css/main.css?v=e05254f7","/1000tries/css/cast-account.css?v=4066998e","/777tds/js/analytics.js?v=d49bd1b0","/1000tries/js/cast-promo.js?v=8fe0a4ed","/777tds/js/data.js?v=b6814210","/777tds/js/draft.js?v=c49ea7ae","/777tds/js/team-spin.js?v=92b5c7e6","/777tds/js/wildcards.js?v=322de840","/1000tries/js/cast-nations.js?v=4c4e8435","/1000tries/js/cast-intl.js?v=5f7b4f7d","/777tds/js/kits-data.js?v=83c829d0","/777tds/js/cast-kits.js?v=50a9fce9","/777tds/js/render.js?v=dc9d023c","/777tds/js/share-card.js?v=18f9d635","/1000tries/js/cast-celebrate.js?v=2fc44216","/777tds/js/app.js?v=cdd4ce55","/1000tries/js/cast-daily.js?v=f0b9cc73","/777tds/js/nfl-daily.js?v=37f5e98e","/777tds/js/daily.js?v=5eb5b120","/1000tries/js/cast-picks.js?v=e56579c0","/777tds/js/ou-engine.js?v=d7305536","/777tds/js/overunder.js?v=7e9d4d8f","/1000tries/js/cast-prices.js?v=d1be5481","/1000tries/js/cast-account.js?v=2c27e6e5","/777tds/data/players.json"],"650goals":["/1000tries/js/cast-contact.js?v=76e04347","/650goals/css/main.css?v=29292a12","/1000tries/css/cast-account.css?v=4066998e","/650goals/js/analytics.js?v=d49bd1b0","/1000tries/js/cast-promo.js?v=8fe0a4ed","/650goals/js/data.js?v=1cdfa63a","/650goals/js/draft.js?v=985506a7","/650goals/js/team-spin.js?v=9badc1c6","/650goals/js/wildcards.js?v=82cd45ef","/1000tries/js/cast-nations.js?v=4c4e8435","/1000tries/js/cast-intl.js?v=5f7b4f7d","/650goals/js/kits-data.js?v=ef602a6b","/650goals/js/cast-kits.js?v=3ec5889d","/650goals/js/render.js?v=120461b1","/650goals/js/share-card.js?v=b2b04739","/1000tries/js/cast-celebrate.js?v=2fc44216","/650goals/js/app.js?v=6acbf15a","/1000tries/js/cast-daily.js?v=f0b9cc73","/650goals/js/epl-daily.js?v=b6ea864a","/650goals/js/daily.js?v=f1939bf0","/1000tries/js/cast-picks.js?v=e56579c0","/650goals/js/ou-engine.js?v=d7305536","/650goals/js/overunder.js?v=fbee6778","/1000tries/js/cast-prices.js?v=d1be5481","/1000tries/js/cast-account.js?v=2c27e6e5","/650goals/data/players.json"],"scpointsking":["/1000tries/js/cast-contact.js?v=76e04347","/scpointsking/css/main.css?v=6a410386","/1000tries/css/cast-account.css?v=4066998e","/scpointsking/js/analytics.js?v=d49bd1b0","/scpointsking/js/data.js?v=831fef1e","/scpointsking/js/draft.js?v=00c0f44e","/scpointsking/js/wildcards.js?v=628486a1","/1000tries/js/cast-nations.js?v=4c4e8435","/1000tries/js/cast-intl.js?v=5f7b4f7d","/scpointsking/js/kits-data.js?v=533919e3","/scpointsking/js/cast-kits.js?v=3ec5889d","/scpointsking/js/render.js?v=5cadef1e","/scpointsking/js/share-card.js?v=74c90403","/1000tries/js/cast-celebrate.js?v=2fc44216","/scpointsking/js/app.js?v=b1ce27a2","/1000tries/js/cast-daily.js?v=f0b9cc73","/scpointsking/js/sc-daily.js?v=d60f93f6","/scpointsking/js/daily.js?v=fd980df5","/1000tries/js/cast-picks.js?v=e56579c0","/1000tries/js/cast-prices.js?v=d1be5481","/1000tries/js/cast-account.js?v=2c27e6e5"],"100000points":["/1000tries/js/cast-contact.js?v=76e04347","/100000points/css/main.css?v=df9bcf49","/1000tries/css/cast-account.css?v=4066998e","/100000points/js/analytics.js?v=d49bd1b0","/1000tries/js/cast-promo.js?v=8fe0a4ed","/100000points/js/data.js?v=7e507b28","/100000points/js/draft.js?v=1f91201a","/100000points/js/team-spin.js?v=08d3febb","/100000points/js/wildcards.js?v=1341ba8d","/1000tries/js/cast-nations.js?v=4c4e8435","/1000tries/js/cast-intl.js?v=5f7b4f7d","/100000points/js/kits-data.js?v=dfb9f529","/100000points/js/cast-kits.js?v=95a9ac6a","/100000points/js/render.js?v=87549a2a","/100000points/js/share-card.js?v=3891f2b4","/1000tries/js/cast-celebrate.js?v=2fc44216","/100000points/js/app.js?v=7f2dc2b8","/1000tries/js/cast-daily.js?v=f0b9cc73","/100000points/js/nba-daily.js?v=92d0aebc","/100000points/js/daily.js?v=66d99921","/1000tries/js/cast-picks.js?v=e56579c0","/1000tries/js/ou-engine.js?v=d4a50fcd","/100000points/js/overunder.js?v=764fb5f4","/1000tries/js/cast-prices.js?v=d1be5481","/1000tries/js/cast-account.js?v=2c27e6e5","/100000points/data/players.json"],"4000goals":["/1000tries/js/cast-contact.js?v=76e04347","/4000goals/css/main.css?v=551cc961","/1000tries/css/cast-account.css?v=4066998e","/4000goals/js/analytics.js?v=ab72a6ec","/1000tries/js/cast-promo.js?v=8fe0a4ed","/4000goals/js/data.js?v=ae65eba1","/4000goals/js/draft.js?v=50a06d7a","/4000goals/js/team-spin.js?v=c8619833","/4000goals/js/wildcards.js?v=3eef818f","/1000tries/js/cast-nations.js?v=4c4e8435","/1000tries/js/cast-intl.js?v=5f7b4f7d","/4000goals/js/kits-data.js?v=bfd209b3","/4000goals/js/cast-kits.js?v=50a9fce9","/4000goals/js/render.js?v=e8fe9a83","/4000goals/js/share-card.js?v=55948fe7","/1000tries/js/cast-celebrate.js?v=2fc44216","/4000goals/js/app.js?v=cd7bce19","/1000tries/js/cast-daily.js?v=f0b9cc73","/4000goals/js/afl-daily.js?v=cb4561c3","/4000goals/js/daily.js?v=33091028","/1000tries/js/upgrades-data.js?v=3e734230","/1000tries/js/cast-upgrades.js?v=97bdb0f0","/1000tries/js/cast-picks.js?v=e56579c0","/1000tries/js/cast-prices.js?v=d1be5481","/1000tries/js/cast-account.js?v=2c27e6e5","/4000goals/js/ou-engine.js?v=d7305536","/4000goals/js/overunder.js?v=8147bea8","/4000goals/data/players.json"]}; // CG_FILES: tools/build.py
  var conn = navigator.connection || {}, saver = !!conn.saveData;
  var seen = {};

  /* ---------- Art ---------- */
  function art(u, high) {
    if (!u || seen[u]) return;
    seen[u] = 1;
    var im = new Image();
    try { im.fetchPriority = high ? 'high' : 'low'; } catch (e) { /* older browser */ }
    im.decoding = 'async';
    im.src = u;
    if (im.decode) im.decode().catch(function () { /* the row's own picture tries again */ });
  }
  function live() { try { return CG.liveGames(); } catch (e) { return []; } }
  function sportArt(sid, high) { live().forEach(function (g) { if (g.sport === sid && g.logo) art(CG.url(g.logo), high); }); }
  function allArt(first) {
    if (first) sportArt(first, false);
    var gs = live(), i = 0;
    (function next() { // a few at a time, while the phone has nothing else to do
      for (var n = 0; n < 4 && i < gs.length; i++) if (gs[i].logo && !seen[CG.url(gs[i].logo)]) { art(CG.url(gs[i].logo), false); n++; }
      if (i < gs.length) idle(next);
    })();
  }
  function idle(f) { if (window.requestIdleCallback) requestIdleCallback(f, { timeout: 1200 }); else setTimeout(f, 200); }
  // The switcher opens (html.cg-sheet-open, shared/cg.js): every game's art, the sport on show first
  var wasOpen = false;
  try {
    new MutationObserver(function () {
      var open = document.documentElement.classList.contains('cg-sheet-open');
      if (open && !wasOpen) {
        var on = document.querySelector('.cg-sw-chip.is-on');
        if (on) sportArt(on.getAttribute('data-cg-sport'), true);
        if (!saver) idle(function () { allArt(null); });
      }
      wasOpen = open;
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  } catch (e) { /* no observers: the rows load their own art */ }

  /* ---------- A game's files ---------- */
  // The folder a link plays: a game's own page, or a mode page (its game's folder, shared/cg.js GAMES)
  function folderOf(a) {
    var u;
    try { u = new URL(a.href, location.href); } catch (e) { return null; }
    if (u.origin !== location.origin) return null;
    var path = u.pathname.replace(/index\.html$/, ''), gs = CG.GAMES || [];
    for (var i = 0; i < gs.length; i++) {
      var g = gs[i];
      if (g.path && new URL(CG.url(g.path), document.baseURI).pathname === path) return { folder: g.folder || g.path.replace(/\/$/, ''), page: u.href };
    }
    return null;
  }
  var warmFor = null, stop = null;
  function warm(a) {
    var f = folderOf(a), list = f && FILES[f.folder];
    if (!list || warmFor === f.folder) return;
    warmFor = f.folder;
    var ctl = window.AbortController ? new AbortController() : null;
    stop = ctl;
    list.forEach(function (u) {
      if (seen[u]) return;
      seen[u] = 1;
      var o = { credentials: 'same-origin' };
      if (ctl) o.signal = ctl.signal;
      try { o.priority = 'low'; } catch (e) { /* older browser */ }
      fetch(u, o).catch(function () { delete seen[u]; });
    });
  }
  function cancel() { // the finger scrolled instead: whatever hasn't come in is dropped
    if (stop) { try { stop.abort(); } catch (e) { /* done */ } stop = null; }
    if (warmFor) { (FILES[warmFor] || []).forEach(function (u) { delete seen[u]; }); warmFor = null; }
  }
  var PICK = 'a.cg-c, a.cg-swr, a.cgb[href], a[data-g], a[data-tap]';
  document.addEventListener('pointerdown', function (e) {
    var t = e.target;
    var chip = t.closest && t.closest('[data-cg-sport]');
    if (chip) { sportArt(chip.getAttribute('data-cg-sport'), true); return; }
    var a = t.closest && t.closest(PICK);
    if (a && window.fetch) setTimeout(function () { warm(a); }, 0);
  }, { capture: true, passive: true });
  document.addEventListener('pointercancel', cancel, { capture: true, passive: true });
  document.addEventListener('pointerup', function () { stop = null; warmFor = null; }, { capture: true, passive: true }); // a tap: they carry on
  var hover = 0;
  document.addEventListener('mouseover', function (e) {
    var a = e.target.closest && e.target.closest(PICK);
    clearTimeout(hover);
    if (a && window.fetch && !saver) hover = setTimeout(function () { warm(a); stop = null; warmFor = null; }, 80);
  }, { passive: true });

  // Chrome: the game's page itself, from a finger on its card or the mouse resting on it
  try {
    if (!saver && window.HTMLScriptElement && HTMLScriptElement.supports && HTMLScriptElement.supports('speculationrules')) {
      var s = document.createElement('script');
      s.type = 'speculationrules';
      s.textContent = JSON.stringify({ prefetch: [{ where: { selector_matches: PICK }, eagerness: 'moderate' }] });
      document.head.appendChild(s);
    }
  } catch (e) { /* no speculation rules */ }
})();
