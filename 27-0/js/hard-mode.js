/* 27-0 Hard mode: Classic spins with no free rerolls or wildcards and no ratings during the draft. Since 29 Sep 2026 its
   wildcards are paid only: one of each a season from the Vault or bought on the spot (js/daily-wild.js).
   (Before, Hard had no wildcards at all.)
   The squad list keeps the Daily's sort (Position / Surname, tap again to flip) and search.
   Ratings stay hidden on the list, the pitch and the strength bar until the squad is complete.
   Loaded after js/daily-wild.js (it reuses that sort and search). */
(function () {
  'use strict';
  var hard = false;
  window.CastHard = { isOn: function () { return hard; } };

  function wrap(name, fn) {
    var orig = window[name];
    if (typeof orig !== 'function') return;
    window[name] = function () { return fn.call(this, orig, arguments); };
  }

  function paint() {
    // The mode cards never show a picked one (one tap plays), so only the body class changes
    document.body.classList.toggle('cp-hard', hard);
    var btn = document.getElementById('startModeBtn');
    if (btn && hard) { btn.textContent = '🔥 START HARD MODE'; }
    if (typeof window.cpOptionsSummary === 'function') window.cpOptionsSummary();
  }

  // selectMode('hard') = Classic set-up, flagged as Hard
  wrap('selectMode', function (orig, args) {
    var mode = args[0];
    hard = mode === 'hard';
    var out = orig.call(this, hard ? 'classic' : mode);
    if (hard && typeof STATE !== 'undefined') STATE.gameMode = 'hard';
    paint();
    return out;
  });

  // A new game rebuilds STATE as Classic: put Hard back, with ratings hidden
  wrap('startGame', function (orig, args) {
    var out = orig.apply(this, args);
    if (hard && !(window.CastDaily && CastDaily.isActive && CastDaily.isActive())) {
      STATE.gameMode = 'hard';
      STATE.showRatings = false;
      STATE.rerollUsed = true; // no rerolls in Hard
      if (typeof updateRerollBtn === 'function') updateRerollBtn();
      if (typeof gtag !== 'undefined') gtag('event', 'Hard_Mode', {});
    }
    return out;
  });

  // The Daily always plays its own rules
  wrap('startSelectedMode', function (orig, args) {
    if (window.CastDaily && CastDaily.isActive && CastDaily.isActive()) { hard = false; paint(); }
    return orig.apply(this, args);
  });

  // No free rerolls in Hard (including the CAST Profile / YouTube extras): only the season's one paid reroll
  // (js/daily-wild.js sets STATE.__hardPaidRR once it's bought or taken from the Vault)
  wrap('useReroll', function (orig, args) {
    if (typeof STATE !== 'undefined' && STATE.gameMode === 'hard') {
      if (!STATE.__hardPaidRR) return;
      STATE.__hardPaidRR = false;
    }
    return orig.apply(this, args);
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', paint); else paint();
})();
