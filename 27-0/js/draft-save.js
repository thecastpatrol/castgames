/* Save the draft in progress (9 Oct 2026, the owner, after two paying players lost a team to a page reload the same
   night): 27-0 Classic, Hard and Pack keep the season being drafted on this phone at every step, so a refresh, a flat
   battery or a trip to the checkout and back offers it again. Spins come from the season's seed (STATE.__seed and
   STATE.__k, js/theme-fx.js) and a Pack run's packs are dealt before they open, so bringing it back deals nothing new.
   Kept until the season kicks off (its results are drawn then, so a finished draw is never offered again), a new season
   starts, the player leaves it for the home screen, or a day passes; never offered to a different account. Not the
   Daily (its goes are its own), Quick Draft or the World Cup (js/world-cup.js has its own Resume).
   Loaded last, after every script that wraps the draft. */
(function () {
  'use strict';
  var LS = '270_draft_v1', MS = 24 * 3600000;
  /* One saved draft per mode (17 Oct 2026, the owner: on CAST Games every mode is its own game, each with its own
     Continue). Classic keeps the first key, Hard and Pack add their name to it; a draft kept under the first key before
     then is still found by its mode */
  function key(m) { return !m || m === 'classic' ? LS : LS + '_' + m; }
  function modeNow() { return typeof STATE !== 'undefined' && STATE && STATE.gameMode ? STATE.gameMode : 'classic'; }
  function isKey(k) { return k === LS || (!!k && k.indexOf(LS + '_') === 0); }
  var MODES = { classic: 'Classic', hard: 'Hard', pack: 'Pack' };
  var SCREENS = { draft: 1, 'squad-complete': 1, 'pack-opening': 1, 'pack-squad': 1 };
  var armed = false; // a draft has been played (or brought back) on this page, so leaving it for home drops it

  function track(name, p) { try { if (typeof gtag === 'function') gtag('event', name, p || {}); } catch (e) { /* analytics only */ } }
  function who() { return (window.CastAccount && CastAccount.uid && CastAccount.uid()) || 'guest'; }
  function daily() { return !!(window.CastDaily && CastDaily.isActive && CastDaily.isActive()); }
  function screen() { var s = document.querySelector('.screen.active'); return s ? s.id : ''; }
  function picks(S) { return (S.team || []).filter(Boolean).length; }

  // Not a friend's challenge (STATE.__ch: its answer is only recorded in the tab it started in)
  function eligible() {
    if (typeof STATE === 'undefined' || !STATE || !MODES[STATE.gameMode] || daily() || STATE.__qd || STATE.__ch || STATE.season) return false;
    if (!SCREENS[screen()]) return false;
    if (STATE.gameMode === 'pack') return (STATE.packPlayers || []).length > 0 || (!STATE.isGodPack && STATE.packIdx > 0);
    // a pick made, or anything used before the first one (a key, a reroll, a second spin)
    return picks(STATE) > 0 || !!(STATE.__keyUsed || STATE.__superNext || STATE.__rrN || STATE.rerollUsed) || (STATE.__k || 0) > 1;
  }
  // Each page is its own tab: a draft carried on in another tab ends here (no peeking at the next spin in a copy)
  var TAB = Math.random().toString(36).slice(2, 10);
  function raw(m) { try { return JSON.parse(localStorage.getItem(key(m)) || 'null'); } catch (e) { return null; } }
  function taken() {
    armed = false;
    if (typeof STATE !== 'undefined' && STATE) STATE.__taken = true;
    var msg = 'This draft carried on in another tab.';
    var t = document.createElement('div'); t.className = 'wc-toast'; t.setAttribute('role', 'alert'); t.textContent = msg; // World Cup's toast look
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
    if (cur && cur.id === STATE.__draftId && cur.who !== 'guest' && cur.who !== me) { drop(); return; } // signed out (or someone else): never handed on
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
    } catch (e) { /* storage full or blocked: no resume */ }
  }
  // m: a mode, or the season being drafted now (the wrapped calls below)
  function drop(m) { try { localStorage.removeItem(key(typeof m === 'string' ? m : modeNow())); } catch (e) { /* storage blocked */ } }
  function dropKey(k) { try { if (k) localStorage.removeItem(k); } catch (e) { /* storage blocked */ } }
  // The saved draft for a mode (or, with no mode, the newest of them), each checked and the stale ones cleared
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

  // Saved after every tap, after each spin lands and each pack opens, and when the page is hidden (a phone switching
  // apps, or going to the checkout), which is the moment before it may be reloaded
  function soon() { setTimeout(keep, 0); }
  document.addEventListener('click', soon, true);
  document.addEventListener('touchend', soon, true);
  document.addEventListener('visibilitychange', function () { if (document.hidden) keep(); });
  window.addEventListener('pagehide', keep);
  function wrap(name, before, afterFn) {
    var orig = window[name];
    if (typeof orig !== 'function') return;
    window[name] = function () {
      if (before) try { before(); } catch (e) { /* the game goes on */ }
      var out = orig.apply(this, arguments);
      if (afterFn) try { afterFn(); } catch (e) { /* the game goes on */ }
      return out;
    };
  }
  ['finalSpin', 'placePlayer', 'useReroll', 'nextPack', 'finishPackOpening', 'revealPackCards', 'packAssignPlayer', 'packAutoAssignPlayer', 'packRemovePlayer', 'packResetTeam', 'packAutoBuild'].forEach(function (n) { wrap(n, null, keep); });
  // A season kicking off, or a new one starting, ends the saved draft
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
    if (S.__wc) { S.__wc.arming = false; S.__wc.sub = null; S.__wc.searching = false; } // nothing half-tapped
    // Reveal and search remember the spin by identity (js/daily-wild.js): point them at the spin brought back
    var same = function (a, b) { return !!(a && b && a.cid === b.cid && a.year === b.year); };
    if (S.__wc && same(S.__wc.revealSpin, S.currentSpin)) S.__wc.revealSpin = S.currentSpin;
    if (S.__wc && same(S.__wc.qSpin, S.currentSpin)) S.__wc.qSpin = S.currentSpin;
    delete S.__taken;
    S.pendingPlayer = null;
    if (typeof selectMode === 'function') selectMode(S.gameMode); // Hard's flag and look (js/hard-mode.js), Pack's set-up
    STATE = S;
    armed = true;
    try { var mine = Object.assign({}, d, { tab: TAB, at: Date.now() }); delete mine.key; localStorage.setItem(key(S.gameMode), JSON.stringify(mine)); if (d.key && d.key !== key(S.gameMode)) dropKey(d.key); } catch (e) { /* storage blocked */ } // this tab owns it now
    track('draft_resume', { mode: S.gameMode, picks: picks(S) });
    if (S.gameMode === 'pack') {
      if ((S.packPlayers || []).length) { showScreen('pack-squad'); renderPackSquad(); }
      else { showScreen('pack-opening'); renderPackIntro(); }
      return;
    }
    if (picks(S) === 13) { showScreen('draft'); renderField(); showSquadComplete(); return; } // the draft behind it, so a Remove or lock-in decision has a screen
    try { _cachedFieldSize = null; } catch (e) { /* older page */ }
    showScreen('draft');
    renderField();
    requestAnimationFrame(function () { try { _cachedFieldSize = null; } catch (e) { /* older page */ } renderField(); });
    var sp = S.currentSpin, btn = document.getElementById('spinBtn');
    if (sp && sp.players) displaySpin(sp.cid, sp.year, sp.players);
    else {
      var c = document.getElementById('spinClubVal'), y = document.getElementById('spinYearVal'), sec = document.getElementById('playerSection');
      if (c) c.textContent = '-';
      if (y) y.textContent = '-';
      if (sec) sec.innerHTML = '';
      if (typeof _resetClubColor === 'function') _resetClubColor();
    }
    // Spin again only once this spin's player is in (the same rule as the draft itself)
    if (btn) { btn.textContent = '🎰 SPIN'; btn.disabled = !!(sp && sp.players && sp.players.length && !S.spinPickedThisSpin); }
    updateRerollBtn();
    if (window.cpWildRender) window.cpWildRender(true);
  }

  // On load: the pop-up, once we know who is signed in and nothing else is on screen
  var modal = null, shown = null; // shown: the draft the pop-up offers
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
    // a CAST Games page for one mode (window.CG_MODE) brings its own draft back without asking (js/theme-fx.js bootPlay)
    if (!d || window.CG_MODE || /[?&](vs|play|ch|challenge)=/.test(location.search) || /#(challenge|cast-profile|leaderboards|cast-pass)/.test(location.hash)) return;
    var signedBefore = false; // a returning player's sign-in may still be loading: a guest's save waits until we know
    try { signedBefore = localStorage.getItem('cast_signed_in') === '1'; } catch (e) { /* storage blocked */ }
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
  /* Opened straight on a mode (js/theme-fx.js bootPlay, 17 Oct 2026): this player's saved draft for that mode carries on
     (true), once we know who is signed in; else fresh() starts a new one */
  function resumeFor(m, fresh) {
    var d = MODES[m] ? saved(m) : null;
    if (!d) { fresh(); return; }
    var done = false, decide = function () {
      if (done) return;
      done = true;
      var now = saved(m);
      if (now && who() === now.who) resume(now); else fresh();
    };
    var signedBefore = false; // a returning player's sign-in may still be loading: a guest's save waits until we know
    try { signedBefore = localStorage.getItem('cast_signed_in') === '1'; } catch (e) { /* storage blocked */ }
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
  window.cpDraftSave = { keep: keep, saved: saved, drop: drop, resumeFor: resumeFor }; // resumeFor: js/theme-fx.js; the rest for the checks
})();
