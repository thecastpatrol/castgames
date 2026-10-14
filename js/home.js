/* The CAST Games home page (15 Oct 2026, the owner picked layout B: featured, then rows, then each sport's games in its own
   section). Everything comes from shared/cg.js (the sports and games) and the account (promos, drafts):
     Featured     the promos that are on now (World Cup, Team of the Week), side by side on desktop
     Continue     drafts saved on this device (each game keeps its own), newest first; hidden when there are none
     Daily        each game with a Daily Challenge
     Sports       one section per sport with live games; an odd number gets a More Coming tile so every row is even
                  (the owner: "all even and consistent"); sport buttons above them once 3 or more sports are live
     Boards, Pass the leaderboards and the CAST Pass
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
  var pickSport = (function () { try { return localStorage.getItem('cg_sport') || 'all'; } catch (e) { return 'all'; } })();

  // Promos on now: the World Cup (while World Cup mode is live) and the Team of the Week (while one is on)
  function promos() {
    var a = A(), out = [];
    if (a && a.wcLive && a.wcLive()) out.push({ k: 'Featured · World Cup', t: 'World Cup 8-0', p: 'Spin a nation, draft from its 2026 squad and win all eight.', b: 'Play Now', href: '27-0/?play=wc' });
    var w = a && a.totw ? a.totw() : null;
    if (w) out.push({ k: 'World Cup · ' + w.label, t: 'Team of the Week', p: '13 players boosted in World Cup 8-0 this week.', b: 'See the 13', href: '27-0/?play=wc', side: true });
    if (!out.length) out.push({ k: 'Welcome', t: 'Pick a Sport, Pick a Game', p: 'Draft games for NRL and AFL fans, with more sports on the way.', b: 'Browse Games', href: '#cgSports' });
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

  function card(g, sub, cta, href, done) {
    return '<a class="cg-card" href="' + esc(href) + '" style="--c1:' + g.c1 + ';--c2:' + g.c2 + '">' + art(g) +
      '<span class="cg-card-t"><b>' + esc(sub[0]) + '</b><small>' + esc(sub[1]) + '</small></span>' +
      '<span class="cg-cta' + (done ? ' is-done' : '') + '">' + cta + '</span></a>';
  }
  function draw() {
    var live = CG.liveGames(), h = '';
    // Featured
    h += '<section class="cg-hero">' + promos().map(function (p) {
      return '<a class="cg-promo' + (p.side ? ' is-side' : '') + '" href="' + esc(p.href) + '"><span class="cg-k">' + esc(p.k) + '</span><b>' + esc(p.t) + '</b><p>' + esc(p.p) + '</p><span class="cg-btn">' + esc(p.b) + '</span></a>';
    }).join('') + '</section>';
    // Continue and Daily side by side on desktop
    var dr = drafts(), daily = live.filter(function (g) { return g.daily; });
    h += '<div class="cg-two">';
    if (dr.length) h += '<section class="cg-sec"><h2>Continue Playing</h2><div class="cg-cards">' + dr.slice(0, 3).map(function (d) { return card(d.g, [d.t, d.s], 'Continue', d.g.path); }).join('') + '</div></section>';
    if (daily.length) h += '<section class="cg-sec"><h2>Daily Challenges <small>' + esc(nextDaily()) + '</small></h2><div class="cg-cards">' + daily.slice(0, 3).map(function (g) { return card(g, [g.name, 'New today'], 'Play', g.path + '?play=daily'); }).join('') + '</div></section>';
    h += '</div>';
    // The sports
    var sports = CG.SPORTS.filter(function (s) { return s.status === 'live' && live.some(function (g) { return g.sport === s.id; }); });
    if (sports.length >= 3) {
      h += '<nav class="cg-chips" aria-label="Sports">' + ['all'].concat(sports.map(function (s) { return s.id; })).map(function (id) {
        var s = CG.sportOf(id);
        return '<button type="button" class="cg-chip' + (pickSport === id ? ' is-on' : '') + '" data-sport="' + id + '">' + esc(s ? s.name : 'All') + '</button>';
      }).join('') + '</nav>';
    }
    h += '<div class="cg-sports" id="cgSports">' + sports.filter(function (s) { return pickSport === 'all' || sports.length < 3 || pickSport === s.id; }).map(function (s) {
      var gs = live.filter(function (g) { return g.sport === s.id; });
      var tiles = gs.map(function (g) {
        return '<a class="cg-game-t" href="' + esc(g.path) + '" style="--c1:' + g.c1 + ';--c2:' + g.c2 + '">' + (g.badge ? '<span class="cg-new">' + esc(g.badge) + '</span>' : '') + art(g) +
          '<b>' + esc(g.name) + '</b><small>' + esc(g.line) + '</small><span class="cg-btn is-white">Play</span></a>';
      });
      // One game: a More Coming tile beside it. Three: the first runs wide on phones so the rest pair up (css/home.css .n3)
      if (gs.length === 1) tiles.push('<div class="cg-game-t is-soon"><b>More Coming</b><small>A new ' + esc(s.name) + ' game is on the way</small></div>');
      return '<section class="cg-sport" style="--sc:' + s.c + '"><div class="cg-sport-h"><span class="cg-sport-ico">' + esc(s.name) + '</span><span><b>' + esc(s.name) + ' Games</b><small>' + esc(s.long) + '</small></span>' +
        '<span class="cg-count">' + gs.length + ' Game' + (gs.length === 1 ? '' : 's') + '</span></div><div class="cg-games n' + gs.length + '">' + tiles.join('') + '</div></section>';
    }).join('') + '</div>';
    // Coming soon sports, small
    var soon = CG.SPORTS.filter(function (s) { return s.status === 'soon'; });
    if (soon.length) h += '<section class="cg-sec"><h2>Coming Soon</h2><div class="cg-soon-row">' + soon.map(function (s) { return '<span class="cg-soon-s" style="--sc:' + s.c + '">' + esc(s.name) + '</span>'; }).join('') + '</div></section>';
    // Boards and Pass
    h += '<section class="cg-sec cg-two"><button type="button" class="cg-wide" data-open="boards"><span>&#x1F3C6;</span><b>Leaderboards</b><small>Every game, every week</small></button>' +
      '<button type="button" class="cg-wide is-pass" data-open="pass"><span>&#x2B50;</span><b>CAST Pass</b><small>Free wildcards every game, no ads, and a free Pick every promo</small></button></section>';
    el.innerHTML = h;
  }
  el.addEventListener('click', function (e) {
    var c = e.target.closest('[data-sport]');
    if (c) { pickSport = c.getAttribute('data-sport'); try { localStorage.setItem('cg_sport', pickSport); } catch (x) { /* blocked */ } draw(); return; }
    var o = e.target.closest('[data-open]'), a = A();
    if (o && a) { if (o.getAttribute('data-open') === 'boards') a.openBoards(null); else if (a.openPass) a.openPass(); else a.open('pass'); }
  });
  draw();
  ['cast:launch', 'cast:totw', 'cast:promo'].forEach(function (ev) { window.addEventListener(ev, draw); });
  window.addEventListener('load', function () { setTimeout(draw, 300); });
})();
