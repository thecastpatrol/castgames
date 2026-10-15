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
  function game(id) { for (var i = 0; i < CG.GAMES.length; i++) if (CG.GAMES[i].id === id) return CG.GAMES[i]; return null; }

  // Promos on now: the World Cup (while World Cup mode is live) and the Team of the Week (while one is on)
  function promos() {
    var a = A(), out = [];
    if (a && a.wcLive && a.wcLive()) out.push({ k: 'Featured · World Cup', t: 'World Cup 8-0', p: 'Spin a nation, draft from its 2026 squad and win all eight.', b: 'Play Now', href: '27-0/?play=wc', art: 'assets/logos/27-0.png' });
    var w = a && a.totw ? a.totw() : null;
    if (w) out.push({ k: 'World Cup · ' + w.label, t: 'Team of the Week', p: '13 players boosted in World Cup 8-0 this week.', b: 'See the 13', href: '27-0/?play=wc', side: true });
    if (!out.length) out.push({ k: 'Welcome', t: 'Pick a Sport, Pick a Game', p: 'Draft games for NRL, AFL, cricket, NFL and horse racing fans.', b: 'Browse Games', href: '#cgSports', art: 'assets/logos/castgames.png' });
    return out;
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
      '<b' + (g.name.length > 14 ? ' class="is-long"' : '') + '>' + esc(g.name) + '</b><small>' + esc(g.line) + '</small><span class="cg-btn is-white">Play</span></a>';
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
    '25000runs': ['CG_DAILY_BBL', 'bigbash'], '60000runs': ['CG_DAILY_TESTS', 'tests'], '700tds': ['CG_DAILY_NFL', 'nfl'], 'g1winner': ['CG_DAILY_RACING', 'racing'] };
  function dailyOf(id) {
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
    return '<a class="cg-card cg-dcard" href="' + esc(CG.url(g.path + '?play=daily')) + '" style="--c1:' + g.c1 + ';--c2:' + g.c2 + '">' + art(g) +
      '<span class="cg-card-t"><b>' + esc(g.name) + '</b><small class="cg-dhead">' + esc(x ? x.head : 'New today') + '</small>' +
      (x && x.reward ? '<small class="cg-dreward">' + esc(x.reward) + '</small>' : '') + '</span><span class="cg-cta">Play</span></a>';
  }
  function card(g, sub, cta, href, done) {
    return '<a class="cg-card" href="' + esc(href) + '" style="--c1:' + g.c1 + ';--c2:' + g.c2 + '">' + art(g) +
      '<span class="cg-card-t"><b>' + esc(sub[0]) + '</b><small>' + esc(sub[1]) + '</small></span>' +
      '<span class="cg-cta' + (done ? ' is-done' : '') + '">' + cta + '</span></a>';
  }
  function draw() {
    var live = CG.liveGames(), h = '';
    // Featured
    h += '<section class="cg-hero">' + promos().map(function (p) {
      // its game's logo on the right when it has the row to itself on desktop (audit L10: the card was mostly empty)
      return '<a class="cg-promo' + (p.side ? ' is-side' : '') + '" href="' + esc(p.href) + '"><span class="cg-k">' + esc(p.k) + '</span><b>' + esc(p.t) + '</b><p>' + esc(p.p) + '</p><span class="cg-btn">' + esc(p.b) + '</span>' +
        (p.art ? '<img class="cg-promo-art" src="' + esc(p.art) + '" alt="" aria-hidden="true">' : '') + '</a>';
    }).join('') + '</section>';
    // Continue and Daily side by side on desktop
    var dr = drafts(), daily = live.filter(function (g) { return g.daily; });
    h += '<div class="cg-two">';
    if (dr.length) h += '<section class="cg-sec"><h2>Continue Playing</h2><div class="cg-cards">' + dr.slice(0, 3).map(function (d) { return card(d.g, [d.t, d.s], 'Continue', d.g.path); }).join('') + '</div></section>';
    // every live game with a Daily (audit L9, 16 Oct 2026: it showed the first three only); four or more take the full width
    if (daily.length) h += '<section class="cg-sec' + (daily.length > 3 ? ' cg-daily-all' : '') + '"><h2>Daily Challenges <small>' + esc(nextDaily()) + '</small></h2><div class="cg-cards n' + daily.length + '">' + daily.map(dailyCard).join('') + '</div></section>';
    h += '</div>';
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
  }
  el.addEventListener('click', function (e) {
    var o = e.target.closest('[data-open]'), a = A();
    if (o && a) { if (o.getAttribute('data-open') === 'boards') a.openBoards(null); else if (a.openPass) a.openPass(); else a.open('pass'); }
  });
  var SPORT = window.CG_SPORT || '', paint = function () { if (SPORT) drawSport(SPORT); else draw(); };
  paint();
  ['cast:launch', 'cast:totw', 'cast:promo'].forEach(function (ev) { window.addEventListener(ev, paint); });
  window.addEventListener('load', function () { setTimeout(paint, 300); });
})();
