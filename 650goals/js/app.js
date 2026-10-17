/* 650 GOALS app controller: screens, events, flow, sound, ads. */
(function (T) {
  'use strict';

  var R = T.render;
  var $ = function (id) { return document.getElementById(id); };
  var selectedMode = 'plus'; // 4000+ is the default on home
  var busy = false;          // blocks input during spin and reveal animations
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Screens */

  function show(name) {
    if (bootOn()) bootEnd(); // opened on a mode (index.html): the screens show from here
    ['home', 'draft', 'results', 'ou'].forEach(function (n) {
      var el = $('screen-' + n);
      if (el) el.classList.toggle('is-active', n === name); // the over/under screen comes with its own mode later
    });
    document.body.setAttribute('data-screen', name);
    // Mode skin: the mode's colour runs through the draft and results (see 'Mode skins' in main.css)
    if (name === 'home') document.body.removeAttribute('data-mode'); else document.body.setAttribute('data-mode', selectedMode);
    // Mid-draft, footer page links open in a new tab so the current team survives
    Array.prototype.forEach.call(document.querySelectorAll('.footer-links a[href$=".html"]'), function (a) {
      if (name === 'draft') { a.target = '_blank'; a.rel = 'noopener'; } else { a.removeAttribute('target'); }
    });
    window.scrollTo(0, 0);
  }

  /* Image fallbacks for logo slots Michael fills later */

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

  /* Unibet creative, same setup as 27-0: manifests list the files, duplicates weight the rotation.
     Files live in assets/cp/ with short neutral names, because content blockers strip
     anything whose path contains words like unibet, partners, banner or popup. */

  // Unibet ads are switched off (no current deal). To bring them back: set ADS_ON to true,
  // restore assets/cp/ from git history, and re-add the Advertising section to privacy.html.
  var ADS_ON = false;
  var ADS_DIR = 'assets/cp/';
  var AD_LISTS = { homepage: 'h.json', popup: 't.json' }; // h = holding banners, t = takeover popups
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
  // Popups preload so the interstitial is instant
  if (ADS_ON) loadManifest('popup').then(function () {
    adLists.popup.forEach(function (f) { var i = new Image(); i.src = ADS_DIR + encodeURIComponent(f); });
  });
  if (ADS_ON) loadManifest('homepage').then(renderHomeAd);

  // CAST Pass holders see no ads: no home banner and no pop-up between games
  function adFree() { return !!(window.CastAccount && CastAccount.hasPass && CastAccount.hasPass()); }
  function renderHomeAd() {
    var slot = $('homeAd');
    if (slot) slot.innerHTML = adFree() ? '' : R.unibet('home');
  }
  window.addEventListener('cast:tier', function () { if (document.body.getAttribute('data-screen') === 'home') renderHomeAd(); });

  // Full-screen popup with a 7s countdown (27-0 pattern). Calls done() when closed.
  // The image is loaded first; if it is blocked or fails, the popup is skipped entirely.
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

  /* Latest YouTube videos. Reuses the media kit's feed (refreshed there by its GitHub job),
     so there is nothing to maintain here. If it cannot load, the section stays hidden. */

  var VIDEO_FEED = 'https://mediakit.thecastpatrol.com.au/data/episodes.json';
  function loadVideos() {
    if (!$('watch')) return; // NRL videos are on NRL games only (the owner, 16 Oct 2026)
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
      .catch(function () { /* keep hidden */ });
  }
  loadVideos();

  /* Sound (on by default; a player's mute choice is remembered in their browser) */

  var sound = true;
  var ctx = null;
  try { sound = localStorage.getItem('500goals_sound_v2') !== 'off'; } catch (e) { /* storage blocked */ }

  function setSound(on) {
    sound = on;
    var b = $('soundToggle');
    b.setAttribute('aria-pressed', String(on));
    b.setAttribute('aria-label', on ? 'Sound on' : 'Sound off');
    b.classList.toggle('is-on', on);
    var l = b.querySelector('.sound-lbl');
    if (l) l.textContent = on ? 'Sound On' : 'Sound Off';
    try { localStorage.setItem('500goals_sound_v2', on ? 'on' : 'off'); } catch (e) { /* ignore */ }
  }

  // iPhones only let a page make sound if its audio engine is created or resumed inside a tap.
  // So: unlock on the first touch/click anywhere, re-wake after the phone sleeps or the tab
  // is hidden, and never create the engine from a timer (that leaves it locked and silent).
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

  // iOS: play on the "ambient" channel, which mixes with the player's own music (Spotify, Apple Music) instead
  // of stopping it. The trade-off: the Ring/Silent switch mutes game sounds, like most games.
  var unlocked = false;
  function useMediaChannel() {
    try { if (navigator.audioSession) navigator.audioSession.type = 'ambient'; } catch (e) { /* not supported */ }
  }

  function unlockAudio() {
    if (!sound || !AC) return;
    try {
      if (!unlocked) useMediaChannel();
      var c = audioReady();
      // A one-sample silent buffer played inside the tap is what unlocks Web Audio on iOS
      var buf = c.createBuffer(1, 1, 22050);
      var src = c.createBufferSource();
      src.buffer = buf;
      src.connect(c.destination);
      src.start(0);
      if (c.state === 'running') unlocked = true;
    } catch (e) { /* audio unavailable */ }
  }
  // Only events iOS treats as a real tap (pointerdown does not count on some versions)
  ['touchend', 'click', 'keydown'].forEach(function (ev) {
    document.addEventListener(ev, unlockAudio, true);
  });
  T.audioState = function () { return ctx ? ctx.state : 'not started'; };
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && ctx && ctx.state !== 'running' && ctx.resume) ctx.resume().catch(function () {});
  });

  function tone(freq, dur, type, when, vol) {
    if (!sound || !ctx) return; // ctx only exists once a tap has unlocked it
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
    } catch (e) { /* audio unavailable */ }
  }

  // Louder than before: phone speakers barely register quiet sine blips
  var sfx = {
    tick: function () { tone(1200, 0.035, 'square', 0, 0.06); },
    pick: function () { tone(523, 0.1, 'triangle', 0, 0.35); tone(784, 0.16, 'triangle', 0.08, 0.35); },
    win: function () { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, 0.28, 'triangle', i * 0.12, 0.35); }); },
    fail: function () { tone(262, 0.3, 'triangle', 0, 0.35); tone(196, 0.45, 'triangle', 0.2, 0.35); },
    wild: function () { tone(660, 0.12, 'sine', 0, 0.35); tone(990, 0.16, 'sine', 0.07, 0.35); },
    land: function () { tone(392, 0.07, 'triangle', 0, 0.3); tone(784, 0.1, 'triangle', 0.04, 0.22); } // a formation card lands
  };

  // Hidden sound check for phones: open the site with ?audiodebug
  if (/[?&]audiodebug\b/.test(location.search)) {
    var dbg = document.createElement('div');
    dbg.style.cssText = 'position:fixed;left:8px;right:8px;bottom:8px;z-index:9999;background:#111;color:#fff;border:2px solid #ff7a2e;border-radius:12px;padding:10px;font:12px/1.4 monospace';
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

  /* Toast + sheet */

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

  /* Home */

  function firstVisit() {
    try {
      if (localStorage.getItem('500goals_played')) return false;
      // a CAST Profile is never a first visit (the owner, 15 Oct 2026: on castgames.com.au, a new address with no games
      // saved yet, his banner sat at the bottom under the first-visit layout)
      if (localStorage.getItem('cast_signed_in') === '1' || signedIn()) return false;
      var g = JSON.parse(localStorage.getItem('cast_games_v1') || '[]');
      return !(Array.isArray(g) && g.some(function (x) { return x && x.game === 'epl'; }));
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
  /* While the World Cup is on (10 Oct 2026, the owner: "keep it under classic until end of world cup"): the Daily
     Challenge sits under the mode cards, World Cup and the main mode first; back in its own place after the final (15 Nov) */
  var dailyMark = null;
  function placeDaily() {
    var d = $('dailyCard'), last = $('packNote');
    if (!d || !last) return;
    if (!dailyMark) { dailyMark = document.createComment(' the Daily Challenge '); d.parentNode.insertBefore(dailyMark, d); }
    if (wcOn() && sydneyToday() <= '2026-11-15') { if (last.nextSibling !== d) last.parentNode.insertBefore(d, last.nextSibling); }
    else if (dailyMark.nextSibling !== d) dailyMark.parentNode.insertBefore(d, dailyMark.nextSibling);
  }
  // Extra Time's card (15 Oct 2026, the owner): straight under the Daily Challenge, wherever the Daily sits, once it's on
  function placeOu() {
    var d = $('dailyCard'), c = $('ouHome');
    // The over/under is its own game (16 Oct 2026, the owner: separate everywhere, Six Again excepted): no card on this home
    if (T.OU_SEPARATE) { if (c) c.hidden = true; return; }
    if (!d) return;
    if (!c) { c = document.createElement('div'); c.id = 'ouHome'; c.className = 'ou-home'; }
    var on = !!(T.ou && T.ou.on());
    c.hidden = !on;
    c.innerHTML = on ? R.ouCard() : '';
    if (d.nextSibling !== c) d.parentNode.insertBefore(c, d.nextSibling);
  }
  T.firstVisit = firstVisit;
  // World Cup 200+ (4 Oct 2026): on once the owner launches it (or ?castwc=1 for an admin's visit); signed-in players only
  function wcOn() { return false; } // 650 GOALS: no World Cup mode (that's 1000TRIES')
  function signedIn() { return !!(window.CastAccount && CastAccount.isSignedIn && CastAccount.isSignedIn()); }
  var SYD = window.Intl && Intl.DateTimeFormat ? new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Sydney', year: 'numeric', month: '2-digit', day: '2-digit' }) : null;
  function sydneyToday() { return SYD ? SYD.format(new Date()) : new Date().toISOString().slice(0, 10); }
  // Its home card: big until the final (15 Nov 2026), then small with the other modes. A guest's first visit keeps 4000+ first
  function wcPlace(first) {
    if (!wcOn()) return null;
    if (sydneyToday() > '2026-11-15') return 'mini';
    return first && !signedIn() ? 'under' : 'top';
  }
  function renderHome() {
    // First visit (no finished game on this phone yet): how it works in three steps, under the pitch. Gone after game one.
    // First-timers also get the modes first (4 Oct 2026, the owner's call): they move up under the steps, above the spot
    // and the Daily Challenge, and a guest's first visit has no spot (js/cast-account.js asks CAST_ACCOUNT.firstVisit)
    var first = firstVisit(), fs = $('firstSteps');
    // guest: Sign In to Play once today's free World Cup is played (Play Free until then, 12 Oct 2026)
    $('modePicker').innerHTML = R.modePicker(selectedMode, { wc: wcPlace(first), guest: !signedIn() && !(window.CastAccount && CastAccount.wcFreeLeft && CastAccount.wcFreeLeft()), free: !signedIn() && !!(window.CastAccount && CastAccount.wcFreeLeft && CastAccount.wcFreeLeft()) });
    if (fs) fs.hidden = !first;
    placeModes(first);
    placeDaily();
    placeOu();
    var ouB = document.querySelector('.spot-promo[data-ou-open]');
    if (ouB && !ouB.getAttribute('data-rich') && R.ouBanner) { ouB.innerHTML = R.ouBanner(); ouB.setAttribute('data-rich', '1'); ouB.classList.add('is-ou'); }
    if (window.CastAccount && CastAccount.spot) CastAccount.spot();
    $('startBtn').setAttribute('data-pick', selectedMode); // Play now takes the picked mode's colour
  }

  /* Draft */

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

  // Animate the bar from the last total to the new one: fill, colour shift, +N chip, glow pulse
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
    void fill.offsetWidth; // commit the start state
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
    fitNames();
    $('pitch').classList.toggle('is-tweaking', !!S.tweakMode);
    $('pickCount').textContent = S.fm ? S.fm + ' \u00B7 ' + T.filledCount() + ' of ' + T.SLOTS.length : 'Formation First';
  }

  // Long surnames shrink to fit the slot on one line instead of being cut off
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

  // Squad full with a Remove Player still in hand: Lock in drains over LOCK_SECS, then locks in by itself
  T.LOCK_SECS = 10;
  var lockTimer = null, lockLeft = null, resumeLock = null, resumeClock = null; // resume*: the seconds a draft brought back still had
  function stopLockTimer() { if (lockTimer) { clearInterval(lockTimer); lockTimer = null; } }
  function startLockTimer(S) {
    stopLockTimer();
    var left = resumeLock != null ? Math.max(1, resumeLock) : T.LOCK_SECS; // a draft brought back keeps its seconds
    resumeLock = null; lockLeft = left;
    // The gold fill steps down with the number, one second at a time (always in sync)
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

  /* The pick clock (17 Oct 2026, the owner: no looking players up mid-draft; the same in every CAST draft game, from
     1000TRIES). Exactly's shot clock (2 Oct 2026) came first. Every pick in the main mode, Exactly and the Daily Challenge
     is timed: T.PICK_SECS, or Exactly's stricter T.EXACT_SECS. A new offer starts it again (a Reroll, a Remove, a Legends
     Pick or a bought Legend Pick's three once their reveal has closed). It runs on the wall clock, so a hidden
     tab or another app never stops it: back on the page, a clock that ran out picks at once. It waits while a wildcard
     plays out, while Remove or Substitute is armed and while any pop-up is open (the Shop, a confirm, a purchase, the
     Daily Challenge), so buying never costs a pick, and while it waits the offer cards are covered, so a pause is never
     time to look anyone up. The phone's spot chooser is part of the pick, so it never waits. Time up: the player you
     tapped goes in, else the first card that fits, in the first open spot he plays. A bought Legend Pick's three go
     back to your own offer first, so a Pick is never used for you. Never Team Spin, Quick Draft or the formation (it comes before the first offer). A draft brought
     back keeps its seconds. GA: exact_timeout, pick_timeout */
  T.PICK_SECS = 20;
  T.EXACT_SECS = 15;
  T.CLOCK_MODES = ['plus', 'exact', 'daily'];
  T.clockMode = function (S) { return !!S && !!S.mode && T.CLOCK_MODES.indexOf(S.mode.id) >= 0 && S.mode.source === 'roll' && !S.qd; };
  T.pickSecs = function (S) { return S && S.mode && S.mode.id === 'exact' ? T.EXACT_SECS : T.PICK_SECS; };
  var clock = { offer: null, end: 0, last: 0, iv: null };
  function clockOn(S) { return T.clockMode(S) && !S.finished && !S.awaitingLock && !!S.offer && S.offer.players.length > 0 && document.body.getAttribute('data-screen') === 'draft'; }
  // A pop-up over the draft: a sheet that isn't the spot chooser, a CAST panel (the Shop, a purchase), the Daily Challenge, a reveal
  function popUpOpen() {
    var sh = $('sheet');
    if (sh && !sh.hidden && !$('sheetBody').querySelector('[data-place]')) return true;
    if (document.documentElement.classList.contains('ca-open') || document.querySelector('.pack-intro')) return true;
    return Array.prototype.some.call(document.querySelectorAll('[role="dialog"], [aria-modal="true"]'), function (d) {
      return d.id !== 'sheetBody' && !d.hidden && d.getClientRects().length > 0;
    });
  }
  // Waiting with the cards covered (a long wait) or just held (a wildcard's moment, a Pick going through)
  function clockPaused(S) { return !!(S.tweakMode || S.subMode) || popUpOpen(); }
  function clockHeld(S) { return busy || !!document.querySelector('.wc-burst, .cg') || clockPaused(S); } // .cg: the GOAT moment (js/cast-celebrate.js)
  function clockStart() {
    if (!clockOn(T.state())) { clockCover(false); return; }
    if (!clock.iv) { clock.last = Date.now(); clock.iv = setInterval(clockTick, 200); }
    clockTick(); // a redraw shows the time left straight away
  }
  function clockStop() { if (clock.iv) { clearInterval(clock.iv); clock.iv = null; } }
  function clockCover(on) { var p = $('offerPanel'); if (p) p.classList.toggle('is-clock-paused', !!on); }
  // What the offer panel draws (js/render.js): the seconds a pick gets and the time left on this offer
  T.clockView = function (S) {
    var secs = T.pickSecs(S), left = clock.offer === S.offer && clock.iv ? Math.max(0, clock.end - Date.now()) : secs * 1000;
    return { secs: secs, left: left, paused: clock.offer === S.offer && clockPaused(S) };
  };
  function clockTick() {
    var S = T.state(), now = Date.now();
    if (!clockOn(S)) { clockStop(); clock.offer = null; clockCover(false); return; }
    var secs = T.pickSecs(S);
    if (clock.offer !== S.offer) { clock.offer = S.offer; clock.end = now + (resumeClock != null ? Math.max(0, resumeClock) : secs * 1000); resumeClock = null; } // a draft brought back keeps its seconds
    else if (clockHeld(S)) clock.end += now - clock.last; // waiting: the clock doesn't move
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
    if (left <= 0 && !clockHeld(S) && !document.hidden) timeUp(S); // off the page: it picks the moment they're back
  }
  // Back on the page (another tab, another app): a clock that ran out while they were away picks at once
  document.addEventListener('visibilitychange', function () { if (!document.hidden && clock.iv) clockTick(); });
  window.addEventListener('pageshow', function () { if (clock.iv) clockTick(); });
  function timeUp(S) {
    clockStop(); clock.offer = null; clockCover(false);
    if (S.offer && S.offer.paid && !S.offer.taken) T.keepOffer(); // never spend a Legend Pick for them
    var list = S.offer ? S.offer.players.filter(function (p) { return !S.used[p.id] && T.openCodesFor(p).length > 0; }) : [];
    var chooser = $('sheet') && !$('sheet').hidden && $('sheetBody').querySelector('[data-place]');
    var tapped = placingId || (chooser && $('sheetBody').getAttribute('data-player')) || null;
    var p = tapped && T.byId[tapped] && list.indexOf(T.byId[tapped]) >= 0 ? T.byId[tapped] : list[0];
    closeSheet(); setPlacing(null);
    if (!p) { nextOffer(); return; } // nobody on it fits an open spot: a fresh offer
    T.track(S.mode.id === 'exact' ? 'exact_timeout' : 'pick_timeout', { mode: S.mode.name, picks: S.picks, tapped: tapped ? 'yes' : 'no' });
    toast('\u23F1\uFE0F Time\u2019s up: ' + p.name + ' goes in');
    place(p.id, T.openCodesFor(p)[0]);
  }

  /* A tap right after the offers moved is ignored (11 Oct 2026, a player in World Cup 200+: "I clicked Thornett" and got the
     player above). The first offer drew before his account had loaded, then the wildcard row under it grew (Substitute and
     the World Legend Pick) and pushed the cards down one place as he tapped. Now a pick within 0.7 s of the cards moving
     does nothing, so the next tap lands where the eye is */
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
  function renderDraft0(flashIdx) {
    var S = T.state();
    renderChrome(flashIdx);
    var panel = $('offerPanel');
    if (S.awaitingLock && !S.tweakMode && !S.lockHold) startLockTimer(S); else stopLockTimer();
    if (!S.fm) {
      if (fmSpinFor === S && fmSpinning) { /* mid-spin: the reels keep turning in place */ }
      else if (fmSpinFor !== S) { fmSpinFor = S; panel.innerHTML = R.formationOffer(S, reduceMotion ? 'fade' : 'spin'); if (!reduceMotion) fmSpin(S); }
      else panel.innerHTML = R.formationOffer(S);
    }
    else if (S.awaitingLock) panel.innerHTML = R.decision(S);
    else if (S.mode.source === 'spin' && !S.offer && !S.spinPos && !S.tweakMode) panel.innerHTML = R.pickPosition(S);
    else if (S.offer && S.offer.kind === 'spin') panel.innerHTML = R.offerSpin(S);
    else if (S.offer) panel.innerHTML = R.offerRoll(S);
    applyPlacing();
    applySquadSearch();
    watchSquadScroll();
    clockStart(); // the pick clock
    keepDraft(); // Save the draft in progress
  }

  // Team Spin: show only players whose name matches the search (group headings hide when empty)
  function applySquadSearch() {
    var list = $('squadList');
    if (!list || !T.squadSearch) return;
    var q = String(T.squadSearch.q || '').trim().toLowerCase(), shown = 0, group = null, groupHits = 0;
    Array.prototype.forEach.call(list.children, function (el) {
      if (el.classList.contains('squad-group')) {
        if (group) group.style.display = groupHits ? '' : 'none';
        group = el; groupHits = 0; return;
      }
      if (!el.classList.contains('srow')) return;
      var hit = !q || (el.getAttribute('data-name') || '').indexOf(q) >= 0;
      el.style.display = hit ? '' : 'none';
      if (hit) { shown++; groupHits++; }
    });
    if (group) group.style.display = groupHits ? '' : 'none';
    var none = list.querySelector('.squad-none');
    if (!shown && q) { if (!none) { none = document.createElement('p'); none.className = 'squad-none'; none.textContent = 'No one in this squad matches that name.'; list.appendChild(none); } }
    else if (none) none.remove();
  }
  document.addEventListener('input', function (e) {
    if (e.target && e.target.id === 'squadSearch') { T.squadSearch.q = e.target.value; applySquadSearch(); }
  });

  // Team Spin: fade + "Scroll for more" cue until the player scrolls or reaches the end
  function watchSquadScroll() {
    var list = $('squadList'), wrap = $('squadWrap');
    if (!list || !wrap) return;
    var update = function () {
      var room = list.scrollHeight - list.clientHeight;
      wrap.classList.toggle('no-scroll', room < 4);
      wrap.classList.toggle('at-end', list.scrollTop >= room - 4);
      if (list.scrollTop > 12) wrap.classList.add('scrolled');
    };
    list.addEventListener('scroll', update, { passive: true });
    update();
  }

  /* Desktop placing: pick a player, then click a glowing spot on the field.
     Phones keep the bottom-sheet chooser. */

  var desktopMQ = window.matchMedia ? window.matchMedia('(min-width: 900px)') : null;
  function isDesktop() { return !!(desktopMQ && desktopMQ.matches); }
  var placingId = null;

  function setPlacing(id) {
    placingId = id;
    applyPlacing();
  }

  // Mark the field spots a player can go into. cls is 'is-target' (placing) or 'is-preview' (hover).
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
    else if (S) hint.textContent = S.fm ? S.fm + ' \u00B7 ' + T.filledCount() + ' of ' + T.SLOTS.length : 'Formation First';
  }

  document.addEventListener('mouseover', function (e) {
    if (!isDesktop() || placingId) return;
    var c = e.target.closest && e.target.closest('#offerPanel [data-pick]');
    var S = T.state();
    if (!S || S.tweakMode || busy) return;
    markSlots(c ? c.getAttribute('data-pick') : null, 'is-preview');
  });

  // Unibet popup cadence: every second "go again" (Play again or Change mode, mid-game or
  // from the results page). Play now on the home page never counts. The count is kept in
  // the browser so a refresh does not reset it.
  var AD_EVERY = 2;
  function adDue() {
    var n = 0;
    try { n = parseInt(localStorage.getItem('500goals_after_game') || '0', 10) || 0; } catch (e) { /* ignore */ }
    n++;
    try { localStorage.setItem('500goals_after_game', String(n)); } catch (e) { /* ignore */ }
    return n % AD_EVERY === 0;
  }

  // Leaving the results page: maybe show the popup, then carry on
  function afterResults(next) {
    if (ADS_ON && adDue()) interstitial(next);
    else next();
  }

  // The Daily starts from js/daily.js (its draft for today's go), never as a plain game
  T.play = function (modeId, opts) { closeSheet(); busy = false; startGame(modeId, opts); };
  function newGame(modeId) {
    if (modeId === 'daily') { if (T.dailyStart) T.dailyStart(); return; }
    // World Cup 200+: only once it's on. A guest gets one free a day, which uses one of their free games (12 Oct 2026, the
    // owner; CastAccount.wcGate counts it); after that it starts by itself once they've signed in
    if (modeId === 'wc') {
      if (!wcOn()) return;
      var gate = CastAccount.wcGate || CastAccount.requireSignIn;
      if (gate && !(CastAccount.wcGate ? gate(function () { newGame('wc'); }, 'wc') : gate(function () { newGame('wc'); }, 'wc', 'wc'))) return;
    }
    // CAST Pass tiers: a guest's 6th game of the day waits for a free sign-in (then starts by itself)
    else if (window.CastAccount && CastAccount.guestGate && !CastAccount.guestGate(function () { newGame(modeId); }, modeId)) return;
    closeSheet();
    busy = false;
    startGame(modeId);
  }

  T.showScreen = show; // Extra Time's own screen (js/overunder.js)
  T.ouHome = function () { goHome(); };
  function goHome() {
    if (window.CG && CG.leave) { closeSheet(); busy = false; CG.leave(); return; } // CAST Games: every mode is its own page (17 Oct 2026)
    closeSheet();
    busy = false;
    renderHome();
    renderHomeAd();
    show('home');
  }

  function startGame(modeId, opts) {
    // Each mode plays from its own pack (AFL or NRLW); load and switch it before the game starts
    var want = (T.MODES[modeId] || T.MODES.plus).dataset || 'nrl';
    if (T.DATASET !== want && !T.useDataset(want)) {
      busy = true;
      T.loadDataset(want).then(function () { busy = false; T.useDataset(want); startGame(modeId, opts); },
        function () { busy = false; toast('Could not load the players. Check your connection and try again.'); });
      return;
    }
    if (modeId !== 'daily') selectedMode = modeId; // the Daily is not one of the home screen's modes
    dropDraft(modeId); // a new game replaces its mode's saved one
    T.newGame(modeId, opts); // opts.seed: a friend's challenge, the same draft they played
    // Wildcards by tier once CAST Pass launches: guests none, CAST Profile 1 of each, CAST Pass 2 of each.
    // Before that: everyone 1 of each, and CAST Profile players +1 reroll (it just shows as "2 left").
    var NS = T.state(), tierW = window.CastAccount && CastAccount.wildcardCount ? CastAccount.wildcardCount() : null;
    var extra = window.CastAccount && CastAccount.profileRerolls ? CastAccount.profileRerolls() : 0;
    // Hard Mode (Exactly 4000): no free wildcards for anyone, only paid ones (a guest signs in first)
    if (NS.mode.paidOnly) { NS.wcStart = { reroll: 0, scout: 0, tweak: 0 }; NS.wcLocked = tierW === 0; }
    else if (NS.mode.wildcards && tierW !== null) setTierWildcards(NS, tierW);
    else if (NS.mode.wildcards && extra) { NS.wildcards.reroll += extra; NS.profileRerolls = extra; }
    NS.subLeft = NS.mode.wildcards && !NS.mode.paidOnly && window.CastAccount && CastAccount.hasPass && CastAccount.hasPass() ? 1 : 0; // Substitute: CAST Pass, 1 a game
    placingId = null;
    shownTotal = 0;
    busy = false;
    // One event per mode so GA's Events list ranks the modes directly:
    // classic_1000_plays (4000+), hard_1000_plays (Exactly 4000), team_spin_plays (Team Spin)
    T.track(T.MODES[modeId].event, { mode: T.MODES[modeId].name });
    show('draft');
    nextOffer();
  }

  function nextOffer() {
    var S = T.state();
    if (S.finished) return;
    if (!S.fm) { renderDraft(); return; } // the formation comes first (R.formationOffer)
    if (T.filledCount() === S.slots.length) { settle(); return; }
    if (S.mode.source === 'spin') {
      if (S.spinPos) spin();
      else { S.offer = null; renderDraft(); } // player chooses a position first
    }
    else {
      var offer = T.rollOffer();
      if (offer && offer.il) { T.track('ileg_natural_shown', { mode: S.mode.name }); ilReveal([T.byId[offer.il]], false, renderDraft); }
      else if (offer && offer.special) packIntro(offer.special, renderDraft, offer.lifeline); else renderDraft();
    }
  }

  /* The formation (17 Oct 2026, the owner): three offered, one tapped (or keyed 1, 2 or 3), then the draft fills its spots.
     Every mode, the Daily too: the offer is seeded, so a Daily or a friend's challenge offers everyone the same three */
  function chooseFormation(id) {
    var S = T.state();
    if (!S || S.finished || S.fm || busy || (fmSpinning && fmSpinFor === S) || (S.fmOffer || []).indexOf(id) < 0 || !T.setFormation(id)) return;
    if (!S.qd) T.track('formation_pick', { mode: S.mode.name, formation: id });
    sfx.pick();
    nextOffer();
  }

  /* The formation spin (17 Oct 2026, the owner: "Make sure the formation spin is in so it's like another element of
     chance"). The three are already decided (T.formationOffer, seeded, so a Daily or a friend's challenge lands everyone
     on the same three); this is theatre only, like Team Spin's reel. Each card flicks through the ten names and their
     little pitches, slowing down, then they land one after another (top to bottom) with a small bounce. Nothing is
     saved or sent; the cards stay disabled until the last one lands. Reduced motion: a plain fade (R.formationOffer) */
  var fmSpinFor = null, fmSpinning = false;
  var FM_STOP = [950, 1350, 1750]; // ms: when each card lands
  function fmSpin(S) {
    var cards = Array.prototype.slice.call($('offerPanel').querySelectorAll('.fm-card'));
    if (!cards.length) return;
    fmSpinning = true;
    var ids = T.FORMATION_IDS, t0 = Date.now(), left = cards.length, lastTick = 0;
    var swap = function (card, id) {
      card.querySelector('.fm-name').textContent = id;
      var old = card.querySelector('.fm-pitch'), tmp = document.createElement('span');
      tmp.innerHTML = R.miniPitch(id);
      old.parentNode.replaceChild(tmp.firstChild, old);
    };
    var done = function () {
      fmSpinning = false;
      if (T.state() !== S || S.fm) return;
      var box = $('offerPanel').querySelector('.fm-cards');
      if (box) { box.classList.remove('is-spinning'); box.removeAttribute('aria-busy'); Array.prototype.forEach.call(box.querySelectorAll('.fm-card'), function (c) { c.disabled = false; }); }
    };
    cards.forEach(function (card, n) {
      var real = card.getAttribute('data-fm'), stopAt = FM_STOP[n] || FM_STOP[FM_STOP.length - 1] + 400 * (n - 2), shown = real;
      var turn = function () {
        if (T.state() !== S || S.fm || !card.isConnected) { if (!--left) done(); return; }
        var t = Date.now() - t0;
        if (t >= stopAt) {
          swap(card, real);
          card.classList.remove('is-spinning'); card.classList.add('is-landed');
          if (card.animate) card.animate([{ transform: 'translateY(-7px) scale(1.015)' }, { transform: 'translateY(3px)', offset: .55 }, { transform: 'none' }], { duration: 320, easing: 'cubic-bezier(.2,.8,.3,1.2)' });
          sfx.land();
          if (!--left) done();
          return;
        }
        // The next name: never the one showing (or the real one too early, so it never seems to land twice)
        var next; do { next = ids[Math.floor(Math.random() * ids.length)]; } while (next === shown || (stopAt - t > 260 && next === real));
        shown = next; swap(card, next);
        var side = card.querySelector('.fm-side'), pitch = card.querySelector('.fm-pitch');
        if (side.animate) [side, pitch].forEach(function (el) { el.animate([{ transform: 'translateY(-38%)', opacity: .35 }, { transform: 'none', opacity: 1 }], { duration: 60, easing: 'ease-out' }); });
        if (Date.now() - lastTick > 55) { lastTick = Date.now(); sfx.tick(); }
        var k = Math.min(1, t / stopAt);
        setTimeout(turn, 45 + Math.round(210 * k * k * k)); // slows down towards its stop
      };
      turn();
    });
  }

  /* Legends Pick / Legend Pick: a short pack-opening moment before the three greats appear.
     Tap anywhere to skip. Hall of Famers get the grander version. A lifeline (a player with no real chance left) says so. */
  function packIntro(kind, done, lifeline, paid) {
    var imm = kind === 'immortal';
    T.track(imm ? 'immortal_pick_shown' : 'legends_pick_shown', { mode: T.state().mode.name, lifeline: lifeline ? 'yes' : 'no', paid: paid ? 'yes' : 'no' });
    if (reduceMotion) { done(); return; }
    /* The same reveal as the World Legends (8 Oct 2026, the owner: "improve legends pack pop up ... to match this",
       js/cast-intl.js): the three greats' clubs, in their colours, flash through the clubs and land one by one, with their
       names and positions (career goals stay hidden). Without it, the old pack card below */
    var CI = window.CastIntl, S0 = T.state(), three = S0 && S0.offer ? S0.offer.players.slice(0, 3) : [];
    if (CI && CI.reveal && three.length) {
      var sides = {}, side = function (k) {
        if (!k || sides[k]) return;
        var c = T.club(k), nm = String(c.name || k), last = nm.split(' ').pop();
        /* The club's real kit (js/cast-kits.js; 16 Oct 2026, the owner: "make sure that they are accurate ... Don't just
           assume always that they are a V-shaped jersey design"), filling the whole tile (17 Oct 2026, the owner: "I prefer
           the full box filled as opposed to jersey outline"). CastIntl.JERSEYS is the NRL clubs' only; without the kits it
           is plain in the club's colours, never a V */
        var K = window.CastKits, fb = { base: c.primary, accent: c.accent || c.secondary };
        sides[k] = { name: nm, short: (T.CLUB_SHORT && T.CLUB_SHORT[k]) || (nm.length <= 15 ? nm : last),
          code: c.abbr, c1: c.primary, c2: c.accent || c.secondary, glow: c.primary, pattern: 'plain', colors: [c.accent || c.secondary],
          draw: K && K.drawFill ? function (w, h) { return K.drawFill('epl', k, { w: w, h: h, fallback: fb }); } : null, fill: true };
      };
      var pool = Object.keys(T.CLUBS).filter(function (k) { return T.CLUB_COLORS[k]; });
      pool.forEach(side);
      var reels = three.map(function (p) { var k = T.lastClub(p); side(k); return { nation: k, name: p.name, sub: T.positionsOf(p).map(T.posLabel).join('/') }; });
      // The GOAT, when a free Legends Pick deals him, is named as the GOAT under his tile (17 Oct 2026, the owner)
      reels.forEach(function (r, i) { if (T.isGoat(three[i])) r.nationName = '\uD83D\uDC10 The GOAT'; });
      busy = true;
      sfx.win();
      try {
        CI.reveal({ reels: reels, sides: sides, pool: pool, kicker: paid ? 'Your Legend Pick' : imm ? 'Legend Pick' : '\u2B50 Legends Pick',
          title: imm ? 'Three of the Game\u2019s Legends' : 'You\u2019ve Unlocked a Legend!', sub: imm ? '' : 'Pick one of three all-time greats', tone: imm ? '' : 'bronze', done: function () { busy = false; done(); } });
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
      '<span class="pi-sub">' + (imm ? 'Three of the game&rsquo;s Legends. Pick one.' : 'Pick one of three all-time greats') + '</span></div>';
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

  /* World Legends (8 Oct 2026, the owner's calls): the World Legend reveal (js/cast-intl.js) before they
     show, flashing through the nations' looks and landing on his: one for a free one turning up in an offer, three for an
     World Legend Pick. Their numbers stay hidden, as on every card. Without the reveal they just show */
  function ilReveal(players, paid, done) {
    var CI = window.CastIntl, list = (players || []).filter(Boolean);
    if (!CI || !CI.reveal || !list.length) { done(); return; }
    busy = true;
    try {
      CI.reveal({
        reels: list.slice(0, 3).map(function (p) { return { nation: T.lastClub(p), name: p.name, sub: T.positionsOf(p).map(T.posLabel).join('/') }; }), // the spot codes (LB/CB), short so they line up (17 Oct 2026)
        kicker: paid ? 'World Legend Pick' : 'World Legend', title: paid ? 'Your World Legends' : '',
        done: function () { busy = false; done(); }
      });
    } catch (e) { busy = false; done(); }
  }

  function spin() {
    var S = T.state();
    var game = S;
    var offer = T.spinOffer(); // decided up front; the reel is just theatre
    if (!offer) { S.spinPos = null; S.spinSlot = null; S.offer = null; toast('No one left for that position. Pick another'); renderDraft(); return; }
    if (reduceMotion) { renderDraft(); return; }
    busy = true;
    S.offer = null;
    renderChrome();
    $('offerPanel').innerHTML = R.spinning(S);
    var reels = T.spinReelValues();
    var yearEl = $('offerPanel').querySelector('.reel-year .reel-val');
    var clubBox = $('offerPanel').querySelector('.reel-club');
    var clubEl = clubBox.querySelector('.reel-val');
    var n = 0, frames = 16;
    // Only swap text and colours in place, so the layout never reflows mid-spin
    var timer = setInterval(function () {
      if (T.state() !== game) { clearInterval(timer); return; }
      n++;
      var c = T.club(reels.clubs[Math.floor(Math.random() * reels.clubs.length)]);
      yearEl.textContent = reels.years[Math.floor(Math.random() * reels.years.length)];
      clubEl.textContent = c.name;
      clubBox.setAttribute('style', R.clubVars(c.slug));
      sfx.tick();
      if (n >= frames) {
        clearInterval(timer);
        S.offer = offer;
        busy = false;
        renderDraft();
      }
    }, 70);
  }

  // Team Spin: lock in a position (from the buttons or an empty field spot), then spin
  function choosePosition(code, slotIdx) {
    var S = T.state();
    if (!S || busy || S.finished || S.mode.source !== 'spin' || S.offer || S.spinPos) return;
    S.spinPos = code;
    S.spinSlot = slotIdx == null ? null : slotIdx;
    sfx.tick();
    spin();
  }

  function onPick(id) {
    var S = T.state();
    if (busy || S.finished || S.tweakMode) return;
    if (Date.now() - offerMovedAt < 700) { T.track('pick_after_shift', { mode: S.mode.id }); return; } // the cards just moved under the finger
    var p = T.byId[id];
    if (!p) return;
    if (S.mode.source === 'spin' && S.spinPos) { place(id, S.spinPos, S.spinSlot); return; }
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
    // A bought Hall of Famer or World Legend Pick (js/draft.js useImm, useIL): taken from the account only now, as he's chosen
    if (S.offer && S.offer.paid && !S.offer.taken) {
      if (busy || !window.CastAccount || !CastAccount.pickUse) return;
      var item = S.offer.item || 'imm', isIL = item === 'ileg';
      busy = true; closeSheet();
      CastAccount.pickUse(item, 'epl').then(function () {
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
    // The free World Legend, taken (GA)
    if (p && p.il && S.il && S.il.shown === p.id && !(S.offer && S.offer.paid)) T.track('ileg_natural_taken', { mode: S.mode.name, player: p.name });
    /* Where he came from, for the team sheet (11 Oct 2026, the owner: "differentiate between all the special cards"; the 4th
       part of his d.sq entry, read by js/cast-account.js PICK_SRC): L a World Legend Pick, I an Legend Pick, F the free
       World Legend, G the GOAT, K a Legend Key's Legends Pick. Kept by player, so a swap of spots keeps it */
    var src = S.offer && S.offer.paid ? (S.offer.item === 'ileg' ? 'L' : 'I') : p && p.il && S.il && S.il.shown === p.id ? 'F'
      : S.offer && S.offer.goat ? 'G' : S.offer && S.offer.key ? 'K' : '';
    var idx = T.pick(id, code, slotIdx);
    if (idx == null) return;
    S.srcOf = S.srcOf || {};
    if (src) S.srcOf[p.id] = src; else delete S.srcOf[p.id];
    // Promos: finding a Team of the Year player or a premier earns that promo's trophy, right away
    if (T.promoTier && T.promoTier(p) && window.CastAccount && window.CastAccount.unlock && !S.qd) window.CastAccount.unlock([T.promoTrophy()]);
    placingId = null;
    closeSheet();
    sfx.pick();
    busy = true;
    // Show the reveal before moving on
    $('offerPanel').innerHTML = R.reveal(p, T.slotClub(S.slots[idx]));
    renderChrome(idx);
    // The GOAT item's card lands: a gold ring and a burst of goats on his spot (js/cast-celebrate.js)
    if (src === 'G' && window.CastCelebrate && window.CastCelebrate.goatLand) window.CastCelebrate.goatLand(document.querySelector('.slot[data-slot="' + idx + '"]'), { tone: tone });
    setTimeout(function () {
      if (T.state() !== S) return; // restarted mid-reveal
      busy = false;
      settle();
    }, reduceMotion ? 300 : 1100);
  }

  // Squad full and short, with no Remove Player left: a saved one, or one to buy, can still swap a player out. So the
  // lock-in choice and its countdown show with "Remove · $0.99" (or "2 saved"): players 15+ in the wildcard modes.
  function removeStillOnSale(S, out) {
    return !out.win && out.reason === 'under' && S.mode.wildcards && S.wildcards.tweak < 1 &&
      !!(window.CastAccount && CastAccount.canBuyRemove && CastAccount.canBuyRemove());
  }
  /* Go Higher (2 Oct 2026, the owner's call): an XI that fills at the target or over (4000+, Team Spin, WBBL 750+) asks
     before it locks in, every time it fills, like a short one: with a Remove Player still in hand (the game's own, CAST
     Pass's second, or saved ones) they can swap someone out and chase a bigger score; with none left, players 15+ get
     one for $0.99 (they may keep paying to climb). The 10-second countdown locks it in if they don't tap, and the new
     score stands even if it drops (under the target, the short choice shows as before). Not Exactly 4000, the Daily or
     Quick Draft. Its headline and line take turns game by game (S.ghCopy). GA: go_higher_view, go_higher_remove,
     go_higher_lock (auto: the countdown ran out) */
  function goHigher(S, out) {
    if (!out.win || out.reason !== 'hit' || S.mode.rule !== 'atleast' || !S.mode.wildcards || S.daily || S.qd) return false;
    if (S.wildcards.tweak > 0) return true;
    var A = window.CastAccount;
    return !!A && ((A.removesSaved && A.removesSaved() > 0) || (A.canBuyRemove && A.canBuyRemove()));
  }
  function goHigherHow(S) { return S.wildcards.tweak > 0 ? 'own' : window.CastAccount && CastAccount.removesSaved && CastAccount.removesSaved() > 0 ? 'saved' : 'buy'; }
  // After a pick or tweak: finish, wait for a lock-in decision, or serve the next offer
  function settle() {
    var S = T.state();
    var out = T.outcome(false);
    var higher = !!out && goHigher(S, out);
    if (out && !removeStillOnSale(S, out) && !higher) { finish(out); return; }
    if (higher) {
      if (S.ghCopy == null) { var ghN = 0; try { ghN = +localStorage.getItem('500goals_gh') || 0; localStorage.setItem('500goals_gh', String(ghN + 1)); } catch (e) { /* storage blocked */ } S.ghCopy = ghN % 2; }
      T.track('go_higher_view', { mode: S.mode.name, total: out.total, how: goHigherHow(S) });
    }
    if (T.filledCount() === S.slots.length) {
      S.lockHold = false; // a fresh countdown
      S.awaitingLock = true;
      S.offer = null;
      renderDraft();
      return;
    }
    S.awaitingLock = false;
    if (S.offer) renderDraft();
    else nextOffer();
  }

  /* Wildcard theatre: using one should feel like a big moment */
  var WC_FX = {
    reroll: { ico: '\uD83D\uDD04', title: 'Reroll!', sub: 'New players to choose' },
    respin: { ico: '\uD83D\uDD04', title: 'Respin!', sub: 'Back on the wheel' },
    scout:  { ico: '\uD83D\uDC40', title: 'Goals revealed', sub: 'Your decision just got easier' },
    tweak:  { ico: '\u274C', title: 'Remove Player', sub: 'Tap a player in your XI' },
    removed:{ ico: '\u274C', title: 'Removed!', sub: '' }
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
  // The button that was just spent flashes before settling into its used state
  function markUsed(key) {
    var b = document.querySelector('#offerPanel .wc-' + key);
    if (b) b.classList.add('just-used');
  }
  // Reveal Goals: count every number up from zero, one card after another
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
      if (S.mode.source === 'spin') {
        S.wildcards.reroll--;
        T.setBoost(T.bestOnOffer() + 1); // 7 times in 10 the new squad quietly has one who beats the best of this one (js/team-spin.js)
        wildcardBurst('respin', 'reroll');
        spin();
        if (!S.wildcards.reroll && window.CastAccount && CastAccount.nudgeBonus) setTimeout(function () { CastAccount.nudgeBonus(grantBonus(S)); }, 2600);
      } else {
        T.useReroll();
        var rolled = S.offer && S.offer.il ? T.byId[S.offer.il] : null; // a free World Legend dealt by the Reroll: his reveal first
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
      else if (T.armTweak(true)) { sfx.wild(); if (!wildcardBurst('tweak', 'tweak')) toast('Tap a player in your XI to remove them'); }
      renderDraft();
      // Phones: bring the field into view so the player can tap who to remove
      if (S.tweakMode && !isDesktop()) {
        var pitchPanel = $('pitch');
        if (pitchPanel) pitchPanel.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
      }
    }
  }

  // Substitute: tap a lit-up player, then one of their lit-up open spots
  function onSubSlot(idx) {
    var S = T.state(), m = S.subMode, p = S.slots[idx].player;
    if (m.from == null || (p && idx !== m.from)) {
      if (p && T.subTargets(idx).length) { m.from = idx; renderDraft(); }
      else toast(p ? p.name + ' has no other open spot they play' : 'Tap a lit-up player first');
      return;
    }
    if (idx === m.from) { m.from = null; renderDraft(); return; }
    var moved = T.subMove(m.from, idx);
    if (!moved) return;
    sfx.wild();
    T.track('wildcard_used', { wildcard: 'sub', mode: S.mode.name });
    if (!wildcardBurst('tweak', 'tweak', moved.name + ' moves to ' + T.POS_NAMES[S.slots[idx].code])) toast(moved.name + ' moves to ' + T.POS_NAMES[S.slots[idx].code]);
    // The offer on screen may have nowhere to go now: deal a fresh one instead of leaving you stuck
    if (S.offer && S.offer.players && !S.offer.players.some(function (x) { return T.openCodesFor(x).length; })) nextOffer(); else renderDraft();
  }

  function onSlot(idx) {
    var S = T.state();
    if (S && S.subMode && !busy) { onSubSlot(idx); return; }
    if (S && S.mode.source === 'spin' && !S.offer && !S.spinPos && !S.tweakMode && !S.awaitingLock && !busy && !S.slots[idx].player) {
      choosePosition(S.slots[idx].code, idx);
      return;
    }
    if (S && placingId && !busy && !S.slots[idx].player) {
      var code = S.slots[idx].code;
      if (T.openCodesFor(T.byId[placingId]).indexOf(code) !== -1) place(placingId, code, idx);
      return;
    }
    if (!S || !S.tweakMode || busy) return;
    var p = T.applyTweak(idx);
    if (!p) return;
    clock.offer = null; // the pick clock starts again for the offer that comes back
    sfx.wild();
    // Stronger wildcards: the next offer quietly beats him (js/wildcards.js applyTweak). A mechanic only, never in the copy
    if (!wildcardBurst('removed', 'tweak', p.name + ' is back in the pool')) toast(p.name + ' is back in the pool');
    settle();
    // Back up to the new offer (the spot you cleared is lower down, on the pitch)
    var panel = $('offerPanel');
    if (panel) {
      var top = panel.getBoundingClientRect().top + window.pageYOffset - 90;
      window.scrollTo({ top: Math.max(0, top), behavior: reduceMotion ? 'auto' : 'smooth' });
    }
  }

  /* Finish */

  // Trophies this game earned (the account module ignores ones already unlocked)
  function trophiesFor(S, out) {
    var ids = [], total = out.total, mode = S.mode.id, nrl = mode !== 'nrlw' && mode !== 'wc', aflwT = T.DATASETS.nrlw.target;
    var players = S.slots.filter(function (x) { return x.player; }).map(function (x) { return x.player; });
    var full = players.length === S.slots.length;
    var wc = S.wildcards || {};
    var st = S.wcStart || { reroll: 1 + (S.profileRerolls || 0), scout: 1, tweak: 1 };
    var usedWild = (st.reroll + (S.bonusRerolls || 0) - (wc.reroll || 0)) + (st.scout + (S.boughtScouts || 0) - (wc.scout || 0)) + (st.tweak + (S.boughtTweaks || 0) - (wc.tweak || 0)) > 0;
    if (nrl) {
      if (total >= T.TARGET) ids.push('hit1000');
      if (total >= T.TARGET * 1.1) ids.push('hit1100'); // 715 Club (+10%, as 1000TRIES' 1100)
      if (total >= T.TARGET * 1.2) ids.push('hit1200'); // Goal Machine (+20%)
      if (out.reason === 'exact') ids.push('exact');
      if (mode === 'plus' && total >= T.TARGET && total <= T.TARGET + Math.round(T.TARGET * 0.009)) ids.push('photo'); // a photo finish: 1000TRIES' 9 in 1000, scaled
      if (total >= T.TARGET * 0.99 && total < T.TARGET) ids.push('soclose'); // the last 1% under, as 1000TRIES' 990 to 999
      if (S.mode.wildcards && total >= T.TARGET && !usedWild) ids.push('nowild');
      if (mode === 'spin' && total >= T.TARGET) ids.push('spin');
      // Top Ten: 3 of the 10 biggest Premier League goalscorers in the pool (Legends and the GOAT are not in it) in one XI
      var top10 = T.players.slice().sort(function (a, b) { return b.tries_1998_plus - a.tries_1998_plus; }).slice(0, 10);
      if (players.filter(function (p) { return top10.indexOf(p) >= 0; }).length >= 3) ids.push('goats');
      if (full && total < T.TARGET / 2) ids.push('bench'); // half the target, as 1000TRIES' 500
      if (players.some(function (p) { return T.isLegend(p); })) ids.push('legend');
      // 5 Oct 2026: a 4000+ here is one that counts (not an Exactly 4000 bust)
      var hit = total >= T.TARGET && out.reason !== 'over', luck = T.luckPct();
      if (total === 555 && mode !== 'exact') ids.push('legs11'); // All Fives
      if (hit && luck != null && luck <= -15) ids.push('odds');
      if (hit && players.some(function (p) { return p.tries_1998_plus === 0; })) ids.push('zero');
      if (full) eraTrophies(players, ids);
      if (full) footballTrophies(S, out, players, ids, hit);
    } else if (mode === 'wc') {
      if (total >= T.DATASETS.wc.target) ids.push('wc200');
      T.wcTrophyIds(players, total, { usedWild: usedWild }).forEach(function (id) { ids.push(id); });
    } else {
      if (total >= aflwT) ids.push('nrlw250'); // the women's pack slot (never on here): its target, and 20% over it
      if (total >= Math.round(aflwT * 1.2)) ids.push('nrlw300');
    }
    if (S.daily && out.reason === 'won') ids.push('dailywin'); // a Daily Challenge won
    // World Cup 200+ keeps to its own trophy (the World Cup branch, 4 to 5 Oct, was built before these, 5 Oct)
    if (full && mode !== 'wc') {
      if (T.luckPct() != null && T.luckPct() >= 30) ids.push('lucky');
      if (S.slots.every(function (x) { return x.top; })) ids.push('read'); // Perfect Read: js/draft.js marks each pick
      clubTrophies(players, ids);
    }
    return ids;
  }
  /* 650 GOALS' own trophies (17 Oct 2026): the lines of the XI, its clubs and seasons, and the record. Their names and
     pictures go in the shared trophy list (js/cast-account.js TROPHIES.epl; ~/cast-dev/epl/tools/trophies_epl.js) */
  var LONDON = ['arsenal', 'chelsea', 'spurs', 'westham', 'palace', 'fulham', 'brentford', 'charlton', 'qpr', 'wimbledon'];
  function footballTrophies(S, out, players, ids, hit) {
    // The lines of the formation's spots (17 Oct 2026): the defence, the midfield, the forwards
    var LINE_OF = { LB: 'D', CB: 'D', RB: 'D', LWB: 'D', RWB: 'D', DM: 'M', CM: 'M', AM: 'M', LM: 'M', RM: 'M', LW: 'F', ST: 'F', RW: 'F', D: 'D', M: 'M', F: 'F' };
    var line = function (code) { return S.slots.filter(function (s) { return LINE_OF[s.code] === code && s.player; }).map(function (s) { return s.player.tries_1998_plus || 0; }); };
    var sum = function (a) { return a.reduce(function (t, x) { return t + x; }, 0); };
    var D = line('D'), M = line('M'), F = line('F');
    if (players.some(function (p) { return (p.record_name || p.name).indexOf('Alan Shearer') === 0; })) ids.push('ep_record'); // Record Breaker: Shearer's 260
    if (players.some(function (p) { return p.tries_1998_plus >= 100; })) ids.push('ep_100'); // 100 Club
    if (F.filter(function (g) { return g >= 100; }).length >= 3) ids.push('ep_front'); // Front Three: 3 forwards on 100+
    if (M.length && sum(M) >= 150) ids.push('ep_mid'); // Goals From Midfield
    if (D.length && sum(D) >= 60) ids.push('ep_back'); // Goals From the Back
    var clubsOf = function (p) { return (p.club_years || []).map(function (c) { return c.club; }); };
    var last = {}; players.forEach(function (p) { last[T.lastClub(p)] = 1; });
    if (Object.keys(last).length >= 10) ids.push('ep_tour'); // Tour of England: ten clubs
    var any = {}; players.forEach(function (p) { clubsOf(p).filter(function (c, i, a) { return a.indexOf(c) === i; }).forEach(function (c) { any[c] = (any[c] || 0) + 1; }); });
    if (!S.daily && Object.keys(any).some(function (c) { return any[c] >= 6; })) ids.push('ep_core'); // One-Club Core (a Daily deals one club's players)
    if (players.filter(function (p) { return T.playedFor(p, 'arsenal', 2003); }).length >= 4) ids.push('ep_invincibles'); // 2003-04, unbeaten
    if (players.filter(function (p) { return T.playedFor(p, 'leicester', 2015); }).length >= 4) ids.push('ep_foxes'); // 2015-16, the 5000-1 champions
    if (players.every(function (p) { return (p.club_years || []).some(function (c) { return c.from <= 1992; }); })) ids.push('ep_dayone'); // Day One: all ten played in 1992-93
    if (players.every(function (p) { return clubsOf(p).length && clubsOf(p).every(function (c) { return LONDON.indexOf(c) >= 0; }); })) ids.push('ep_london'); // London Calling
    var both = function (a, b) { return players.every(function (p) { var c = clubsOf(p); return c.indexOf(a) >= 0 || c.indexOf(b) >= 0; }); };
    if (both('liverpool', 'everton')) ids.push('ep_mersey'); // Merseyside
    if (both('manutd', 'mancity')) ids.push('ep_manchester'); // Manchester
    if (both('arsenal', 'spurs')) ids.push('ep_northlondon'); // North London
    var legends = players.filter(function (p) { return p.tier; }).length;
    if (hit && legends) ids.push('legendary');
    if (hit && !legends && S.mode.id === 'plus') ids.push('pure');
  }
  /* A 13's careers (5 Oct 2026, AFL): Time Traveller (one who started before 2000, Legends included, with one who played
     in 2026), Fresh Faces (all started in 2020 or later), Old School (all finished by 2004), and Family Business or
     Namesakes from the names (js/cast-account.js) */
  function eraTrophies(players, ids) {
    var spans = players.map(function (p) { var m = /^(\d{4})\D+(\d{4})$/.exec(p.career_span || ''); return m ? [+m[1], +m[2]] : null; });
    if (spans.every(Boolean)) {
      // career_span ends the year a player's last season ends (2026-27 is 2027)
      if (spans.some(function (x) { return x[0] <= 1995; }) && spans.some(function (x) { return x[1] > (T.CUR_SEASON || 2026); })) ids.push('timetravel');
      if (spans.every(function (x) { return x[0] >= 2020; })) ids.push('fresh');
      if (spans.every(function (x) { return x[1] <= 2000; })) ids.push('oldschool'); // all done by 1999-2000
    }
    var CA = window.CastAccount;
    if (CA && CA.nameTrophies) CA.nameTrophies(players.map(function (p) { return p.name; })).forEach(function (id) { ids.push(id); });
  }
  // Club Legends (all 18 played for one club) and True Colours (5+ who played for the profile's club). A forerunner counts
  // as the club it grew into: Easts are the Roosters (js/cast-account.js)
  function clubTrophies(players, ids) {
    var CA = window.CastAccount || {}, home = CA.homeClub || function (c) { return c; };
    var sets = players.map(function (p) { var o = {}; (p.club_years || []).forEach(function (cy) { o[home(cy.club)] = 1; }); return o; });
    if (Object.keys(sets[0] || {}).some(function (c) { return sets.every(function (o) { return o[c]; }); })) ids.push('clubleg');
    var fan = CA.fanClub && CA.fanClub();
    if (fan && sets.filter(function (o) { return o[fan]; }).length >= 5) ids.push('colours');
  }

  // Follow us for a free reroll (cast-account.js): add it to this game when granted
  // Tier wildcards: every kind starts at n (guests 0, shown locked with "Sign in"). S.wcStart remembers the starting
  // counts, so a sign-in mid-game adds the difference and wildcards already played stay played.
  function setTierWildcards(S, n) {
    ['reroll', 'scout', 'tweak'].forEach(function (k) {
      var start = S.wcStart ? S.wcStart[k] : 1;
      if (!S.wcStart) S.wildcards[k] = n; else if (n > start) S.wildcards[k] += n - start;
    });
    S.wcStart = { reroll: Math.max(n, S.wcStart ? S.wcStart.reroll : 0), scout: Math.max(n, S.wcStart ? S.wcStart.scout : 0), tweak: Math.max(n, S.wcStart ? S.wcStart.tweak : 0) };
    S.wcLocked = n === 0;
  }
  // Signed in (or bought the Pass) mid-game: unlock the wildcards in this same game
  // Saved rerolls changed (bought or used): the Reroll button's "N saved" follows
  window.addEventListener('cast:rerolls', function () { var S = T.state(); if (S && !S.finished && document.body.getAttribute('data-screen') === 'draft') renderDraft(); });
  // Midnight in Sydney: a new Legend Key (the tile was counting down to it)
  window.addEventListener('cast:keys', function () { var S = T.state(); if (S && !S.finished && document.body.getAttribute('data-screen') === 'draft') renderDraft(); });
  window.addEventListener('cast:launch', function () { var S = T.state(); if (S && !S.finished && !busy && document.body.getAttribute('data-screen') === 'draft') renderDraft(); });
  window.addEventListener('cast:tier', function (e) {
    var S = T.state(), n = e.detail && e.detail.wildcards;
    if (!S || S.finished || !S.mode.wildcards || !S.wcStart || typeof n !== 'number') return;
    if (S.mode.paidOnly) { S.wcLocked = n === 0; if (document.body.getAttribute('data-screen') === 'draft') renderDraft(); return; } // Hard Mode: still no free ones
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

  /* CAST account team sheets: club colours and goals from 650 GOALS's own lists (Legends and Hall of Famers included).
     Attached once the page has loaded: the account config is set up after this script. */
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
    var wcNames = null, wcCount = -1;
    window.CAST_ACCOUNT.player = function (game, name, mode) {
      if (game !== 'epl') return null;
      // A World Cup 200+ team sheet (never on in 650 GOALS): its own pack
      if (mode === 'wc') {
        var wp = (T.DATASETS.wc && T.DATASETS.wc.pool) || null;
        if (!wp) { T.loadDataset('wc').then(function () { if (window.CastAccount) CastAccount.refresh(); }, function () { /* no World Cup pack */ }); return null; }
        if (wp.players.length !== wcCount) { wcNames = {}; wcCount = wp.players.length; wp.players.forEach(function (p) { wcNames[(p.record_name || p.name).toLowerCase()] = p; }); }
        var w = wcNames[String(name).toLowerCase()];
        return w ? { tries: w.tries_1998_plus, club: T.lastClub(w), tier: '' } : null; // 'tries': the shared field name (the number shown)
      }
      var pools = ['nrl', 'nrlw'].map(function (k) { return (T.DATASETS[k] && T.DATASETS[k].pool) || { players: [] }; });
      var n = pools[0].players.length + pools[1].players.length + (T.LEGENDS || []).length;
      if (n !== sheetCount) {
        sheetNames = {}; sheetCount = n;
        // A renamed player's old name ('was') still finds them, for games saved before the rename
        pools.forEach(function (pl) { pl.players.forEach(function (p) { sheetNames[(p.record_name || p.name).toLowerCase()] = p; (p.was || []).forEach(function (o) { sheetNames[String(o).toLowerCase()] = p; }); }); });
        (T.LEGENDS || []).forEach(function (p) { sheetNames[(p.record_name || p.name).toLowerCase()] = p; });
        if (T.GOAT_CARD) sheetNames[T.GOAT_CARD.record_name.toLowerCase()] = T.GOAT_CARD; // the GOAT item's card
      }
      var p = sheetNames[String(name).toLowerCase()];
      return p ? { tries: p.tries_1998_plus, club: T.lastClub(p), tier: p.tier || '' } : null; // 'tries': the shared field name (the number shown)
    };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', sheetHooks); else sheetHooks();

  function finish(out) {
    var S = T.state();
    S.finished = true;
    dropDraft(S.mode.id);
    S.tweakMode = false;
    if (!S.qd) T.track('game_end', { mode: S.mode.name, result: out.win ? 'win' : 'fail', total: out.total });
    try { localStorage.setItem('500goals_played', '1'); } catch (e) { /* storage blocked */ }
    $('results').innerHTML = R.results(S, out);
    // CAST Games account: keep the result on this device, and sync it if signed in
    if (window.CastAccount) {
      window.CastAccount.record({
        // A themed Daily's target without its club player is a miss ('under'); won is 'won' (Daily Won)
        game: 'epl', mode: acctMode(S.mode.id), score: out.total, result: out.reason === 'noclub' ? 'under' : out.reason, win: out.win, top: out.reason === 'exact',
        // Legends and Hall of Famers are saved as "Ken Irvine (Legend)" so the server scores them from the Legends list
        picks: S.slots.filter(function (s) { return s.player; }).map(function (s) { return s.player.record_name || s.player.name; }),
        // sq: each pick's club (Team Spin: club|season spun), in pick order, for the leaderboard team sheet.
        // The luck of the draw goes with it: lk (percent against an average draw), lf (a lifeline pick), wc (wildcards played)
        d: Object.assign({ sq: S.slots.filter(function (s) { return s.player; }).map(function (s) {
          var src = S.srcOf && S.srcOf[s.player.id];
          return (T.slotClub(s) || '') + (s.year || src ? '|' + (s.year || '') : '') + (src ? '||' + src : ''); // "nzl|||F"
        }) },
          S.special && S.specialDone ? { pack: S.special } : {}, S.lifelineUsed ? { lf: 1 } : {},
          T.luckPct() != null ? { lk: T.luckPct() } : {}, T.wildcardsUsed() != null ? { wc: T.wildcardsUsed() } : {},
          // seed: the draft, so this game can be sent to a friend as a challenge; key: boosted with a Vault key (CAST Pass)
          S.seed ? { seed: S.seed } : {}, S.keyUsed ? { key: S.keyUsed } : {}, S.keysUsed ? { lks: S.keysUsed } : {}, S.qd ? { qd: 1 } : {}, S.goatUsed ? { goat: 1 } : {}, S.immUsed ? { imm: S.immUsed } : {}, S.ilegUsed ? { ileg: S.ilegUsed } : {},
          S.daily ? { daily: S.daily.n, date: S.daily.date, go: S.daily.go } : {},
          // fm: the formation (17 Oct 2026); the picks are in its order, and the server checks each one's spot
          S.fm ? { fm: S.fm } : {},
          // World Cup 200+: how many World Cup games the pack had (the board adds the total up at that tally)
          S.mode.id === 'wc' ? { wv: T.DATASETS.wc.wv || 0 } : {},
          // the women's pack slot: how many matches since the pack was built it had (never on here)
          S.mode.id === 'nrlw' ? { av: T.DATASETS.nrlw.av || 0 } : {})
      });
      window.CastAccount.refresh();
      if (window.CastAccount.unlock && !S.qd) window.CastAccount.unlock(trophiesFor(S, out));
    }
    // Build the share image now so the Share tap can hand it over instantly
    shareCard = null;
    if (T.buildShareCard) T.buildShareCard(S, out).then(function (card) { if (T.state() === S) shareCard = card; });
    if (out.win) sfx.win(); else sfx.fail();
    celebrate(S, out, function () {
      show('results');
      if (S.daily && T.dailyDone) T.dailyDone(S, out); // the Daily's own result card on top
      countUp($('rtNum'), 0, out.total);
    });
  }

  /* Exactly 4000 (8 Oct 2026, the owner: "yes build this", 650 GOALS's own big moment to match 27-0's 27-0): the big moment
     both games share (js/cast-celebrate.js) before the results: the XI in the order they went in, their goals adding up to
     the target, then the cup, the XI and their numbers. Not in Quick Draft. then() shows the results. */
  function celebrate(S, out, then) {
    if (out.reason !== 'exact' || S.qd || !window.CastCelebrate) { then(); return; }
    var A = window.CastAccount, C = window.CAST_ACCOUNT;
    var club = function (id) {
      var c = C && C.club ? C.club(id) : null;
      return c ? { abbr: c.abbr, bg: c.bg, fg: c.fg } : { abbr: String(id || '?').slice(0, 3).toUpperCase(), bg: '#2a2a3a', fg: '#fff' };
    };
    // The order they went in: each spot's last pick (a swap or a pick after a Remove counts from when it went in)
    var when = {};
    (S.history || []).forEach(function (h, i) { if (h && h.slot != null) when[h.slot] = i; });
    var filled = S.slots.map(function (s, i) { return { s: s, i: i }; }).filter(function (x) { return x.s.player; });
    var joined = filled.slice().sort(function (a, b) { return (when[a.i] != null ? when[a.i] : a.i) - (when[b.i] != null ? when[b.i] : b.i); });
    var run = 0;
    var steps = joined.map(function (x) {
      var t = x.s.player.tries_1998_plus || 0;
      run += t;
      return Object.assign(club(T.slotClub(x.s)), { n: run, label: T.surname(x.s.player.name) + ' +' + T.fmt(t) });
    });
    var last = joined[joined.length - 1], counts = {}, clubs = 0;
    filled.forEach(function (x) { var id = T.slotClub(x.s); if (!id) return; if (!counts[id]) clubs++; counts[id] = (counts[id] || 0) + 1; });
    // The player's club (their CAST Profile), else the club most of the XI come from
    var b = A && A.myBadge ? A.myBadge() : null, colours = b && b.c1 ? [b.c1, b.c2] : null;
    if (!colours) {
      var top = Object.keys(counts).sort(function (x, y) { return counts[y] - counts[x]; })[0], tc = top && A && A.teamColours ? A.teamColours(top) : null;
      colours = tc ? [tc.c1, tc.c2] : ['#ffffff', '#9aa4b2'];
    }
    var goals = filled.map(function (x) { return x.s.player.tries_1998_plus || 0; });
    var aj = (T.players || []).concat(T.LEGENDS || []).filter(function (p) { return p.name === 'Alan Shearer'; })[0];
    var wc = T.wildcardsUsed ? T.wildcardsUsed() : null;
    T.track('celebration_shown', { result: 'exact_1000' });
    window.CastCelebrate.show({
      id: 'cel1000', label: 'Exactly ' + T.fmt(T.TARGET), from: 0, fmt: T.fmt, steps: steps, big: T.fmt(T.TARGET), stamp: 'Exactly', line: 'Not a goal wasted', colours: colours,
      cards: S.slots.map(function (s) {
        if (!s.player) return null;
        var c = club(T.slotClub(s));
        return { pos: T.posLabel(s.code), name: T.surname(s.player.name), val: T.fmt(s.player.tries_1998_plus || 0), vc: '#fff', abbr: c.abbr, bg: c.bg, fg: c.fg };
      }),
      rows: R.rows(S), teamLabel: 'Your XI', // the pitch: the formation's front row up top (17 Oct 2026)
      stats: [{ label: 'Biggest Pick', value: Math.max.apply(null, goals) }, { label: 'Smallest Pick', value: Math.min.apply(null, goals) }, { label: 'Clubs', value: clubs }]
        .concat(wc != null ? [{ label: 'Wildcards', value: wc }] : []),
      star: last ? { label: 'The Last Pick', value: last.s.player.name, extra: '+' + T.fmt(last.s.player.tries_1998_plus || 0) } : null,
      history: aj ? { head: 'The Premier League Record', text: 'Alan Shearer holds it with ' + T.fmt(aj.tries_1998_plus) + ' goals. Your XI: exactly ' + T.fmt(T.TARGET) + '.' } : null,
      button: '\u2B50 See Your Team', done: then
    });
  }

  var shareCard = null;

  function shareText() {
    var S = T.state();
    var out = T.outcome(true);
    if (!S || !out) return '';
    var url = 'https://castgames.com.au/650goals';
    if (window.CastAccount && window.CastAccount.inviteLink) url = window.CastAccount.inviteLink(url); // Invite a Mate v2: their invite code
    var score = out.reason === 'exact'
      ? 'I just hit exactly ' + T.fmt(T.TARGET) + ' Premier League goals on 650 GOALS \uD83C\uDFAF'
      : 'I just scored ' + T.fmt(out.total) + ' ' + T.TRY_LABEL + ' on 650 GOALS (' + S.mode.name + ') \u26BD';
    return score + '\nThink you can beat me? ' + url;
  }

  // Share opens a small sheet with both sizes: Story (9:16) and Post (4:5)
  function share() {
    var text = shareText();
    if (!text) return;
    var post = shareCard && shareCard.post, story = shareCard && shareCard.story;
    if (!post && !story) {
      // Card not ready (or this browser cannot draw it): share the message on its own
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
      '<button type="button" class="btn btn-ghost btn-block sheet-gap" data-action="copy-share">&#x1F4CB; Copy message</button>' +
      '<button type="button" class="btn btn-ghost btn-block sheet-gap" data-action="close-sheet">Done</button>');
  }

  // Inside the tap itself (iOS only allows sharing a file from a tap)
  function shareCardFile(kind) {
    var text = shareText(), card = shareCard && shareCard[kind];
    var file = card && card.file;
    if (file && navigator.canShare && navigator.share) {
      var withFile = { files: [file], text: text }, ok = false;
      try { ok = navigator.canShare(withFile); } catch (e) { ok = false; }
      if (ok) { navigator.share(withFile).catch(function () { /* cancelled */ }); T.track('share_card', { size: kind }); return; }
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



  /* Events */

  // Rules open in a pop-up on the game page, so nobody gets lost on a separate page
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

  // FAQ: one question open at a time (name="faq" does this in newer browsers; this covers the rest)
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
    // .mode-card only: the body carries data-mode during the draft and results (the mode skin), and a tap anywhere
    // there must never start a new game
    var t = e.target.closest('.mode-card[data-mode],.mode-mini[data-mode],[data-fm],[data-pick],[data-place],[data-wildcard],[data-slot],[data-action],[data-track]');
    if (!t) return;

    if (t.hasAttribute('data-track')) {
      T.track(t.getAttribute('data-track'), { placement: t.getAttribute('data-where') || '' });
      if (!t.hasAttribute('data-action')) return; // plain links keep default behaviour
    }
    if (t.hasAttribute('data-mode')) {
      // One tap plays that mode (a scroll that starts on a card is never a tap). Players still loading: it starts once
      // they are in
      selectedMode = t.getAttribute('data-mode');
      if (selectedMode === 'ou') { if (T.ou) T.ou.open(); return; } // Extra Time has its own screen (js/overunder.js)
      renderHome();
      if (T.players.length) newGame(selectedMode); else { startWhenReady = selectedMode; $('startBtn').hidden = false; }
      return;
    }
    if (t.hasAttribute('data-fm')) { chooseFormation(t.getAttribute('data-fm')); return; }
    if (t.hasAttribute('data-pick')) { onPick(t.getAttribute('data-pick')); return; }
    if (t.hasAttribute('data-place')) { place($('sheetBody').getAttribute('data-player'), t.getAttribute('data-place')); return; }
    if (t.hasAttribute('data-gh') && T.state()) T.track('go_higher_remove', { mode: T.state().mode.name, total: T.total(), how: goHigherHow(T.state()) }); // Go Higher's Remove
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
      case 'play-again': { // after a Daily go: the next go (or the Daily card when all 3 are used), never a 4000+ game
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
        // Where the draft is at, for the top of the sheet: "524 goals with 3 picks to go. 126 more and you hit 650."
        var bTot = T.total(), bLeft = bs.slots.filter(function (x) { return !x.player; }).length, bWord = bs.mode.id === 'spin' ? 'spin' : 'pick';
        var bHook = bTot < T.TARGET
          ? { title: 'You\u2019re One Good ' + (bWord === 'spin' ? 'Spin' : 'Pick') + ' Away', line: T.fmt(bTot) + ' goals with ' + bLeft + ' ' + bWord + (bLeft === 1 ? '' : 's') + ' to go. ' + T.fmt(T.TARGET - bTot) + ' more and you hit ' + T.fmt(T.TARGET) + '.' }
          : { title: 'Chase a Bigger Score', line: T.fmt(bTot) + ' goals already. One more good ' + bWord + ' could put you on top of the leaderboard.' };
        CastAccount.buyReroll('epl', function () {
          if (T.state() !== bs) return;
          bs.wildcards.reroll += 1; bs.boughtRerolls = (bs.boughtRerolls || 0) + 1;
          if (bs.mode.paidOnly) bs.paidUsed.reroll = true; // Hard Mode: one a game
          onWildcard('reroll');
        }, bHook);
        break;
      }
      case 'buy-remove': { // Remove Player used up: a saved one, or one to buy (CastAccount.buyRemove), then tap who goes
        var ms = T.state();
        if (!ms || !window.CastAccount || !CastAccount.buyRemove) break;
        if (ms.awaitingLock) { ms.lockHold = true; stopLockTimer(); } // squad full: the countdown waits while they choose
        var mTot = T.total(), mOpen = ms.slots.filter(function (x) { return !x.player; }).length, mWord = ms.mode.id === 'spin' ? 'spin' : 'pick';
        var mHook = mTot >= T.TARGET ? { title: 'Chase a Bigger Score', line: T.fmt(mTot) + ' goals already. Swap your lowest scorer for someone better and climb the leaderboard.' }
          : mOpen ? { title: 'Swap Out Your Weakest ' + (mWord === 'spin' ? 'Spin' : 'Pick'), line: T.fmt(mTot) + ' goals with ' + mOpen + ' ' + mWord + (mOpen === 1 ? '' : 's') + ' to go. Take one player out and draft that spot again.' }
          : { title: 'You’re ' + T.fmt(T.TARGET - mTot) + ' Goals Short', line: 'Your XI has ' + T.fmt(mTot) + ' goals. Take one player out, draft that spot again and chase ' + T.fmt(T.TARGET) + '.' };
        CastAccount.buyRemove('epl', function () {
          if (T.state() !== ms) return;
          ms.wildcards.tweak += 1; ms.boughtTweaks = (ms.boughtTweaks || 0) + 1;
          if (ms.mode.paidOnly) ms.paidUsed.tweak = true; // Hard Mode: one a game
          onWildcard('tweak');
        }, mHook);
        break;
      }
      case 'buy-reveal': { // Reveal Goals used up: a saved one, or one to buy (CastAccount.buyItem), then the offer shows its goals
        var vs = T.state();
        if (!vs || !window.CastAccount || !CastAccount.buyItem) break;
        var vTot = T.total(), vLeft = vs.slots.filter(function (x) { return !x.player; }).length;
        var vHook = { title: 'See Their Goals First', line: T.fmt(vTot) + ' goals with ' + vLeft + ' spot' + (vLeft === 1 ? '' : 's') + ' to fill. Show the goals for everyone on this offer, then pick.' };
        CastAccount.buyItem('reveal', 'epl', function () {
          if (T.state() !== vs) return;
          vs.wildcards.scout += 1; vs.boughtScouts = (vs.boughtScouts || 0) + 1;
          if (vs.mode.paidOnly) vs.paidUsed.scout = true; // Hard Mode: one a game
          onWildcard('scout');
        }, vHook);
        break;
      }
      case 'imm': { // The Legend Pick tile: one in hand deals three Legends now; none, its price (then the deal)
        var ims = T.state();
        if (!ims || busy || !T.immFits() || !window.CastAccount || !CastAccount.pickState) break;
        var ist = CastAccount.pickState('imm'), deal = function () {
          if (T.state() !== ims || !T.useImm()) return;
          T.track('imm_pick_open', { mode: ims.mode.name });
          packIntro('immortal', renderDraft, false, true);
        };
        if (ist && ist.have) { deal(); break; }
        T.track('imm_pick_tap', { mode: ims.mode.name });
        CastAccount.pickBuy('imm', 'epl', deal, { kicker: 'Legend Pick', title: 'Choose a Legend', line: T.fmt(T.total()) + ' goals so far. Swap this offer for three Legends and add one with his career goals.' });
        break;
      }
      case 'ileg': { // The World Legend Pick tile: one in hand deals three World Legends now; none, its price (then the deal)
        var ls = T.state();
        if (!ls || busy || !T.ilFits() || !window.CastAccount || !CastAccount.pickState) break;
        var lst = CastAccount.pickState('ileg'), ldeal = function () {
          if (T.state() !== ls || !T.useIL()) return;
          T.track('ileg_pick_open', { mode: ls.mode.name });
          ilReveal(ls.offer.players, true, renderDraft);
        };
        if (lst && lst.have) { ldeal(); break; }
        T.track('ileg_pick_tap', { mode: ls.mode.name });
        CastAccount.pickBuy('ileg', 'epl', ldeal, { kicker: 'World Legend Pick', title: 'Choose a World Legend', line: T.fmt(T.total()) + ' goals so far. Swap this offer for three World Legends and add one with his goals.' });
        break;
      }
      case 'imm-back': { // Keep My Offer: the offer they had, nothing used
        if (!busy && T.keepOffer()) renderDraft();
        break;
      }
      case 'goat': { // The GOAT tile: ask first (it's a $9.99 item)
        if (!T.goatFits()) break;
        openSheet(R.goatSheet()); $('sheet').classList.add('is-confirm');
        break;
      }
      case 'confirm-goat': { // use one from the Vault (or buy one), then the offer becomes the GOAT
        var gs = T.state();
        closeSheet();
        if (!gs || !T.goatFits() || !window.CastAccount || !CastAccount.buyItem) break;
        CastAccount.buyItem('goat', 'epl', function () {
          if (T.state() !== gs || !T.useGoat()) return;
          T.track('goat_used', { mode: gs.mode.name });
          renderDraft();
          // The GOAT moment (js/cast-celebrate.js, 17 Oct 2026): the reel locks on him, then the toast
          var said = function () { toast('\uD83D\uDC10 The GOAT is in: ' + T.fmt((T.goatPlayer() || {}).tries_1998_plus || 0) + ' Premier League goals'); };
          if (window.CastCelebrate && window.CastCelebrate.goat) window.CastCelebrate.goat({ tone: tone, unit: 'Premier League goals', done: said }); else said();
        });
        break;
      }
      case 'buy-key': { // no Legend Key to use: buy one ($1.99, or 3 for $4.99); once it's in the Vault the tile says Ready
        var ks = T.state();
        if (!ks || !window.CastAccount || !CastAccount.buyKey) break;
        var kTot = T.total();
        CastAccount.buyKey('legend', 'epl', { title: 'Swap for a Legends Pick', line: T.fmt(kTot) + ' goals so far. Swap this offer for a Legends Pick and add a Legend\u2019s career goals.' });
        break;
      }
      case 'shop-removes': { // squad full, own Remove Player still in hand: stock up (the countdown waits meanwhile)
        var ss = T.state();
        if (!ss || !window.CastAccount || !CastAccount.shopRemoves) break;
        if (ss.awaitingLock) { ss.lockHold = true; stopLockTimer(); renderDraft(); }
        CastAccount.shopRemoves('epl', { kicker: 'Stock Up', title: 'Stock Up on Remove Players', line: 'Save them for the games where one swap is the difference. They work in 650 GOALS and every CAST draft game.' });
        break;
      }
      case 'bonus-reroll':
        if (window.CastAccount && T.state()) CastAccount.followBonus(grantBonus(T.state()));
        break;
      case 'legend-key': useLegendKey(); break;
      case 'legend-key-pass': if (window.CastAccount && CastAccount.openPass) CastAccount.openPass('vault'); break;
      case 'sub-pass': T.track('wildcard_locked_tap', { wildcard: 'sub' }); if (window.CastAccount && CastAccount.openPass) CastAccount.openPass('substitute'); break;
      case 'wc-signin': // a guest taps a locked wildcard: sign in free, and they unlock in this game
        if (window.CastAccount && CastAccount.requireSignIn) CastAccount.requireSignIn(null, 'wildcards');
        break;
      case 'spin-pos': choosePosition(t.getAttribute('data-pos')); break;
      case 'squad-search': {
        T.squadSearch.open = !T.squadSearch.open;
        if (!T.squadSearch.open) T.squadSearch.q = '';
        renderDraft();
        var si = $('squadSearch'); if (si) si.focus();
        break;
      }
      case 'spin-sort': {
        var key = t.getAttribute('data-sort');
        T.spinSort = T.spinSort.key === key ? { key: key, dir: -T.spinSort.dir } : { key: key, dir: 1 };
        renderDraft();
        break;
      }
    }
  });

  document.addEventListener('keydown', function (e) {
    // Desktop keys (16 Oct 2026, the owner): 1, 2 and 3 pick that card (the Team Spin list too); while choosing a spot,
    // the same keys choose among the spots he can go into. Never while typing, in a pop-up or a sheet
    var tg = e.target || {}, typing = /^(INPUT|TEXTAREA|SELECT)$/.test(tg.tagName || '') || tg.isContentEditable;
    if (/^[1-9]$/.test(e.key) && !e.metaKey && !e.ctrlKey && !e.altKey && !typing && document.body.getAttribute('data-screen') === 'draft' &&
        $('sheet').hidden && !document.documentElement.classList.contains('ca-open') && !$('offerPanel').classList.contains('is-clock-paused')) {
      var keyList = placingId ? document.querySelectorAll('#pitch .slot.is-target') : document.querySelectorAll('.fm-cards [data-fm], .offer-cards [data-pick]:not([disabled]), .srow[data-pick]:not([disabled])');
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

  // "Play" from the leaderboards' Not Ranked Yet box (the cast:play event from js/cast-account.js), or a link from
  // 27-0 (?play=exact): straight into that mode, asking first if a team is half built
  /* The women's mode slot is 'nrlw' inside the game (kept from 1000TRIES' code; never on here) but 'wbbl' to CAST accounts, its boards and the
     server (12 Oct 2026): these two turn one into the other where the game meets them */
  function acctMode(id) { return id === 'nrlw' ? 'wbbl' : id; }
  function gameMode(id) { return id === 'wbbl' ? 'nrlw' : id; }
  T.acctMode = acctMode;
  function playMode(modeId) {
    modeId = gameMode(modeId);
    if (modeId === 'daily') { if (T.dailyStart && T.players.length) T.dailyStart(); return; }
    // Extra Time (js/overunder.js). Not loaded yet (the players can arrive first): it opens itself once it is (T.ouWanted)
    if (modeId === 'ou') { if (!T.ou) T.ouWanted = true; else if (T.ou.on()) { selectedMode = 'ou'; T.ou.open(); } return; }
    if (!T.MODES[modeId]) return;
    if (!T.players.length) { startWhenReady = modeId; return; } // back from signing in on a phone before the players loaded
    var mid = document.body.getAttribute('data-screen') === 'draft' && !T.state().finished && T.filledCount() > 0;
    if (mid && !window.confirm('Leave this team and start ' + T.MODES[modeId].name + '?')) return;
    newGame(modeId);
  }
  window.addEventListener('cast:play', function (e) { var d = e.detail || {}; if (d.game === 'epl') playMode(d.mode); });
  // World Cup launched (or taken down), or a sign-in: the home page redraws its World Cup card
  function homeAgain() { if (document.body.getAttribute('data-screen') === 'home') renderHome(); }
  window.addEventListener('cast:launch', function (e) { if (e.detail && e.detail.game === 'wc') { wcBits(); homeAgain(); } if (e.detail && e.detail.game === 'po') homeAgain(); });
  // The home FAQ's World Cup 200+ entry ([data-cast-wc]): shows once World Cup mode is on, like the How It Works notes
  function wcBits() {
    var on = !!(window.CastAccount && CastAccount.wcLive && CastAccount.wcLive());
    Array.prototype.forEach.call(document.querySelectorAll('[data-cast-wc]'), function (n) { n.hidden = !on; });
  }
  setTimeout(wcBits, 0);
  window.addEventListener('cast:tier', homeAgain);

  /* The Vault (CAST Pass): the server takes today's Legend Key, then this offer becomes a Legends Pick */
  function useLegendKey() {
    var S = T.state();
    if (busy || !T.legendKeyFits() || !window.CastAccount || !CastAccount.useKey) return;
    busy = true;
    CastAccount.useKey('legend', 'plus').then(function () {
      busy = false;
      // The key is already spent: if the game moved on meanwhile, say so (the review, 9 Oct 2026; it was silent)
      // The Contact Us form opens for them, ready to send (17 Oct 2026: it was an email address in the toast)
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

  /* A friend's challenge (from the CAST Profile, or a ?challenge= link): the same mode and the same draft (seed).
     Attached in sheetHooks, once the account config exists (it is set up after this script). */
  function startChallenge(c) {
    if (c && c.mode) c = Object.assign({}, c, { mode: gameMode(c.mode) });
    if (!c || !T.MODES[c.mode]) return false;
    if (!T.players.length) { setTimeout(function () { startChallenge(c); }, 400); return true; } // players still loading
    var S0 = T.state(), mid = document.body.getAttribute('data-screen') === 'draft' && S0 && !S0.finished && T.filledCount() > 0;
    if (mid && !window.confirm('Leave this team and play ' + (c.from || 'your friend') + '\u2019s challenge?')) return false;
    closeSheet();
    busy = false;
    startGame(c.mode, { seed: c.seed, challenge: true });
    return true;
  }

  /* Quick Draft (the owner's challenges, from the CAST Profile): drafts the strongest team from the challenge's own
     seeded offers, then finishes the game for real, so the result is checked and settled like any other. Later offers
     depend on earlier picks, so it searches ahead in the real engine (T.snapshot / T.restore): a beam of the best few
     drafts, each scored by finishing it greedily. 4000+, NRLW and Team Spin go for the most runs (under the server's
     cap); Exactly 4000 for the most without going over. In 4000+ and NRLW it may spend your tier's rerolls on weak
     offers. Marked qd (private): off the leaderboards, no trophies or stats. */
  var QD_CAP = { nrl: 1450, nrlw: 330 };
  // The choices at this state: each offered player in each open spot they play (Team Spin: each open spot's spin,
  // its best few players). Exactly 4000 leaves out any card that would go over.
  function qdOptions(snap, spin, exact, per, codes) {
    T.restore(snap);
    var S = T.state(), out = [], room = T.TARGET - T.total();
    if (!spin) {
      (S.offer ? S.offer.players : []).forEach(function (p) {
        if (exact && p.tries_1998_plus > room) return;
        T.openCodesFor(p).forEach(function (code) { out.push({ id: p.id, code: code, t: p.tries_1998_plus }); });
      });
      if (T.canUse('reroll')) out.push({ reroll: true, t: -1 }); // bin this offer for the next one
      return out;
    }
    (codes || Object.keys(T.emptyCodes())).forEach(function (code) {
      T.restore(snap);
      var S2 = T.state();
      S2.spinPos = code; S2.spinSlot = null;
      var o = T.spinOffer();
      if (!o) return;
      o.players.filter(function (p) { return !S2.used[p.id] && T.canFill(p, code); })
        .sort(function (a, b) { return b.tries_1998_plus - a.tries_1998_plus; }).slice(0, per || 1)
        .forEach(function (p) { out.push({ id: p.id, code: code, t: p.tries_1998_plus }); });
    });
    return out;
  }
  // Make one choice from a copied state; returns the next copy (with the next offer dealt, as the game deals it)
  function qdApply(snap, o, spin) {
    T.restore(snap);
    var S = T.state();
    if (o.reroll) return T.useReroll() ? T.snapshot() : null;
    if (spin) { S.spinPos = o.code; S.spinSlot = null; if (!T.spinOffer()) return null; }
    if (T.pick(o.id, o.code) == null) return null;
    if (!spin && T.filledCount() < S.slots.length) T.rollOffer();
    return T.snapshot();
  }
  // Finish greedily (the biggest card each time; Team Spin takes the first open spot's spin): { plan, total } or null
  function qdRollout(snap, spin, exact) {
    var plan = [], s = snap;
    for (var guard = 0; guard < 20; guard++) {
      T.restore(s);
      if (T.filledCount() === T.state().slots.length) return { plan: plan, total: T.total() };
      var opts = [];
      if (spin) { var codes = Object.keys(T.emptyCodes()); for (var i = 0; i < codes.length && !opts.length; i++) opts = qdOptions(s, true, false, 1, [codes[i]]); }
      else opts = qdOptions(s, false, exact).filter(function (x) { return !x.reroll; });
      if (!opts.length) return null;
      var o = opts.reduce(function (a, b) { return b.t > a.t ? b : a; });
      var nx = qdApply(s, o, spin);
      if (!nx) return null;
      plan.push(o); s = nx;
    }
    return null;
  }
  function qdSearch(spin, exact, width) {
    var root = T.snapshot(), cap = QD_CAP[T.DATASET] || 1450, best = null, beam = [{ snap: root, plan: [] }];
    function consider(plan, total) { if (total <= cap && (!best || total > best.total)) best = { plan: plan, total: total }; }
    var first = qdRollout(root, spin, exact);
    if (first) consider(first.plan, first.total);
    return new Promise(function (ok) {
      (function depth() {
        var kids = [];
        beam.forEach(function (b) {
          qdOptions(b.snap, spin, exact, 2).forEach(function (o) {
            var nx = qdApply(b.snap, o, spin);
            if (!nx) return;
            var plan = b.plan.concat([o]), r = qdRollout(nx, spin, exact);
            if (!r) return;
            consider(plan.concat(r.plan), r.total);
            kids.push({ snap: nx, plan: plan, full: !r.plan.length, score: r.total <= cap ? r.total : -1 });
          });
        });
        kids.sort(function (a, b) { return b.score - a.score; });
        beam = kids.filter(function (k) { return !k.full; }).slice(0, width);
        if (!beam.length || (exact && best && best.total === T.TARGET)) { T.restore(root); return ok(best); }
        setTimeout(depth, 0); // one depth at a time, so the page keeps breathing
      })();
    });
  }
  var qdOn = false;
  function quickDraft(c) {
    if (c && c.mode) c = Object.assign({}, c, { mode: gameMode(c.mode) });
    if (!c || ['plus', 'spin', 'nrlw', 'exact'].indexOf(c.mode) === -1) return Promise.reject(new Error('Quick Draft plays 650 GOALS challenges.'));
    var S0 = T.state();
    if (document.body.getAttribute('data-screen') === 'draft' && S0 && !S0.finished && T.filledCount() > 0) return Promise.reject(new Error('Finish or leave the team you are drafting first.'));
    if (qdOn) return Promise.reject(new Error('Quick Draft is already drafting.'));
    var want = T.MODES[c.mode].dataset || 'nrl';
    qdOn = true;
    // The Legends list decides 4000+'s Legends and Legend Picks, so it must be in before the draft is dealt
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
      // Your tier's wildcards, as a normal game gets them (CAST Pass: 2 rerolls)
      var tierW = window.CastAccount && CastAccount.wildcardCount ? CastAccount.wildcardCount() : null;
      if (S.mode.wildcards && !S.mode.paidOnly && tierW !== null) setTierWildcards(S, tierW);
      busy = true; // no taps while it drafts
      var spin = S.mode.source === 'spin', exact = S.mode.rule === 'exact';
      // The formation (17 Oct 2026): the one of the three offered whose quick greedy draft goes furthest
      var root0 = T.snapshot(), bestFm = S.fmOffer[0], bestT = -1;
      S.fmOffer.forEach(function (fm) {
        T.restore(root0); S.fm = null; T.setFormation(fm);
        if (!spin) T.rollOffer();
        var r = qdRollout(T.snapshot(), spin, exact), t = r ? (exact && r.total > T.TARGET ? -1 : r.total) : -1;
        if (t > bestT) { bestT = t; bestFm = fm; }
      });
      T.restore(root0); S.fm = null; T.setFormation(bestFm);
      if (!spin) T.rollOffer(); // the first offer, as the game deals it
      return qdSearch(spin, exact, spin ? 2 : 4).then(function (best) {
        if (!best) throw new Error('Quick Draft could not find a team for this draft. It is still waiting.');
        var s = T.snapshot();
        best.plan.forEach(function (o) { if (s) s = qdApply(s, o, spin); });
        if (!s || T.filledCount() !== S.slots.length) throw new Error('Quick Draft lost its place in the draft. It is still waiting.');
        busy = false;
        finish(T.outcome(true));
      });
    }).then(function () { qdOn = false; }, function (e) { qdOn = false; busy = false; throw e; });
  }

  /* Save the draft in progress (9 Oct 2026, the owner, after two paying players lost a team to a page reload the same
     night): every change to the draft is kept on this phone, so a refresh, a flat battery or a trip to the checkout and
     back offers it again. It was dealt from its seed, so bringing it back deals nothing new. Players are kept by id and
     the mode by name; the promo is worked out again from the seed. Not the Daily (its goes are its own) or Quick
     Draft. Dropped when the game ends, when a new one starts, when Change Mode leaves it, after a day, and never
     offered to a different account. */
  var LS_DRAFT = '500goals_draft_v1', DRAFT_MS = 24 * 3600000;
  /* One saved draft per mode (17 Oct 2026, the owner: on CAST Games every mode is its own game, each with its own
     Continue). The main mode keeps the first key and every other mode adds its name to it; a draft kept under the first
     key before then is still found by its mode */
  function draftKey(mode) { return !mode || mode === 'plus' ? LS_DRAFT : LS_DRAFT + '_' + mode; }
  function draftModeOf(d) { return (d && (d.mode || d.sel)) || 'plus'; }
  function dropKey(k) { try { if (k) localStorage.removeItem(k); } catch (e) { /* storage blocked */ } }
  // Each page is its own tab: a draft carried on in another tab ends here (no peeking at the next offer in a copy)
  var DRAFT_TAB = Math.random().toString(36).slice(2, 10);
  function draftWho() { return (window.CastAccount && CastAccount.uid && CastAccount.uid()) || 'guest'; }
  function draftRaw(mode) { try { return JSON.parse(localStorage.getItem(draftKey(mode)) || 'null'); } catch (e) { return null; } }
  // Worth keeping: a pick made, or anything used or paid for before the first one (a key, a reroll, a Pick)
  function draftWorth(S) {
    return T.filledCount() > 0 || S.offerNo > 1 || S.spinNo > 1 || !!(S.keysUsed || S.keyUsed || S.immUsed || S.ilegUsed || S.goatUsed || S.subUsed ||
      S.boughtRerolls || S.boughtScouts || S.boughtTweaks || Object.keys(S.paidUsed || {}).length);
  }
  function keepDraft() {
    var S = T.state();
    // Not the Daily, Quick Draft or a friend's challenge (its answer is only recorded in the tab it started in)
    if (!S || S.finished || S.daily || S.qd || S.challenge || !S.mode || !draftWorth(S)) return;
    if (!S.draftId) S.draftId = Math.random().toString(36).slice(2, 12);
    var cur = draftRaw(S.mode.id), me = draftWho();
    if (cur && cur.id === S.draftId && cur.tab !== DRAFT_TAB) { draftTaken(); return; }
    if (cur && cur.id === S.draftId && cur.who !== 'guest' && cur.who !== me) { dropDraft(S.mode.id); return; } // signed out (or someone else): never handed on
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
    } catch (e) { /* storage full or blocked: no resume */ }
  }
  // Another tab took this draft over: this copy stops, so the draft only ever moves forward in one place
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
  // The saved draft for a mode (or, with no mode, the newest of them), each checked and the stale ones cleared
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
      try { var mine = Object.assign({}, d, { tab: DRAFT_TAB, at: Date.now(), mode: S.mode.id }); delete mine.key; localStorage.setItem(draftKey(S.mode.id), JSON.stringify(mine)); if (d.key && d.key !== draftKey(S.mode.id)) dropKey(d.key); } catch (e) { /* storage blocked */ } // this tab owns it now
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
  /* Opened on a mode (?play=, or a CAST Games page for one mode, window.CG_MODE): straight into play, never the home
     first (17 Oct 2026, the owner). The same player's saved draft for that mode carries on, else a new game starts. A
     link that opens something else (the leaderboards, a profile, the Pass, a friend's challenge) leaves the screen to it.
     When nothing could start (a sign-in wall closed, a mode that isn't on yet), CAST Games shows its own card for the
     mode (CG.bootIdle) and the game's own site shows its home */
  var bootMode = null;
  function bootOn() { return document.documentElement.classList.contains('play-boot'); }
  function bootEnd() { document.documentElement.classList.remove('play-boot'); if (window.CG && CG.bootDone) CG.bootDone(); }
  function bootIdleWatch() {
    var check = function () {
      if (!bootOn() || busy || !T.players.length || document.documentElement.classList.contains('ca-open') || !$('sheet').hidden) return;
      if (document.body.getAttribute('data-screen') !== 'home') return;
      if (window.CG && CG.bootIdle) CG.bootIdle(function () { playMode(bootMode); }); else bootEnd();
    };
    var soon = function () { setTimeout(check, 400); };
    setTimeout(check, 2500); setTimeout(check, 7000);
    try {
      new MutationObserver(soon).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
      new MutationObserver(soon).observe($('sheet'), { attributes: true, attributeFilter: ['hidden'] });
    } catch (e) { /* very old browser: the timers above */ }
  }
  function bootPlay(mode) {
    if (mode === 'aflw') mode = 'nrlw'; // the women's mode's other name (4000 GOALS)
    bootMode = mode;
    bootIdleWatch();
    if (/#(challenge|cast-profile|my-cast|leaderboards|cast-pass|join|admin)/.test(location.hash) || /[?&](challenge|vs)=/.test(location.search)) return;
    var d = mode === 'daily' || mode === 'ou' ? null : savedDraft(mode);
    if (!d) { playMode(mode); return; }
    var done = false, decide = function () {
      if (done) return;
      done = true;
      var now = savedDraft(mode);
      if (now && draftWho() === now.who) resumeDraft(now); else playMode(mode);
    };
    // A guest's save: only once we know this visit is a guest too (a returning player's sign-in may still be loading)
    var signedBefore = false;
    try { signedBefore = localStorage.getItem('cast_signed_in') === '1'; } catch (e) { /* storage blocked */ }
    if (draftWho() === d.who && !(d.who === 'guest' && signedBefore)) { decide(); return; }
    var on = function (e) {
      var st = e.detail && e.detail.status;
      if (st !== 'signed-in' && st !== 'guest') return;
      window.removeEventListener('cast-account', on);
      decide();
    };
    window.addEventListener('cast-account', on);
    setTimeout(decide, 6000); // a page whose accounts are off never says
  }
  // On load: their saved draft, once we know who is signed in (a signed-in player's waits for the sign-in to finish)
  var offered = null; // the draft the resume sheet is offering
  function offeredDraft() { return offered ? savedDraft(draftModeOf(offered)) : savedDraft(); }
  function offerResume() {
    var d = savedDraft();
    if (!d || /#(challenge|cast-profile|leaderboards|cast-pass)/.test(location.hash)) return;
    var ask = function () {
      if (document.documentElement.classList.contains('ca-open')) { setTimeout(ask, 1500); return; } // a CAST pop-up first (a gift, the Pass page)
      var now = savedDraft(draftModeOf(d));
      if (!now || now.at !== d.at || draftWho() !== d.who || document.body.getAttribute('data-screen') !== 'home' || !$('sheet').hidden) return;
      T.track('draft_resume_offer', { mode: d.name, picks: d.picks });
      offered = d;
      openSheet(R.resumeSheet(d.name, d.picks));
      $('sheet').classList.add('is-confirm');
    };
    // A guest's save: only once we know this visit is a guest too (a returning player's sign-in may still be loading)
    var signedBefore = false;
    try { signedBefore = localStorage.getItem('cast_signed_in') === '1'; } catch (e) { /* storage blocked */ }
    if (draftWho() === d.who && !(d.who === 'guest' && signedBefore)) { setTimeout(ask, 400); return; }
    var on = function (e) {
      var st = e.detail && e.detail.status;
      if (st !== 'signed-in' && st !== 'guest') return;
      window.removeEventListener('cast-account', on);
      if (draftWho() === d.who) setTimeout(ask, 400);
    };
    window.addEventListener('cast-account', on);
  }
  window.addEventListener('cast-account', function () { setTimeout(homeAgain, 0); }); // signed in or out: the home's layout follows (first visit or not)
  document.addEventListener('visibilitychange', function () { if (document.hidden) keepDraft(); });
  window.addEventListener('pagehide', keepDraft);

  /* Boot */

  setSound(sound);
  checkImages();
  renderHome();
  document.body.setAttribute('data-screen', 'home');

  var startWhenReady = null; // a mode tapped before the players loaded
  T.loadPlayers().then(function (players) {
    var btn = $('startBtn');
    btn.disabled = false;
    btn.textContent = 'Play now';
    btn.hidden = true;
    homeAgain(); // the account has loaded by now: World Cup's card (when it's on) and Sign In to Play
    if (startWhenReady) { var go = startWhenReady; startWhenReady = null; newGame(go); return; }
    var play = /[?&]play=(plus|exact|spin|nrlw|aflw|wc|daily|ou)(?=&|#|$)/.exec(location.search) || (/[?&]po=[a-z0-9]+/.test(location.search) ? [0, 'ou'] : null) || (window.CG_MODE ? [0, window.CG_MODE] : null); // ?po=: the owner's private Extra Time link
    if (!play) offerResume();
    if (play) {
      try { history.replaceState(null, '', location.pathname + location.search.replace(/([?&])play=[^&#]*&?/, '$1').replace(/[?&]$/, '') + location.hash); } catch (e) { /* keep the address as it is */ }
      bootPlay(play[1]);
    }
  }).catch(function () {
    $('startBtn').textContent = 'Could not load players';
    $('startBtn').hidden = false;
    $('packNote').textContent = 'Check your connection and refresh the page to try again.';
  });
})(window.T = window.T || {});
