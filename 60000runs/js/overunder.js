/* HIGHER OR LOWER: CRICKET (17 Oct 2026, the owner): 60000 RUNS' over/under (Follow On) and 25000 RUNS' (Free Hit) are one
   game now, HIGHER OR LOWER: CRICKET, played on 25000 RUNS' page (its js/overunder.js) with both games' categories. Every
   way into it from here (?play=ou, CAST Games' own page with CG_MODE 'ou', a board's Play button, the mode card) goes on
   to it, on the Test category asked for (Test Runs, unless ?cat= or the last one played says Test Wickets). Runs there
   still save under 60000 RUNS ('tests'), so its boards (tsou, tsouw), trophies and stats carry on. data/ou.json stays
   here: the server's copy of the Test lists is built from it (1000TRIES tools/sync_functions_data.py), and 25000 RUNS'
   data/ou.json carries the same rows */
(function () {
  'use strict';
  var T = window.T;
  if (!T) return;
  var PAGE = 'https://castgames.com.au/higher-or-lower-cricket/', CATS = ['testruns', 'testwkts'], LS_CAT = 'fo_cat_v1';
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function urlCat() { var m = /[?&]cat=([a-z0-9]+)(?=&|#|$)/.exec(location.search); return m ? m[1] : null; }
  // The address there: the category first, then whatever else this one carried (an invite code, the launch preview)
  function to(cat) {
    var c = CATS.indexOf(cat) >= 0 ? cat : CATS.indexOf(lsGet(LS_CAT)) >= 0 ? lsGet(LS_CAT) : CATS[0];
    var keep = location.search.replace(/^\?/, '').split('&').filter(function (x) { return x && !/^(play|cat|po)=/.test(x); });
    return PAGE + '?' + ['cat=' + c].concat(keep).join('&') + location.hash;
  }
  function go(cat) { location.replace(to(cat)); }
  T.ou = { open: function (cat) { go(cat || urlCat()); }, on: function () { return true; } };
  if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) T.ou._to = to; // tests on the preview only
  // Straight on, before the rest of this page shows (ouWanted: the page asked before this loaded, js/app.js playMode)
  if (T.ouWanted || window.CG_MODE === 'ou' || /[?&](play=ou|po=[a-z0-9]+)(?=&|#|$)/.test(location.search)) {
    var boot = document.createElement('style');
    boot.textContent = 'html.ou-boot .screen { display: none !important; }';
    document.head.appendChild(boot);
    document.documentElement.classList.add('ou-boot');
    go(urlCat());
  }
})();
