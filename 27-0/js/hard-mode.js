





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
    
    document.body.classList.toggle('cp-hard', hard);
    var btn = document.getElementById('startModeBtn');
    if (btn && hard) { btn.textContent = '🔥 START HARD MODE'; }
    if (typeof window.cpOptionsSummary === 'function') window.cpOptionsSummary();
  }

  
  wrap('selectMode', function (orig, args) {
    var mode = args[0];
    hard = mode === 'hard';
    var out = orig.call(this, hard ? 'classic' : mode);
    if (hard && typeof STATE !== 'undefined') STATE.gameMode = 'hard';
    paint();
    return out;
  });

  
  wrap('startGame', function (orig, args) {
    var out = orig.apply(this, args);
    if (hard && !(window.CastDaily && CastDaily.isActive && CastDaily.isActive())) {
      STATE.gameMode = 'hard';
      STATE.showRatings = false;
      STATE.rerollUsed = true; 
      if (typeof updateRerollBtn === 'function') updateRerollBtn();
      if (typeof gtag !== 'undefined') gtag('event', 'Hard_Mode', {});
    }
    return out;
  });

  
  wrap('startSelectedMode', function (orig, args) {
    if (window.CastDaily && CastDaily.isActive && CastDaily.isActive()) { hard = false; paint(); }
    return orig.apply(this, args);
  });

  
  
  wrap('useReroll', function (orig, args) {
    if (typeof STATE !== 'undefined' && STATE.gameMode === 'hard') {
      if (!STATE.__hardPaidRR) return;
      STATE.__hardPaidRR = false;
    }
    return orig.apply(this, args);
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', paint); else paint();
})();
