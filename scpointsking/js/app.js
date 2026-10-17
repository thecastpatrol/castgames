 
(function (T) {
  'use strict';

  var R = T.render;
  var $ = function (id) { return document.getElementById(id); };
  var GAME = 'sc'; 
  var selectedMode = 'plus';
  var busy = false;          
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

   

  function show(name) {
    if (bootOn()) bootEnd(); 
    ['home', 'draft', 'results'].forEach(function (n) {
      var el = $('screen-' + n);
      if (el) el.classList.toggle('is-active', n === name);
    });
    document.body.setAttribute('data-screen', name);
    if (name === 'home') document.body.removeAttribute('data-mode'); else document.body.setAttribute('data-mode', selectedMode);
    
    Array.prototype.forEach.call(document.querySelectorAll('.footer-links a[href$=".html"]'), function (a) {
      if (name === 'draft') { a.target = '_blank'; a.rel = 'noopener'; } else { a.removeAttribute('target'); }
    });
    window.scrollTo(0, 0);
  }

  function fallback(img) {
    var cls = img.getAttribute('data-fallback');
    if (!cls) return;
    img.hidden = true;
    var alt = img.parentNode.querySelector('.' + cls);
    if (alt) alt.hidden = false;
  }
  document.addEventListener('error', function (e) { if (e.target && e.target.tagName === 'IMG') fallback(e.target); }, true);
  function checkImages(root) {
    Array.prototype.forEach.call((root || document).querySelectorAll('img[data-fallback]'), function (img) {
      if (img.complete && img.naturalWidth === 0) fallback(img);
    });
  }

   

  var sound = true;
  var ctx = null;
  try { sound = localStorage.getItem('sc_sound_v1') !== 'off'; } catch (e) {   }
  function setSound(on) {
    sound = on;
    var b = $('soundToggle');
    b.setAttribute('aria-pressed', String(on));
    b.setAttribute('aria-label', on ? 'Sound on' : 'Sound off');
    b.classList.toggle('is-on', on);
    var l = b.querySelector('.sound-lbl');
    if (l) l.textContent = on ? 'Sound On' : 'Sound Off';
    try { localStorage.setItem('sc_sound_v1', on ? 'on' : 'off'); } catch (e) {   }
  }
  
  var AC = window.AudioContext || window.webkitAudioContext;
  var master = null;
  function audioReady() {
    if (!AC) return null;
    if (!ctx) { ctx = new AC(); master = ctx.createGain(); master.gain.value = 1; master.connect(ctx.destination); }
    if (ctx.state !== 'running' && ctx.resume) ctx.resume().catch(function () {});
    return ctx;
  }
  var unlocked = false;
  function useMediaChannel() { try { if (navigator.audioSession) navigator.audioSession.type = 'ambient'; } catch (e) {   } }
  function unlockAudio() {
    if (!sound || !AC) return;
    try {
      if (!unlocked) useMediaChannel();
      var c = audioReady(), buf = c.createBuffer(1, 1, 22050), src = c.createBufferSource();
      src.buffer = buf; src.connect(c.destination); src.start(0);
      if (c.state === 'running') unlocked = true;
    } catch (e) {   }
  }
  ['touchend', 'click', 'keydown'].forEach(function (ev) { document.addEventListener(ev, unlockAudio, true); });
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && ctx && ctx.state !== 'running' && ctx.resume) ctx.resume().catch(function () {});
  });
  function tone(freq, dur, type, when, vol) {
    if (!sound || !ctx) return;
    try {
      if (ctx.state !== 'running' && ctx.resume) ctx.resume().catch(function () {});
      var t0 = ctx.currentTime + 0.01 + (when || 0), o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(freq, t0);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol || 0.25, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g); g.connect(master);
      o.start(t0); o.stop(t0 + dur + 0.03);
    } catch (e) {   }
  }
  var sfx = {
    tick: function () { tone(1200, 0.035, 'square', 0, 0.06); },
    land: function () { tone(880, 0.06, 'triangle', 0, 0.22); },
    pick: function () { tone(523, 0.1, 'triangle', 0, 0.35); tone(784, 0.16, 'triangle', 0.08, 0.35); },
    win: function () { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, 0.28, 'triangle', i * 0.12, 0.35); }); },
    done: function () { tone(392, 0.2, 'triangle', 0, 0.3); tone(523, 0.3, 'triangle', 0.15, 0.3); },
    wild: function () { tone(660, 0.12, 'sine', 0, 0.35); tone(990, 0.16, 'sine', 0.07, 0.35); }
  };

   

  var toastTimer = null;
  function toast(msg) {
    var el = $('toast');
    el.textContent = msg;
    el.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('is-on'); }, 2600);
  }
  function lockScroll(on) { document.body.classList.toggle('is-locked', !!on); }
  function openSheet(html) {
    $('sheetBody').innerHTML = html;
    $('sheet').hidden = false;
    lockScroll(true);
    var first = $('sheetBody').querySelector('button');
    if (first) first.focus();
  }
  function closeSheet() { $('sheet').hidden = true; $('sheet').classList.remove('is-rules', 'is-confirm'); $('sheetBody').innerHTML = ''; lockScroll(false); }

   

  function signedIn() { return !!(window.CastAccount && CastAccount.isSignedIn && CastAccount.isSignedIn()); }
  function firstVisit() {
    try {
      if (localStorage.getItem('sc_played')) return false;
      if (localStorage.getItem('cast_signed_in') === '1' || signedIn()) return false;
      var g = JSON.parse(localStorage.getItem('cast_games_v1') || '[]');
      return !(Array.isArray(g) && g.some(function (x) { return x && x.game === GAME; }));
    } catch (e) { return false; }
  }
  T.firstVisit = firstVisit;
  var modesMark = null, modesUp = false;
  function placeModes(first) {
    var fs = $('firstSteps'), block = [$('modeKicker'), $('modePicker'), $('startBtn'), $('packNote')];
    if (!fs || !block.every(Boolean) || first === modesUp) return;
    if (!modesMark) { modesMark = document.createComment(' the modes, after a first game '); block[0].parentNode.insertBefore(modesMark, block[0]); }
    var ref = first ? fs.nextSibling : modesMark;
    block.forEach(function (el) { ref.parentNode.insertBefore(el, ref); });
    modesUp = first;
  }
  function renderHome() {
    var first = firstVisit(), fs = $('firstSteps');
    $('modePicker').innerHTML = R.modePicker(selectedMode);
    if (fs) fs.hidden = !first;
    placeModes(first);
    if (window.CastAccount && CastAccount.spot) CastAccount.spot();
  }

   

  function countUp(el, from, to, dur) {
    if (!el) return;
    if (reduceMotion || from === to) { el.textContent = T.fmt(to); return; }
    var start = null;
    dur = dur || 650;
    function step(ts) {
      if (!start) start = ts;
      var k = Math.min(1, (ts - start) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = T.fmt(Math.round(from + (to - from) * e));
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  var shownTotal = 0; 
  function renderChrome(flashIdx) {
    var S = T.state(), total = T.total();
    $('scoreboard').innerHTML = R.scoreboard(S);
    countUp($('sbTotal'), shownTotal, total);
    shownTotal = total;
    $('pitch').innerHTML = R.pitch(S, flashIdx);
    fitNames();
    $('pitch').classList.toggle('is-tweaking', !!S.tweakMode);
    $('pickCount').textContent = T.filledCount() + ' of ' + T.SLOTS.length;
  }

  
  
  function fitNames() {
    Array.prototype.forEach.call(document.querySelectorAll('#pitch .slot-name'), function (el) {
      el.style.fontSize = ''; el.style.letterSpacing = ''; el.style.whiteSpace = ''; el.style.lineHeight = '';
      var room = el.clientWidth;
      if (!room || el.scrollWidth <= room) return;
      var size = parseFloat(getComputedStyle(el).fontSize);
      size = Math.max(6, Math.floor(size * room / el.scrollWidth * 10) / 10);
      el.style.fontSize = size + 'px';
      if (size < 8.5) el.style.letterSpacing = '-.2px';
      while (el.scrollWidth > room && size > 6) { size -= .25; el.style.fontSize = size + 'px'; }
      if (size < 8.5 && el.textContent.indexOf('-') > 0) {
        el.style.whiteSpace = 'normal'; el.style.lineHeight = '1.1'; el.style.letterSpacing = '';
        size = 11; el.style.fontSize = size + 'px';
        while (el.scrollWidth > el.clientWidth && size > 6) { size -= .25; el.style.fontSize = size + 'px'; }
      }
      while (el.scrollWidth > el.clientWidth && size > 5) { size -= .25; el.style.fontSize = size + 'px'; }
    });
  }
  var fitTimer = null;
  window.addEventListener('resize', function () { clearTimeout(fitTimer); fitTimer = setTimeout(fitNames, 120); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitNames);

  
  
  T.LOCK_SECS = 10;
  var lockTimer = null, lockLeft = null, resumeLock = null;
  function stopLockTimer() { if (lockTimer) { clearInterval(lockTimer); lockTimer = null; } }
  function startLockTimer(S, then) {
    stopLockTimer();
    var left = resumeLock != null ? Math.max(1, resumeLock) : T.LOCK_SECS;
    resumeLock = null; lockLeft = left;
    function paint() {
      var f = document.querySelector('#offerPanel .lock-fill');
      if (f) f.style.transform = 'scaleX(' + Math.max(left - 1, 0) / T.LOCK_SECS + ')';
    }
    requestAnimationFrame(function () { requestAnimationFrame(paint); });
    lockTimer = setInterval(function () {
      if (T.state() !== S || S.tweakMode || S.finished || document.documentElement.classList.contains('ca-open')) { if (T.state() !== S || S.finished) stopLockTimer(); return; }
      left--; lockLeft = left;
      var el = document.querySelector('#offerPanel .lock-secs');
      if (el) el.textContent = Math.max(left, 0);
      paint();
      if (left <= 0) { stopLockTimer(); then(); }
    }, 1000);
  }

  









  T.PICK_SECS = 20;
  T.CLOCK_MODES = ['plus', 'daily'];
  T.clockMode = function (S) { return !!S && !!S.mode && T.CLOCK_MODES.indexOf(S.mode.id) >= 0 && S.mode.source === 'roll' && !S.qd; };
  T.pickSecs = function () { return T.PICK_SECS; };
  var clock = { offer: null, end: 0, last: 0, iv: null }, resumeClock = null; 
  function clockOn(S) { return T.clockMode(S) && !S.finished && !S.fullTime && !S.awaitingLock && !!S.offer && S.offer.players.length > 0 && document.body.getAttribute('data-screen') === 'draft'; }
  
  function popUpOpen() {
    var sh = $('sheet');
    if (sh && !sh.hidden && !$('sheetBody').querySelector('[data-place]')) return true;
    if (document.documentElement.classList.contains('ca-open') || document.querySelector('.pack-intro')) return true;
    return Array.prototype.some.call(document.querySelectorAll('[role="dialog"], [aria-modal="true"]'), function (d) {
      return d.id !== 'sheetBody' && !d.hidden && d.getClientRects().length > 0;
    });
  }
  
  function clockPaused(S) { return !!(S.tweakMode || S.subMode) || popUpOpen(); }
  function clockHeld(S) { return busy || !!document.querySelector('.wc-burst, .cg') || clockPaused(S); } 
  function clockStart() {
    if (!clockOn(T.state())) { clockCover(false); return; }
    if (!clock.iv) { clock.last = Date.now(); clock.iv = setInterval(clockTick, 200); }
    clockTick(); 
  }
  function clockStop() { if (clock.iv) { clearInterval(clock.iv); clock.iv = null; } }
  function clockCover(on) { var p = $('offerPanel'); if (p) p.classList.toggle('is-clock-paused', !!on); }
  
  T.clockView = function (S) {
    var secs = T.pickSecs(S), left = clock.offer === S.offer && clock.iv ? Math.max(0, clock.end - Date.now()) : secs * 1000;
    return { secs: secs, left: left, paused: clock.offer === S.offer && clockPaused(S) };
  };
  function clockTick() {
    var S = T.state(), now = Date.now();
    if (!clockOn(S)) { clockStop(); clock.offer = null; clockCover(false); return; }
    var secs = T.pickSecs(S);
    if (clock.offer !== S.offer) { clock.offer = S.offer; clock.end = now + (resumeClock != null ? Math.max(0, resumeClock) : secs * 1000); resumeClock = null; } 
    else if (clockHeld(S)) clock.end += now - clock.last; 
    clock.last = now;
    var left = Math.max(0, clock.end - now), paused = clockPaused(S), el = document.querySelector('#offerPanel [data-pick-clock]');
    clockCover(paused);
    if (el) {
      var bar = el.querySelector('i'), num = el.querySelector('b');
      if (bar) bar.style.width = Math.min(100, left / (secs * 10)).toFixed(1) + '%';
      if (num) num.textContent = Math.ceil(left / 1000) + 's';
      el.classList.toggle('is-low', left <= 5000 && !paused);
      el.classList.toggle('is-paused', paused);
    }
    if (left <= 0 && !clockHeld(S) && !document.hidden) timeUp(S); 
  }
  
  document.addEventListener('visibilitychange', function () { if (!document.hidden && clock.iv) clockTick(); });
  window.addEventListener('pageshow', function () { if (clock.iv) clockTick(); });
  function timeUp(S) {
    clockStop(); clock.offer = null; clockCover(false);
    if (S.offer && S.offer.paid && !S.offer.taken) T.keepOffer(); 
    var list = S.offer ? S.offer.players.filter(function (p) { return !S.used[p.id] && T.openCodesFor(p).length > 0; }) : [];
    var chooser = $('sheet') && !$('sheet').hidden && $('sheetBody').querySelector('[data-place]');
    var tapped = placingId || (chooser && $('sheetBody').getAttribute('data-player')) || null;
    var p = tapped && T.byId[tapped] && list.indexOf(T.byId[tapped]) >= 0 ? T.byId[tapped] : list[0];
    closeSheet(); setPlacing(null);
    if (!p) { nextOffer(); return; } 
    T.track('pick_timeout', { mode: S.mode.name, picks: S.picks, tapped: tapped ? 'yes' : 'no' });
    toast('\u23F1\uFE0F Time\u2019s up: ' + p.name + ' ' + p.year + ' goes in');
    place(p.id, T.openCodesFor(p)[0]);
  }

   
  var offerTop = null, offerKey = '', offerMovedAt = 0;
  function noteOffers() {
    var c = document.querySelector('#offerPanel [data-pick], #offerPanel [data-scout]');
    if (!c) { offerTop = null; offerKey = ''; return; }
    var key = Array.prototype.map.call(document.querySelectorAll('#offerPanel .pcard'), function (x) { return x.getAttribute('data-pick') || x.getAttribute('data-scout'); }).join(','),
      top = c.getBoundingClientRect().top + (window.scrollY || 0);
    if (key === offerKey && offerTop !== null && Math.abs(top - offerTop) > 8) offerMovedAt = Date.now();
    offerTop = top; offerKey = key;
  }
  function renderDraft(flashIdx) {
    try { return renderDraft0(flashIdx); } finally { noteOffers(); }
  }
  function renderDraft0(flashIdx) {
    var S = T.state();
    renderChrome(flashIdx);
    var panel = $('offerPanel');
    if (S.fullTime) { if (S.capStep) renderCaptainPanel(S); return; }
    if (S.awaitingLock && !S.tweakMode && !S.lockHold) startLockTimer(S, function () { T.track('lock_in_auto', { mode: S.mode.name }); lockIn(S); }); else stopLockTimer();
    if (S.awaitingLock) panel.innerHTML = R.decision(S);
    else if (S.offer) panel.innerHTML = R.offerRoll(S);
    else if (S.tweakMode) panel.innerHTML = R.removeMode(S);
    applyPlacing();
    clockStart(); 
    keepDraft();
  }

   
  var desktopMQ = window.matchMedia ? window.matchMedia('(min-width: 900px)') : null;
  function isDesktop() { return !!(desktopMQ && desktopMQ.matches); }
  var placingId = null;
  function setPlacing(id) { placingId = id; applyPlacing(); }
  function markSlots(id, cls) {
    var pitch = $('pitch');
    if (!pitch) return;
    Array.prototype.forEach.call(pitch.querySelectorAll('.' + cls), function (el) { el.classList.remove(cls); });
    var p = id && T.byId[id];
    if (!p) return;
    var codes = T.openCodesFor(p);
    Array.prototype.forEach.call(pitch.querySelectorAll('.slot.is-empty'), function (el) {
      if (codes.indexOf(T.state().slots[+el.getAttribute('data-slot')].code) !== -1) el.classList.add(cls);
    });
  }
  function applyPlacing() {
    var S = T.state();
    if (placingId && (!S || !S.offer || T.taken(T.byId[placingId]) || !S.offer.players.some(function (p) { return p.id === placingId; }))) placingId = null;
    markSlots(placingId, 'is-target');
    $('pitch').classList.toggle('is-placing', !!placingId);
    Array.prototype.forEach.call(document.querySelectorAll('#offerPanel [data-pick]'), function (el) {
      el.classList.toggle('is-selected', el.getAttribute('data-pick') === placingId);
    });
    var hint = $('pickCount');
    if (placingId) hint.innerHTML = '<span class="place-hint">Click a glowing spot</span>';
    else if (S) hint.textContent = T.filledCount() + ' of ' + T.SLOTS.length;
  }
  document.addEventListener('mouseover', function (e) {
    if (!isDesktop() || placingId) return;
    var c = e.target.closest && e.target.closest('#offerPanel [data-pick]');
    var S = T.state();
    if (!S || S.tweakMode || busy) return;
    markSlots(c ? c.getAttribute('data-pick') : null, 'is-preview');
  });

  
  T.play = function (modeId, opts) { closeSheet(); busy = false; startGame(modeId, opts); };
  function newGame(modeId) {
    if (modeId === 'daily') { if (T.dailyStart) T.dailyStart(); return; }
    if (window.CastAccount && CastAccount.guestGate && !CastAccount.guestGate(function () { newGame(modeId); }, modeId)) return;
    closeSheet();
    busy = false;
    startGame(modeId);
  }
  T.showScreen = show;
  function goHome() {
    if (window.CG && window.CG.leave) { closeSheet(); busy = false; stopLockTimer(); window.CG.leave(); return; } 
    closeSheet();
    busy = false;
    stopLockTimer();
    renderHome();
    show('home');
  }

  function startGame(modeId, opts) {
    if (modeId !== 'daily') selectedMode = modeId;
    dropDraft();
    stopLockTimer();
    T.newGame(modeId, opts);
    
    var NS = T.state(), tierW = window.CastAccount && CastAccount.wildcardCount ? CastAccount.wildcardCount() : null;
    var extra = window.CastAccount && CastAccount.profileRerolls ? CastAccount.profileRerolls() : 0;
    if (NS.mode.wildcards && tierW !== null) setTierWildcards(NS, tierW);
    else if (NS.mode.wildcards && extra) { NS.wildcards.reroll += extra; NS.profileRerolls = extra; }
    NS.subLeft = NS.mode.wildcards && window.CastAccount && CastAccount.hasPass && CastAccount.hasPass() ? 1 : 0; 
    placingId = null;
    shownTotal = 0;
    busy = false;
    T.track(T.MODES[modeId].event, { mode: T.MODES[modeId].name });
    show('draft');
    nextOffer();
  }

  function nextOffer() {
    var S = T.state();
    if (S.finished) return;
    if (T.filledCount() === S.slots.length) { settle(); return; }
    var offer = T.rollOffer();
    if (offer && offer.special) packIntro(renderDraft); else spinIn(offer);
  }

  


  var spinTimer = null;
  function spinIn(offer, then) {
    var S = T.state();
    if (reduceMotion || !offer || !offer.players.length) { renderDraft(); if (then) then(); return; }
    busy = true;
    renderChrome();
    $('offerPanel').innerHTML = R.spinning(S);
    var reels = Array.prototype.slice.call(document.querySelectorAll('#offerPanel .spin-reel'));
    var clubs = Object.keys(T.CLUBS), frames = [9, 13, 17], n = 0;
    var done = false;
    function face(el, club, year, land) {
      var c = T.club(club);
      el.setAttribute('style', R.clubVars(club));
      el.querySelector('.kit-slot').innerHTML = R.kit(club, 120, 90);
      el.querySelector('.sr-club').textContent = c.nick;
      el.querySelector('.sr-year').textContent = year;
      if (land) el.classList.add('is-landed');
    }
    function finish() {
      if (done) return;
      done = true;
      clearInterval(spinTimer); spinTimer = null;
      if (T.state() !== S) return;
      busy = false;
      renderDraft();
      var cards = document.querySelector('#offerPanel .offer-cards');
      if (cards) cards.classList.add('is-spun');
      if (then) then();
    }
    $('offerPanel').querySelector('.spin-reels').addEventListener('click', finish);
    spinTimer = setInterval(function () {
      if (T.state() !== S) { clearInterval(spinTimer); return; }
      n++;
      reels.forEach(function (el, i) {
        if (el.classList.contains('is-landed')) return;
        var p = offer.players[i];
        if (n >= frames[i] && p) { face(el, p.club, p.year, true); sfx.land(); return; }
        face(el, clubs[Math.floor(Math.random() * clubs.length)], T.FIRST_YEAR + Math.floor(Math.random() * (T.LAST_YEAR - T.FIRST_YEAR + 1)), false);
      });
      if (n % 2) sfx.tick();
      if (n >= frames[2] + 3) finish();
    }, 55);
  }

  

  function packIntro(done) {
    var S0 = T.state();
    T.track('legends_pick_shown', { mode: S0.mode.name, paid: 'yes' });
    var CI = window.CastIntl, three = S0 && S0.offer ? S0.offer.players.slice(0, 3) : [];
    if (reduceMotion || !CI || !CI.reveal || !three.length) { done(); return; }
    var sides = {}, side = function (k) {
      if (!k || sides[k]) return;
      var c = T.club(k), K = window.CastKits, fb = { base: c.primary, accent: c.accent || c.secondary };
      sides[k] = { name: c.name, short: c.nick, code: c.abbr, c1: c.primary, c2: c.accent || c.secondary, glow: c.primary, pattern: 'plain', colors: [c.accent || c.secondary],
        draw: K && K.drawFill ? function (w, h) { return K.drawFill('nrl', k, { w: w, h: h, fallback: fb }); } : null, fill: true };
    };
    var pool = Object.keys(T.CLUBS);
    pool.forEach(side);
    var reels = three.map(function (p) { return { nation: p.club, name: p.name, sub: p.year + ' · ' + T.positionsOf(p).map(T.posLabel).join('/') }; });
    busy = true;
    sfx.win();
    try {
      CI.reveal({ reels: reels, sides: sides, pool: pool, kicker: 'Legend Key', title: 'Three Legend Seasons', tone: 'bronze', done: function () { busy = false; done(); } });
    } catch (e) { busy = false; done(); }
  }

  function onPick(id) {
    var S = T.state();
    if (busy || S.finished || S.tweakMode || S.fullTime) return;
    if (Date.now() - offerMovedAt < 700) { T.track('pick_after_shift', { mode: S.mode.id }); return; }
    var p = T.byId[id];
    if (!p) return;
    var codes = T.openCodesFor(p);
    if (codes.length > 1 && isDesktop()) {
      setPlacing(placingId === id ? null : id);
      if (placingId) sfx.tick();
      return;
    }
    if (codes.length > 1) {
      openSheet(R.slotChooser(p, codes));
      $('sheetBody').setAttribute('data-player', id);
      return;
    }
    place(id, codes[0]);
  }

  
  function onScout() {
    var S = T.state();
    if (busy || !S) return;
    if (!T.useScout()) return;
    sfx.wild();
    T.track('wildcard_used', { wildcard: 'scout', mode: S.mode.name });
    wildcardBurst('scout', 'scout');
    renderDraft();
    markUsed('scout');
    Array.prototype.forEach.call(document.querySelectorAll('#offerPanel .tries-badge.is-revealed'), function (badge) { countBadge(badge); });
  }

  function place(id, code, slotIdx) {
    var S = T.state(), p = T.byId[id];
    var src = S.offer && S.offer.goat ? 'G' : S.offer && S.offer.key ? 'K' : '';
    var idx = T.pick(id, code, slotIdx);
    if (idx == null) return;
    S.srcOf = S.srcOf || {};
    if (src) S.srcOf[p.id] = src; else delete S.srcOf[p.id];
    placingId = null;
    closeSheet();
    sfx.pick();
    busy = true;
    $('offerPanel').innerHTML = R.reveal(p, T.slotClub(S.slots[idx]));
    renderChrome(idx);
    var go = function () {
      setTimeout(function () {
        if (T.state() !== S) return;
        busy = false;
        settle();
      }, reduceMotion ? 300 : 900);
    };
    

    var CC = window.CastCelebrate;
    if (T.isGoat(p) && CC && CC.goat) {
      T.track('goat_moment', { mode: S.mode.name });
      CC.goat({ player: p, head: T.goatHeadline(p), unit: 'SC points', tone: tone, done: function () {
        if (CC.goatLand) CC.goatLand(document.querySelector('#pitch .slot[data-slot="' + idx + '"]'), { tone: tone });
        go();
      } });
      return;
    }
    go();
  }

  
  
  function removeStillOnSale(S) {
    return S.mode.wildcards && S.wildcards.tweak < 1 && !!(window.CastAccount && CastAccount.canBuyRemove && CastAccount.canBuyRemove());
  }
  
  function settle() {
    var S = T.state();
    if (T.filledCount() === S.slots.length) {
      var out = T.outcome(false);
      if (out && !removeStillOnSale(S)) { captainStep(out); return; }
      S.lockHold = false;
      S.awaitingLock = true;
      S.offer = null;
      renderDraft();
      return;
    }
    S.awaitingLock = false;
    if (S.offer) renderDraft(); else nextOffer();
  }
  function lockIn(S) {
    if (T.state() !== S || S.finished || S.fullTime) return;
    stopLockTimer();
    S.awaitingLock = false;
    captainStep(T.outcome(true));
  }

  




  function capHave() { return window.CastAccount && CastAccount.itemSaved ? CastAccount.itemSaved('captain') : 0; }
  function capOn() { return !!(window.CastAccount && CastAccount.buyItem && CastAccount.tier && CastAccount.tier() !== null) && T.captainOffer(); }
  function captainStep(out) {
    var S = T.state();
    S.fullTime = true; S.awaitingLock = false; S.offer = null; S.lockHold = false;
    if (!capOn()) { finish(out); return; }
    S.capStep = true; S.capPick = T.bestCaptain();
    T.track('captain_offer_view', { mode: S.mode.name, total: T.total() });
    renderCaptain(S);
  }
  function renderCaptainPanel(S) {
    var A = window.CastAccount, signIn = !!(A && A.isSignedIn && !A.isSignedIn());
    $('offerPanel').innerHTML = R.captainStep(S, capHave(), signIn);
  }
  function renderCaptain(S) {
    renderChrome();
    var A = window.CastAccount, signIn = !!(A && A.isSignedIn && !A.isSignedIn());
    $('offerPanel').innerHTML = R.captainStep(S, capHave(), signIn);
    if (!S.lockHold) startLockTimer(S, function () { noCaptain(S, true); }); else stopLockTimer();
  }
  function noCaptain(S, auto) {
    if (T.state() !== S || S.finished || !S.capStep) return;
    stopLockTimer();
    S.capStep = false;
    T.track('captain_skip', { mode: S.mode.name, auto: auto ? 1 : 0 });
    finish(T.outcome(true));
  }
  function setCaptain() {
    var S = T.state();
    if (!S || busy || !S.capStep || S.capPick == null || !window.CastAccount || !CastAccount.buyItem) return;
    S.lockHold = true; stopLockTimer();
    var p = S.slots[S.capPick].player, at = S.capPick;
    CastAccount.buyItem('captain', GAME, function () {
      if (T.state() !== S || S.finished || !S.capStep) return;
      if (!T.setCaptain(at)) { toast('The Captain could not be set. Email cast@thecastpatrol.com.au and we\u2019ll put it back.'); return; }
      S.capStep = false;
      T.track('captain_used', { mode: S.mode.name, add: p.tries_1998_plus });
      sfx.win();
      if (!wildcardBurst('captain', 'cap', p.name + ' ' + p.year + ' counts double: +' + T.fmt(p.tries_1998_plus))) toast(p.name + ' counts double');
      renderChrome(at);
      setTimeout(function () { if (T.state() === S && !S.finished) finish(T.outcome(true)); }, reduceMotion ? 300 : 1400);
    }, { kicker: 'SC Captain', title: 'Make ' + p.name + ' Your Captain', line: T.fmt(T.total()) + ' SC points. His ' + T.fmt(p.tries_1998_plus) + ' count double: ' + T.fmt(T.total() + p.tries_1998_plus) + ' SC points.' });
    renderCaptain(S);
  }

   
  var WC_FX = {
    reroll: { ico: '🔄', title: 'Reroll!', sub: 'Back on the spinner' },
    scout:  { ico: '👀', title: 'Revealed', sub: 'All three seasons\u2019 SC points' },
    tweak:  { ico: '❌', title: 'Remove Player', sub: 'Tap a player in your 13' },
    removed:{ ico: '❌', title: 'Removed!', sub: '' },
    captain:{ ico: '\uD83C\uDF96\uFE0F', title: 'Captain!', sub: '' }
  };
  function wildcardBurst(kind, cls, sub) {
    if (reduceMotion) return false;
    var fx = WC_FX[kind], el = document.createElement('div');
    el.className = 'wc-burst wc-burst-' + cls;
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<span class="wcb-ring"></span><span class="wcb-ring wcb-ring2"></span>' +
      '<span class="wcb-card"><span class="wcb-ico">' + fx.ico + '</span><span class="wcb-title">' + fx.title + '</span>' +
      '<span class="wcb-sub">' + R.esc(sub == null ? fx.sub : sub) + '</span></span>';
    document.body.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 1400);
    return true;
  }
  function markUsed(key) { var b = document.querySelector('#offerPanel .wc-' + key); if (b) b.classList.add('just-used'); }
  
  function countBadge(badge) {
    var strong = badge.querySelector('strong'), to = parseInt(strong.textContent.replace(/\D/g, ''), 10) || 0;
    badge.classList.add('is-popping');
    if (reduceMotion || !to) return;
    strong.textContent = '0';
    var start = null;
    function step(ts) {
      if (start === null) start = ts;
      var t = Math.max(0, Math.min(1, (ts - start) / 750));
      strong.textContent = T.fmt(Math.round(to * (1 - Math.pow(1 - t, 3))));
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function onWildcard(key) {
    var S = T.state();
    if (busy || !S) return;
    placingId = null;
    if (key === 'sub') {
      if (S.subMode) S.subMode = null;
      else if (T.canSub()) { S.subMode = { from: null }; S.tweakMode = false; S.scoutMode = false; sfx.wild(); toast('Tap a lit-up player to move him'); }
      renderDraft();
      if (S.subMode && !isDesktop()) { var pp = $('pitch'); if (pp) pp.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' }); }
      return;
    }
    if (key === 'reroll') {
      if (!T.canUse('reroll')) return;
      sfx.wild();
      T.useReroll();
      T.track('wildcard_used', { wildcard: 'reroll', mode: S.mode.name });
      wildcardBurst('reroll', 'reroll');
      spinIn(S.offer);
      if (!S.wildcards.reroll && window.CastAccount && CastAccount.nudgeBonus && S.mode.wildcards) setTimeout(function () { CastAccount.nudgeBonus(grantBonus(S)); }, 1600);
      return;
    }
    if (key === 'scout') { onScout(); return; }
    if (key === 'tweak') {
      if (S.tweakMode) T.armTweak(false);
      else if (T.armTweak(true)) { sfx.wild(); if (!wildcardBurst('tweak', 'tweak')) toast('Tap a player in your 13 to remove him'); }
      renderDraft();
      if (S.tweakMode && !isDesktop()) {
        var pitchPanel = $('pitch');
        if (pitchPanel) pitchPanel.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
      }
    }
  }

  function onSubSlot(idx) {
    var S = T.state(), m = S.subMode, p = S.slots[idx].player;
    if (m.from == null || (p && idx !== m.from)) {
      if (p && T.subTargets(idx).length) { m.from = idx; renderDraft(); }
      else toast(p ? p.name + ' has no other open spot in his SC positions' : 'Tap a lit-up player first');
      return;
    }
    if (idx === m.from) { m.from = null; renderDraft(); return; }
    var moved = T.subMove(m.from, idx);
    if (!moved) return;
    sfx.wild();
    T.track('wildcard_used', { wildcard: 'sub', mode: S.mode.name });
    if (!wildcardBurst('tweak', 'tweak', moved.name + ' moves to ' + T.POS_NAMES[S.slots[idx].code])) toast(moved.name + ' moves to ' + T.POS_NAMES[S.slots[idx].code]);
    if (S.offer && S.offer.players && !S.offer.players.some(function (x) { return T.openCodesFor(x).length; })) nextOffer(); else renderDraft();
  }

  function onSlot(idx) {
    var S = T.state();
    if (S && S.capStep && !busy && S.slots[idx].player) { S.capPick = idx; sfx.tick(); renderCaptain(S); return; }
    if (S && S.subMode && !busy) { onSubSlot(idx); return; }
    if (S && placingId && !busy && !S.slots[idx].player) {
      var code = S.slots[idx].code;
      if (T.openCodesFor(T.byId[placingId]).indexOf(code) !== -1) place(placingId, code, idx);
      return;
    }
    if (!S || !S.tweakMode || busy) return;
    var p = T.applyTweak(idx);
    if (!p) return;
    sfx.wild();
    T.track('wildcard_used', { wildcard: 'tweak', mode: S.mode.name });
    if (!wildcardBurst('removed', 'tweak', p.name + ' ' + p.year + ' is back in the pool')) toast(p.name + ' ' + p.year + ' is back in the pool');
    S.awaitingLock = false;
    settle();
    var panel = $('offerPanel');
    if (panel) {
      var top = panel.getBoundingClientRect().top + window.pageYOffset - 90;
      window.scrollTo({ top: Math.max(0, top), behavior: reduceMotion ? 'auto' : 'smooth' });
    }
  }

   

  




  function trophiesFor(S, out) {
    var ids = [], players = S.slots.filter(function (x) { return x.player; }).map(function (x) { return x.player; });
    if (players.length !== S.slots.length) return ids;
    if (players.some(T.isGoat)) ids.push('sc_goat');
    if (players.some(function (p) { return p.tries_1998_plus >= 2000; })) ids.push('sc_2000');
    if (players.some(T.isLegend)) ids.push('sc_legend');
    if (players.filter(function (p) { return p.year <= 2014; }).length >= 5) ids.push('sc_vintage');
    if (players.every(function (p) { return p.year >= 2024; })) ids.push('sc_fresh');
    var club = {}, year = {};
    players.forEach(function (p) { club[p.club] = (club[p.club] || 0) + 1; year[p.year] = (year[p.year] || 0) + 1; });
    if (!S.daily && Object.keys(club).some(function (c) { return club[c] >= 5; })) ids.push('sc_oneclub');
    if (!S.daily && Object.keys(year).some(function (y) { return year[y] >= 4; })) ids.push('sc_oneyear');
    if (S.pb && S.pbBefore > 0) ids.push('sc_pb'); 
    if (S.slots.every(function (x) { return x.top; })) ids.push('read');
    if (T.luckPct() != null && T.luckPct() >= 30) ids.push('lucky');
    if (S.daily && out.reason === 'won') ids.push('dailywin');
    return ids;
  }

  
  function setTierWildcards(S, n) {
    ['reroll', 'tweak'].forEach(function (k) {
      var start = S.wcStart ? S.wcStart[k] : 1;
      if (!S.wcStart) S.wildcards[k] = n; else if (n > start) S.wildcards[k] += n - start;
    });
    S.wcStart = { reroll: Math.max(n, S.wcStart ? S.wcStart.reroll : 0), scout: T.FREE_REVEALS || 0, tweak: Math.max(n, S.wcStart ? S.wcStart.tweak : 0) };
    S.wcLocked = n === 0;
  }
  function draftLive() { var S = T.state(); return !!S && !S.finished && document.body.getAttribute('data-screen') === 'draft' && !busy; }
  window.addEventListener('cast:rerolls', function () { if (draftLive()) renderDraft(); });
  window.addEventListener('cast:keys', function () { if (draftLive()) renderDraft(); });
  window.addEventListener('cast:launch', function () { if (draftLive()) renderDraft(); });
  window.addEventListener('cast:tier', function (e) {
    var S = T.state(), n = e.detail && e.detail.wildcards;
    


    if (S && !S.finished && S.mode.wildcards && !S.mode.paidOnly && !S.wcStart && typeof n === 'number') {
      var def = { reroll: 1 + (S.profileRerolls || 0), scout: 1, tweak: 1 };
      ['reroll', 'scout', 'tweak'].forEach(function (k) { S.wildcards[k] = Math.max(0, n - Math.max(0, def[k] - S.wildcards[k])); });
      S.wcStart = { reroll: n, scout: n, tweak: n }; S.wcLocked = n === 0; S.profileRerolls = 0;
    }
    if (!S || S.finished || !S.mode.wildcards || !S.wcStart || typeof n !== 'number') return;
    setTierWildcards(S, n);
    if (e.detail && e.detail.tier === 'pass' && !S.subUsed && !S.subLeft) S.subLeft = 1;
    if (draftLive()) renderDraft();
  });
  function grantBonus(BS) {
    return function () {
      if (T.state() !== BS || BS.finished) return;
      BS.wildcards.reroll++;
      BS.bonusRerolls = (BS.bonusRerolls || 0) + 1;
      toast('🎁 Bonus Reroll added. Thanks for the follow!');
      if (draftLive()) renderDraft();
    };
  }

  

  function sheetHooks() {
    if (!window.CAST_ACCOUNT) return;
    window.CAST_ACCOUNT.startChallenge = function (c) { return startChallenge(c); };
    window.CAST_ACCOUNT.quickDraft = function (c) { return quickDraft(c); };
    window.CAST_ACCOUNT.club = function (id) {
      if (!T.CLUB_COLORS[id]) return null;
      var c = T.club(id);
      return { abbr: c.abbr, bg: c.primary, fg: c.text, name: c.name };
    };
    var sheetNames = null, sheetCount = -1;
    window.CAST_ACCOUNT.player = function (game, name) {
      if (game !== GAME) return null;
      var n = (T.players || []).length + (T.LEGENDS || []).length;
      if (n !== sheetCount) {
        sheetNames = {}; sheetCount = n;
        (T.players || []).concat(T.LEGENDS || []).forEach(function (p) { sheetNames[p.record_name.toLowerCase()] = p; });
      }
      var p = sheetNames[String(name).toLowerCase()];
      return p ? { tries: p.tries_1998_plus, club: p.club, tier: p.tier || '' } : null;
    };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', sheetHooks); else sheetHooks();

  function finish(out) {
    var S = T.state();
    S.finished = true; S.fullTime = true;
    S.ftOut = out; 
    stopLockTimer();
    dropDraft();
    S.tweakMode = false; S.scoutMode = false;
    if (!S.qd) T.track('game_end', { mode: S.mode.name, result: out.reason, total: out.total });
    try { localStorage.setItem('sc_played', '1'); } catch (e) {   }
    
    if (!S.daily && !S.qd) {
      var pb = bestScore();
      S.pbBefore = pb; S.pb = out.total > pb;
      if (S.pb) { try { localStorage.setItem(LS_BEST, String(out.total)); } catch (e) {   } }
    }
    $('results').innerHTML = R.results(S, out);
    if (window.CastAccount) {
      window.CastAccount.record({
        game: GAME, mode: S.mode.id, score: out.total, result: out.reason, win: out.win, top: false,
        
        picks: S.slots.filter(function (s) { return s.player; }).map(function (s) { return s.player.record_name; }),
        
        
        d: Object.assign({ sq: S.slots.filter(function (s) { return s.player; }).map(function (s) {
          var src = S.srcOf && S.srcOf[s.player.id];
          return s.player.club + '|' + s.player.year + (src ? '||' + src : '');
        }) },
          T.luckPct() != null ? { lk: T.luckPct() } : {}, T.wildcardsUsed() != null ? { wc: T.wildcardsUsed() } : {},
          S.seed ? { seed: S.seed } : {}, S.keyUsed ? { key: S.keyUsed } : {}, S.keysUsed ? { lks: S.keysUsed } : {}, S.qd ? { qd: 1 } : {}, S.goatUsed ? { goat: 1 } : {},
          
          S.captain != null ? { cap: S.slots.filter(function (s) { return s.player; }).indexOf(S.slots[S.captain]) } : {},
          S.daily ? { daily: S.daily.n, date: S.daily.date, go: S.daily.go } : {})
      });
      window.CastAccount.refresh();
      if (window.CastAccount.unlock && !S.qd) window.CastAccount.unlock(trophiesFor(S, out));
    }
    shareCard = null;
    if (T.buildShareCard) T.buildShareCard(S, out).then(function (card) { if (T.state() === S) shareCard = card; });
    if (out.win || S.pb) sfx.win(); else sfx.done();
    show('results');
    if (!S.daily && !S.qd) resBoardStart(S, out.total);
    if (S.daily && T.dailyDone) T.dailyDone(S, out);
    countUp($('rtNum'), 0, out.total);
  }
  


  var rb = { S: null, period: 'today', score: 0, data: {}, own: {} };
  function resBoardOn() { var A = window.CastAccount; return !!(A && A.resultBoard && A.tier && A.tier() !== null); }
  function resBoardDraw() {
    var el = $('resBoard');
    if (!el || rb.S !== T.state()) return;
    el.hidden = false;
    el.innerHTML = R.resBoard(rb);
  }
  function resBoardLoad(period) {
    rb.period = period;
    resBoardDraw();
    if (rb.data[period] && !rb.data[period].failed) return;
    var S = rb.S;
    delete rb.data[period];
    CastAccount.resultBoard('scplus', period).then(function (b) {
      if (rb.S !== S) return;
      rb.data[period] = b;
      resBoardDraw();
      var rows = (b.top || []).filter(function (r) { return !b.me || r.n !== b.me.name; });
      var outside = (b.top || []).length >= 100 && (b.players || 0) > (b.top || []).length && rows.length && rb.score < rows[rows.length - 1].s;
      if (outside && b.me && !rb.own[period]) {
        setTimeout(function () {
          b.rank().then(function (r) { if (rb.S === S && r && r.s === rb.score && r.rank) { rb.own[period] = r.rank; if (rb.period === period) resBoardDraw(); } }, function () {});
        }, 4000);
      }
    }, function () { if (rb.S !== S) return; rb.data[period] = { failed: true }; resBoardDraw(); });
  }
  function resBoardStart(S, score) {
    if (!resBoardOn()) return;
    rb = { S: S, period: 'today', score: score, data: {}, own: {} };
    T.track('results_board_view', { total: score });
    resBoardLoad('today');
  }

  var LS_BEST = 'sc_best_v1';
  function bestScore() { try { return +localStorage.getItem(LS_BEST) || 0; } catch (e) { return 0; } }
  T.bestScore = bestScore;
  
  T.crownOn = function () { return !!(window.CastAccount && CastAccount.isLaunched && CastAccount.isLaunched(GAME)); };

  var shareCard = null;
  function gameUrl() { return 'https://castgames.com.au/' + T.GAME_SLUG; }
  function shareLine() {
    var S = T.state(), out = S && S.ftOut;
    if (!S || !out) return '';
    var score = S.daily ? 'My ' + T.GAME_NAME + ' Daily Challenge: ' + T.fmt(out.total) + ' SC points' + (out.win ? ' \u2705' : '')
      : 'I just scored ' + T.fmt(out.total) + ' SC points on ' + T.GAME_NAME + ' \uD83C\uDFC9';
    return score + '\nThink you can take the crown? \uD83D\uDC51';
  }
  function shareText() { var l = shareLine(); return l ? l + ' ' + gameUrl() : ''; }
  
  function shareUrl() {
    var u = window.CG && window.CG.url ? window.CG.url(T.GAME_SLUG + '/') : gameUrl() + '/', CA = window.CastAccount;
    return CA && CA.inviteLink ? CA.inviteLink(u) : u;
  }
  function share() {
    var text = shareText();
    if (!text) return;
    



    var CA = window.CastAccount, S0 = T.state();
    if (CA && typeof CA.sharePicker === 'function' && T.shareRenderers && S0 && S0.ftOut) {
      var png = function (p) { return p.then(function (c) { return new Promise(function (ok, no) { c.toBlob(function (b) { if (b) ok(b); else no(new Error('no picture')); }, 'image/png'); }); }); };
      CA.sharePicker({ game: GAME, mode: 'results', title: 'Share Your Team', text: shareLine(), url: shareUrl(),
        file: T.GAME_NAME.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
        images: shareCard && shareCard.post && shareCard.story ? { portrait: shareCard.post.blob, story: shareCard.story.blob } : null,
        render: { portrait: function () { return png(T.shareRenderers.portrait(S0, S0.ftOut)); }, story: function () { return png(T.shareRenderers.story(S0, S0.ftOut)); } } });
      return;
    }
    var post = shareCard && shareCard.post, story = shareCard && shareCard.story;
    if (!post && !story) { if (navigator.share && !isDesktop()) { navigator.share({ text: text }).catch(function () {}); return; } }
    var phone = !isDesktop() && !!navigator.share;
    function opt(card, kind, label, sub) {
      if (!card) return '';
      return '<div class="share-opt">' +
        '<img class="share-opt-img' + (kind === 'story' ? ' is-story' : '') + '" src="' + card.url + '" alt="' + label + ' image">' +
        '<div class="share-opt-lbl"><b>' + label + '</b><small>' + sub + '</small></div>' +
        (phone ? '<button type="button" class="btn btn-res btn-res-share" data-action="share-card" data-card="' + kind + '">&#x1F4E4; Share</button>'
               : '<a class="btn btn-res btn-res-again" href="' + card.url + '" download="' + card.name + '">&#x2B07;&#xFE0F; Save</a>') +
      '</div>';
    }
    openSheet('<div class="sheet-grab" aria-hidden="true"></div>' +
      '<h2 class="sheet-title center">Share Your 13</h2>' +
      '<div class="share-opts">' + opt(story, 'story', 'Story', 'Instagram, Facebook, TikTok') + opt(post, 'post', 'Portrait', 'Feed and group chats') + '</div>' +
      '<button type="button" class="btn btn-ghost btn-block sheet-gap" data-action="copy-share">&#x1F4CB; Copy Message</button>' +
      '<button type="button" class="btn btn-ghost btn-block sheet-gap" data-action="close-sheet">Done</button>');
  }
  function shareCardFile(kind) {
    var text = shareText(), card = shareCard && shareCard[kind], file = card && card.file;
    if (file && navigator.canShare && navigator.share) {
      var withFile = { files: [file], text: text }, ok = false;
      try { ok = navigator.canShare(withFile); } catch (e) { ok = false; }
      if (ok) { navigator.share(withFile).catch(function () {}); T.track('share_card', { size: kind }); return; }
    }
    if (navigator.share) navigator.share({ text: text }).catch(function () {});
  }
  function copyShare() {
    var text = shareText();
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { toast('Copied. Paste it in the group chat'); }, function () { toast(text); });
    else toast(text);
  }

   

  var rulesHtml = null;
  function openRules() {
    var showIt = function (html) {
      openSheet('<button type="button" class="sheet-x" data-action="close-sheet" aria-label="Close">&times;</button>' +
        '<div class="doc rules-pop">' + html + '</div>' +
        '<button type="button" class="btn btn-primary btn-block" data-action="close-sheet">Back to the Game</button>');
      $('sheet').classList.add('is-rules');
      $('sheetBody').scrollTop = 0;
    };
    if (rulesHtml) { showIt(rulesHtml); return; }
    fetch('how-it-works.html').then(function (r) { return r.text(); }).then(function (text) {
      var doc = new DOMParser().parseFromString(text, 'text/html'), art = doc.querySelector('article.doc');
      if (!art) throw new Error('no rules');
      Array.prototype.forEach.call(art.querySelectorAll('.cta, .back-link'), function (el) { el.parentNode.removeChild(el); });
      rulesHtml = art.innerHTML;
      showIt(rulesHtml);
    }).catch(function () { location.href = 'how-it-works.html'; });
  }

  document.addEventListener('toggle', function (e) {
    var d = e.target;
    if (!d.classList || !d.classList.contains('faq-item') || !d.open) return;
    Array.prototype.forEach.call(document.querySelectorAll('.faq-item[open]'), function (o) { if (o !== d) o.open = false; });
  }, true);

  document.addEventListener('click', function (e) {
    var rulesLink = e.target.closest('a[href="how-it-works.html"]');
    if (rulesLink && document.body.getAttribute('data-screen') !== 'draft') { e.preventDefault(); openRules(); return; }
    var t = e.target.closest('.mode-card[data-mode],[data-pick],[data-scout],[data-place],[data-wildcard],[data-slot],[data-action],[data-track]');
    if (!t) return;
    if (t.hasAttribute('data-track')) {
      T.track(t.getAttribute('data-track'), { placement: t.getAttribute('data-where') || '' });
      if (!t.hasAttribute('data-action')) return;
    }
    if (t.hasAttribute('data-mode')) {
      selectedMode = t.getAttribute('data-mode');
      renderHome();
      if (T.players.length) newGame(selectedMode); else { startWhenReady = selectedMode; $('startBtn').hidden = false; }
      return;
    }
    if (t.hasAttribute('data-scout')) { onScout(t.getAttribute('data-scout')); return; }
    if (t.hasAttribute('data-pick')) { onPick(t.getAttribute('data-pick')); return; }
    if (t.hasAttribute('data-place')) { place($('sheetBody').getAttribute('data-player'), t.getAttribute('data-place')); return; }
    if (t.hasAttribute('data-wildcard')) { onWildcard(t.getAttribute('data-wildcard')); return; }
    if (t.hasAttribute('data-slot')) { onSlot(Number(t.getAttribute('data-slot'))); return; }

    switch (t.getAttribute('data-action')) {
      case 'home': e.preventDefault(); goHome(); break;
      case 'results-home': goHome(); break;
      case 'close-sheet': closeSheet(); break;
      case 'resume-draft': { var rd = savedDraft(); closeSheet(); if (rd) resumeDraft(rd); break; }
      case 'drop-draft': { var dd = savedDraft(); T.track('draft_resume_skip', { mode: dd && dd.name || '' }); dropDraft(); closeSheet(); break; }
      case 'cancel-tweak': T.armTweak(false); renderDraft(); break;
      case 'cancel-scout': T.armScout(false); renderDraft(); break;
      case 'lock-in': if (T.state()) lockIn(T.state()); break;
      case 'captain': setCaptain(); break;
      case 'no-captain': if (T.state()) noCaptain(T.state(), false); break;
      case 'rb-tab': { var rv = t.getAttribute('data-v'); if (rv && rb.S === T.state()) resBoardLoad(rv); break; }
      case 'rb-retry': if (rb.S === T.state()) resBoardLoad(rb.period); break;
      case 'rb-signin': T.track('results_board_signin', {}); if (window.CastAccount && CastAccount.requireSignIn) CastAccount.requireSignIn(null, 'leaderboard'); break;
      case 'play-again': {
        var wasDaily = !!(T.state() && T.state().daily);
        if (wasDaily && T.dailyStart) T.dailyStart(); else newGame(selectedMode);
        break;
      }
      case 'restart': openSheet(R.restartSheet()); $('sheet').classList.add('is-confirm'); break;
      case 'new-game': if (T.state()) { openSheet(R.newGameSheet(T.state())); $('sheet').classList.add('is-confirm'); } break;
      case 'change-mode': if (T.state()) { openSheet(R.changeModeSheet(T.state())); $('sheet').classList.add('is-confirm'); } break;
      case 'confirm-change-mode':
        closeSheet();
        placingId = null;
        if (T.state()) { selectedMode = T.state().mode.id === 'daily' ? 'plus' : T.state().mode.id; T.state().finished = true; }
        dropDraft();
        goHome();
        break;
      case 'confirm-restart': {
        var again = T.state() ? T.state().mode.id : selectedMode;
        closeSheet();
        if (T.state()) T.state().finished = true;
        newGame(again);
        break;
      }
      case 'share': share(); break;
      case 'copy-share': copyShare(); break;
      case 'share-card': shareCardFile(t.getAttribute('data-card')); break;
      case 'buy-reroll': {
        var bs = T.state();
        if (!bs || !window.CastAccount || !CastAccount.buyReroll) break;
        var bLeft = bs.slots.filter(function (x) { return !x.player; }).length;
        CastAccount.buyReroll(GAME, function () {
          if (T.state() !== bs) return;
          bs.wildcards.reroll += 1; bs.boughtRerolls = (bs.boughtRerolls || 0) + 1;
          onWildcard('reroll');
        }, { title: 'One More Spin', line: bLeft + ' spot' + (bLeft === 1 ? '' : 's') + ' to fill. Spin again for three new seasons.' });
        break;
      }
      case 'buy-remove': {
        var ms = T.state();
        if (!ms || !window.CastAccount || !CastAccount.buyRemove) break;
        if (ms.awaitingLock) { ms.lockHold = true; stopLockTimer(); }
        CastAccount.buyRemove(GAME, function () {
          if (T.state() !== ms) return;
          ms.wildcards.tweak += 1; ms.boughtTweaks = (ms.boughtTweaks || 0) + 1;
          onWildcard('tweak');
        }, { title: 'Swap One Out', line: 'Take one season out of your 13 and spin for his spot.' });
        break;
      }
      case 'buy-reveal': {
        var vs = T.state();
        if (!vs || !window.CastAccount || !CastAccount.buyItem) break;
        CastAccount.buyItem('reveal', GAME, function () {
          if (T.state() !== vs) return;
          vs.wildcards.scout += 1; vs.boughtScouts = (vs.boughtScouts || 0) + 1;
          onWildcard('scout');
        }, { title: 'See Their SC Points First', line: 'Show the SC points for all three seasons on this spin, then pick.' });
        break;
      }
      case 'goat': if (T.goatFits()) { openSheet(R.goatSheet()); $('sheet').classList.add('is-confirm'); } break;
      case 'confirm-goat': {
        var gs = T.state();
        closeSheet();
        if (!gs || !T.goatFits() || !window.CastAccount || !CastAccount.buyItem) break;
        CastAccount.buyItem('goat', GAME, function () {
          if (T.state() !== gs || !T.useGoat()) return;
          T.track('goat_used', { mode: gs.mode.name });
          renderDraft();
          toast('🐐 The GOAT is in: ' + T.fmt((T.goatPlayer() || {}).tries_1998_plus || 0) + ' SC points');
        });
        break;
      }
      case 'buy-key': {
        var ks = T.state();
        if (!ks || !window.CastAccount || !CastAccount.buyKey) break;
        CastAccount.buyKey('legend', GAME, { title: 'Swap for a Legends Pick', line: 'Swap this spin for three Legend seasons, their SC points showing, and pick one.' });
        break;
      }
      case 'bonus-reroll': if (window.CastAccount && T.state()) CastAccount.followBonus(grantBonus(T.state())); break;
      case 'legend-key': useLegendKey(); break;
      case 'legend-key-pass': if (window.CastAccount && CastAccount.openPass) CastAccount.openPass('vault'); break;
      case 'sub-pass': T.track('wildcard_locked_tap', { wildcard: 'sub' }); if (window.CastAccount && CastAccount.openPass) CastAccount.openPass('substitute'); break;
      case 'wc-signin': if (window.CastAccount && CastAccount.requireSignIn) CastAccount.requireSignIn(null, 'wildcards'); break;
    }
  });

  document.addEventListener('keydown', function (e) {
    
    var tg = e.target || {}, typing = /^(INPUT|TEXTAREA|SELECT)$/.test(tg.tagName || '') || tg.isContentEditable;
    if (/^[1-9]$/.test(e.key) && !e.metaKey && !e.ctrlKey && !e.altKey && !typing && document.body.getAttribute('data-screen') === 'draft' &&
        $('sheet').hidden && !document.documentElement.classList.contains('ca-open')) {
      var keyList = placingId ? document.querySelectorAll('#pitch .slot.is-target') : document.querySelectorAll('.offer-cards .pcard:not([disabled])');
      var keyHit = Array.prototype.filter.call(keyList, function (x) { return x.offsetParent !== null; })[+e.key - 1];
      if (keyHit) { e.preventDefault(); keyHit.click(); return; }
    }
    if (e.key === 'Escape') {
      var S = T.state();
      if (placingId) setPlacing(null);
      else if (!$('sheet').hidden) closeSheet();
      else if (S && S.tweakMode) { T.armTweak(false); renderDraft(); }
      else if (S && S.scoutMode) { T.armScout(false); renderDraft(); }
    }
  });

  $('soundToggle').addEventListener('click', function () { setSound(!sound); if (sound) { unlockAudio(); sfx.pick(); } });
  $('startBtn').addEventListener('click', function () { if (T.players.length) newGame(selectedMode); });

  


  
  
  var acctSeen = !window.CAST_ACCOUNT;
  window.addEventListener('cast-account', function (e) { var s = e.detail && e.detail.status; if (s === 'signed-in' || s === 'guest') acctSeen = true; });
  function launchKnown() { try { return !!localStorage.getItem('cast_launch_v1'); } catch (e) { return true; } }
  function dailyWhenReady(n) {
    n = n || 0;
    if (T.dailyStart && T.players.length && (!window.CAST_ACCOUNT || (window.CastAccount && ((acctSeen && launchKnown()) || n >= 40)))) { T.dailyStart(); return; }
    if (n < 75) setTimeout(function () { dailyWhenReady(n + 1); }, 200);
  }
  function playMode(modeId) {
    if (modeId === 'daily') { dailyWhenReady(); return; }
    if (!T.MODES[modeId] || T.MODES[modeId].off) return;
    if (!T.players.length) { startWhenReady = modeId; return; }
    var mid = document.body.getAttribute('data-screen') === 'draft' && !T.state().finished && T.filledCount() > 0;
    if (mid && !window.confirm('Leave this 13 and start ' + T.MODES[modeId].name + '?')) return;
    newGame(modeId);
  }
  window.addEventListener('cast:play', function (e) { var d = e.detail || {}; if (d.game === GAME) playMode(d.mode); });
  function homeAgain() { if (document.body.getAttribute('data-screen') === 'home') renderHome(); }
  window.addEventListener('cast:tier', homeAgain);

   
  function useLegendKey() {
    var S = T.state();
    if (busy || !T.legendKeyFits() || !window.CastAccount || !CastAccount.useKey) return;
    busy = true;
    CastAccount.useKey('legend', 'plus').then(function () {
      busy = false;
      if (T.state() !== S || !T.useLegendKey()) { toast('The spin changed before your Legend Key opened. Email cast@thecastpatrol.com.au and we’ll put it back.'); if (T.state() === S) renderDraft(); return; }
      T.track('vault_key', { key: 'legend', mode: S.mode.name });
      var offer = T.rollOffer();
      if (offer && offer.special) packIntro(renderDraft); else renderDraft();
    }, function (err) { busy = false; toast((err && err.message) || 'The Vault did not open. Try again.'); renderDraft(); });
  }

   
  function startChallenge(c) {
    if (!c || !T.MODES[c.mode] || T.MODES[c.mode].off) return false;
    if (!T.players.length) { setTimeout(function () { startChallenge(c); }, 400); return true; }
    var S0 = T.state(), mid = document.body.getAttribute('data-screen') === 'draft' && S0 && !S0.finished && T.filledCount() > 0;
    if (mid && !window.confirm('Leave this 13 and play ' + (c.from || 'your friend') + '’s challenge?')) return false;
    closeSheet();
    busy = false;
    startGame(c.mode, { seed: c.seed, challenge: true });
    return true;
  }

  

  var QD_CAP = 40000;
  function qdOptions(snap) {
    T.restore(snap);
    var S = T.state(), out = [];
    (S.offer ? S.offer.players : []).forEach(function (p) {
      T.openCodesFor(p).forEach(function (code) { out.push({ id: p.id, code: code, t: p.tries_1998_plus }); });
    });
    if (T.canUse('reroll')) out.push({ reroll: true, t: -1 });
    return out;
  }
  function qdApply(snap, o) {
    T.restore(snap);
    var S = T.state();
    if (o.reroll) return T.useReroll() ? T.snapshot() : null;
    if (T.pick(o.id, o.code) == null) return null;
    if (T.filledCount() < S.slots.length) T.rollOffer();
    return T.snapshot();
  }
  function qdRollout(snap) {
    var plan = [], s = snap;
    for (var guard = 0; guard < 20; guard++) {
      T.restore(s);
      if (T.filledCount() === T.state().slots.length) return { plan: plan, total: T.total() };
      var opts = qdOptions(s).filter(function (x) { return !x.reroll; });
      if (!opts.length) return null;
      var o = opts.reduce(function (a, b) { return b.t > a.t ? b : a; }), nx = qdApply(s, o);
      if (!nx) return null;
      plan.push(o); s = nx;
    }
    return null;
  }
  function qdSearch(width) {
    var root = T.snapshot(), best = null, beam = [{ snap: root, plan: [] }];
    function consider(plan, total) { if (total <= QD_CAP && (!best || total > best.total)) best = { plan: plan, total: total }; }
    var first = qdRollout(root);
    if (first) consider(first.plan, first.total);
    return new Promise(function (ok) {
      (function depth() {
        var kids = [];
        beam.forEach(function (b) {
          qdOptions(b.snap).forEach(function (o) {
            var nx = qdApply(b.snap, o);
            if (!nx) return;
            var plan = b.plan.concat([o]), r = qdRollout(nx);
            if (!r) return;
            consider(plan.concat(r.plan), r.total);
            kids.push({ snap: nx, plan: plan, full: !r.plan.length, score: r.total });
          });
        });
        kids.sort(function (a, b) { return b.score - a.score; });
        beam = kids.filter(function (k) { return !k.full; }).slice(0, width);
        if (!beam.length) { T.restore(root); return ok(best); }
        setTimeout(depth, 0);
      })();
    });
  }
  var qdOn = false;
  function quickDraft(c) {
    if (!c || c.mode !== 'plus') return Promise.reject(new Error('Quick Draft plays ' + T.GAME_NAME + ' challenges.'));
    var S0 = T.state();
    if (document.body.getAttribute('data-screen') === 'draft' && S0 && !S0.finished && T.filledCount() > 0) return Promise.reject(new Error('Finish or leave the 13 you are drafting first.'));
    if (qdOn) return Promise.reject(new Error('Quick Draft is already drafting.'));
    qdOn = true;
    return (T.players.length ? Promise.resolve() : T.loadPlayers()).then(function () {
      stopLockTimer(); closeSheet();
      selectedMode = c.mode; placingId = null;
      T.newGame(c.mode, { seed: c.seed, challenge: true });
      var S = T.state();
      if (S.seed !== c.seed) throw new Error('The challenge did not start. It is still waiting.');
      S.qd = true;
      var tierW = window.CastAccount && CastAccount.wildcardCount ? CastAccount.wildcardCount() : null;
      if (S.mode.wildcards && tierW !== null) setTierWildcards(S, tierW);
      busy = true;
      T.rollOffer();
      return qdSearch(3).then(function (best) {
        if (!best) throw new Error('Quick Draft could not find a 13 for this draft. It is still waiting.');
        var s = T.snapshot();
        best.plan.forEach(function (o) { if (s) s = qdApply(s, o); });
        if (!s || T.filledCount() !== S.slots.length) throw new Error('Quick Draft lost its place in the draft. It is still waiting.');
        busy = false;
        S.fullTime = true;
        var out = T.outcome(true);
        S.ftOut = out;
        finish(out);
      });
    }).then(function () { qdOn = false; }, function (e) { qdOn = false; busy = false; throw e; });
  }

  


  var LS_DRAFT = 'sc_draft_v1', DRAFT_MS = 24 * 3600000;
  var DRAFT_TAB = Math.random().toString(36).slice(2, 10);
  function draftWho() { return (window.CastAccount && CastAccount.uid && CastAccount.uid()) || 'guest'; }
  function draftRaw() { try { return JSON.parse(localStorage.getItem(LS_DRAFT) || 'null'); } catch (e) { return null; } }
  function draftWorth(S) { return T.filledCount() > 0 || S.offerNo > 1 || !!(S.keysUsed || S.goatUsed || S.subUsed || S.boughtRerolls || S.boughtScouts || S.boughtTweaks); }
  function keepDraft(force) {
    var S = T.state();
    if (!S || S.finished || S.daily || S.qd || S.challenge || !S.mode || !(force === true || draftWorth(S))) return; 
    if (!S.draftId) S.draftId = Math.random().toString(36).slice(2, 12);
    var cur = draftRaw(), me = draftWho();
    if (cur && cur.id === S.draftId && cur.tab !== DRAFT_TAB) { draftTaken(); return; }
    if (cur && cur.id === S.draftId && cur.who !== 'guest' && cur.who !== me) { dropDraft(); return; }
    try {
      var s = JSON.stringify(S, function (k, v) {
        if (k === 'promoDef' || k === 'ftOut') return undefined;
        if (k === 'mode' && v && T.MODES[v.id] === v) return { __m: v.id };
        if (v && typeof v === 'object' && typeof v.id === 'string' && T.byId[v.id] === v) return { __p: v.id };
        return v;
      });
      var clockLeft = clock.iv && clock.offer === S.offer ? Math.max(0, clock.end - Date.now()) : null;
      localStorage.setItem(LS_DRAFT, JSON.stringify({ v: 1, id: S.draftId, tab: DRAFT_TAB, who: me, at: Date.now(), ds: T.DATASET, sel: selectedMode,
        name: S.mode.name, picks: T.filledCount(), clock: clockLeft, lock: S.awaitingLock && lockTimer ? lockLeft : null, s: s }));
    } catch (e) {   }
  }
  function draftTaken() {
    var S = T.state();
    if (!S || S.finished) return;
    S.finished = true;
    stopLockTimer(); clockStop(); closeSheet();
    toast('This draft carried on in another tab.');
    goHome();
  }
  window.addEventListener('storage', function (e) {
    if (e.key !== LS_DRAFT) return;
    var S = T.state(), d = null;
    try { d = JSON.parse(e.newValue || 'null'); } catch (x) { d = null; }
    if (S && !S.finished && S.draftId && d && d.id === S.draftId && d.tab !== DRAFT_TAB) draftTaken();
  });
  function dropDraft() { try { localStorage.removeItem(LS_DRAFT); } catch (e) {   } }
  function savedDraft() {
    var d = null;
    try { d = JSON.parse(localStorage.getItem(LS_DRAFT) || 'null'); } catch (e) { d = null; }
    if (!d || d.v !== 1 || typeof d.s !== 'string' || !(Date.now() - d.at < DRAFT_MS)) { if (d) dropDraft(); return null; }
    return d;
  }
  function resumeDraft(d) {
    var miss = false, S = null;
    try {
      S = JSON.parse(d.s, function (k, v) {
        if (v && typeof v === 'object' && !Array.isArray(v)) {
          if (typeof v.__p === 'string') { if (!T.byId[v.__p]) miss = true; return T.byId[v.__p] || null; }
          if (typeof v.__m === 'string') { if (!T.MODES[v.__m]) miss = true; return T.MODES[v.__m] || null; }
        }
        return v;
      });
    } catch (e) { miss = true; }
    if (miss || !S || !S.mode || !Array.isArray(S.slots) || S.finished) { dropDraft(); toast('That draft could not be brought back. Sorry!'); return; }
    T.adopt(S);
    resumeClock = typeof d.clock === 'number' ? d.clock : null; resumeLock = typeof d.lock === 'number' ? d.lock : null;
    try { localStorage.setItem(LS_DRAFT, JSON.stringify(Object.assign({}, d, { tab: DRAFT_TAB, at: Date.now() }))); } catch (e) {   }
    selectedMode = d.sel || S.mode.id;
    placingId = null; busy = false;
    T.track('draft_resume', { mode: S.mode.name, picks: T.filledCount() });
    show('draft');
    shownTotal = 0;
    if (S.fullTime) { S.fullTime = false; S.capStep = false; captainStep(T.outcome(true)); return; }
    if (!S.offer && !S.awaitingLock) nextOffer(); else renderDraft();
  }
  



  var bootMode = null;
  function bootOn() { return document.documentElement.classList.contains('play-boot'); }
  function bootEnd() { document.documentElement.classList.remove('play-boot'); if (window.CG && window.CG.bootDone) window.CG.bootDone(); }
  function bootIdleWatch() {
    var check = function () {
      if (!bootOn() || busy || !T.players.length || document.documentElement.classList.contains('ca-open') || !$('sheet').hidden) return;
      if (document.body.getAttribute('data-screen') !== 'home') return;
      if (window.CG && window.CG.bootIdle) window.CG.bootIdle(function () { playMode(bootMode); }); else bootEnd();
    };
    var soon = function () { setTimeout(check, 400); };
    setTimeout(check, 2500); setTimeout(check, 7000);
    try {
      new MutationObserver(soon).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
      new MutationObserver(soon).observe($('sheet'), { attributes: true, attributeFilter: ['hidden'] });
    } catch (e) {   }
  }
  function bootPlay(mode) {
    bootMode = mode;
    bootIdleWatch();
    if (/#(challenge|cast-profile|my-cast|leaderboards|cast-pass|join|admin)/.test(location.hash) || /[?&](challenge|vs)=/.test(location.search)) return;
    var d = mode === 'daily' ? null : savedDraft();
    if (!d || (d.sel || 'plus') !== mode) { playMode(mode); return; }
    var done = false, decide = function () {
      if (done) return;
      done = true;
      var now = savedDraft();
      if (now && (draftWho() === now.who || draftHanded(now))) resumeDraft(now); else playMode(mode);
    };
    var signedBefore = false;
    try { signedBefore = localStorage.getItem('cast_signed_in') === '1'; } catch (e) {   }
    if (draftHanded(d) || (draftWho() === d.who && !(d.who === 'guest' && signedBefore))) { decide(); return; }
    var on = function (e) {
      var st = e.detail && e.detail.status;
      if (st !== 'signed-in' && st !== 'guest') return;
      window.removeEventListener('cast-account', on);
      decide();
    };
    window.addEventListener('cast-account', on);
    setTimeout(decide, 6000); 
  }
  function offerResume() {
    var d = savedDraft();
    if (!d || /#(challenge|cast-profile|leaderboards|cast-pass)/.test(location.hash)) return;
    var ask = function () {
      if (document.documentElement.classList.contains('ca-open')) { setTimeout(ask, 1500); return; }
      var now = savedDraft();
      if (!now || now.at !== d.at || draftWho() !== d.who || document.body.getAttribute('data-screen') !== 'home' || !$('sheet').hidden) return;
      T.track('draft_resume_offer', { mode: d.name, picks: d.picks });
      openSheet(R.resumeSheet(d.name, d.picks));
      $('sheet').classList.add('is-confirm');
    };
    var signedBefore = false;
    try { signedBefore = localStorage.getItem('cast_signed_in') === '1'; } catch (e) {   }
    if (draftWho() === d.who && !(d.who === 'guest' && signedBefore)) { setTimeout(ask, 400); return; }
    var on = function (e) {
      var st = e.detail && e.detail.status;
      if (st !== 'signed-in' && st !== 'guest') return;
      window.removeEventListener('cast-account', on);
      if (draftWho() === d.who) setTimeout(ask, 400);
    };
    window.addEventListener('cast-account', on);
  }
  window.addEventListener('cast-account', function () { setTimeout(homeAgain, 0); });
  document.addEventListener('visibilitychange', function () { if (document.hidden) keepDraft(); });
  window.addEventListener('pagehide', keepDraft);

  





  window.addEventListener('cast:signin-away', function () { if (T.reloadSafe()) keepDraft(true); });
  window.addEventListener('cast-account', function (e) { if (e.detail && e.detail.status === 'signed-in') keepDraft(); }); 
  function draftHanded(d) {
    var t = window.CastAccount && CastAccount.signInBack ? CastAccount.signInBack() : 0;
    return !!(t && d && d.who === 'guest' && d.at >= t);
  }
  T.reloadSafe = function () {
    var S = T.state();
    if (!window.CG_MODE || !bootMode || document.body.getAttribute('data-screen') !== 'draft' || !S || S.finished || !S.mode) return false;
    return !(S.daily || S.qd || S.challenge || busy || qdOn) && (selectedMode || 'plus') === bootMode;
  };

   

  setSound(sound);
  checkImages();
  renderHome();
  document.body.setAttribute('data-screen', 'home');

  var startWhenReady = null;
  T.loadPlayers().then(function () {
    var btn = $('startBtn');
    btn.disabled = false;
    btn.textContent = 'Play Now';
    btn.hidden = true;
    homeAgain();
    if (startWhenReady) { var go = startWhenReady; startWhenReady = null; newGame(go); return; }
    var play = /[?&]play=(plus|daily)(?=&|#|$)/.exec(location.search) || (window.CG_MODE ? [0, window.CG_MODE] : null);
    if (!play) offerResume();
    if (play) {
      try { history.replaceState(null, '', location.pathname + location.search.replace(/([?&])play=[^&#]*&?/, '$1').replace(/[?&]$/, '') + location.hash); } catch (e) {   }
      bootPlay(play[1]);
    }
  }).catch(function () {
    $('startBtn').textContent = 'Could Not Load the Seasons';
    $('startBtn').hidden = false;
    $('packNote').textContent = 'Check your connection and refresh the page to try again.';
  });
})(window.T = window.T || {});
