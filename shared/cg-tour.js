/* How CAST Games Works (17 Oct 2026, the owner: "Click the banner and it shows what CAST Games is like. Think of it like
   explaining the new concept and how to use the app").

   A full-screen, swipeable tour in six steps, opened by a tap on the home page's The Sports banner (anywhere but its See
   All Games button) or by castgames.com.au/#how-it-works. The page's hook (index.html, after js/home.js) loads this file
   and css/cg-tour.css on that first tap, so the home page itself loads nothing extra.

     1  Welcome to CAST Games        one card per sport, the sports' colours, the real counts
     2  Pick Your Sport              the switcher's sport chips and that sport's cards, turning by themselves
     3  So Many Ways to Play         the real logos of the different kinds of game (only the ones that are on)
     4  Wildcards and Your Vault     the draft's wildcard row, the Vault strip, the Shop and the Gameday Bag
     5  Daily Challenge, Boards...   today's real Daily Challenge, its countdown, a board and Friends
     6  depends on who is looking    a guest: a free profile first; a free profile 15 and over: CAST Pass (gold, the
                                     Pass's colour); under 15, or a Pass member: Start Playing

   Everything on screen is drawn from the site's own lists (shared/cg.js SPORTS and GAMES, so the counts and cards never
   go stale) and the account's own state (js/cast-account.js), in the same words and colours as the real screens. No
   odds, boosts or guarantees anywhere in the copy (the owner's rule: mechanics are never marketing).

   Moving: swipe (the track snaps a step at a time), the dots, Next and the round Back, the arrow keys, or a tap on the
   picture (left third back, the rest on). Next sits in the same place on every step. Skip on every step but the last,
   which has a close instead. The phone's Back closes it: the root is a body > .ca with a .ca-x, so the account's Back
   helper picks it up like any pop-up. GA: cg_tour_open { from, who } and then one of cg_tour_finish { step, action, who }
   or cg_tour_skip { step, how, who }. */
(function () {
  'use strict';
  if (window.CGTour) return;
  var CG = window.CG;
  var NB = ' ';
  function A() { return window.CastAccount || null; }
  function call(f, d) { var a = A(); try { return a && typeof a[f] === 'function' ? a[f]() : d; } catch (e) { return d; } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); }
  function url(p) { return CG && CG.url ? CG.url(p) : p; }
  function still() { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }
  function track(ev, p) { try { if (CG && CG.track) CG.track(ev, p); else if (typeof gtag === 'function') gtag('event', ev, p || {}); } catch (e) { /* no analytics */ } }

  /* ---------------- What the site has on now ---------------- */
  function liveSports() { return CG ? CG.SPORTS.filter(function (s) { return s.status === 'live'; }) : []; }
  function liveGames() { return CG ? CG.liveGames() : []; }
  // The same words as The Sports banner (js/home.js slides): "30+" from 31 games, the exact number under 10
  function gamesWord() { var n = liveGames().length; return n >= 10 ? Math.floor(n / 10) * 10 + '+' : String(n); }
  function game(id) { var g = CG && CG.game(id); return g && g.status === 'live' && CG.launched(g.launch) ? g : null; }
  // Each sport's main card (its most popular game), for the welcome fan and the sport rows
  function sportGames(sid, n) { return CG ? CG.popular(0, sid).filter(function (g) { return !!g.logo; }).slice(0, n || 99) : []; }
  // Who is looking: a guest, a free profile (15 and over: the account's buy rule, so under-15s never see a buy prompt),
  // a young or unnamed profile, or a CAST Pass member
  function who() {
    if (call('isSignedIn', false) !== true) return 'guest';
    if (call('hasPass', false) === true) return 'pass';
    return call('canBuyReroll', false) === true ? 'free' : 'young';
  }

  /* ---------------- The pictures (each drawn 340 x 320 and scaled to its space) ---------------- */
  function stripe() {
    var s = liveSports(), w = 100 / Math.max(1, s.length);
    return '<i class="cgt-7" aria-hidden="true" style="background:linear-gradient(90deg,' + s.map(function (x, i) { return x.hex + ' ' + (i * w).toFixed(2) + '% ' + ((i + 1) * w).toFixed(2) + '%'; }).join(',') + ')"></i>';
  }
  function card(g, line) {
    return '<span class="cgt-gc" style="--c1:' + g.c1 + ';--ink:' + g.ink + '"><span class="cgt-gc-art"><img src="' + esc(url(g.logo)) + '" alt="" decoding="async"></span>' +
      (line ? '<small>' + esc(g.line) + '</small>' : '') + '</span>';
  }
  // 1: the logo over a wall of game cards, one per sport (the Welcome banner's wall, live), the sports' colours under it
  function wallHtml() {
    var gs = liveSports().map(function (s) { return sportGames(s.id, 1)[0]; }).filter(Boolean), half = Math.ceil(gs.length / 2);
    var rows = gs.length > 4 ? [gs.slice(0, half), gs.slice(half)] : [gs];
    var k = 0, wall = rows.map(function (r) {
      return '<span class="cgt-wall-r">' + r.map(function (g) { return '<span class="cgt-wall-c" style="--d:' + (k++ * 70) + 'ms">' + card(g, false) + '</span>'; }).join('') + '</span>';
    }).join('');
    return '<span class="cgt-wall">' + wall + '</span>' + stripe();
  }
  function visWelcome() {
    return '<div class="cgt-vis is-welcome" aria-hidden="true"><img class="cgt-logo" src="' + esc(url('assets/logos/castgames-600.png')) + '" alt="" decoding="async">' + wallHtml() + '</div>';
  }
  // 2: the switcher's sport chips (emoji, the sport's colour) and the picked sport's cards, a tap on the first
  var swAt = 0;
  function swSports() { return liveSports().filter(function (s) { return sportGames(s.id, 1).length; }); }
  function swRow() {
    var sp = swSports()[swAt] || swSports()[0];
    if (!sp) return '';
    return '<div class="cgt-sw-h" style="--sc:' + sp.c + '"><i></i><b>' + esc(sp.name) + '</b><small>' + esc(sp.long) + '</small></div>' +
      '<div class="cgt-sw-row">' + sportGames(sp.id, 3).map(function (g) { return card(g, true); }).join('') + '<span class="cgt-tap"></span></div>';
  }
  function swChips() {
    return swSports().map(function (s, i) {
      return '<span class="cgt-chip' + (i === swAt ? ' is-on' : '') + '" style="--sc:' + s.c + '"><span>' + (s.ico || '') + '</span>' + esc(s.chip || s.name) + '</span>';
    }).join('');
  }
  function visSports() {
    return '<div class="cgt-vis is-sports" aria-hidden="true"><div class="cgt-sw-top"><span class="cgt-allg">All Games <i>&#x25BE;</i></span></div>' +
      '<div class="cgt-chips">' + swChips() + '</div><div class="cgt-sw-body">' + swRow() + '</div></div>';
  }
  // 3: the kinds of game, by their real logos (only what is on for this player)
  var WAYS = [['1000tries', 'Draft to a Target'], ['27-0', 'Go Undefeated'], ['higher-or-lower-nrl', 'Higher or Lower'], ['nrl-bingo', 'Fill the Card'],
    ['scpointsking', 'Chase the Crown'], ['world-cup-8-0', 'World Cup'], ['4000goals', 'Draft to a Target'], ['27-0-pack', 'Rip Open Packs'], ['60000runs', 'Test Cricket'], ['1000tries-team-spin', 'Spin and Pick']];
  function visWays() {
    var seen = {}, out = [];
    WAYS.forEach(function (w) { var g = game(w[0]); if (g && out.length < 6 && !seen[w[1]]) { seen[w[1]] = 1; out.push([g, w[1]]); } });
    return '<div class="cgt-vis is-ways" aria-hidden="true"><div class="cgt-ways">' + out.map(function (x, i) {
      return '<span class="cgt-way" style="--c1:' + x[0].c1 + ';--ink:' + x[0].ink + ';--d:' + (i * 80) + 'ms"><span class="cgt-gc-art"><img src="' + esc(url(x[0].logo)) + '" alt="" decoding="async"></span><b>' + esc(x[1]) + '</b></span>';
    }).join('') + '</div></div>';
  }
  // 4: the draft's wildcard row (the same colours and names in every game), the Vault strip, the Shop and the Bag
  function visWild() {
    var wc = function (k, ico, name) { return '<span class="cgt-wc is-' + k + '"><b><span>' + ico + '</span>' + name + '</b><small>1 left</small></span>'; };
    var chip = function (k, ico, n) { return '<i class="cgt-vchip is-' + k + '"><span>' + ico + '</span>' + n + '</i>'; };
    var nrl = CG && CG.sportOf('nrl');
    return '<div class="cgt-vis is-wild" aria-hidden="true"><div class="cgt-offer"><div class="cgt-offer-h"><b>Pick 1</b><small>Tries hidden until you pick</small></div>' +
      '<div class="cgt-wcs">' + wc('rr', '&#x1F504;', 'Reroll') + wc('rv', '&#x1F440;', 'Reveal') + wc('rm', '&#x274C;', 'Remove') + '</div>' +
      '<div class="cgt-pl" style="--c1:' + (nrl ? nrl.hex : '#15803D') + '"><span class="cgt-pl-club">NRL</span><b>Your Next Pick</b><span class="cgt-pl-q">??' + NB + '<small>tries</small></span></div></div>' +
      '<div class="cgt-vault"><b>&#x1F510; Your Vault</b><span class="cgt-vchips">' + chip('rr', '&#x1F504;', 3) + chip('rv', '&#x1F440;', 2) + chip('rm', '&#x274C;', 2) + chip('rib', '&#x23EA;', 1) + chip('key', '&#x2B50;', 1) + chip('goat', '&#x1F410;', 1) + '</span></div>' +
      '<div class="cgt-shop"><span>&#x1F6D2; Shop</span><span>&#x1F392; Gameday Bag</span></div></div>';
  }
  // 5: today's real Daily Challenge (1000TRIES's, from the page's own calendar), the countdown to the next, a board, Friends
  function sydDate(ms) {
    try { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Sydney', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(ms)); } catch (e) { return new Date(ms).toISOString().slice(0, 10); }
  }
  function dailyHead() {
    var C = window.CG_DAILY_NRL || window.CAST_DAILY;
    try {
      var d = C.day(sydDate(Date.now())), era = d.key.indexOf('era:') === 0, lead = d.lead != null ? d.lead : era ? 'From ' : 'With ';
      return d.g1000.target + '+ ' + lead + d.short;
    } catch (e) { return 'A new challenge today'; }
  }
  function nextDaily() {
    try {
      var p = {};
      new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Sydney', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
      var left = 24 * 60 - ((parseInt(p.hour, 10) || 0) * 60 + (parseInt(p.minute, 10) || 0)), h = Math.floor(left / 60), m = left % 60;
      return 'New in ' + (h ? h + 'h ' : '') + m + 'm';
    } catch (e) { return 'New at midnight'; }
  }
  function visDaily() {
    var g = game('1000tries') || liveGames()[0], logo = g && g.logo ? '<img src="' + esc(url(g.logo)) + '" alt="" decoding="async">' : '';
    var row = function (r, n, s, me) { return '<li' + (me ? ' class="is-me"' : '') + '><span>' + r + '</span><b>' + n + '</b><em>' + s + '</em></li>'; };
    return '<div class="cgt-vis is-daily" aria-hidden="true">' +
      '<div class="cgt-dc" style="--c1:' + (g ? g.c1 : '#15803D') + '"><span class="cgt-dc-l">' + logo + '</span><span class="cgt-dc-t"><b>&#x1F5D3;&#xFE0F; Daily Challenge</b><small>' + esc(dailyHead()) + '</small></span>' +
      '<span class="cgt-dc-f"><i>' + esc(nextDaily()) + '</i><i class="is-fire">&#x1F525; 7' + NB + 'Day Streak</i></span></div>' +
      '<div class="cgt-two"><div class="cgt-lb"><b>&#x1F3C6; This Week</b><ol>' + row('1', 'SinBinSam', '1107') + row('2', 'TryTimeTommo', '1081') + row('3', 'DummyHalfDan', '1064') + row('#14', 'You', '1012', true) + '</ol></div>' +
      '<div class="cgt-fr"><b>&#x1F465; Friends</b><span class="cgt-avs"><i style="--a:#3a78b5">S</i><i style="--a:#be185d">T</i><i style="--a:#0f766e">D</i></span><small>Send your exact draft to a mate</small><span class="cgt-fr-go">&#x2694;&#xFE0F; Challenge</span></div></div></div>';
  }
  // 6: for a guest, what a free CAST Profile gives (the sign-in wall's own list); for a free profile, CAST Pass; else all set
  var PERKS = [['&#x267E;&#xFE0F;', 'Unlimited Games'], ['&#x1F3B4;', 'Wildcards'], ['&#x1F5D3;&#xFE0F;', 'Daily Challenge'], ['&#x1F3C6;', 'Leaderboards'], ['&#x2694;&#xFE0F;', 'Challenges'], ['&#x1F4CA;', 'Your Stats']];
  // The gold tick: the account's own badge (js/cast-account.js PASS_SVG), as it shows on the boards
  var TICK = '<svg class="cgt-vf" viewBox="0 0 24 24" aria-hidden="true"><path fill="#f1c073" d="M22.5 12.5c0-1.58-.88-2.95-2.15-3.6.15-.44.23-.92.23-1.4 0-2.21-1.71-3.99-3.82-3.99-.47 0-.92.08-1.34.25C14.8 2.49 13.51 1.6 12 1.6s-2.8.89-3.42 2.16c-.42-.17-.87-.26-1.34-.26-2.11 0-3.82 1.78-3.82 3.99 0 .49.08.96.23 1.4-1.27.65-2.15 2.02-2.15 3.6 0 1.5.8 2.8 1.98 3.47-.02.17-.03.34-.03.52 0 2.21 1.71 4 3.82 4 .47 0 .92-.09 1.34-.25.62 1.26 1.9 2.16 3.39 2.16 1.5 0 2.78-.9 3.4-2.16.42.16.87.25 1.34.25 2.11 0 3.82-1.79 3.82-4 0-.18-.01-.35-.04-.52 1.18-.67 1.98-1.97 1.98-3.47z"/><path fill="#1c1400" d="M10.54 16.55l-3.8-3.8 1.42-1.41 2.38 2.38 5.3-5.3 1.41 1.42z"/></svg>';
  var PASS_PERKS = [['&#x1F3B4;', '2 of Every Wildcard'], ['&#x1F511;', 'Daily Vault Keys'], [TICK, 'The Gold Tick']];
  function visEnd(w) {
    if (w === 'free' || w === 'pass') {
      return '<div class="cgt-vis is-pass' + (w === 'pass' ? ' is-member' : '') + '" aria-hidden="true"><img class="cgt-pass" src="' + esc(url('assets/cast-pass-logo.png')) + '" alt="" decoding="async">' +
        (w === 'pass' ? '<span class="cgt-member">' + TICK + ' Member</span>' : '<ul class="cgt-pp">' + PASS_PERKS.map(function (p) { return '<li><span>' + p[0] + '</span>' + p[1] + '</li>'; }).join('') + '</ul>') + '</div>';
    }
    if (w === 'young') return '<div class="cgt-vis is-welcome is-set" aria-hidden="true"><span class="cgt-tick">&#x2705;</span>' + wallHtml() + '</div>';
    return '<div class="cgt-vis is-perks" aria-hidden="true"><ul class="cgt-perks">' + PERKS.map(function (p, i) { return '<li style="--d:' + (i * 60) + 'ms"><span>' + p[0] + '</span>' + p[1] + '</li>'; }).join('') + '</ul>' +
      '<p class="cgt-free">&#x2705; Free forever &middot; No password</p></div>';
  }

  /* ---------------- The words ---------------- */
  function steps() {
    var sN = liveSports().length;
    return [
      { id: 'welcome', k: 'How It Works', h: 'Welcome to CAST Games', p: sN + NB + 'sports. ' + gamesWord() + NB + 'games. One free account for all of them.', vis: visWelcome },
      { id: 'sports', k: 'All Games', h: 'Pick Your Sport', p: 'Choose a sport, then tap any card to jump straight into a game.', vis: visSports },
      { id: 'ways', k: 'Game Modes', h: 'So Many Ways to Play', p: 'Draft to a target, go undefeated, beat the clock and more. Every card plays its own way.', vis: visWays },
      { id: 'wild', k: 'Wildcards', h: 'Wildcards and Your Vault', p: 'Reroll, Reveal, Remove and more. One Vault for every game, topped up from the Shop or a Gameday' + NB + 'Bag.', vis: visWild },
      { id: 'daily', k: 'Every Day', h: 'Daily Challenge, Boards and Friends', p: 'A new Daily Challenge every midnight, Sydney time. Build a streak, climb the boards and challenge your mates.', vis: visDaily },
      { id: 'end', end: true }
    ];
  }
  function endCopy(w) {
    if (w === 'guest') return { k: 'Free CAST Profile', h: 'One Free Account', p: 'Save every game, unlock wildcards, climb the boards and keep your streak.', b: 'Create Your Free Account', alt: 'Start Playing', go: 'signup' };
    if (w === 'free') return { k: 'CAST Pass', h: 'Get More From Every Game', p: '2 of every wildcard, daily Vault keys and the gold tick, in every game.', b: 'See CAST Pass', alt: 'Start Playing', go: 'pass', gold: true };
    if (w === 'pass') return { k: 'CAST Pass Member', h: 'You’re All Set', p: 'Your CAST Pass works in every game. Pick a sport and start playing.', b: 'Start Playing', go: 'play', gold: true };
    return { k: 'Your CAST Profile', h: 'You’re All Set', p: 'Pick a sport, tap a card and play. Every game saves to your profile.', b: 'Start Playing', go: 'play' };
  }

  /* ---------------- Drawing ---------------- */
  var root = null, track_ = null, at = 0, list = [], whoNow = 'guest', from = '', opener = null, ended = false, swTimer = 0, fitT = 0, scrollT = 0, srPrev = null, srT = 0;
  function copyHtml(c) {
    return '<div class="cgt-copy"><span class="cgt-k">' + esc(c.k) + '</span><h2 class="cgt-h">' + esc(c.h) + '</h2><p class="cgt-p">' + esc(c.p) + '</p></div>';
  }
  function stepHtml(s, i) {
    var c = s.end ? endCopy(whoNow) : s;
    return '<section class="cgt-step is-' + (s.end ? 'end' : s.id) + (c.gold ? ' is-gold' : '') + '" data-i="' + i + '" role="group" aria-roledescription="slide" aria-label="' + (i + 1) + ' of ' + list.length + ': ' + esc(c.h) + '">' +
      '<div class="cgt-stage">' + (s.end ? visEnd(whoNow) : s.vis()) + '</div>' + copyHtml(c) + '</section>';
  }
  function build() {
    list = steps();
    whoNow = who();
    root = document.createElement('div');
    root.className = 'ca cgt'; // body > .ca with a .ca-x: the phone's Back closes it (js/cast-account.js, The phone's Back)
    root.hidden = true;
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', 'How CAST Games Works');
    root.innerHTML = '<div class="cgt-scrim" data-cgt="scrim"></div><div class="cgt-box" tabindex="-1">' +
      '<div class="cgt-top"><span class="cgt-sp"></span><div class="cgt-dots" role="group" aria-label="Steps">' + list.map(function (s, i) {
        return '<button type="button" class="cgt-dot" data-cgt-dot="' + i + '" aria-label="Step ' + (i + 1) + ' of ' + list.length + '"></button>';
      }).join('') + '</div><button type="button" class="cgt-x ca-x" data-cgt="x">Skip</button></div>' +
      '<div class="cgt-track">' + list.map(stepHtml).join('') + '</div>' +
      '<div class="cgt-foot"><div class="cgt-btns"><button type="button" class="cgt-back" data-cgt="back" aria-label="Back">&#x2039;</button>' +
      '<button type="button" class="cgt-next" data-cgt="next">Next</button></div><div class="cgt-alt-row"><button type="button" class="cgt-alt" data-cgt="alt" hidden></button></div></div>' +
      '<p class="cgt-sr" aria-live="polite"></p></div>';
    document.body.appendChild(root);
    track_ = root.querySelector('.cgt-track');
    root.addEventListener('click', onClick);
    root.addEventListener('keydown', onKey);
    track_.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function () { if (!root.hidden) { fitSoon(); goTo(at, false); } });
    window.addEventListener('cast-account', function () { if (!root.hidden && who() !== whoNow) redrawEnd(); });
  }
  // The last step follows the account (a sign-in finishing while the tour is open)
  function redrawEnd() {
    whoNow = who();
    var old = track_.querySelector('.cgt-step.is-end'), i = list.length - 1, tmp = document.createElement('div');
    tmp.innerHTML = stepHtml(list[i], i);
    track_.replaceChild(tmp.firstChild, old);
    sync(true);
    fitSoon();
  }
  // Each picture is drawn 340 x 320 and scaled to the room its step has beside its words (up to 1.4 on a desktop card);
  // the picture and the words sit together in the middle of the step
  function fit() {
    if (!root) return;
    Array.prototype.forEach.call(root.querySelectorAll('.cgt-step'), function (st) {
      var cs = getComputedStyle(st), cp = st.querySelector('.cgt-copy');
      var w = st.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight), h = st.clientHeight - (cp ? cp.offsetHeight : 150) - 12;
      st.style.setProperty('--s', Math.max(0.55, Math.min(w / 340, h / 320, 1.4)).toFixed(3));
    });
  }
  function fitSoon() { clearTimeout(fitT); fitT = setTimeout(fit, 30); }

  /* ---------------- Moving ---------------- */
  // Next, Back, a dot or a key: straight to that step (a smooth slide passing other steps does not light them up)
  var going = 0;
  function goTo(i, smooth) {
    i = Math.max(0, Math.min(list.length - 1, i));
    var w = track_.clientWidth, sm = smooth && !still();
    clearTimeout(scrollT);
    going = sm ? 1 : 0;
    if (sm) scrollT = setTimeout(function () { going = 0; }, 700);
    if (track_.scrollTo) track_.scrollTo({ left: i * w, behavior: sm ? 'smooth' : 'auto' }); else track_.scrollLeft = i * w;
    if (i !== at) { at = i; sync(); }
  }
  // A swipe: the step more than half in view is the live one (its picture starts coming in as it lands)
  function onScroll() {
    if (going) return;
    var w = track_.clientWidth || 1, i = Math.max(0, Math.min(list.length - 1, Math.round(track_.scrollLeft / w)));
    if (i !== at) { at = i; sync(); }
  }
  // The dots, the buttons, which step is live (its pictures move), what a screen reader hears
  function sync(quiet) {
    var last = at === list.length - 1, c = list[at].end ? endCopy(whoNow) : list[at];
    Array.prototype.forEach.call(root.querySelectorAll('.cgt-dot'), function (d, i) { d.classList.toggle('is-on', i === at); if (i === at) d.setAttribute('aria-current', 'step'); else d.removeAttribute('aria-current'); });
    Array.prototype.forEach.call(root.querySelectorAll('.cgt-step'), function (s, i) {
      var on = i === at;
      s.classList.toggle('is-on', on);
      if (on) { s.classList.add('is-seen'); s.removeAttribute('aria-hidden'); s.inert = false; } else { s.setAttribute('aria-hidden', 'true'); s.inert = true; }
    });
    var x = root.querySelector('.cgt-x'), next = root.querySelector('.cgt-next'), back = root.querySelector('.cgt-back'), alt = root.querySelector('.cgt-alt');
    x.textContent = last ? '✕' : 'Skip';
    x.classList.toggle('is-close', last);
    x.setAttribute('aria-label', last ? 'Close' : 'Skip the tour');
    next.textContent = last ? c.b : 'Next';
    next.classList.toggle('is-gold', !!(last && c.gold && c.go === 'pass'));
    back.classList.toggle('is-off', at === 0);
    back.tabIndex = at === 0 ? -1 : 0;
    alt.hidden = !(last && c.alt);
    alt.textContent = last && c.alt ? c.alt : '';
    root.classList.toggle('is-last', last);
    root.setAttribute('data-step', list[at].id || 'end');
    if (!quiet) root.querySelector('.cgt-sr').textContent = 'Step ' + (at + 1) + ' of ' + list.length + ': ' + c.h;
    sportsTurn();
  }
  // Step 2's sport chips turn by themselves (every 2.6 s), the cards and the tap following
  function sportsTurn() {
    clearInterval(swTimer); swTimer = 0;
    if (!root || root.hidden || list[at].id !== 'sports' || still()) return;
    swTimer = setInterval(function () {
      var n = swSports().length;
      if (!n || document.hidden) return;
      swAt = (swAt + 1) % n;
      var st = root.querySelector('.cgt-step.is-sports');
      if (!st) return;
      st.querySelector('.cgt-chips').innerHTML = swChips();
      st.querySelector('.cgt-sw-body').innerHTML = swRow();
    }, 2600);
  }

  /* ---------------- Opening and closing ---------------- */
  function open(src) {
    CG = CG || window.CG;
    if (!CG || !document.body) return;
    if (!root) build();
    else if (root.hidden) { // a sign-in or a launch since the last time: the steps again, as they are now
      list = steps(); whoNow = who();
      track_.innerHTML = list.map(stepHtml).join('');
    }
    if (!root.hidden) return;
    from = src || 'hero'; ended = false; at = 0; swAt = 0;
    // Focus goes back to the banner afterwards only for a keyboard (a focused banner holds the home slides still)
    var ae = document.activeElement;
    try { opener = ae && ae !== document.body && ae.matches(':focus-visible') ? ae : null; } catch (e) { opener = null; }
    // While it is open, a step back through history never moves the home page (Start Playing scrolls it to All Games)
    clearTimeout(srT);
    try { if ('scrollRestoration' in history) { if (srPrev == null) srPrev = history.scrollRestoration; history.scrollRestoration = 'manual'; } } catch (e) { /* old browser */ }
    root.hidden = false;
    document.documentElement.classList.add('cgt-open');
    track_.scrollLeft = 0;
    fit();
    sync(true);
    var box = root.querySelector('.cgt-box');
    try { box.focus({ preventScroll: true }); } catch (e) { box.focus(); }
    track('cg_tour_open', { from: from, who: whoNow });
  }
  // how: 'skip' (Skip, Escape, the scrim), 'back' (the phone's Back), or the last step's action
  function close(how, action) {
    if (!root || root.hidden) return;
    var step = at + 1, done = !!action;
    if (!ended) {
      ended = true;
      if (done) track('cg_tour_finish', { step: step, action: action, who: whoNow });
      else track('cg_tour_skip', { step: step, how: how, who: whoNow });
    }
    root.hidden = true;
    clearInterval(swTimer); swTimer = 0;
    document.documentElement.classList.remove('cgt-open');
    if (/^#how-it-works$/.test(location.hash)) { try { history.replaceState(history.state, '', location.pathname + location.search); } catch (e) { /* old browser */ } }
    srT = setTimeout(function () { try { if (srPrev) history.scrollRestoration = srPrev; } catch (e) { /* old browser */ } srPrev = null; }, 800);
    var a = A();
    // The next thing opens in this same moment, so the Back helper keeps one history entry for it
    if (action === 'signup' && a) { if (!a.requireSignIn || a.requireSignIn(null, 'cg_tour') === true) { if (a.openProfile) a.openProfile(); } return; }
    if (action === 'pass' && a) { if (a.openPass) a.openPass('cg_tour'); else if (a.open) a.open('pass'); return; }
    if (action === 'play') {
      setTimeout(function () {
        var gs = document.getElementById('cgGames');
        if (gs) gs.scrollIntoView({ behavior: still() ? 'auto' : 'smooth', block: 'start' });
        else if (CG && CG.url) location.href = CG.url('');
      }, 120);
      return;
    }
    if (opener && document.contains(opener)) { try { opener.focus({ preventScroll: true }); } catch (e) { /* gone */ } }
  }
  function finish() { var c = endCopy(whoNow); close('done', c.go); }

  function onClick(e) {
    var t = e.target, dot = t.closest('[data-cgt-dot]');
    if (dot) { goTo(+dot.getAttribute('data-cgt-dot'), true); return; }
    var b = t.closest('[data-cgt]'), k = b && b.getAttribute('data-cgt');
    // A .ca-x clicked by the account's Back helper is not a person's tap (isTrusted false): that is the phone's Back
    if (k === 'x') { close(e.isTrusted === false ? 'back' : at === list.length - 1 ? 'close' : 'skip'); return; }
    if (k === 'scrim') { close('skip'); return; }
    if (k === 'next') { if (at === list.length - 1) finish(); else goTo(at + 1, true); return; }
    if (k === 'back') { goTo(at - 1, true); return; }
    if (k === 'alt') { close('done', 'play'); return; }
    // A tap on the picture: the left third goes back, the rest on (like stories); never past the last step
    var st = t.closest('.cgt-stage');
    if (st) { var r = st.getBoundingClientRect(); if (e.clientX < r.left + r.width / 3) goTo(at - 1, true); else if (at < list.length - 1) goTo(at + 1, true); }
  }
  function onKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); close('skip'); return; }
    if (e.key === 'ArrowRight') { e.preventDefault(); goTo(at + 1, true); return; }
    if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(at - 1, true); return; }
    if (e.key === 'Tab') { // focus stays inside the tour
      var f = Array.prototype.filter.call(root.querySelectorAll('.cgt-top button, .cgt-foot button'), function (x) { return !x.hidden && x.tabIndex !== -1; });
      if (!f.length) return;
      var i = f.indexOf(document.activeElement);
      if (e.shiftKey && (i <= 0)) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && (i === f.length - 1 || i < 0)) { e.preventDefault(); f[0].focus(); }
    }
  }

  window.CGTour = { open: open, close: function () { close('skip'); }, step: function (i) { if (root && !root.hidden) goTo(i, false); return at; } };
})();
