/* The CAST Games home page (15 Oct 2026, the owner picked layout B: featured, then rows, then each sport's games in its own
   section). Everything comes from shared/cg.js (the sports and games) and the account (promos, drafts):
     Featured     the promos that are on now (World Cup, Team of the Week), side by side on desktop
     Continue     drafts saved on this device (each game keeps its own), newest first; hidden when there are none
     Daily        each game with a Daily Challenge
     Most Popular the four most popular live games (CG.popular, the owner, 15 Oct 2026)
     All Games    one See All button per sport with live games, to its own page (nrl/, afl/: every game for that sport)
     Boards, Pass the leaderboards and the CAST Pass
   A sport page (window.CG_SPORT, tools/build.py makes them) is the same file drawing that sport's games instead.
   Redrawn when the launch switches or the Team of the Week change. */
(function () {
  'use strict';
  var CG = window.CG, el = document.getElementById('cgHome');
  if (!CG || !el) return;
  function A() { return window.CastAccount || null; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); }
  function lsJson(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  function art(g, cls) { return g.logo ? '<img class="' + (cls || 'cg-art') + '" src="' + esc(g.logo) + '" alt="' + esc(g.name) + '">' : '<span class="' + (cls || 'cg-art') + ' cg-mark">' + g.mark + '</span>'; }
  // The competition above a game's name (Big Bash or Test Cricket), its own colours
  function comp(g) { return g.comp ? '<span class="cg-comp" style="--cc:' + g.cc + ';--ci:' + g.ci + '">' + esc(g.comp) + '</span>' : ''; }
  function game(id) { for (var i = 0; i < CG.GAMES.length; i++) if (CG.GAMES[i].id === id) return CG.GAMES[i]; return null; }

  /* The featured banner slides (16 Oct 2026, the owner: "it's just there and doesn't offer anything"): the World Cup while
     it's on, CAST Pass for anyone without it (money cards first), the newest game, and today's Daily Challenge. Each slide
     wears its own colours; they rotate on their own and swipe by hand */
  function newest() {
    var gs = CG.liveGames().filter(function (g) { return g.badge && g.logo; });
    return gs.length ? gs[gs.length - 1] : null;
  }
  function promos() {
    var a = A(), out = [];
    if (a && a.wcLive && a.wcLive()) out.push({ k: 'Featured · World Cup', t: 'World Cup 8-0', p: 'Spin a nation, draft from its 2026 squad and win all eight.', b: 'Play Now', href: '27-0/?play=wc', art: 'assets/logos/27-0.png', c1: '#0f4c8a', c2: '#081a33', ac: '56,189,248' });
    var w = a && a.totw ? a.totw() : null;
    if (w) out.push({ k: 'World Cup · ' + w.label, t: 'Team of the Week', p: '13 players boosted in World Cup 8-0 this week.', b: 'See the 13', href: '27-0/?play=wc', art: 'assets/logos/27-0.png', c1: '#0f4c8a', c2: '#081a33', ac: '56,189,248' });
    if (!(a && a.hasPass && a.hasPass())) out.push({ k: 'CAST Pass', t: 'Play Every Game Like a Member', p: 'Free wildcards in every game, no ads, and a free Pick every promo.', b: 'See CAST Pass', open: 'pass', art: 'assets/cast-pass-logo.png', c1: '#3a2a0c', c2: '#120d04', ac: '241,192,115', pass: true });
    var g = newest();
    if (g) out.push({ k: 'New Game · ' + ((CG.sportOf(g.sport) || {}).name || ''), t: g.name, p: g.line, b: 'Play Free', href: g.path, art: g.logo, c1: g.c1, c2: g.c2, ac: (CG.sportOf(g.sport) || {}).c || '255,255,255' });
    var dg = CG.popular(0).filter(function (x) { return x.daily && dailyOf(x.id); })[0];
    if (dg) { var dx = dailyOf(dg.id); out.push({ k: 'Daily Challenge', t: dg.name + ' Daily', p: dx.head + (dx.reward ? '. ' + dx.reward.trim() : ''), b: 'Play Today', href: dg.path + '?play=' + (dg.dplay || 'daily'), art: dg.logo, c1: dg.c1, c2: dg.c2, ac: (CG.sportOf(dg.sport) || {}).c || '255,255,255' }); }
    if (!out.length) out.push({ k: 'Welcome', t: 'Pick a Sport, Pick a Game', p: 'Draft games for NRL, AFL, cricket, NFL and horse racing fans.', b: 'Browse Games', href: '#cgSports', art: 'assets/logos/castgames.png', c1: '#0c2747', c2: '#081322', ac: '56,189,248' });
    return out;
  }
  function slide(p, i) {
    var st = ' style="--c1:' + p.c1 + ';--c2:' + p.c2 + ';--ac:' + p.ac + '"', inner = '<span class="cg-k">' + esc(p.k) + '</span><b>' + esc(p.t) + '</b><p>' + esc(p.p) + '</p><span class="cg-btn">' + esc(p.b) + '</span>' +
      (p.art ? '<img class="cg-promo-art" src="' + esc(p.art) + '" alt="" aria-hidden="true">' : '');
    var cls = 'cg-promo' + (p.pass ? ' is-pass' : '');
    return p.open ? '<button type="button" class="' + cls + '" data-open="' + p.open + '" data-slide="' + i + '"' + st + '>' + inner + '</button>'
      : '<a class="' + cls + '" href="' + esc(p.href) + '" data-slide="' + i + '"' + st + '>' + inner + '</a>';
  }
  // The rotation: every 6 s, paused while a finger or mouse is on it, off for reduced motion; it keeps its place on a redraw
  var heroAt = 0, heroTimer = null;
  function heroGo(track, i, smooth) {
    var n = track.children.length; if (!n) return;
    heroAt = (i + n) % n;
    track.scrollTo({ left: track.children[heroAt].offsetLeft - track.offsetLeft, behavior: smooth ? 'smooth' : 'auto' });
    var dots = track.parentNode.querySelectorAll('.cg-dot');
    Array.prototype.forEach.call(dots, function (d, k) { d.classList.toggle('is-on', k === heroAt); d.setAttribute('aria-current', k === heroAt ? 'true' : 'false'); });
  }
  function heroWire() {
    var track = el.querySelector('.cg-hero-track'); clearInterval(heroTimer);
    if (!track || track.children.length < 2) return;
    heroGo(track, heroAt, false);
    var held = false, still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    ['pointerenter', 'touchstart', 'focusin'].forEach(function (e) { track.addEventListener(e, function () { held = true; }, { passive: true }); });
    ['pointerleave', 'touchend', 'focusout'].forEach(function (e) { track.addEventListener(e, function () { held = false; }, { passive: true }); });
    var t; track.addEventListener('scroll', function () { clearTimeout(t); t = setTimeout(function () { var w = track.clientWidth || 1, i = Math.round(track.scrollLeft / w); if (i !== heroAt) heroGo(track, i, false); }, 120); }, { passive: true });
    if (!still) heroTimer = setInterval(function () { if (!held && !document.hidden) heroGo(track, heroAt + 1, true); }, 6000);
  }
  // Drafts waiting on this device: 1000TRIES and 4000 GOALS keep theirs under their own names here, 27-0 under its own
  function drafts() {
    var out = [], day = 24 * 3600000, now = Date.now();
    [['1000tries', '1000tries_draft_v1', 13], ['4000goals', '4000goals_draft_v1', 18], ['27-0', '270_draft_v1', 13]].forEach(function (x) {
      var d = lsJson(x[1]), g = game(x[0]);
      if (!d || !g || !(d.at > now - day)) return;
      var mode = d.name || ({ classic: 'Classic', hard: 'Hard Mode', pack: 'Packs', wc: 'World Cup 8-0' })[d.mode] || g.name;
      out.push({ g: g, at: d.at, t: g.name === mode ? g.name : mode, s: (d.picks || 0) + ' of ' + x[2] + ' picked' });
    });
    return out.sort(function (a, b) { return b.at - a.at; });
  }
  // Midnight in Sydney, when the next Dailies drop
  function nextDaily() {
    try {
      var p = {}; new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Sydney', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(new Date()).forEach(function (x) { p[x.type] = +x.value || x.value; });
      var left = (24 * 60) - (p.hour * 60 + p.minute), h = Math.floor(left / 60), m = left % 60;
      return 'New in ' + (h ? h + 'h ' : '') + m + 'm';
    } catch (e) { return ''; }
  }

  // A game tile (Most Popular and the sport pages): the same size everywhere
  function tile(g) {
    return '<a class="cg-game-t" href="' + esc(CG.url(g.path)) + '" style="--c1:' + g.c1 + ';--c2:' + g.c2 + '">' + (g.badge ? '<span class="cg-new">' + esc(g.badge) + '</span>' : '') + art(g) +
      '<b' + (g.name.length > 14 ? ' class="is-long"' : '') + '>' + comp(g) + esc(g.name) + '</b><small>' + esc(g.line) + '</small><span class="cg-btn is-white">Play</span></a>';
  }
  // A sport page (nrl/, afl/): its games, most popular first, an odd number made even with a More Coming tile
  function drawSport(id) {
    var sp = CG.sportOf(id), gs = CG.popular(0, id);
    if (!sp) return;
    var tiles = gs.map(tile);
    if (tiles.length % 2) tiles.push('<div class="cg-game-t is-soon"><b>More Coming</b><small>A new ' + esc(sp.name) + ' game is on the way</small></div>');
    el.innerHTML = '<section class="cg-sport is-page" style="--sc:' + sp.c + '"><div class="cg-sport-h"><span class="cg-sport-ico" aria-hidden="true">' + sp.ico + '</span><span class="cg-sh-t"><b>' + esc(sp.name) + '</b><small>' + esc(sp.long) + '</small></span>' +
      '<span class="cg-count">' + gs.length + ' Game' + (gs.length === 1 ? '' : 's') + '</span></div><div class="cg-games n' + tiles.length + '">' + tiles.join('') + '</div></section>' +
      '<section class="cg-sec cg-two"><a class="cg-wide" href="' + esc(CG.url('')) + '"><span>&#x1F3E0;</span><b>All Games</b><small>Every sport on CAST Games</small></a>' +
      '<button type="button" class="cg-wide" data-open="boards"><span>&#x1F3C6;</span><b>Leaderboards</b><small>Every game, every week</small></button></section>';
  }
  /* Today's Daily Challenge for a game, in its own words (the owner, 15 Oct 2026: "pull through in smaller text what the
     daily challenge is, or the reward"): the headline each game's home card shows (js/daily.js themeFor), and the reward */
  function sydDate() { try { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Sydney', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); } catch (e) { return new Date().toISOString().slice(0, 10); } }
  function fmt(n) { return String(n); } // no commas in numbers (the owner, 16 Oct 2026)
  // Each game's calendar (index.html loads them) and the name its rewards go under
  var CAL = { '27-0': ['CG_DAILY_NRL', '27-0'], '1000tries': ['CG_DAILY_NRL', '1000tries'], '4000goals': ['CG_DAILY_AFL', '4000goals'],
    '25000runs': ['CG_DAILY_BBL', 'bigbash'], '60000runs': ['CG_DAILY_TESTS', 'tests'], '700tds': ['CG_DAILY_NFL', 'nfl'], 'g1winner': ['CG_DAILY_RACING', 'racing'], '500goals': ['CG_DAILY_EPL', 'epl'], scpointsking: ['CG_DAILY_SC', 'sc'] };
  function dailyOf(id) {
    // NRL Bingo's Daily (17 Oct 2026): the same card of players for everyone, one go, no reward of its own
    if (id === 'nrl-bingo') return { head: 'Fill all 20 tiles', icon: '', reward: '' };
    var cal = CAL[id], C = cal && window[cal[0]];
    if (!C || !C.day) return null;
    try {
      var d = C.day(sydDate()), era = d.key.indexOf('era:') === 0, head, lead;
      if (id === '27-0') {
        var g = d.g270, region = d.key === 'sydney' || d.key === 'queensland';
        head = (era ? d.short.replace(/^The /, '') : region ? d.short.replace(/ Clubs$/, '') : d.short) + (g.wins ? ' 13 with ' + g.wins + '+ wins' : ' 13 rated ' + g.goal + '+');
      } else {
        // the words each game's own home card uses (its js/daily.js themeFor): "525+ From the 2010s", "46250+ With Australia"
        if (id === 'g1winner') lead = /^(era|dec):/.test(d.key) ? (/^Since /.test(d.short) ? '' : d.key.indexOf('dec:') === 0 ? 'From the ' : 'From ') : d.g1000.ds ? '' : 'With ';
        else lead = d.lead != null ? d.lead : era ? 'From ' : 'With ';
        head = fmt(d.g1000.target) + '+ ' + lead + d.short;
      }
      var items = (d.reward || {})[cal[1]] || {}, k = Object.keys(items)[0];
      return { head: head, icon: d.icon || '', reward: k ? ((C.itemIcons && C.itemIcons[k]) || '') + ' ' + C.itemsText(items) : '' };
    } catch (e) { return null; }
  }
  function dailyCard(g) {
    var x = dailyOf(g.id);
    return '<a class="cg-card cg-dcard" href="' + esc(CG.url(g.path + '?play=' + (g.dplay || 'daily'))) + '" style="--c1:' + g.c1 + ';--c2:' + g.c2 + '">' + art(g) +
      '<span class="cg-card-t"><b>' + comp(g) + esc(g.name) + '</b><small class="cg-dhead">' + esc(x ? x.head : 'New today') + '</small>' +
      (x && x.reward ? '<small class="cg-dreward">' + esc(x.reward) + '</small>' : '') + '</span><span class="cg-cta">Play</span></a>';
  }
  var dAll = false; // the Daily grid is open (View All)
  function dailyMini(g) {
    var x = dailyOf(g.id);
    return '<a class="cg-dmini" href="' + esc(CG.url(g.path + '?play=' + (g.dplay || 'daily'))) + '" style="--c1:' + g.c1 + ';--c2:' + g.c2 + '">' + art(g, 'cg-dlogo') +
      '<b>' + comp(g) + esc(g.name) + '</b><small class="cg-dhead">' + esc(x ? x.head : 'New today') + '</small>' +
      '<span class="cg-dfoot">' + (x && x.reward ? '<small class="cg-dreward">' + esc(x.reward) + '</small>' : '<i></i>') + '<span class="cg-cta">Play</span></span></a>';
  }
  function dailyTile(g) {
    var x = dailyOf(g.id);
    return '<a class="cg-dtile" href="' + esc(CG.url(g.path + '?play=' + (g.dplay || 'daily'))) + '" style="--c1:' + g.c1 + ';--c2:' + g.c2 + '">' + art(g, 'cg-dlogo') +
      '<b>' + comp(g) + esc(g.name) + '</b><small>' + esc(x ? x.head : 'New today') + '</small></a>';
  }
  function card(g, sub, cta, href, done) {
    return '<a class="cg-card" href="' + esc(href) + '" style="--c1:' + g.c1 + ';--c2:' + g.c2 + '">' + art(g) +
      '<span class="cg-card-t"><b>' + esc(sub[0]) + '</b><small>' + esc(sub[1]) + '</small></span>' +
      '<span class="cg-cta' + (done ? ' is-done' : '') + '">' + cta + '</span></a>';
  }
  function draw() {
    var live = CG.liveGames(), h = '';
    // Featured: the rotating banner (a single slide when only one is on)
    var ps = promos();
    h += '<section class="cg-hero" aria-roledescription="carousel" aria-label="Featured"><div class="cg-hero-track">' + ps.map(slide).join('') + '</div>' +
      (ps.length > 1 ? '<div class="cg-dots">' + ps.map(function (p, i) { return '<button type="button" class="cg-dot" data-dot="' + i + '" aria-label="' + esc(p.t) + '"></button>'; }).join('') + '</div>' : '') + '</section>';
    // Continue Playing, then the Dailies: one swipeable row of small cards, and View All opens a compact grid of every one
    // (16 Oct 2026, the owner: the stacked Dailies took too much of the home page)
    var dr = drafts(), daily = live.filter(function (g) { return g.daily; });
    if (dr.length) h += '<section class="cg-sec"><h2>Continue Playing</h2><div class="cg-cards">' + dr.slice(0, 3).map(function (d) { return card(d.g, [d.t, d.s], 'Continue', d.g.path); }).join('') + '</div></section>';
    if (daily.length) {
      h += '<section class="cg-sec cg-daily"><h2><span>Daily Challenges <small>' + esc(nextDaily()) + '</small></span>' +
        (daily.length > 2 ? '<button type="button" class="cg-view" data-dview aria-expanded="' + dAll + '">' + (dAll ? 'Show Less' : 'View All ' + daily.length) + '</button>' : '') + '</h2>' +
        (dAll ? '<div class="cg-dgrid">' + daily.map(dailyTile).join('') + '</div>' : '<div class="cg-drow">' + daily.map(dailyMini).join('') + '</div>') + '</section>';
    }
    // Most Popular: the top four live games (CG.popular), two by two on phones, four across on desktop
    var top = CG.popular(4);
    h += '<section class="cg-sec"><h2>Most Popular</h2><div class="cg-games cg-top n' + top.length + '">' + top.map(tile).join('') + '</div></section>';
    // All Games: one See All button per sport with live games, to its own page
    var sports = CG.SPORTS.filter(function (s) { return s.status === 'live' && s.path && live.some(function (g) { return g.sport === s.id; }); });
    h += '<section class="cg-sec" id="cgSports"><h2>All Games</h2><div class="cg-sport-links">' + sports.map(function (s) {
      var gs = CG.popular(0, s.id);
      return '<a class="cg-sport-link" href="' + esc(CG.url(s.path)) + '" style="--sc:' + s.c + '"><span class="cg-sport-ico" aria-hidden="true">' + s.ico + '</span>' +
        // each game's name stays whole on one line (16 Oct 2026: "25000 RUNS" was split over two)
        '<span class="cg-sl-t"><b>' + esc(s.name) + '</b><small>' + gs.map(function (g) { return '<span class="cg-nw">' + esc(g.name) + '</span>'; }).join(' \u00B7 ') + '</small></span>' +
        '<span class="cg-sl-go">See All ' + gs.length + ' <i aria-hidden="true">&#x203A;</i></span></a>';
    }).join('') + '</div></section>';
    // Coming soon sports, small
    var soon = CG.SPORTS.filter(function (s) { return s.status === 'soon'; });
    if (soon.length) h += '<section class="cg-sec"><h2>Coming Soon</h2><div class="cg-soon-row">' + soon.map(function (s) { return '<span class="cg-soon-s" style="--sc:' + s.c + '">' + esc(s.name) + '</span>'; }).join('') + '</div></section>';
    // Boards and Pass
    h += '<section class="cg-sec cg-two"><button type="button" class="cg-wide" data-open="boards"><span>&#x1F3C6;</span><b>Leaderboards</b><small>Every game, every week</small></button>' +
      '<button type="button" class="cg-wide is-pass" data-open="pass"><span>&#x2B50;</span><b>CAST Pass</b><small>Free wildcards every game, no ads, and a free Pick every promo</small></button></section>';
    el.innerHTML = h;
    heroWire();
  }
  el.addEventListener('click', function (e) {
    if (e.target.closest('[data-dview]')) { dAll = !dAll; paint(); return; }
    var dot = e.target.closest('[data-dot]');
    if (dot) { var tr = el.querySelector('.cg-hero-track'); if (tr) heroGo(tr, +dot.getAttribute('data-dot'), true); return; }
    var o = e.target.closest('[data-open]'), a = A();
    if (o && a) { if (o.getAttribute('data-open') === 'boards') a.openBoards(null); else if (a.openPass) a.openPass(); else a.open('pass'); }
  });
  var SPORT = window.CG_SPORT || '', paint = function () { if (SPORT) drawSport(SPORT); else draw(); };
  paint();
  ['cast:launch', 'cast:totw', 'cast:promo'].forEach(function (ev) { window.addEventListener(ev, paint); });
  window.addEventListener('load', function () { setTimeout(paint, 300); });
})();
