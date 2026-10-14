/* 27-0 mode skins: while a game is on, <body data-mode> carries the mode (classic, pack, hard, daily)
   so the headers, panels and edges pick up that mode's colour. Classic gold, Pack blue, Hard red, Daily orange.
   Cleared on the home screen. Loaded after js/hard-mode.js. */
(function () {
  'use strict';
  var STRIP = { pack: '&#x1F4E6; Pack mode &middot; 7 packs, keep your best 13', hard: '&#x1F525; Hard mode &middot; No ratings, paid wildcards' };
  function mode() {
    if (window.CastDaily && CastDaily.isActive && CastDaily.isActive()) return 'daily';
    if (window.CastHard && CastHard.isOn()) return 'hard'; // set just after startGame shows the draft
    return (typeof STATE !== 'undefined' && STATE.gameMode) || 'classic';
  }
  function apply(id) {
    var b = document.body;
    if (!id || id === 'setup') { b.removeAttribute('data-mode'); return; }
    var m = mode();
    b.setAttribute('data-mode', m);
    // A slim mode strip on top of each game screen (the Daily has its own strip, Classic needs none)
    Array.prototype.forEach.call(document.querySelectorAll('.screen'), function (sc) {
      if (sc.id === 'setup') return;
      var st = sc.querySelector(':scope > .cp-skin-strip');
      if (!STRIP[m]) { if (st) st.remove(); return; }
      if (!st) { st = document.createElement('div'); st.className = 'cp-skin-strip'; sc.insertBefore(st, sc.firstChild); }
      st.innerHTML = STRIP[m];
    });
  }
  var orig = window.showScreen;
  if (typeof orig === 'function') {
    window.showScreen = function (id) { var out = orig.apply(this, arguments); try { apply(id); } catch (e) { /* skin is decoration only */ } return out; };
  }
})();
