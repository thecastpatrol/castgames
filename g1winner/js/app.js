 
(function (T) {
  'use strict';

  

  (function () {
    if (window.CastKits || document.querySelector('script[src*="cast-kits.js"]')) return;
    var me = document.querySelector('script[src*="js/app.js"]'), v = me && /\?v=([\w-]+)/.exec(me.getAttribute('src'));
    ['js/kits-data.js', 'js/cast-kits.js'].forEach(function (src) {
      var sc = document.createElement('script');
      sc.src = src + (v ? '?v=' + v[1] : ''); sc.async = false;
      document.head.appendChild(sc);
    });
  })();

  var R = T.render;
  var $ = function (id) { return document.getElementById(id); };
  var selectedMode = 'plus'; 
  var busy = false;          
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

   

  function show(name) {
    if (bootOn()) bootEnd(); 
    ['home', 'draft', 'results', 'ou'].forEach(function (n) {
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
  document.addEventListener('error', function (e) {
    if (e.target && e.target.tagName === 'IMG') fallback(e.target);
  }, true);
  function checkImages(root) {
    Array.prototype.forEach.call((root || document).querySelectorAll('img[data-fallback]'), function (img) {
      if (img.complete && img.naturalWidth === 0) fallback(img);
    });
  }

  



  
  
  var ADS_ON = false;
  var ADS_DIR = 'assets/cp/';
  var AD_LISTS = { homepage: 'h.json', popup: 't.json' }; 
  var adLists = { homepage: [], popup: [] };
  T.ads = {
    pick: function (kind) {
      var list = adLists[kind];
      if (!list || !list.length) return null;
      return ADS_DIR + encodeURIComponent(list[Math.floor(Math.random() * list.length)]);
    }
  };
  function loadManifest(kind) {
    return fetch(ADS_DIR + AD_LISTS[kind], { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (list) { adLists[kind] = Array.isArray(list) ? list : []; })
      .catch(function () { adLists[kind] = []; });
  }
  
  if (ADS_ON) loadManifest('popup').then(function () {
    adLists.popup.forEach(function (f) { var i = new Image(); i.src = ADS_DIR + encodeURIComponent(f); });
  });
  if (ADS_ON) loadManifest('homepage').then(renderHomeAd);

  
  function adFree() { return !!(window.CastAccount && CastAccount.hasPass && CastAccount.hasPass()); }
  function renderHomeAd() {
    var slot = $('homeAd');
    if (slot) slot.innerHTML = adFree() ? '' : R.unibet('home');
  }
  window.addEventListener('cast:tier', function () { if (document.body.getAttribute('data-screen') === 'home') renderHomeAd(); });

  
  
  function interstitial(done) {
    if (adFree()) { done(); return; }
    var src = T.ads.pick('popup');
    if (!src) { done(); return; }
    var img = new Image();
    var settled = false;
    var giveUp = setTimeout(function () { if (!settled) { settled = true; done(); } }, 4000);
    img.onerror = function () { if (settled) return; settled = true; clearTimeout(giveUp); done(); };
    img.onload = function () {
      if (settled) return;
      settled = true;
      clearTimeout(giveUp);
      showTakeover(img, done);
    };
    img.alt = 'Unibet';
    img.src = src;
  }

  function showTakeover(img, done) {
    var closed = false;
    var timer = null;
    var ov = document.createElement('div');
    ov.className = 'cp-takeover';
    ov.innerHTML = '<a class="cp-takeover-link" href="https://bit.ly/betwithcast" target="_blank" rel="noopener noreferrer sponsored" data-track="unibet_click" data-where="popup"></a>' +
      '<div class="cp-takeover-bar"><div class="cp-takeover-fill"></div></div>' +
      '<div class="cp-takeover-label">Ad closes in 7s</div>';
    ov.querySelector('.cp-takeover-link').appendChild(img);
    function close() {
      if (closed) return;
      closed = true;
      clearInterval(timer);
      if (ov.parentNode) ov.parentNode.removeChild(ov);
      lockScroll(false);
      done();
    }
    document.body.appendChild(ov);
    lockScroll(true);
    var total = 7000, elapsed = 0, step = 100;
    var fill = ov.querySelector('.cp-takeover-fill');
    var label = ov.querySelector('.cp-takeover-label');
    timer = setInterval(function () {
      elapsed += step;
      fill.style.width = Math.max(0, 100 - elapsed / total * 100) + '%';
      label.textContent = 'Ad closes in ' + Math.max(0, Math.ceil((total - elapsed) / 1000)) + 's';
      if (elapsed >= total) close();
    }, step);
    ov.querySelector('.cp-takeover-link').addEventListener('click', function () { setTimeout(close, 50); });
  }

  


  var VIDEO_FEED = 'https://mediakit.thecastpatrol.com.au/data/episodes.json';
  function loadVideos() {
    if (!$('watch')) return; 
    fetch(VIDEO_FEED, { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (data) {
        var list = (data && data.episodes || []).filter(function (v) {
          return v && v.url && /^https:\/\/(www\.)?youtube\.com\//.test(v.url) && v.title;
        }).slice(0, 4);
        if (!list.length) return;
        $('watchTrack').innerHTML = R.videos(list);
        $('watch').hidden = false;
      })
      .catch(function () {   });
  }
  loadVideos();

   

  var sound = true;
  var ctx = null;
  
  try { sound = localStorage.getItem('racing_sound_v2') !== 'off'; } catch (e) {   }

  function setSound(on) {
    sound = on;
    var b = $('soundToggle');
    b.setAttribute('aria-pressed', String(on));
    b.setAttribute('aria-label', on ? 'Sound on' : 'Sound off');
    b.classList.toggle('is-on', on);
    var l = b.querySelector('.sound-lbl');
    if (l) l.textContent = on ? 'Sound On' : 'Sound Off';
    try { localStorage.setItem('racing_sound_v2', on ? 'on' : 'off'); } catch (e) {   }
  }

  
  
  
  var AC = window.AudioContext || window.webkitAudioContext;
  var master = null;

  function audioReady() {
    if (!AC) return null;
    if (!ctx) {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 1;
      master.connect(ctx.destination);
    }
    if (ctx.state !== 'running' && ctx.resume) ctx.resume().catch(function () {});
    return ctx;
  }

  
  
  var unlocked = false;
  function useMediaChannel() {
    try { if (navigator.audioSession) navigator.audioSession.type = 'ambient'; } catch (e) {   }
  }

  function unlockAudio() {
    if (!sound || !AC) return;
    try {
      if (!unlocked) useMediaChannel();
      var c = audioReady();
      
      var buf = c.createBuffer(1, 1, 22050);
      var src = c.createBufferSource();
      src.buffer = buf;
      src.connect(c.destination);
      src.start(0);
      if (c.state === 'running') unlocked = true;
    } catch (e) {   }
  }
  
  ['touchend', 'click', 'keydown'].forEach(function (ev) {
    document.addEventListener(ev, unlockAudio, true);
  });
  T.audioState = function () { return ctx ? ctx.state : 'not started'; };
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && ctx && ctx.state !== 'running' && ctx.resume) ctx.resume().catch(function () {});
  });

  function tone(freq, dur, type, when, vol) {
    if (!sound || !ctx) return; 
    try {
      if (ctx.state !== 'running' && ctx.resume) ctx.resume().catch(function () {});
      var t0 = ctx.currentTime + 0.01 + (when || 0);
      var o = ctx.createOscillator();
      var g = ctx.createGain();
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
    pick: function () { tone(523, 0.1, 'triangle', 0, 0.35); tone(784, 0.16, 'triangle', 0.08, 0.35); },
    win: function () { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, 0.28, 'triangle', i * 0.12, 0.35); }); },
    fail: function () { tone(262, 0.3, 'triangle', 0, 0.35); tone(196, 0.45, 'triangle', 0.2, 0.35); },
    wild: function () { tone(660, 0.12, 'sine', 0, 0.35); tone(990, 0.16, 'sine', 0.07, 0.35); }
  };

  
  if (/[?&]audiodebug\b/.test(location.search)) {
    var dbg = document.createElement('div');
    dbg.style.cssText = 'position:fixed;left:8px;right:8px;bottom:8px;z-index:9999;background:#111;color:#fff;border:2px solid #5b8cff;border-radius:12px;padding:10px;font:12px/1.4 monospace';
    dbg.innerHTML = '<div id="adbInfo">tap a button</div>' +
      '<div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">' +
      '<button id="adbWeb" style="flex:1;padding:10px;font-weight:bold">Web Audio beep</button>' +
      '<button id="adbHtml" style="flex:1;padding:10px;font-weight:bold">MP3 beep</button></div>';
    document.body.appendChild(dbg);
    var info = function (note) {
      var lines = [
        'note: ' + note,
        'sound pref: ' + (sound ? 'on' : 'off'),
        'AudioContext support: ' + (!!AC),
        'ctx state: ' + (ctx ? ctx.state : 'none') + ' | time ' + (ctx ? ctx.currentTime.toFixed(2) : '-'),
        'audioSession: ' + (navigator.audioSession ? navigator.audioSession.type + ' / ' + navigator.audioSession.state : 'n/a'),
        'unlocked: ' + unlocked,
        'UA: ' + navigator.userAgent.slice(0, 90)
      ];
      document.getElementById('adbInfo').innerHTML = lines.join('<br>');
    };
    setInterval(function () { info('live'); }, 500);
    document.getElementById('adbWeb').addEventListener('click', function () {
      unlockAudio(); var was = sound; sound = true; tone(880, 0.4, 'square', 0, 0.4); sound = was; info('web beep sent');
    });
    document.getElementById('adbHtml').addEventListener('click', function () {
      var a = new Audio('assets/beep.mp3'); var p = a.play();
      if (p && p.then) p.then(function () { info('mp3 playing'); }, function (e) { info('mp3 blocked: ' + e.name); });
    });
  }

   

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

   

  function firstVisit() {
    try {
      if (localStorage.getItem('racing_played')) return false;
      
      
      if (localStorage.getItem('cast_signed_in') === '1' || signedIn()) return false;
      var g = JSON.parse(localStorage.getItem('cast_games_v1') || '[]');
      return !(Array.isArray(g) && g.some(function (x) { return x && x.game === 'racing'; }));
    } catch (e) { return false; }
  }
  var modesMark = null, modesUp = false;
  function placeModes(first) {
    var fs = $('firstSteps'), block = [$('modeKicker'), $('modePicker'), $('startBtn'), $('packNote')];
    if (!fs || !block.every(Boolean) || first === modesUp) return;
    if (!modesMark) { modesMark = document.createComment(' the modes, after a first game '); block[0].parentNode.insertBefore(modesMark, block[0]); }
    var ref = first ? fs.nextSibling : modesMark;
    block.forEach(function (el) { ref.parentNode.insertBefore(el, ref); });
    modesUp = first;
  }
  

  var dailyMark = null;
  function placeDaily() {
    var d = $('dailyCard'), last = $('packNote');
    if (!d || !last) return;
    if (!dailyMark) { dailyMark = document.createComment(' the Daily Challenge '); d.parentNode.insertBefore(dailyMark, d); }
    if (wcOn() && sydneyToday() <= '2026-11-15') { if (last.nextSibling !== d) last.parentNode.insertBefore(d, last.nextSibling); }
    else if (dailyMark.nextSibling !== d) dailyMark.parentNode.insertBefore(d, dailyMark.nextSibling);
  }
  
  function placeOu() {
    var d = $('dailyCard'), c = $('ouHome');
    
    if (T.OU_SEPARATE) { if (c) c.hidden = true; return; }
    if (!d) return;
    if (!c) { c = document.createElement('div'); c.id = 'ouHome'; c.className = 'ou-home'; }
    var on = !!(T.ou && T.ou.on());
    c.hidden = !on;
    c.innerHTML = on ? R.ouCard() : '';
    if (d.nextSibling !== c) d.parentNode.insertBefore(c, d.nextSibling);
  }
  T.firstVisit = firstVisit;
  
  function wcOn() { return false; } 
  function signedIn() { return !!(window.CastAccount && CastAccount.isSignedIn && CastAccount.isSignedIn()); }
  var SYD = window.Intl && Intl.DateTimeFormat ? new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Sydney', year: 'numeric', month: '2-digit', day: '2-digit' }) : null;
  function sydneyToday() { return SYD ? SYD.format(new Date()) : new Date().toISOString().slice(0, 10); }
  
  function wcPlace(first) {
    if (!wcOn()) return null;
    if (sydneyToday() > '2026-11-15') return 'mini';
    return first && !signedIn() ? 'under' : 'top';
  }
  function renderHome() {
    
    
    
    var first = firstVisit(), fs = $('firstSteps');
    
    $('modePicker').innerHTML = R.modePicker(selectedMode, { wc: wcPlace(first), guest: !signedIn() && !(window.CastAccount && CastAccount.wcFreeLeft && CastAccount.wcFreeLeft()), free: !signedIn() && !!(window.CastAccount && CastAccount.wcFreeLeft && CastAccount.wcFreeLeft()) });
    if (fs) fs.hidden = !first;
    placeModes(first);
    placeDaily();
    placeOu();
    var ouB = document.querySelector('.spot-promo[data-ou-open]');
    if (ouB && !ouB.getAttribute('data-rich') && R.ouBanner) { ouB.innerHTML = R.ouBanner(); ouB.setAttribute('data-rich', '1'); ouB.classList.add('is-ou'); }
    if (window.CastAccount && CastAccount.spot) CastAccount.spot();
    $('startBtn').setAttribute('data-pick', selectedMode); 
  }

   

  var shownTotal = 0;

  function countUp(el, from, to) {
    if (!el) return;
    if (reduceMotion || from === to) { el.textContent = T.fmt(to); return; }
    var start = null, dur = 650;
    function step(ts) {
      if (!start) start = ts;
      var k = Math.min(1, (ts - start) / dur);
      var e = 1 - Math.pow(1 - k, 3);
      el.textContent = T.fmt(Math.round(from + (to - from) * e));
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  
  function animateBar(from, to) {
    var S = T.state();
    var fill = $('sbFill'), bar = $('sbBar'), gain = $('sbGain');
    if (!fill) return;
    var pct = function (t) { return Math.min(100, t / T.TARGET * 100); };
    var before = R.barLook(S, from), after = R.barLook(S, to);
    bar.setAttribute('data-stage', after.stage);
    if (reduceMotion || from === to) {
      fill.style.width = pct(to) + '%';
      fill.style.setProperty('--bar', after.color);
      fill.style.setProperty('--glow', after.glow);
      return;
    }
    fill.style.transition = 'none';
    fill.style.width = pct(from) + '%';
    fill.style.setProperty('--bar', before.color);
    fill.style.setProperty('--glow', before.glow);
    void fill.offsetWidth; 
    fill.style.transition = '';
    fill.style.width = pct(to) + '%';
    fill.style.setProperty('--bar', after.color);
    fill.style.setProperty('--glow', after.glow);
    var d = to - from;
    if (d > 0) {
      bar.classList.remove('is-pulse'); void bar.offsetWidth; bar.classList.add('is-pulse');
      gain.textContent = '+' + T.fmt(d);
      gain.style.left = Math.min(92, Math.max(8, pct(to))) + '%';
      gain.classList.remove('is-on'); void gain.offsetWidth; gain.classList.add('is-on');
    }
    if (after.stage !== before.stage) {
      bar.classList.remove('is-levelup'); void bar.offsetWidth; bar.classList.add('is-levelup');
    }
  }

  function renderChrome(flashIdx) {
    var S = T.state();
    var total = T.total();
    $('scoreboard').innerHTML = R.scoreboard(S);
    countUp($('sbTotal'), shownTotal, total);
    animateBar(shownTotal, total);
    shownTotal = total;
    $('pitch').innerHTML = R.pitch(S, flashIdx);
    fitSlotNames();
    fitNames();
    $('pitch').classList.toggle('is-tweaking', !!S.tweakMode);
    $('pickCount').textContent = T.filledCount() + ' of ' + T.SLOTS.length;
  }

  
  function fitNames() {
    Array.prototype.forEach.call(document.querySelectorAll('#pitch .slot-name'), function (el) {
      el.style.fontSize = ''; el.style.letterSpacing = '';
      var room = el.clientWidth;
      if (!room || el.scrollWidth <= room) return;
      var size = parseFloat(getComputedStyle(el).fontSize);
      size = Math.max(6, Math.floor(size * room / el.scrollWidth * 10) / 10);
      el.style.fontSize = size + 'px';
      if (size < 8.5) el.style.letterSpacing = '-.2px';
      while (el.scrollWidth > room && size > 6) { size -= .25; el.style.fontSize = size + 'px'; }
    });
  }
  var fitTimer = null;
  window.addEventListener('resize', function () { clearTimeout(fitTimer); fitTimer = setTimeout(fitNames, 120); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitNames);

  
  T.LOCK_SECS = 10;
  var lockTimer = null, lockLeft = null, resumeLock = null, resumeClock = null; 
  function stopLockTimer() { if (lockTimer) { clearInterval(lockTimer); lockTimer = null; } }
  function startLockTimer(S) {
    stopLockTimer();
    var left = resumeLock != null ? Math.max(1, resumeLock) : T.LOCK_SECS; 
    resumeLock = null; lockLeft = left;
    
    function paint() {
      var f = document.querySelector('#offerPanel .lock-fill');
      if (f) f.style.transform = 'scaleX(' + Math.max(left - 1, 0) / T.LOCK_SECS + ')';
    }
    requestAnimationFrame(function () { requestAnimationFrame(paint); });
    lockTimer = setInterval(function () {
      if (T.state() !== S || !S.awaitingLock || S.tweakMode || S.finished) { stopLockTimer(); return; }
      left--; lockLeft = left;
      var el = document.querySelector('#offerPanel .lock-secs');
      if (el) el.textContent = Math.max(left, 0);
      paint();
      if (left <= 0) {
        stopLockTimer(); T.track('lock_in_auto', { mode: S.mode.name });
        if (T.total() >= T.TARGET) T.track('go_higher_lock', { mode: S.mode.name, total: T.total(), auto: 1 });
        finish(T.outcome(true));
      }
    }, 1000);
  }

  










  T.PICK_SECS = 20;
  T.EXACT_SECS = 15;
  T.CLOCK_MODES = ['plus', 'exact', 'daily'];
  T.clockMode = function (S) { return !!S && !!S.mode && T.CLOCK_MODES.indexOf(S.mode.id) >= 0 && S.mode.source === 'roll' && !S.qd; };
  T.pickSecs = function (S) { return S && S.mode && S.mode.id === 'exact' ? T.EXACT_SECS : T.PICK_SECS; };
  var clock = { offer: null, end: 0, last: 0, iv: null };
  function clockOn(S) { return T.clockMode(S) && !S.finished && !S.awaitingLock && !!S.offer && S.offer.players.length > 0 && document.body.getAttribute('data-screen') === 'draft'; }
  
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
    T.track(S.mode.id === 'exact' ? 'exact_timeout' : 'pick_timeout', { mode: S.mode.name, picks: S.picks, tapped: tapped ? 'yes' : 'no' });
    toast('\u23F1\uFE0F Time\u2019s up: ' + p.name + ' goes in');
    place(p.id, T.openCodesFor(p)[0]);
  }

  



  var offerTop = null, offerKey = '', offerMovedAt = 0;
  function noteOffers() {
    var c = document.querySelector('#offerPanel [data-pick]');
    if (!c) { offerTop = null; offerKey = ''; return; }
    var key = Array.prototype.map.call(document.querySelectorAll('#offerPanel [data-pick]'), function (x) { return x.getAttribute('data-pick'); }).join(','),
      top = c.getBoundingClientRect().top + (window.scrollY || 0);
    if (key === offerKey && offerTop !== null && Math.abs(top - offerTop) > 8) offerMovedAt = Date.now();
    offerTop = top; offerKey = key;
  }
  function renderDraft(flashIdx) {
    try { return renderDraft0(flashIdx); } finally { noteOffers(); }
  }
  

  function fitSlotNames() {
    Array.prototype.forEach.call(document.querySelectorAll('#pitch .slot.is-silks .slot-name'), function (el) {
      el.style.fontSize = '';
      var size = parseFloat(getComputedStyle(el).fontSize) || 11;
      while (el.scrollWidth > el.clientWidth + 0.5 && size > 6.5) { size -= 0.5; el.style.fontSize = size + 'px'; }
    });
  }
  window.addEventListener('resize', function () { if (document.body.getAttribute('data-screen') === 'draft') fitSlotNames(); });
  function renderDraft0(flashIdx) {
    var S = T.state();
    renderChrome(flashIdx);
    var panel = $('offerPanel');
    if (S.awaitingLock && !S.tweakMode && !S.lockHold) startLockTimer(S); else stopLockTimer();
    if (S.awaitingLock) panel.innerHTML = R.decision(S);
    else if (S.offer) panel.innerHTML = R.offerRoll(S);
    applyPlacing();
    clockStart(); 
    keepDraft(); 
  }

  


  var desktopMQ = window.matchMedia ? window.matchMedia('(min-width: 900px)') : null;
  function isDesktop() { return !!(desktopMQ && desktopMQ.matches); }
  var placingId = null;

  function setPlacing(id) {
    placingId = id;
    applyPlacing();
  }

  
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
    if (placingId && (!S || !S.offer || S.used[placingId] || !S.offer.players.some(function (p) { return p.id === placingId; }))) placingId = null;
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

  
  
  
  var AD_EVERY = 2;
  function adDue() {
    var n = 0;
    try { n = parseInt(localStorage.getItem('racing_after_game') || '0', 10) || 0; } catch (e) {   }
    n++;
    try { localStorage.setItem('racing_after_game', String(n)); } catch (e) {   }
    return n % AD_EVERY === 0;
  }

  
  function afterResults(next) {
    if (ADS_ON && adDue()) interstitial(next);
    else next();
  }

  
  T.play = function (modeId, opts) { closeSheet(); busy = false; startGame(modeId, opts); };
  function newGame(modeId) {
    if (modeId === 'daily') { if (T.dailyStart) T.dailyStart(); return; }
    
    
    if (modeId === 'wc') {
      if (!wcOn()) return;
      var gate = CastAccount.wcGate || CastAccount.requireSignIn;
      if (gate && !(CastAccount.wcGate ? gate(function () { newGame('wc'); }, 'wc') : gate(function () { newGame('wc'); }, 'wc', 'wc'))) return;
    }
    
    else if (window.CastAccount && CastAccount.guestGate && !CastAccount.guestGate(function () { newGame(modeId); }, modeId)) return;
    closeSheet();
    busy = false;
    startGame(modeId);
  }

  T.showScreen = show; 
  T.ouHome = function () { goHome(); };
  function goHome() {
    if (window.CG && window.CG.leave) { closeSheet(); busy = false; window.CG.leave(); return; } 
    closeSheet();
    busy = false;
    renderHome();
    renderHomeAd();
    show('home');
  }

  function startGame(modeId, opts) {
    
    var want = (T.MODES[modeId] || T.MODES.plus).dataset || 'nrl';
    if (T.DATASET !== want && !T.useDataset(want)) {
      busy = true;
      T.loadDataset(want).then(function () { busy = false; T.useDataset(want); startGame(modeId, opts); },
        function () { busy = false; toast('Could not load the players. Check your connection and try again.'); });
      return;
    }
    if (modeId !== 'daily') selectedMode = modeId; 
    dropDraft(modeId); 
    T.newGame(modeId, opts); 
    
    
    var NS = T.state(), tierW = window.CastAccount && CastAccount.wildcardCount ? CastAccount.wildcardCount() : null;
    var extra = window.CastAccount && CastAccount.profileRerolls ? CastAccount.profileRerolls() : 0;
    
    if (NS.mode.paidOnly) { NS.wcStart = { reroll: 0, scout: 0, tweak: 0 }; NS.wcLocked = tierW === 0; }
    else if (NS.mode.wildcards && tierW !== null) setTierWildcards(NS, tierW);
    else if (NS.mode.wildcards && extra) { NS.wildcards.reroll += extra; NS.profileRerolls = extra; }
    NS.subLeft = NS.mode.wildcards && !NS.mode.paidOnly && window.CastAccount && CastAccount.hasPass && CastAccount.hasPass() ? 1 : 0; 
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
    if (offer && offer.il) { T.track('ileg_natural_shown', { mode: S.mode.name }); ilReveal([T.byId[offer.il]], false, renderDraft); }
    else if (offer && offer.special) packIntro(offer.special, renderDraft, offer.lifeline); else renderDraft();
  }

  

  function packIntro(kind, done, lifeline, paid) {
    var imm = kind === 'immortal';
    T.track(imm ? 'immortal_pick_shown' : 'legends_pick_shown', { mode: T.state().mode.name, lifeline: lifeline ? 'yes' : 'no', paid: paid ? 'yes' : 'no' });
    if (reduceMotion) { done(); return; }
    


    var CI = window.CastIntl, S0 = T.state(), three = S0 && S0.offer ? S0.offer.players.slice(0, 3) : [];
    if (CI && CI.reveal && three.length) {
      


      var K = window.CastKits, horseKey = function (h) { return String(h || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); };
      var sides = {}, side = function (p) {
        var k = p && p.id;
        if (!k || sides[k]) return;
        var L = T.look(p), own = T.silksOf(p), sk = own || T.NEUTRAL_SILKS, nm = L.horse || 'Racing Silks', hk = own ? horseKey(own.horse) : '';
        sides[k] = { name: nm, short: nm, code: '', c1: L.primary, c2: L.accent, glow: L.primary, fill: true,
          draw: function (w, h) {
            if (K && K.drawFill && hk && K.has('racing', hk)) return K.drawFill('racing', hk, { w: w, h: h });
            return T.silksSvg(sk, w, h);
          } };
      };
      var greats = (T.LEGENDS || []).concat(three);
      greats.forEach(side);
      var pool = greats.map(function (p) { return p.id; }).filter(function (k, i, a) { return a.indexOf(k) === i; });
      var reels = three.map(function (p) { return { nation: p.id, name: p.name, sub: '' }; });
      
      reels.forEach(function (r, i) { if (T.isGoat(three[i])) r.nationName = '\uD83D\uDC10 The GOAT'; });
      busy = true;
      sfx.win();
      try {
        CI.reveal({ reels: reels, sides: sides, pool: pool, kicker: paid ? 'Your Legend Pick' : imm ? 'Legend Pick' : '\u2B50 Legends Pick',
          title: imm ? 'Three of the Saddle\u2019s Legends' : 'You\u2019ve Unlocked a Legend!', sub: imm ? '' : 'Pick one of three all-time great jockeys', tone: imm ? '' : 'bronze', done: function () { busy = false; done(); } });
      } catch (e) { busy = false; done(); }
      return;
    }
    busy = true;
    var el = document.createElement('div');
    el.className = 'pack-intro is-' + kind;
    el.setAttribute('role', 'status');
    el.innerHTML = '<div class="pi-rays" aria-hidden="true"></div>' +
      '<div class="pi-card" aria-hidden="true"><div class="pi-card-face"><span class="pi-emblem">' + (imm ? '&#x1F410;' : '&#x2B50;') + '</span><span class="pi-card-word">' + (imm ? 'IMMORTAL' : 'LEGENDS') + '</span></div></div>' +
      '<div class="pi-text"><span class="pi-kicker">' + (paid ? 'Your Legend Pick' : imm ? 'Rarest pull in the game' : '&#x2B50; Legends Pick') + '</span>' +
      '<span class="pi-title">' + (imm ? 'Legend Pick' : 'You&rsquo;ve Unlocked a Legend!') + '</span>' +
      '<span class="pi-sub">' + (imm ? 'Three of the saddle&rsquo;s Legends. Pick one.' : 'Pick one of three all-time great jockeys') + '</span></div>';
    document.body.appendChild(el);
    sfx.win();
    var finished = false;
    function end() {
      if (finished) return; finished = true;
      el.classList.add('is-out');
      setTimeout(function () { el.remove(); busy = false; done(); }, 280);
    }
    el.addEventListener('click', end);
    setTimeout(end, imm ? 2600 : 2100);
  }

  


  function ilReveal(players, paid, done) {
    var CI = window.CastIntl, list = (players || []).filter(Boolean);
    if (!CI || !CI.reveal || !list.length) { done(); return; }
    busy = true;
    try {
      CI.reveal({
        reels: list.slice(0, 3).map(function (p) { return { nation: T.lastClub(p), name: p.name, sub: paid ? T.positionsOf(p).map(T.posLabel).join('/') : T.positionsOf(p).map(function (c) { return T.POS_NAMES[c] || c; }).join('/') }; }), 
        kicker: paid ? 'World Legend Pick' : 'World Legend', title: paid ? 'Your World Legends' : '',
        done: function () { busy = false; done(); }
      });
    } catch (e) { busy = false; done(); }
  }

  function onPick(id) {
    var S = T.state();
    if (busy || S.finished || S.tweakMode) return;
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

  function place(id, code, slotIdx) {
    var S = T.state();
    var p = T.byId[id];
    
    if (S.offer && S.offer.paid && !S.offer.taken) {
      if (busy || !window.CastAccount || !CastAccount.pickUse) return;
      var item = S.offer.item || 'imm', isIL = item === 'ileg';
      busy = true; closeSheet();
      CastAccount.pickUse(item, 'racing').then(function () {
        busy = false;
        if (T.state() !== S || !S.offer || !S.offer.paid) return;
        S.offer.taken = true;
        if (isIL) S.ilegUsed = (S.ilegUsed || 0) + 1; else S.immUsed = (S.immUsed || 0) + 1;
        T.track(item + '_pick_chosen', { mode: S.mode.name, player: p ? p.name : '' });
        place(id, code, slotIdx);
      }, function (err) {
        busy = false;
        toast((err && err.message) || 'Your ' + (isIL ? 'World Legend Pick' : 'Legend Pick') + ' did not go through. Try again.');
      });
      return;
    }
    
    if (p && p.il && S.il && S.il.shown === p.id && !(S.offer && S.offer.paid)) T.track('ileg_natural_taken', { mode: S.mode.name, player: p.name });
    


    var src = S.offer && S.offer.paid ? (S.offer.item === 'ileg' ? 'L' : 'I') : p && p.il && S.il && S.il.shown === p.id ? 'F'
      : S.offer && S.offer.goat ? 'G' : S.offer && S.offer.key ? 'K' : '';
    var idx = T.pick(id, code, slotIdx);
    if (idx == null) return;
    S.srcOf = S.srcOf || {};
    if (src) S.srcOf[p.id] = src; else delete S.srcOf[p.id];
    
    if (T.promoTier && T.promoTier(p) && window.CastAccount && window.CastAccount.unlock && !S.qd) window.CastAccount.unlock([T.promoTrophy()]);
    placingId = null;
    closeSheet();
    sfx.pick();
    busy = true;
    
    $('offerPanel').innerHTML = R.reveal(p);
    renderChrome(idx);
    
    if (src === 'G' && window.CastCelebrate && window.CastCelebrate.goatLand) window.CastCelebrate.goatLand(document.querySelector('.slot[data-slot="' + idx + '"]'), { tone: tone });
    setTimeout(function () {
      if (T.state() !== S) return; 
      busy = false;
      settle();
    }, reduceMotion ? 300 : 1100);
  }

  
  
  function removeStillOnSale(S, out) {
    return !out.win && out.reason === 'under' && S.mode.wildcards && S.wildcards.tweak < 1 &&
      !!(window.CastAccount && CastAccount.canBuyRemove && CastAccount.canBuyRemove());
  }
  






  function goHigher(S, out) {
    if (!out.win || out.reason !== 'hit' || S.mode.rule !== 'atleast' || !S.mode.wildcards || S.daily || S.qd) return false;
    if (S.wildcards.tweak > 0) return true;
    var A = window.CastAccount;
    return !!A && ((A.removesSaved && A.removesSaved() > 0) || (A.canBuyRemove && A.canBuyRemove()));
  }
  function goHigherHow(S) { return S.wildcards.tweak > 0 ? 'own' : window.CastAccount && CastAccount.removesSaved && CastAccount.removesSaved() > 0 ? 'saved' : 'buy'; }
  
  function settle() {
    var S = T.state();
    var out = T.outcome(false);
    var higher = !!out && goHigher(S, out);
    if (out && !removeStillOnSale(S, out) && !higher) { finish(out); return; }
    if (higher) {
      if (S.ghCopy == null) { var ghN = 0; try { ghN = +localStorage.getItem('racing_gh') || 0; localStorage.setItem('racing_gh', String(ghN + 1)); } catch (e) {   } S.ghCopy = ghN % 2; }
      T.track('go_higher_view', { mode: S.mode.name, total: out.total, how: goHigherHow(S) });
    }
    if (T.filledCount() === S.slots.length) {
      S.lockHold = false; 
      S.awaitingLock = true;
      S.offer = null;
      renderDraft();
      return;
    }
    S.awaitingLock = false;
    if (S.offer) renderDraft();
    else nextOffer();
  }

   
  var WC_FX = {
    reroll: { ico: '\uD83D\uDD04', title: 'Reroll!', sub: 'New players to choose' },
    scout:  { ico: '\uD83D\uDC40', title: 'Reveal!', sub: 'Your decision just got easier' },
    tweak:  { ico: '\u274C', title: 'Remove!', sub: 'Tap a jockey on your card' },
    removed:{ ico: '\u274C', title: 'Removed!', sub: '' },
    sub:    { ico: '\uD83D\uDD01', title: 'Substitute', sub: '' } 
  };
  function wildcardBurst(kind, cls, sub) {
    if (reduceMotion) return false;
    var fx = WC_FX[kind];
    var el = document.createElement('div');
    el.className = 'wc-burst wc-burst-' + cls;
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<span class="wcb-ring"></span><span class="wcb-ring wcb-ring2"></span>' +
      '<span class="wcb-card"><span class="wcb-ico">' + fx.ico + '</span>' +
      '<span class="wcb-title">' + fx.title + '</span>' +
      '<span class="wcb-sub">' + R.esc(sub == null ? fx.sub : sub) + '</span></span>';
    document.body.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 1400);
    return true;
  }
  
  function markUsed(key) {
    var b = document.querySelector('#offerPanel .wc-' + key);
    if (b) b.classList.add('just-used');
  }
  
  function countRevealed() {
    Array.prototype.forEach.call(document.querySelectorAll('#offerPanel .tries-badge.is-revealed'), function (badge, i) {
      var strong = badge.querySelector('strong');
      var to = parseInt(strong.textContent.replace(/\D/g, ''), 10) || 0;
      badge.classList.add('is-popping');
      badge.style.animationDelay = (i * 90) + 'ms';
      if (reduceMotion || !to) return;
      strong.textContent = '0';
      var start = null, delay = i * 90, dur = 750;
      function step(ts) {
        if (start === null) start = ts + delay;
        var t = Math.max(0, Math.min(1, (ts - start) / dur));
        strong.textContent = T.fmt(Math.round(to * (1 - Math.pow(1 - t, 3))));
        if (t < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }

  function onWildcard(key) {
    var S = T.state();
    if (busy || !S) return;
    placingId = null;
    if (key === 'sub') {
      if (S.subMode) S.subMode = null;
      else if (T.canSub()) { S.subMode = { from: null }; S.tweakMode = false; sfx.wild(); toast('Tap a lit-up player to move them'); }
      renderDraft();
      if (S.subMode && !isDesktop()) { var pp = $('pitch'); if (pp) pp.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' }); }
      return;
    }
    if (key === 'reroll') {
      if (!T.canUse('reroll')) return;
      sfx.wild();
      {
        T.useReroll();
        var rolled = S.offer && S.offer.il ? T.byId[S.offer.il] : null; 
        if (rolled) { T.track('ileg_natural_shown', { mode: S.mode.name }); ilReveal([rolled], false, renderDraft); } else renderDraft();
        wildcardBurst('reroll', 'reroll');
        markUsed('reroll');
        if (!S.wildcards.reroll && window.CastAccount && CastAccount.nudgeBonus && S.mode.wildcards) setTimeout(function () { CastAccount.nudgeBonus(grantBonus(S)); }, 1600);
        var cards = document.querySelector('#offerPanel .offer-cards');
        if (cards) cards.classList.add('is-rerolled');
      }
      return;
    }
    if (key === 'scout') {
      if (T.useScout()) {
        sfx.wild();
        renderDraft();
        wildcardBurst('scout', 'scout');
        markUsed('scout');
        countRevealed();
      }
      return;
    }
    if (key === 'tweak') {
      if (S.tweakMode) T.armTweak(false);
      else if (T.armTweak(true)) { sfx.wild(); if (!wildcardBurst('tweak', 'tweak')) toast('Tap a jockey on your card to remove them'); }
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
      else toast(p ? p.name + ' has no other open race they can ride' : 'Tap a lit-up jockey first');
      return;
    }
    if (idx === m.from) { m.from = null; renderDraft(); return; }
    var moved = T.subMove(m.from, idx);
    if (!moved) return;
    sfx.wild();
    T.track('wildcard_used', { wildcard: 'sub', mode: S.mode.name });
    if (!wildcardBurst('sub', 'sub', moved.name + ' moves to ' + T.POS_NAMES[S.slots[idx].code])) toast(moved.name + ' moves to ' + T.POS_NAMES[S.slots[idx].code]);
    
    if (S.offer && S.offer.players && !S.offer.players.some(function (x) { return T.openCodesFor(x).length; })) nextOffer(); else renderDraft();
  }

  function onSlot(idx) {
    var S = T.state();
    if (S && S.subMode && !busy) { onSubSlot(idx); return; }
    if (S && placingId && !busy && !S.slots[idx].player) {
      var code = S.slots[idx].code;
      if (T.openCodesFor(T.byId[placingId]).indexOf(code) !== -1) place(placingId, code, idx);
      return;
    }
    if (!S || !S.tweakMode || busy) return;
    var p = T.applyTweak(idx);
    if (!p) return;
    clock.offer = null; 
    sfx.wild();
    
    if (!wildcardBurst('removed', 'tweak', p.name + ' is back in the pool')) toast(p.name + ' is back in the pool');
    settle();
    
    var panel = $('offerPanel');
    if (panel) {
      var top = panel.getBoundingClientRect().top + window.pageYOffset - 90;
      window.scrollTo({ top: Math.max(0, top), behavior: reduceMotion ? 'auto' : 'smooth' });
    }
  }

   

  
  function trophiesFor(S, out) {
    var ids = [], total = out.total, mode = S.mode.id, nrl = mode !== 'nrlw' && mode !== 'wc', aflwT = T.DATASETS.nrlw.target;
    var players = S.slots.filter(function (x) { return x.player; }).map(function (x) { return x.player; });
    var full = players.length === S.slots.length;
    var wc = S.wildcards || {};
    var st = S.wcStart || { reroll: 1 + (S.profileRerolls || 0), scout: 1, tweak: 1 };
    var usedWild = (st.reroll + (S.bonusRerolls || 0) - (wc.reroll || 0)) + (st.scout + (S.boughtScouts || 0) - (wc.scout || 0)) + (st.tweak + (S.boughtTweaks || 0) - (wc.tweak || 0)) > 0;
    if (nrl) {
      if (total >= T.TARGET) ids.push('hit1000');
      if (total >= T.TARGET * 1.1) ids.push('hit1100'); 
      if (total >= T.TARGET * 1.2) ids.push('hit1200'); 
      if (out.reason === 'exact') ids.push('exact');
      if (mode === 'plus' && total >= T.TARGET && total <= T.TARGET + 5) ids.push('photo'); 
      if (total >= T.TARGET * 0.99 && total < T.TARGET) ids.push('soclose'); 
      if (S.mode.wildcards && total >= T.TARGET && !usedWild) ids.push('nowild');
      
      var top10 = T.players.slice().sort(function (a, b) { return b.tries_1998_plus - a.tries_1998_plus; }).slice(0, 10);
      if (players.filter(function (p) { return top10.indexOf(p) >= 0; }).length >= 3) ids.push('goats');
      if (full && total < T.TARGET / 2) ids.push('bench'); 
      if (players.some(function (p) { return T.isLegend(p); })) ids.push('legend');
      
      var hit = total >= T.TARGET && out.reason !== 'over', luck = T.luckPct();
      if (total === 222 && mode !== 'exact') ids.push('legs11'); 
      if (hit && luck != null && luck <= -15) ids.push('odds');
      if (full) eraTrophies(players, ids);
      if (full) racingTrophies(S, out, players, ids, hit);
    } else if (mode === 'wc') {
      if (total >= T.DATASETS.wc.target) ids.push('wc200');
      T.wcTrophyIds(players, total, { usedWild: usedWild }).forEach(function (id) { ids.push(id); });
    } else {
      if (total >= aflwT) ids.push('nrlw250'); 
      if (total >= Math.round(aflwT * 1.2)) ids.push('nrlw300');
    }
    if (S.daily && out.reason === 'won') ids.push('dailywin'); 
    
    if (full && mode !== 'wc') {
      if (T.luckPct() != null && T.luckPct() >= 30) ids.push('lucky');
      if (S.slots.every(function (x) { return x.top; })) ids.push('read'); 
      
    }
    return ids;
  }
  



  function racingTrophies(S, out, players, ids, hit) {
    if (players.filter(function (p) { return p.tries_1998_plus >= 50; }).length >= 3) ids.push('rc_biggun'); 
    if (players.filter(function (p) { return (p.mc || 0) > 0; }).length >= 3) ids.push('rc_cup'); 
    if (players.filter(function (p) { return (p.cox || 0) > 0; }).length >= 3) ids.push('rc_cox'); 
    var legends = players.filter(function (p) { return p.tier; }).length;
    if (hit && legends) ids.push('legendary');
    if (hit && !legends && S.mode.id === 'plus') ids.push('pure');
  }
  


  function eraTrophies(players, ids) {
    var spans = players.map(function (p) { var m = /^(\d{4})\D+(\d{4})$/.exec(p.career_span || ''); return m ? [+m[1], +m[2]] : null; });
    if (spans.every(Boolean)) {
      if (spans.some(function (x) { return x[0] <= 1990; }) && players.some(function (p) { return p.active; })) ids.push('timetravel');
      if (spans.every(function (x) { return x[0] >= 2015; })) ids.push('fresh');
      if (spans.every(function (x) { return x[1] <= 2012; })) ids.push('oldschool');
    }
    var CA = window.CastAccount;
    if (CA && CA.nameTrophies) CA.nameTrophies(players.map(function (p) { return p.name; })).forEach(function (id) { ids.push(id); });
  }
  
  
  
  function setTierWildcards(S, n) {
    ['reroll', 'scout', 'tweak'].forEach(function (k) {
      var start = S.wcStart ? S.wcStart[k] : 1;
      if (!S.wcStart) S.wildcards[k] = n; else if (n > start) S.wildcards[k] += n - start;
    });
    S.wcStart = { reroll: Math.max(n, S.wcStart ? S.wcStart.reroll : 0), scout: Math.max(n, S.wcStart ? S.wcStart.scout : 0), tweak: Math.max(n, S.wcStart ? S.wcStart.tweak : 0) };
    S.wcLocked = n === 0;
  }
  
  
  window.addEventListener('cast:rerolls', function () { var S = T.state(); if (S && !S.finished && document.body.getAttribute('data-screen') === 'draft') renderDraft(); });
  
  window.addEventListener('cast:keys', function () { var S = T.state(); if (S && !S.finished && document.body.getAttribute('data-screen') === 'draft') renderDraft(); });
  window.addEventListener('cast:launch', function () { var S = T.state(); if (S && !S.finished && !busy && document.body.getAttribute('data-screen') === 'draft') renderDraft(); });
  window.addEventListener('cast:tier', function (e) {
    var S = T.state(), n = e.detail && e.detail.wildcards;
    if (!S || S.finished || !S.mode.wildcards || !S.wcStart || typeof n !== 'number') return;
    if (S.mode.paidOnly) { S.wcLocked = n === 0; if (document.body.getAttribute('data-screen') === 'draft') renderDraft(); return; } 
    setTierWildcards(S, n);
    if (e.detail && e.detail.tier === 'pass' && !S.subUsed && !S.subLeft) S.subLeft = 1;
    if (document.body.getAttribute('data-screen') === 'draft') renderDraft();
  });

  function grantBonus(BS) {
    return function () {
      if (T.state() !== BS || BS.finished) return;
      BS.wildcards.reroll++;
      BS.bonusRerolls = (BS.bonusRerolls || 0) + 1;
      toast('\uD83C\uDF81 Bonus reroll added. Thanks for the follow!');
      renderDraft();
    };
  }

  


  function sheetHooks() {
    if (!window.CAST_ACCOUNT) return;
    window.CAST_ACCOUNT.startChallenge = function (c) { return startChallenge(c); };
    window.CAST_ACCOUNT.quickDraft = function (c) { return quickDraft(c); };
    window.CAST_ACCOUNT.club = function (id) {
      var p = id && T.byId[id];
      if (!p) return null; 
      var L = T.look(p);
      return { abbr: '', bg: L.primary, fg: L.text, name: L.horse ? 'Silks of ' + L.horse : 'Racing silks' };
    };
    var sheetNames = null, sheetCount = -1;
    var wcNames = null, wcCount = -1;
    window.CAST_ACCOUNT.player = function (game, name, mode) {
      if (game !== 'racing') return null;
      
      if (mode === 'wc') {
        var wp = (T.DATASETS.wc && T.DATASETS.wc.pool) || null;
        if (!wp) { T.loadDataset('wc').then(function () { if (window.CastAccount) CastAccount.refresh(); }, function () {   }); return null; }
        if (wp.players.length !== wcCount) { wcNames = {}; wcCount = wp.players.length; wp.players.forEach(function (p) { wcNames[(p.record_name || p.name).toLowerCase()] = p; }); }
        var w = wcNames[String(name).toLowerCase()];
        return w ? { tries: w.tries_1998_plus, club: T.lastClub(w), tier: '' } : null; 
      }
      var pools = ['nrl'].map(function (k) { return (T.DATASETS[k] && T.DATASETS[k].pool) || { players: [] }; });
      var n = pools[0].players.length + (T.LEGENDS || []).length;
      if (n !== sheetCount) {
        sheetNames = {}; sheetCount = n;
        
        pools.forEach(function (pl) { pl.players.forEach(function (p) { sheetNames[(p.record_name || p.name).toLowerCase()] = p; (p.was || []).forEach(function (o) { sheetNames[String(o).toLowerCase()] = p; }); }); });
        (T.LEGENDS || []).forEach(function (p) { sheetNames[(p.record_name || p.name).toLowerCase()] = p; });
        if (T.GOAT_CARD) sheetNames[T.GOAT_CARD.record_name.toLowerCase()] = T.GOAT_CARD; 
      }
      var p = sheetNames[String(name).toLowerCase()];
      return p ? { tries: p.tries_1998_plus, club: T.lastClub(p), tier: p.tier || '' } : null; 
    };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', sheetHooks); else sheetHooks();

  function finish(out) {
    var S = T.state();
    S.finished = true;
    dropDraft(S.mode.id);
    S.tweakMode = false;
    if (!S.qd) T.track('game_end', { mode: S.mode.name, result: out.win ? 'win' : 'fail', total: out.total });
    try { localStorage.setItem('racing_played', '1'); } catch (e) {   }
    $('results').innerHTML = R.results(S, out);
    
    if (window.CastAccount) {
      window.CastAccount.record({
        
        game: 'racing', mode: acctMode(S.mode.id), score: out.total, result: out.reason === 'noclub' ? 'under' : out.reason, win: out.win, top: out.reason === 'exact',
        
        picks: S.slots.filter(function (s) { return s.player; }).map(function (s) { return s.player.record_name || s.player.name; }),
        
        
        
        d: Object.assign({ sq: S.slots.filter(function (s) { return s.player; }).map(function (s) {
          var src = S.srcOf && S.srcOf[s.player.id];
          return (src ? '|||' + src : ''); 
        }) },
          S.special && S.specialDone ? { pack: S.special } : {}, S.lifelineUsed ? { lf: 1 } : {},
          T.luckPct() != null ? { lk: T.luckPct() } : {}, T.wildcardsUsed() != null ? { wc: T.wildcardsUsed() } : {},
          
          S.seed ? { seed: S.seed } : {}, S.keyUsed ? { key: S.keyUsed } : {}, S.keysUsed ? { lks: S.keysUsed } : {}, S.qd ? { qd: 1 } : {}, S.goatUsed ? { goat: 1 } : {}, S.immUsed ? { imm: S.immUsed } : {}, S.ilegUsed ? { ileg: S.ilegUsed } : {},
          S.daily ? { daily: S.daily.n, date: S.daily.date, go: S.daily.go } : {},
          
          T.DATASET !== 'nrl' ? { ds: T.DATASET } : {})
      });
      window.CastAccount.refresh();
      if (window.CastAccount.unlock && !S.qd) window.CastAccount.unlock(trophiesFor(S, out));
    }
    
    shareCard = null;
    if (T.buildShareCard) T.buildShareCard(S, out).then(function (card) { if (T.state() === S) shareCard = card; });
    if (out.win) sfx.win(); else sfx.fail();
    celebrate(S, out, function () {
      show('results');
      if (S.daily && T.dailyDone) T.dailyDone(S, out); 
      countUp($('rtNum'), 0, out.total);
    });
  }

  


  function celebrate(S, out, then) {
    if (out.reason !== 'exact' || S.qd || !window.CastCelebrate) { then(); return; }
    var A = window.CastAccount, C = window.CAST_ACCOUNT;
    
    var club = function (id) {
      var c = C && C.club ? C.club(id) : null;
      return c ? { abbr: c.abbr, bg: c.bg, fg: c.fg } : { abbr: '', bg: '#2a2a3a', fg: '#fff' };
    };
    
    var when = {};
    (S.history || []).forEach(function (h, i) { if (h && h.slot != null) when[h.slot] = i; });
    var filled = S.slots.map(function (s, i) { return { s: s, i: i }; }).filter(function (x) { return x.s.player; });
    var joined = filled.slice().sort(function (a, b) { return (when[a.i] != null ? when[a.i] : a.i) - (when[b.i] != null ? when[b.i] : b.i); });
    var sum = 0;
    var steps = joined.map(function (x) {
      var t = x.s.player.tries_1998_plus || 0;
      sum += t;
      return Object.assign(club(T.slotClub(x.s)), { n: sum, label: T.surname(x.s.player.name) + ' +' + T.fmt(t) });
    });
    var last = joined[joined.length - 1];
    
    var b = A && A.myBadge ? A.myBadge() : null, colours = b && b.c1 ? [b.c1, b.c2] : null;
    if (!colours) {
      var big = filled.map(function (x) { return x.s.player; }).sort(function (x, y) { return (y.tries_1998_plus || 0) - (x.tries_1998_plus || 0); })[0], bl = big ? T.look(big) : null;
      colours = bl ? [bl.primary, bl.accent] : ['#ffffff', '#9aa4b2'];
    }
    var wins = filled.map(function (x) { return x.s.player.tries_1998_plus || 0; });
    var aj = (T.players || []).concat(T.LEGENDS || []).filter(function (p) { return p.name === 'Damien Oliver'; })[0];
    var wc = T.wildcardsUsed ? T.wildcardsUsed() : null;
    T.track('celebration_shown', { result: 'exact_1000' });
    window.CastCelebrate.show({
      id: 'cel1000', label: 'Exactly ' + T.fmt(T.TARGET), from: 0, fmt: T.fmt, steps: steps, big: T.fmt(T.TARGET), stamp: 'Exactly', line: 'Not a win wasted', colours: colours,
      cards: S.slots.map(function (s) {
        if (!s.player) return null;
        var c = club(T.slotClub(s));
        return { pos: T.raceLabel(S.slots.indexOf(s)), name: T.surname(s.player.name), val: T.fmt(s.player.tries_1998_plus || 0), vc: '#fff', abbr: c.abbr, bg: c.bg, fg: c.fg };
      }),
      rows: [[0, 1], [2, 3], [4, 5], [6, 7]], teamLabel: 'Your Card', 
      stats: [{ label: 'Biggest Pick', value: Math.max.apply(null, wins) }, { label: 'Smallest Pick', value: Math.min.apply(null, wins) }, { label: 'Average Pick', value: Math.round(sum / Math.max(1, filled.length)) }]
        .concat(wc != null ? [{ label: 'Wildcards', value: wc }] : []),
      star: last ? { label: 'The Last Pick', value: last.s.player.name, extra: '+' + T.fmt(last.s.player.tries_1998_plus || 0) } : null,
      history: aj ? { head: 'The Record', text: 'Damien Oliver holds it with ' + T.fmt(aj.tries_1998_plus) + ' Group 1 wins since 1983. Your card: exactly ' + T.fmt(T.TARGET) + '.' } : null,
      button: '\u2B50 See Your Team', done: then
    });
  }

  var shareCard = null;

  function shareText() {
    var S = T.state();
    var out = T.outcome(true);
    if (!S || !out) return '';
    var url = 'https://castgames.com.au/' + T.GAME_SLUG;
    if (window.CastAccount && window.CastAccount.inviteLink) url = window.CastAccount.inviteLink(url); 
    var score = out.reason === 'exact'
      ? 'I just hit exactly ' + T.fmt(T.TARGET) + ' Group 1 wins on ' + T.GAME_NAME + ' \uD83C\uDFAF'
      : 'I just drafted ' + T.fmt(out.total) + ' ' + T.TRY_LABEL + ' on ' + T.GAME_NAME + ' (' + S.mode.name + ') \uD83C\uDFC7';
    return score + '\nThink you can beat me? ' + url;
  }

  
  function share() {
    var text = shareText();
    if (!text) return;
    
    
    var CA = window.CastAccount;
    if (CA && CA.sharePick && T.buildShareCard) {
      var S0 = T.state(), made = null, card = function () { var S = S0; return made || (made = T.buildShareCard(S, T.outcome(true))); };
      CA.sharePick({ title: 'Share Your Team', text: shareText, name: ((shareCard && shareCard.post && shareCard.post.name) || 'my-team').replace(/\.png$/, ''), where: 'results',
        images: shareCard ? { portrait: shareCard.post, story: shareCard.story } : null,
        render: function (size) { return card().then(function (c) { return c && (size === 'story' ? c.story : c.post); }); } });
      return;
    }
    var post = shareCard && shareCard.post, story = shareCard && shareCard.story;
    if (!post && !story) {
      
      if (navigator.share && !isDesktop()) { navigator.share({ text: text }).catch(function () {}); return; }
    }
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
      '<h2 class="sheet-title center">Share Your Team</h2>' +
      '<div class="share-opts">' + opt(story, 'story', 'Story', 'Instagram, Facebook, TikTok') + opt(post, 'post', 'Post', 'Feed and group chats') + '</div>' +
      '<button type="button" class="btn btn-ghost btn-block sheet-gap" data-action="copy-share">&#x1F4CB; Copy Message</button>' +
      '<button type="button" class="btn btn-ghost btn-block sheet-gap" data-action="close-sheet">Done</button>');
  }

  
  function shareCardFile(kind) {
    var text = shareText(), card = shareCard && shareCard[kind];
    var file = card && card.file;
    if (file && navigator.canShare && navigator.share) {
      var withFile = { files: [file], text: text }, ok = false;
      try { ok = navigator.canShare(withFile); } catch (e) { ok = false; }
      if (ok) { navigator.share(withFile).catch(function () {   }); T.track('share_card', { size: kind }); return; }
    }
    if (navigator.share) navigator.share({ text: text }).catch(function () {});
  }

  function copyShare() {
    var text = shareText();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { toast('Copied. Paste it in the group chat'); }, function () { toast(text); });
    } else {
      toast(text);
    }
  }



   

  
  var rulesHtml = null;
  function openRules() {
    var show = function (html) {
      openSheet('<button type="button" class="sheet-x" data-action="close-sheet" aria-label="Close">&times;</button>' +
        '<div class="doc rules-pop">' + html + '</div>' +
        '<button type="button" class="btn btn-primary btn-block" data-action="close-sheet">Back to the game</button>');
      $('sheet').classList.add('is-rules');
      $('sheetBody').scrollTop = 0;
    };
    if (rulesHtml) { show(rulesHtml); return; }
    fetch('how-it-works.html').then(function (r) { return r.text(); }).then(function (text) {
      var doc = new DOMParser().parseFromString(text, 'text/html');
      var art = doc.querySelector('article.doc');
      if (!art) throw new Error('no rules');
      Array.prototype.forEach.call(art.querySelectorAll('.cta, .back-link'), function (el) { el.parentNode.removeChild(el); });
      rulesHtml = art.innerHTML;
      show(rulesHtml);
    }).catch(function () { location.href = 'how-it-works.html'; });
  }

  
  document.addEventListener('toggle', function (e) {
    var d = e.target;
    if (!d.classList || !d.classList.contains('faq-item') || !d.open) return;
    Array.prototype.forEach.call(document.querySelectorAll('.faq-item[open]'), function (o) { if (o !== d) o.open = false; });
  }, true);

  document.addEventListener('click', function (e) {
    var rulesLink = e.target.closest('a[href="how-it-works.html"]');
    if (rulesLink && document.body.getAttribute('data-screen') !== 'draft') {
      e.preventDefault();
      openRules();
      return;
    }
    
    
    var t = e.target.closest('.mode-card[data-mode],.mode-mini[data-mode],[data-pick],[data-place],[data-wildcard],[data-slot],[data-action],[data-track]');
    if (!t) return;

    if (t.hasAttribute('data-track')) {
      T.track(t.getAttribute('data-track'), { placement: t.getAttribute('data-where') || '' });
      if (!t.hasAttribute('data-action')) return; 
    }
    if (t.hasAttribute('data-mode')) {
      
      
      selectedMode = t.getAttribute('data-mode');
      if (selectedMode === 'ou') { if (T.ou) T.ou.open(); return; } 
      renderHome();
      if (T.players.length) newGame(selectedMode); else { startWhenReady = selectedMode; $('startBtn').hidden = false; }
      return;
    }
    if (t.hasAttribute('data-pick')) { onPick(t.getAttribute('data-pick')); return; }
    if (t.hasAttribute('data-place')) { place($('sheetBody').getAttribute('data-player'), t.getAttribute('data-place')); return; }
    if (t.hasAttribute('data-gh') && T.state()) T.track('go_higher_remove', { mode: T.state().mode.name, total: T.total(), how: goHigherHow(T.state()) }); 
    if (t.hasAttribute('data-wildcard')) { onWildcard(t.getAttribute('data-wildcard')); return; }
    if (t.hasAttribute('data-slot')) { onSlot(Number(t.getAttribute('data-slot'))); return; }

    switch (t.getAttribute('data-action')) {
      case 'home':
        e.preventDefault();
        goHome();
        break;
      case 'results-home': afterResults(goHome); break;
      case 'close-sheet': closeSheet(); break;
      case 'resume-draft': { var rd = offeredDraft(); closeSheet(); if (rd) resumeDraft(rd); break; }
      case 'drop-draft': { var dd = offeredDraft(); T.track('draft_resume_skip', { mode: dd && dd.name || '' }); if (dd) dropKey(dd.key); closeSheet(); break; }
      case 'cancel-tweak': T.armTweak(false); renderDraft(); break;
      case 'lock-in':
        stopLockTimer();
        if (T.state() && T.total() >= T.TARGET) T.track('go_higher_lock', { mode: T.state().mode.name, total: T.total(), auto: 0 });
        finish(T.outcome(true));
        break;
      case 'play-again': { 
        var wasDaily = !!(T.state() && T.state().daily);
        afterResults(function () { if (wasDaily && T.dailyStart) T.dailyStart(); else newGame(selectedMode); });
        break;
      }
      case 'restart': openSheet(R.restartSheet()); $('sheet').classList.add('is-confirm'); break;
      case 'new-game': if (T.state()) { openSheet(R.newGameSheet(T.state())); $('sheet').classList.add('is-confirm'); } break;
      case 'change-mode': if (T.state()) { openSheet(R.changeModeSheet(T.state())); $('sheet').classList.add('is-confirm'); } break;
      case 'confirm-change-mode':
        closeSheet();
        placingId = null;
        if (T.state()) { selectedMode = T.state().mode.id; T.state().finished = true; }
        dropDraft(selectedMode);
        afterResults(goHome);
        break;
      case 'confirm-restart': {
        var again = T.state() ? T.state().mode.id : selectedMode;
        closeSheet();
        afterResults(function () { newGame(again); });
        break;
      }
      case 'share': share(); break;
      case 'copy-share': copyShare(); break;
      case 'share-card': shareCardFile(t.getAttribute('data-card')); break;
      case 'buy-reroll': {
        var bs = T.state();
        if (!bs || !window.CastAccount || !CastAccount.buyReroll) break;
        
        var bTot = T.total(), bLeft = bs.slots.filter(function (x) { return !x.player; }).length, bWord = 'pick';
        var bHook = bTot < T.TARGET
          ? { title: 'You\u2019re One Good ' + 'Pick' + ' Away', line: T.fmt(bTot) + ' wins with ' + bLeft + ' ' + bWord + (bLeft === 1 ? '' : 's') + ' to go. ' + T.fmt(T.TARGET - bTot) + ' more and you hit ' + T.fmt(T.TARGET) + '.' }
          : { title: 'Chase a Bigger Score', line: T.fmt(bTot) + ' wins already. One more good ' + bWord + ' could put you on top of the leaderboard.' };
        CastAccount.buyReroll('racing', function () {
          if (T.state() !== bs) return;
          bs.wildcards.reroll += 1; bs.boughtRerolls = (bs.boughtRerolls || 0) + 1;
          if (bs.mode.paidOnly) bs.paidUsed.reroll = true; 
          onWildcard('reroll');
        }, bHook);
        break;
      }
      case 'buy-remove': { 
        var ms = T.state();
        if (!ms || !window.CastAccount || !CastAccount.buyRemove) break;
        if (ms.awaitingLock) { ms.lockHold = true; stopLockTimer(); } 
        var mTot = T.total(), mOpen = ms.slots.filter(function (x) { return !x.player; }).length, mWord = 'pick';
        var mHook = mTot >= T.TARGET ? { title: 'Chase a Bigger Score', line: T.fmt(mTot) + ' wins already. Swap your lowest pick for someone better and climb the leaderboard.' }
          : mOpen ? { title: 'Swap Out Your Weakest ' + 'Pick', line: T.fmt(mTot) + ' wins with ' + mOpen + ' ' + mWord + (mOpen === 1 ? '' : 's') + ' to go. Take one jockey off and draft that race again.' }
          : { title: 'You’re ' + T.fmt(T.TARGET - mTot) + ' Wins Short', line: 'Your card has ' + T.fmt(mTot) + ' wins. Take one jockey off, draft that race again and chase ' + T.fmt(T.TARGET) + '.' };
        CastAccount.buyRemove('racing', function () {
          if (T.state() !== ms) return;
          ms.wildcards.tweak += 1; ms.boughtTweaks = (ms.boughtTweaks || 0) + 1;
          if (ms.mode.paidOnly) ms.paidUsed.tweak = true; 
          onWildcard('tweak');
        }, mHook);
        break;
      }
      case 'buy-reveal': { 
        var vs = T.state();
        if (!vs || !window.CastAccount || !CastAccount.buyItem) break;
        var vTot = T.total(), vLeft = vs.slots.filter(function (x) { return !x.player; }).length;
        var vHook = { title: 'See Their Wins First', line: T.fmt(vTot) + ' wins with ' + vLeft + ' race' + (vLeft === 1 ? '' : 's') + ' to fill. Show the wins for everyone on this offer, then pick.' };
        CastAccount.buyItem('reveal', 'racing', function () {
          if (T.state() !== vs) return;
          vs.wildcards.scout += 1; vs.boughtScouts = (vs.boughtScouts || 0) + 1;
          if (vs.mode.paidOnly) vs.paidUsed.scout = true; 
          onWildcard('scout');
        }, vHook);
        break;
      }
      case 'imm': { 
        var ims = T.state();
        if (!ims || busy || !T.immFits() || !window.CastAccount || !CastAccount.pickState) break;
        var ist = CastAccount.pickState('imm'), deal = function () {
          if (T.state() !== ims || !T.useImm()) return;
          T.track('imm_pick_open', { mode: ims.mode.name });
          packIntro('immortal', renderDraft, false, true);
        };
        if (ist && ist.have) { deal(); break; }
        T.track('imm_pick_tap', { mode: ims.mode.name });
        CastAccount.pickBuy('imm', 'racing', deal, { kicker: 'Legend Pick', title: 'Choose a Legend', line: T.fmt(T.total()) + ' wins so far. Swap this offer for three Legends and add one with his Group 1 wins.' });
        break;
      }
      case 'ileg': { 
        var ls = T.state();
        if (!ls || busy || !T.ilFits() || !window.CastAccount || !CastAccount.pickState) break;
        var lst = CastAccount.pickState('ileg'), ldeal = function () {
          if (T.state() !== ls || !T.useIL()) return;
          T.track('ileg_pick_open', { mode: ls.mode.name });
          ilReveal(ls.offer.players, true, renderDraft);
        };
        if (lst && lst.have) { ldeal(); break; }
        T.track('ileg_pick_tap', { mode: ls.mode.name });
        CastAccount.pickBuy('ileg', 'racing', ldeal, { kicker: 'World Legend Pick', title: 'Choose a World Legend', line: T.fmt(T.total()) + ' so far. Swap this offer for three World Legends.' });
        break;
      }
      case 'imm-back': { 
        if (!busy && T.keepOffer()) renderDraft();
        break;
      }
      case 'goat': { 
        if (!T.goatFits()) break;
        openSheet(R.goatSheet()); $('sheet').classList.add('is-confirm');
        break;
      }
      case 'confirm-goat': { 
        var gs = T.state();
        closeSheet();
        if (!gs || !T.goatFits() || !window.CastAccount || !CastAccount.buyItem) break;
        CastAccount.buyItem('goat', 'racing', function () {
          if (T.state() !== gs || !T.useGoat()) return;
          T.track('goat_used', { mode: gs.mode.name });
          renderDraft();
          
          var said = function () { toast('\uD83D\uDC10 The GOAT is in: ' + T.fmt((T.goatPlayer() || {}).tries_1998_plus || 0) + ' Group 1 wins'); };
          if (window.CastCelebrate && window.CastCelebrate.goat) window.CastCelebrate.goat({ tone: tone, unit: 'Group 1 wins', done: said }); else said();
        });
        break;
      }
      case 'buy-key': { 
        var ks = T.state();
        if (!ks || !window.CastAccount || !CastAccount.buyKey) break;
        var kTot = T.total();
        CastAccount.buyKey('legend', 'racing', { title: 'Swap for a Legends Pick', line: T.fmt(kTot) + ' wins so far. Swap this offer for a Legends Pick and add a Legend\u2019s Group 1 wins.' });
        break;
      }
      case 'shop-removes': { 
        var ss = T.state();
        if (!ss || !window.CastAccount || !CastAccount.shopRemoves) break;
        if (ss.awaitingLock) { ss.lockHold = true; stopLockTimer(); renderDraft(); }
        CastAccount.shopRemoves('racing', { kicker: 'Stock Up', title: 'Stock Up on Remove Players', line: 'Save them for the games where one swap is the difference. They work in ' + T.GAME_NAME + ' and 27-0 Classic.' });
        break;
      }
      case 'bonus-reroll':
        if (window.CastAccount && T.state()) CastAccount.followBonus(grantBonus(T.state()));
        break;
      case 'legend-key': useLegendKey(); break;
      case 'legend-key-pass': if (window.CastAccount && CastAccount.openPass) CastAccount.openPass('vault'); break;
      case 'sub-pass': T.track('wildcard_locked_tap', { wildcard: 'sub' }); if (window.CastAccount && CastAccount.openPass) CastAccount.openPass('substitute'); break;
      case 'wc-signin': 
        if (window.CastAccount && CastAccount.requireSignIn) CastAccount.requireSignIn(null, 'wildcards');
        break;
    }
  });

  document.addEventListener('keydown', function (e) {
    
    
    var tg = e.target || {}, typing = /^(INPUT|TEXTAREA|SELECT)$/.test(tg.tagName || '') || tg.isContentEditable;
    if (/^[1-9]$/.test(e.key) && !e.metaKey && !e.ctrlKey && !e.altKey && !typing && document.body.getAttribute('data-screen') === 'draft' &&
        $('sheet').hidden && !document.documentElement.classList.contains('ca-open') && !$('offerPanel').classList.contains('is-clock-paused')) {
      var keyList = placingId ? document.querySelectorAll('#pitch .slot.is-target') : document.querySelectorAll('.offer-cards [data-pick]:not([disabled])');
      var keyHit = Array.prototype.filter.call(keyList, function (x) { return x.offsetParent !== null; })[+e.key - 1];
      if (keyHit) { e.preventDefault(); keyHit.click(); return; }
    }
    if (e.key === 'Escape') {
      if (placingId) setPlacing(null);
      else if (!$('sheet').hidden) closeSheet();
      else if (T.state() && T.state().tweakMode) { T.armTweak(false); renderDraft(); }
    }
  });

  $('soundToggle').addEventListener('click', function () {
    setSound(!sound);
    if (sound) { unlockAudio(); sfx.pick(); }
  });

  $('startBtn').addEventListener('click', function () {
    if (T.players.length) newGame(selectedMode);
  });

  
  
   
  function acctMode(id) { return id; }
  function gameMode(id) { return id; }
  T.acctMode = acctMode;
  


  
  
  var acctSeen = !window.CAST_ACCOUNT;
  window.addEventListener('cast-account', function (e) { var s = e.detail && e.detail.status; if (s === 'signed-in' || s === 'guest') acctSeen = true; });
  function launchKnown() { try { return !!localStorage.getItem('cast_launch_v1'); } catch (e) { return true; } }
  function dailyWhenReady(n) {
    n = n || 0;
    if (T.dailyStart && T.players.length && (!window.CAST_ACCOUNT || (window.CastAccount && ((acctSeen && launchKnown()) || n >= 40)))) { T.dailyStart(); return; }
    if (n < 75) setTimeout(function () { dailyWhenReady(n + 1); }, 200);
  }
  function playMode(modeId) {
    modeId = gameMode(modeId);
    if (modeId === 'daily') { dailyWhenReady(); return; }
    
    if (modeId === 'ou') { if (!T.ou) T.ouWanted = true; else if (T.ou.on()) { selectedMode = 'ou'; T.ou.open(); } return; }
    if (!T.MODES[modeId]) return;
    if (!T.players.length) { startWhenReady = modeId; return; } 
    var mid = document.body.getAttribute('data-screen') === 'draft' && !T.state().finished && T.filledCount() > 0;
    if (mid && !window.confirm('Leave this team and start ' + T.MODES[modeId].name + '?')) return;
    newGame(modeId);
  }
  window.addEventListener('cast:play', function (e) { var d = e.detail || {}; if (d.game === 'racing') playMode(d.mode); });
  
  function homeAgain() { if (document.body.getAttribute('data-screen') === 'home') renderHome(); }
  window.addEventListener('cast:launch', function (e) { if (e.detail && e.detail.game === 'wc') { wcBits(); homeAgain(); } if (e.detail && e.detail.game === 'po') homeAgain(); });
  
  function wcBits() {
    var on = !!(window.CastAccount && CastAccount.wcLive && CastAccount.wcLive());
    Array.prototype.forEach.call(document.querySelectorAll('[data-cast-wc]'), function (n) { n.hidden = !on; });
  }
  setTimeout(wcBits, 0);
  window.addEventListener('cast:tier', homeAgain);

   
  function useLegendKey() {
    var S = T.state();
    if (busy || !T.legendKeyFits() || !window.CastAccount || !CastAccount.useKey) return;
    busy = true;
    CastAccount.useKey('legend', 'plus').then(function () {
      busy = false;
      
      
      if (T.state() !== S || !T.useLegendKey()) {
        toast('The offer changed before your Legend Key opened. Send us a message and we\u2019ll put it back.');
        if (window.CastContact) setTimeout(function () { window.CastContact.open('pay', { msg: 'My Legend Key was used, but the offer changed before it opened. Please put it back. ' }); }, 1400);
        if (T.state() === S) renderDraft(); return;
      }
      T.track('vault_key', { key: 'legend', mode: S.mode.name });
      var offer = T.rollOffer();
      if (offer && offer.special) packIntro(offer.special, renderDraft, false); else renderDraft();
    }, function (err) { busy = false; toast((err && err.message) || 'The Vault did not open. Try again.'); renderDraft(); });
  }

  

  function startChallenge(c) {
    if (c && c.mode) c = Object.assign({}, c, { mode: gameMode(c.mode) });
    if (!c || !T.MODES[c.mode]) return false;
    if (!T.players.length) { setTimeout(function () { startChallenge(c); }, 400); return true; } 
    var S0 = T.state(), mid = document.body.getAttribute('data-screen') === 'draft' && S0 && !S0.finished && T.filledCount() > 0;
    if (mid && !window.confirm('Leave this team and play ' + (c.from || 'your friend') + '\u2019s challenge?')) return false;
    closeSheet();
    busy = false;
    startGame(c.mode, { seed: c.seed, challenge: true });
    return true;
  }

  





  var QD_CAP = { nrl: 900 }; 
  
  
  function qdOptions(snap, exact) {
    T.restore(snap);
    var S = T.state(), out = [], room = T.TARGET - T.total();
    (S.offer ? S.offer.players : []).forEach(function (p) {
      if (exact && p.tries_1998_plus > room) return;
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
  
  function qdRollout(snap, exact) {
    var plan = [], s = snap;
    for (var guard = 0; guard < 20; guard++) {
      T.restore(s);
      if (T.filledCount() === T.state().slots.length) return { plan: plan, total: T.total() };
      var opts = qdOptions(s, exact).filter(function (x) { return !x.reroll; });
      if (!opts.length) return null;
      var o = opts.reduce(function (a, b) { return b.t > a.t ? b : a; });
      var nx = qdApply(s, o);
      if (!nx) return null;
      plan.push(o); s = nx;
    }
    return null;
  }
  function qdSearch(exact, width) {
    var root = T.snapshot(), cap = QD_CAP[T.DATASET] || 900, best = null, beam = [{ snap: root, plan: [] }];
    function consider(plan, total) { if (total <= cap && (!best || total > best.total)) best = { plan: plan, total: total }; }
    var first = qdRollout(root, exact);
    if (first) consider(first.plan, first.total);
    return new Promise(function (ok) {
      (function depth() {
        var kids = [];
        beam.forEach(function (b) {
          qdOptions(b.snap, exact).forEach(function (o) {
            var nx = qdApply(b.snap, o);
            if (!nx) return;
            var plan = b.plan.concat([o]), r = qdRollout(nx, exact);
            if (!r) return;
            consider(plan.concat(r.plan), r.total);
            kids.push({ snap: nx, plan: plan, full: !r.plan.length, score: r.total <= cap ? r.total : -1 });
          });
        });
        kids.sort(function (a, b) { return b.score - a.score; });
        beam = kids.filter(function (k) { return !k.full; }).slice(0, width);
        if (!beam.length || (exact && best && best.total === T.TARGET)) { T.restore(root); return ok(best); }
        setTimeout(depth, 0); 
      })();
    });
  }
  var qdOn = false;
  function quickDraft(c) {
    if (c && c.mode) c = Object.assign({}, c, { mode: gameMode(c.mode) });
    if (!c || ['plus', 'exact'].indexOf(c.mode) === -1) return Promise.reject(new Error('Quick Draft plays ' + T.GAME_NAME + ' challenges.'));
    var S0 = T.state();
    if (document.body.getAttribute('data-screen') === 'draft' && S0 && !S0.finished && T.filledCount() > 0) return Promise.reject(new Error('Finish or leave the team you are drafting first.'));
    if (qdOn) return Promise.reject(new Error('Quick Draft is already drafting.'));
    var want = T.MODES[c.mode].dataset || 'nrl';
    qdOn = true;
    
    return Promise.all([T.players.length ? null : T.loadPlayers(), T.loadLegends()]).then(function () {
      if (T.DATASET !== want && !T.useDataset(want)) return T.loadDataset(want).then(function () { T.useDataset(want); });
      return null;
    }).then(function () {
      stopLockTimer(); closeSheet();
      selectedMode = c.mode; placingId = null; shownTotal = 0;
      T.newGame(c.mode, { seed: c.seed, challenge: true });
      var S = T.state();
      if (S.seed !== c.seed || S.mode.id !== c.mode) throw new Error('The challenge did not start. It is still waiting.');
      S.qd = true;
      
      var tierW = window.CastAccount && CastAccount.wildcardCount ? CastAccount.wildcardCount() : null;
      if (S.mode.wildcards && !S.mode.paidOnly && tierW !== null) setTierWildcards(S, tierW);
      busy = true; 
      var exact = S.mode.rule === 'exact';
      T.rollOffer(); 
      return qdSearch(exact, 4).then(function (best) {
        if (!best) throw new Error('Quick Draft could not find a team for this draft. It is still waiting.');
        var s = T.snapshot();
        best.plan.forEach(function (o) { if (s) s = qdApply(s, o); });
        if (!s || T.filledCount() !== S.slots.length) throw new Error('Quick Draft lost its place in the draft. It is still waiting.');
        busy = false;
        finish(T.outcome(true));
      });
    }).then(function () { qdOn = false; }, function (e) { qdOn = false; busy = false; throw e; });
  }

  





  var LS_DRAFT = 'racing_draft_v1', DRAFT_MS = 24 * 3600000;
  


  function draftKey(mode) { return !mode || mode === 'plus' ? LS_DRAFT : LS_DRAFT + '_' + mode; }
  function draftModeOf(d) { return (d && (d.mode || d.sel)) || 'plus'; }
  function dropKey(k) { try { if (k) localStorage.removeItem(k); } catch (e) {   } }
  
  var DRAFT_TAB = Math.random().toString(36).slice(2, 10);
  function draftWho() { return (window.CastAccount && CastAccount.uid && CastAccount.uid()) || 'guest'; }
  function draftRaw(mode) { try { return JSON.parse(localStorage.getItem(draftKey(mode)) || 'null'); } catch (e) { return null; } }
  
  function draftWorth(S) {
    return T.filledCount() > 0 || S.offerNo > 1 || !!(S.keysUsed || S.keyUsed || S.immUsed || S.ilegUsed || S.goatUsed || S.subUsed ||
      S.boughtRerolls || S.boughtScouts || S.boughtTweaks || Object.keys(S.paidUsed || {}).length);
  }
  function keepDraft() {
    var S = T.state();
    
    if (!S || S.finished || S.daily || S.qd || S.challenge || !S.mode || !draftWorth(S)) return;
    if (!S.draftId) S.draftId = Math.random().toString(36).slice(2, 12);
    var cur = draftRaw(S.mode.id), me = draftWho();
    if (cur && cur.id === S.draftId && cur.tab !== DRAFT_TAB) { draftTaken(); return; }
    if (cur && cur.id === S.draftId && cur.who !== 'guest' && cur.who !== me) { dropDraft(S.mode.id); return; } 
    try {
      var s = JSON.stringify(S, function (k, v) {
        if (k === 'promoDef') return undefined;
        if (k === 'mode' && v && T.MODES[v.id] === v) return { __m: v.id };
        if (v && typeof v === 'object' && typeof v.id === 'string' && T.byId[v.id] === v) return { __p: v.id };
        return v;
      });
      var clockLeft = clock.iv && clock.offer === S.offer ? Math.max(0, clock.end - Date.now()) : null;
      localStorage.setItem(draftKey(S.mode.id), JSON.stringify({ v: 1, id: S.draftId, tab: DRAFT_TAB, who: me, at: Date.now(), ds: T.DATASET, target: T.TARGET, sel: selectedMode, mode: S.mode.id,
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
    if (!e.key || (e.key !== LS_DRAFT && e.key.indexOf(LS_DRAFT + '_') !== 0)) return;
    var S = T.state(), d = null;
    try { d = JSON.parse(e.newValue || 'null'); } catch (x) { d = null; }
    if (S && !S.finished && S.draftId && d && d.id === S.draftId && d.tab !== DRAFT_TAB) draftTaken();
  });
  function dropDraft(mode) { dropKey(draftKey(mode)); }
  
  function savedDraft(mode) {
    var keys = [], best = null;
    try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k === LS_DRAFT || (k && k.indexOf(LS_DRAFT + '_') === 0)) keys.push(k); } } catch (e) { return null; }
    keys.forEach(function (k) {
      var d = null;
      try { d = JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { d = null; }
      if (!d || d.v !== 1 || typeof d.s !== 'string' || !(Date.now() - d.at < DRAFT_MS)) { if (d) dropKey(k); return; }
      d.key = k;
      if ((!mode || draftModeOf(d) === mode) && (!best || d.at > best.at)) best = d;
    });
    return best;
  }
  function resumeDraft(d) {
    var go = function () {
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
      if (miss || !S || !S.mode || !Array.isArray(S.slots) || S.finished) { dropKey(d.key); toast('That draft could not be brought back. Sorry!'); return; }
      S.promoDef = window.CAST_PROMO && window.CAST_PROMO.of ? window.CAST_PROMO.of(S.seed) : null;
      T.adopt(S);
      if (d.target) T.TARGET = d.target;
      resumeClock = typeof d.clock === 'number' ? d.clock : null; resumeLock = typeof d.lock === 'number' ? d.lock : null;
      try { var mine = Object.assign({}, d, { tab: DRAFT_TAB, at: Date.now(), mode: S.mode.id }); delete mine.key; localStorage.setItem(draftKey(S.mode.id), JSON.stringify(mine)); if (d.key && d.key !== draftKey(S.mode.id)) dropKey(d.key); } catch (e) {   } 
      selectedMode = d.sel || S.mode.id;
      placingId = null; shownTotal = 0; busy = false;
      T.track('draft_resume', { mode: S.mode.name, picks: T.filledCount() });
      show('draft');
      if (!S.offer && !S.awaitingLock) nextOffer(); else renderDraft();
    };
    if (T.DATASET === d.ds || T.useDataset(d.ds)) { go(); return; }
    busy = true;
    T.loadDataset(d.ds).then(function () { busy = false; T.useDataset(d.ds); go(); },
      function () { busy = false; toast('Could not load the players. Check your connection and try again.'); });
  }
  




  var bootMode = null, bootWait = false;
  function bootOn() { return document.documentElement.classList.contains('play-boot'); }
  function bootEnd() { document.documentElement.classList.remove('play-boot'); if (window.CG && window.CG.bootDone) window.CG.bootDone(); }
  function bootIdleWatch() {
    var check = function () {
      if (!bootOn() || bootWait || busy || !T.players.length || document.documentElement.classList.contains('ca-open') || !$('sheet').hidden) return;
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
    if (mode === 'aflw') mode = 'nrlw'; 
    bootMode = mode;
    bootIdleWatch();
    if (/#(challenge|cast-profile|my-cast|leaderboards|cast-pass|join|admin)/.test(location.hash) || /[?&](challenge|vs)=/.test(location.search)) return;
    
    
    var gated = mode === 'ou' ? function () { return !T.ou || T.ou.on(); } : mode === 'wc' ? wcOn : null;
    if (gated && !gated()) {
      bootWait = true;
      var n = 0;
      (function wait() { if (gated() || ++n > 40) { bootWait = false; bootGo(mode); return; } setTimeout(wait, 200); })();
      return;
    }
    bootGo(mode);
  }
  function bootGo(mode) {
    var d = mode === 'daily' || mode === 'ou' ? null : savedDraft(mode);
    if (!d) { playMode(mode); return; }
    var done = false, decide = function () {
      if (done) return;
      done = true;
      var now = savedDraft(mode);
      if (now && draftWho() === now.who) resumeDraft(now); else playMode(mode);
    };
    
    var signedBefore = false;
    try { signedBefore = localStorage.getItem('cast_signed_in') === '1'; } catch (e) {   }
    if (draftWho() === d.who && !(d.who === 'guest' && signedBefore)) { decide(); return; }
    var on = function (e) {
      var st = e.detail && e.detail.status;
      if (st !== 'signed-in' && st !== 'guest') return;
      window.removeEventListener('cast-account', on);
      decide();
    };
    window.addEventListener('cast-account', on);
    setTimeout(decide, 6000); 
  }
  
  var offered = null; 
  function offeredDraft() { return offered ? savedDraft(draftModeOf(offered)) : savedDraft(); }
  function offerResume() {
    var d = savedDraft();
    if (!d || /#(challenge|cast-profile|leaderboards|cast-pass)/.test(location.hash)) return;
    var ask = function () {
      if (document.documentElement.classList.contains('ca-open')) { setTimeout(ask, 1500); return; } 
      var now = savedDraft(draftModeOf(d));
      if (!now || now.at !== d.at || draftWho() !== d.who || document.body.getAttribute('data-screen') !== 'home' || !$('sheet').hidden) return;
      T.track('draft_resume_offer', { mode: d.name, picks: d.picks });
      offered = d;
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

   

  setSound(sound);
  checkImages();
  renderHome();
  document.body.setAttribute('data-screen', 'home');

  var startWhenReady = null; 
  T.loadPlayers().then(function (players) {
    var btn = $('startBtn');
    btn.disabled = false;
    btn.textContent = 'Play now';
    btn.hidden = true;
    homeAgain(); 
    if (startWhenReady) { var go = startWhenReady; startWhenReady = null; newGame(go); return; }
    var play = /[?&]play=(plus|exact|daily|ou)(?=&|#|$)/.exec(location.search) || (/[?&]po=[a-z0-9]+/.test(location.search) ? [0, 'ou'] : null) || (window.CG_MODE ? [0, window.CG_MODE] : null); 
    if (!play) offerResume();
    if (play) {
      try { history.replaceState(null, '', location.pathname + location.search.replace(/([?&])play=[^&#]*&?/, '$1').replace(/[?&]$/, '') + location.hash); } catch (e) {   }
      bootPlay(play[1]);
    }
  }).catch(function () {
    $('startBtn').textContent = 'Could not load players';
    $('startBtn').hidden = false;
    $('packNote').textContent = 'Check your connection and refresh the page to try again.';
  });
})(window.T = window.T || {});
