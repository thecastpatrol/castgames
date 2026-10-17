







(function () {
  'use strict';
  var LS = '270_draft_v1', MS = 24 * 3600000;
  


  function key(m) { return !m || m === 'classic' ? LS : LS + '_' + m; }
  function modeNow() { return typeof STATE !== 'undefined' && STATE && STATE.gameMode ? STATE.gameMode : 'classic'; }
  function isKey(k) { return k === LS || (!!k && k.indexOf(LS + '_') === 0); }
  var MODES = { classic: 'Classic', hard: 'Hard', pack: 'Pack' };
  var SCREENS = { draft: 1, 'squad-complete': 1, 'pack-opening': 1, 'pack-squad': 1 };
  var armed = false; 

  function track(name, p) { try { if (typeof gtag === 'function') gtag('event', name, p || {}); } catch (e) {   } }
  function who() { return (window.CastAccount && CastAccount.uid && CastAccount.uid()) || 'guest'; }
  function daily() { return !!(window.CastDaily && CastDaily.isActive && CastDaily.isActive()); }
  function screen() { var s = document.querySelector('.screen.active'); return s ? s.id : ''; }
  function picks(S) { return (S.team || []).filter(Boolean).length; }

  
  function eligible() {
    if (typeof STATE === 'undefined' || !STATE || !MODES[STATE.gameMode] || daily() || STATE.__qd || STATE.__ch || STATE.season) return false;
    if (!SCREENS[screen()]) return false;
    if (STATE.gameMode === 'pack') return (STATE.packPlayers || []).length > 0 || (!STATE.isGodPack && STATE.packIdx > 0);
    
    return picks(STATE) > 0 || !!(STATE.__keyUsed || STATE.__superNext || STATE.__rrN || STATE.rerollUsed) || (STATE.__k || 0) > 1;
  }
  
  var TAB = Math.random().toString(36).slice(2, 10);
  function raw(m) { try { return JSON.parse(localStorage.getItem(key(m)) || 'null'); } catch (e) { return null; } }
  function taken() {
    armed = false;
    if (typeof STATE !== 'undefined' && STATE) STATE.__taken = true;
    var msg = 'This draft carried on in another tab.';
    var t = document.createElement('div'); t.className = 'wc-toast'; t.setAttribute('role', 'alert'); t.textContent = msg; 
    document.body.appendChild(t); setTimeout(function () { t.remove(); }, 4200);
    if (typeof showScreen === 'function') showScreen('setup');
  }
  window.addEventListener('storage', function (e) {
    if (!isKey(e.key) || typeof STATE === 'undefined' || !STATE || !STATE.__draftId || STATE.__taken || !armed) return;
    var d = null; try { d = JSON.parse(e.newValue || 'null'); } catch (x) { d = null; }
    if (d && d.id === STATE.__draftId && d.tab !== TAB) taken();
  });
  function keep() {
    if (!eligible() || STATE.__taken) return;
    if (!STATE.__draftId) STATE.__draftId = Math.random().toString(36).slice(2, 12);
    var cur = raw(STATE.gameMode), me = who();
    if (cur && cur.id === STATE.__draftId && cur.tab !== TAB) { taken(); return; }
    if (cur && cur.id === STATE.__draftId && cur.who !== 'guest' && cur.who !== me) { drop(); return; } 
    armed = true;
    try {
      var s = JSON.stringify(STATE, function (k, v) {
        if (typeof v === 'function') return undefined;
        if (v instanceof Set) return { __set: Array.from(v) };
        if (v instanceof Map) return { __map: Array.from(v.entries()) };
        if (typeof Element !== 'undefined' && v instanceof Element) return undefined;
        return v;
      });
      localStorage.setItem(key(STATE.gameMode), JSON.stringify({ v: 1, id: STATE.__draftId, tab: TAB, who: me, at: Date.now(), mode: STATE.gameMode, picks: picks(STATE), s: s }));
    } catch (e) {   }
  }
  
  function drop(m) { try { localStorage.removeItem(key(typeof m === 'string' ? m : modeNow())); } catch (e) {   } }
  function dropKey(k) { try { if (k) localStorage.removeItem(k); } catch (e) {   } }
  
  function saved(m) {
    var best = null;
    [LS, LS + '_hard', LS + '_pack'].forEach(function (k) {
      var d = null;
      try { d = JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { d = null; }
      if (!d || d.v !== 1 || typeof d.s !== 'string' || !MODES[d.mode] || !(Date.now() - d.at < MS)) { if (d) dropKey(k); return; }
      d.key = k;
      if ((!m || d.mode === m) && (!best || d.at > best.at)) best = d;
    });
    return best;
  }

  
  
  function soon() { setTimeout(keep, 0); }
  document.addEventListener('click', soon, true);
  document.addEventListener('touchend', soon, true);
  document.addEventListener('visibilitychange', function () { if (document.hidden) keep(); });
  window.addEventListener('pagehide', keep);
  function wrap(name, before, afterFn) {
    var orig = window[name];
    if (typeof orig !== 'function') return;
    window[name] = function () {
      if (before) try { before(); } catch (e) {   }
      var out = orig.apply(this, arguments);
      if (afterFn) try { afterFn(); } catch (e) {   }
      return out;
    };
  }
  ['finalSpin', 'placePlayer', 'useReroll', 'nextPack', 'finishPackOpening', 'revealPackCards', 'packAssignPlayer', 'packAutoAssignPlayer', 'packRemovePlayer', 'packResetTeam', 'packAutoBuild'].forEach(function (n) { wrap(n, null, keep); });
  
  ['startSeason', 'startGame', 'startPackOpening', 'resetGame'].forEach(function (n) { wrap(n, drop, null); });
  wrap('showScreen', null, function () { if (armed && screen() === 'setup') { drop(); armed = false; } });

  function resume(d) {
    var S = null;
    try {
      S = JSON.parse(d.s, function (k, v) {
        if (v && typeof v === 'object' && !Array.isArray(v)) {
          if (Array.isArray(v.__set)) return new Set(v.__set);
          if (Array.isArray(v.__map)) return new Map(v.__map);
        }
        return v;
      });
    } catch (e) { S = null; }
    if (!S || !Array.isArray(S.team) || S.team.length !== 13 || !MODES[S.gameMode] || S.season) { dropKey(d.key); return; }
    if (!(S.takenNames instanceof Set)) S.takenNames = new Set(S.team.filter(Boolean).map(function (p) { return p.name; }));
    if (S.__wc) { S.__wc.arming = false; S.__wc.sub = null; S.__wc.searching = false; } 
    
    var same = function (a, b) { return !!(a && b && a.cid === b.cid && a.year === b.year); };
    if (S.__wc && same(S.__wc.revealSpin, S.currentSpin)) S.__wc.revealSpin = S.currentSpin;
    if (S.__wc && same(S.__wc.qSpin, S.currentSpin)) S.__wc.qSpin = S.currentSpin;
    delete S.__taken;
    S.pendingPlayer = null;
    if (typeof selectMode === 'function') selectMode(S.gameMode); 
    STATE = S;
    armed = true;
    try { var mine = Object.assign({}, d, { tab: TAB, at: Date.now() }); delete mine.key; localStorage.setItem(key(S.gameMode), JSON.stringify(mine)); if (d.key && d.key !== key(S.gameMode)) dropKey(d.key); } catch (e) {   } 
    track('draft_resume', { mode: S.gameMode, picks: picks(S) });
    if (S.gameMode === 'pack') {
      if ((S.packPlayers || []).length) { showScreen('pack-squad'); renderPackSquad(); }
      else { showScreen('pack-opening'); renderPackIntro(); }
      return;
    }
    if (picks(S) === 13) { showScreen('draft'); renderField(); showSquadComplete(); return; } 
    try { _cachedFieldSize = null; } catch (e) {   }
    showScreen('draft');
    renderField();
    requestAnimationFrame(function () { try { _cachedFieldSize = null; } catch (e) {   } renderField(); });
    var sp = S.currentSpin, btn = document.getElementById('spinBtn');
    if (sp && sp.players) displaySpin(sp.cid, sp.year, sp.players);
    else {
      var c = document.getElementById('spinClubVal'), y = document.getElementById('spinYearVal'), sec = document.getElementById('playerSection');
      if (c) c.textContent = '-';
      if (y) y.textContent = '-';
      if (sec) sec.innerHTML = '';
      if (typeof _resetClubColor === 'function') _resetClubColor();
    }
    
    if (btn) { btn.textContent = '🎰 SPIN'; btn.disabled = !!(sp && sp.players && sp.players.length && !S.spinPickedThisSpin); }
    updateRerollBtn();
    if (window.cpWildRender) window.cpWildRender(true);
  }

  
  var modal = null, shown = null; 
  function ask(d) {
    if (screen() !== 'setup' || document.documentElement.classList.contains('ca-open') || document.querySelector('.cp-confirm[style*="flex"]')) { setTimeout(function () { ask(d); }, 1500); return; }
    var now = saved(d.mode);
    if (!now || now.at !== d.at || who() !== d.who) return;
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'cpResumeModal';
      modal.className = 'cp-confirm';
      modal.addEventListener('click', function (e) {
        var b = e.target.closest('[data-rs]');
        if (!b) return;
        var a = b.getAttribute('data-rs'), cur = shown ? saved(shown.mode) : saved();
        modal.style.display = 'none';
        if (a === 'go' && cur) resume(cur);
        if (a === 'fresh') { track('draft_resume_skip', { mode: cur ? cur.mode : '' }); if (cur) dropKey(cur.key); }
      });
      document.body.appendChild(modal);
    }
    shown = d;
    var name = MODES[d.mode], done = d.mode === 'pack' ? 'Your Pack run' : 'Your ' + name + ' team has ' + d.picks + ' of 13 picked';
    modal.innerHTML = '<div class="cp-confirm-backdrop"></div>' +
      '<div class="cp-confirm-body" role="dialog" aria-modal="true" aria-labelledby="cpResumeTitle">' +
        '<div class="cp-confirm-grab" aria-hidden="true"></div>' +
        '<div class="cp-confirm-ico" aria-hidden="true">&#x1F3C9;</div>' +
        '<div class="cp-confirm-kicker">Your Draft Is Saved</div>' +
        '<h2 class="cp-confirm-title" id="cpResumeTitle">Pick Up Where You Left Off?</h2>' +
        '<p class="cp-confirm-sub">' + done + ', with everything you used still in it.</p>' +
        '<button type="button" class="cp-btn cp-btn-primary" data-rs="go">Continue My Draft</button>' +
        '<button type="button" class="cp-btn cp-btn-ghost" data-rs="fresh">Start Fresh</button>' +
      '</div>';
    modal.style.display = 'flex';
    track('draft_resume_offer', { mode: d.mode, picks: d.picks });
  }
  function boot() {
    var d = saved();
    
    if (!d || window.CG_MODE || /[?&](vs|play|ch|challenge)=/.test(location.search) || /#(challenge|cast-profile|leaderboards|cast-pass)/.test(location.hash)) return;
    var signedBefore = false; 
    try { signedBefore = localStorage.getItem('cast_signed_in') === '1'; } catch (e) {   }
    if (who() === d.who && !(d.who === 'guest' && signedBefore)) { setTimeout(function () { ask(d); }, 900); return; }
    var on = function (e) {
      var st = e.detail && e.detail.status;
      if (st !== 'signed-in' && st !== 'guest') return;
      window.removeEventListener('cast-account', on);
      if (who() === d.who) setTimeout(function () { ask(d); }, 900);
    };
    window.addEventListener('cast-account', on);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  

  function resumeFor(m, fresh) {
    var d = MODES[m] ? saved(m) : null;
    if (!d) { fresh(); return; }
    var done = false, decide = function () {
      if (done) return;
      done = true;
      var now = saved(m);
      if (now && who() === now.who) resume(now); else fresh();
    };
    var signedBefore = false; 
    try { signedBefore = localStorage.getItem('cast_signed_in') === '1'; } catch (e) {   }
    if (who() === d.who && !(d.who === 'guest' && signedBefore)) { decide(); return; }
    var on = function (e) {
      var st = e.detail && e.detail.status;
      if (st !== 'signed-in' && st !== 'guest') return;
      window.removeEventListener('cast-account', on);
      decide();
    };
    window.addEventListener('cast-account', on);
    setTimeout(decide, 6000);
  }
  window.cpDraftSave = { keep: keep, saved: saved, drop: drop, resumeFor: resumeFor }; 
})();
