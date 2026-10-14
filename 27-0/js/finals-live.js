/* 27-0 finals, watched live (7 Oct 2026, the owner: World Cup 8-0's live view in every 27-0 mode, for the finals).
   Each finals game the player is in gets a match card (their badge against the club's, and what's at stake), then Watch
   It (the clock runs and the tries, goals and field goals land at their minutes, with golden point when it's level at 80)
   or Quick Result, then the full time card. The results and scores are the engine's (runFinalsSeries in
   js/game-data-sim.js), decided before the finals start; nothing here changes them. Takes over from the old finals
   viewer: launchFinalsViewer and fvSkipFinals keep their names (Quick Draft and Run It Back call them).
   8 Oct 2026 (the owner's calls, to match World Cup 8-0): the four finals weeks as chips across the top, Finals So Far
   under the card (every result so far and who's still in), Watch It first for every final, your team's rating on your
   plate, Classic gold accents, and Share This Win after a Grand Final win. */
(function () {
  'use strict';
  var F = null, liveTimer = null, skipArm = 0;
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function track(name, p) { if (typeof gtag !== 'undefined') gtag('event', name, p || {}); }
  function stopLive() { if (liveTimer) { clearInterval(liveTimer); liveTimer = null; } }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function short(name) { return typeof fvShort === 'function' ? fvShort(name) : name; }
  function surname(n) { return typeof cardSurname === 'function' ? cardSurname(n) : String(n).split(' ').pop(); }

  /* ---------- The player's finals games ---------- */
  function roundOf(label, seed) {
    if (label === 'Finals Week 1') return seed && seed <= 4 ? { name: 'Qualifying Final', kind: 'qf' } : { name: 'Elimination Final', kind: 'ef' };
    if (label === 'Semi Finals') return { name: 'Semi Final', kind: 'sf' };
    if (label === 'Preliminary Finals') return { name: 'Preliminary Final', kind: 'pf' };
    return { name: 'Grand Final', kind: 'gf' };
  }
  // As the player's side sees them. A season from before 7 Oct 2026 has only tries (all converted, 6 each)
  function myGames(f, seed) {
    var me = myTeam(), out = [];
    (f.weeks || []).forEach(function (wk, wi) {
      (wk.games || []).forEach(function (g) {
        if (g.winner.name !== me && g.loser.name !== me) return;
        var won = g.winner.name === me, has = g.wPts != null;
        out.push({ round: roundOf(wk.label, seed), wk: wi, opp: (won ? g.loser : g.winner).name, won: won,
          myTries: won ? g.wTries : g.lTries, theirTries: won ? g.lTries : g.wTries,
          my: has ? (won ? g.wPts : g.lPts) : (won ? g.wTries : g.lTries) * 6,
          their: has ? (won ? g.lPts : g.wPts) : (won ? g.lTries : g.wTries) * 6,
          myConv: has ? (won ? g.wConv : g.lConv) : null, theirConv: has ? (won ? g.lConv : g.wConv) : null,
          myPens: has ? (won ? g.wPens : g.lPens) : 0, theirPens: has ? (won ? g.lPens : g.wPens) : 0,
          myFg: has && won ? g.wFg : 0, theirFg: has && !won ? g.wFg : 0, gp: !!g.gp });
      });
    });
    return out;
  }

  /* ---------- Badges: the player's photo or club (as in World Cup 8-0), and each club's colours ---------- */
  function badge(side, cls) {
    cls = cls || '';
    if (side === 'me') {
      var A = window.CastAccount, me = A && A.myBadge ? A.myBadge() : null;
      if (me && me.img) return '<span class="wc-badge is-photo ' + cls + '"><img src="' + esc(me.img) + '" alt=""></span>';
      if (me && me.abbr) return '<span class="wc-badge ' + cls + '" style="--n1:' + esc(me.c1) + ';--n2:' + esc(me.c2) + ';--n3:' + esc(me.c3 || me.c1) + '">' + esc(me.abbr) + '</span>';
      return '<span class="wc-badge ' + cls + '" style="--n1:#1a1a2a;--n2:#fff;--n3:#1a1a2a">YOU</span>';
    }
    var k = (typeof OPPONENT_CLUB_MAP !== 'undefined' && OPPONENT_CLUB_MAP[side]) || '';
    var c1 = CLUB_COLORS[k] || '#1a1a2a', c2 = CLUB_SECONDARY[k] || '#ffffff';
    return '<span class="wc-badge ' + cls + '" style="--n1:' + c1 + ';--n2:' + c2 + ';--n3:' + c1 + '">' + esc(CLUB_ABBR[k] || short(side).slice(0, 3).toUpperCase()) + '</span>';
  }
  function nameOf(side) { return side === 'me' ? myTeam() : short(side); }

  /* ---------- Kickers and try scorers ---------- */
  function goals(n) { return (typeof GOAL_KICKER_RANK !== 'undefined' && GOAL_KICKER_RANK[n]) || 0; }
  function myKicker() { var s = STATE.season; return (s && s.kicker) || (typeof fvFindMyConv === 'function' ? fvFindMyConv() : ''); }
  function roster(club) { return (typeof FV_ROSTERS !== 'undefined' && FV_ROSTERS[club]) || { conv: '', players: [] }; }
  function theirKicker(club) { return roster(club).conv || ''; }
  // Field goals by a half: the one with the most career goals, else the halfback (the owner: "the FE or HALFBACK usually")
  function pickHalf(list) {
    var best = null;
    list.forEach(function (x) { if (!best || goals(x.n) > goals(best.n) || (goals(x.n) === goals(best.n) && x.p === 'HB' && best.p !== 'HB')) best = x; });
    return best ? best.n : '';
  }
  function myFgKicker() {
    var halves = SLOTS.filter(function (s) { return (s.type === 'HB' || s.type === 'FE') && STATE.team[s.i]; }).map(function (s) { return { n: STATE.team[s.i].name, p: s.type }; });
    return pickHalf(halves) || myKicker();
  }
  function theirFgKicker(club) { return pickHalf(roster(club).players.filter(function (x) { return x.p === 'HB' || x.p === 'FE'; })) || theirKicker(club); }
  function weighted(list, w) {
    var ws = list.map(w), tot = ws.reduce(function (a, b) { return a + b; }, 0), r = Math.random() * tot;
    for (var j = 0; j < list.length; j++) { r -= ws[j]; if (r <= 0) return list[j]; }
    return list[list.length - 1];
  }
  function myScorers(n) {
    var slots = SLOTS.filter(function (s) { return STATE.team[s.i]; }), out = [];
    for (var i = 0; i < n && slots.length; i++) { var c = weighted(slots, function (s) { return TRY_WEIGHTS[s.type] || 4; }); out.push({ name: STATE.team[c.i].name, pos: c.type, rating: STATE.team[c.i].rating || 0 }); }
    return out;
  }
  function theirScorers(club, n) {
    var pl = roster(club).players, out = [];
    for (var i = 0; i < n && pl.length; i++) { var c = weighted(pl, function (x) { return TRY_WEIGHTS[x.p] || 4; }); out.push({ name: c.n, pos: c.p, rating: 0 }); }
    return out;
  }

  /* ---------- The game in order (as World Cup 8-0, js/world-cup.js) ----------
     Tries at their own minutes, each one's conversion a moment later, penalty goals, and a field goal last: in the last
     10 minutes (level, or 6 ahead to go 7 up), or in golden point (the engine's call) when it was level at 80. Level late
     with time to spare, a side sometimes has a shot at a field goal and misses. A season from before 7 Oct 2026 kicked
     every goal with its try */
  function ptsOf(e) { return e.p ? (e.conv == null ? 6 : 4) : e.pen || e.goal === true ? 2 : e.fg ? 1 : 0; }
  function place(groups, top) {
    var free = [], mins = [], out = [];
    for (var m = 2; m <= top; m++) free.push(m);
    groups.forEach(function () { mins.push(free.splice(Math.floor(Math.random() * free.length), 1)[0]); });
    mins.sort(function (x, y) { return x - y; });
    groups.forEach(function (grp, n) { grp.forEach(function (e) { e.min = mins[n]; out.push(e); }); });
    return out;
  }
  function withMisses(out, g, end) {
    var me = 0, them = 0, add = [];
    for (var i = 0; i <= out.length && add.length < 2; i++) {
      if (i) { var e = out[i - 1]; if (e.me) me += ptsOf(e); else them += ptsOf(e); }
      var from = Math.max(70, i ? out[i - 1].min + 1 : 2), to = (i < out.length ? out[i].min : end) - 1;
      if (me !== them || to < from || Math.random() >= 0.5) continue;
      var at = from + Math.floor(Math.random() * (to - from + 1));
      if (at === 80) { if (from < 80) at = 79; else if (to > 80) at = 81; else continue; }
      var next = out[i], who = next && next.fg ? (Math.random() < 0.4 ? next.me : !next.me) : Math.random() < 0.5;
      add.push({ min: at, me: who, fgMiss: true, k: who ? myFgKicker() : theirFgKicker(g.opp) });
    }
    return out.concat(add).sort(function (a, b) { return a.min - b.min; });
  }
  function timeline(g) {
    var mine = myScorers(g.myTries), theirs = theirScorers(g.opp, g.theirTries), list = [], m;
    if (g.myConv == null) {
      mine.forEach(function (p) { list.push([{ me: true, p: p }]); });
      theirs.forEach(function (p) { list.push([{ me: false, p: p }]); });
      return { ev: place(shuffle(list), 79), mine: mine, theirs: theirs };
    }
    var kick = { me: myKicker(), them: theirKicker(g.opp) };
    var flags = function (n, k) { var f = []; for (var i = 0; i < n; i++) f.push(i < k); return shuffle(f); };
    var mc = flags(mine.length, g.myConv), tc = flags(theirs.length, g.theirConv);
    mine.forEach(function (p, i) { list.push([{ me: true, p: p, conv: mc[i] }, { me: true, goal: mc[i], k: kick.me, after: true }]); });
    theirs.forEach(function (p, i) { list.push([{ me: false, p: p, conv: tc[i] }, { me: false, goal: tc[i], k: kick.them, after: true }]); });
    for (m = 0; m < (g.myPens || 0); m++) list.push([{ me: true, pen: true, k: kick.me }]);
    for (m = 0; m < (g.theirPens || 0); m++) list.push([{ me: false, pen: true, k: kick.them }]);
    var fg = g.myFg ? true : g.theirFg ? false : null, gp = fg !== null && g.gp;
    var fgMin = fg === null ? 80 : gp ? 81 + Math.floor(Math.random() * 6) : 71 + Math.floor(Math.random() * 9);
    var out = place(shuffle(list), Math.min(79, fgMin - 1));
    if (fg !== null) out.push({ min: fgMin, me: fg, fg: true, gp: gp, k: fg ? myFgKicker() : theirFgKicker(g.opp) });
    return { ev: withMisses(out, g, fgMin), mine: mine, theirs: theirs };
  }
  // Player of the Match: the winners' top try scorer (the better player breaks a tie)
  function potmOf(g, mine, theirs) {
    var by = {}, list = g.won ? mine : theirs;
    list.forEach(function (p) { (by[p.name] = by[p.name] || { p: p, n: 0 }).n++; });
    var best = Object.keys(by).map(function (k) { return by[k]; }).sort(function (a, b) { return b.n - a.n || (b.p.rating || 0) - (a.p.rating || 0); })[0];
    return best ? { name: best.p.name, pos: best.p.pos, tries: best.n, me: g.won } : null;
  }
  function play(i) {
    if (F.ev[i]) return;
    var t = timeline(F.games[i]);
    F.ev[i] = t.ev;
    F.potm[i] = potmOf(F.games[i], t.mine, t.theirs);
  }

  /* ---------- What the cards say ---------- */
  function stakes(g) {
    switch (g.round.kind) {
      case 'qf': return 'Win and you go straight through to a Preliminary Final. Lose and you get a second chance.';
      case 'ef': return 'Win and you&rsquo;re into the Semi Finals. Lose and your season is over.';
      case 'sf': return 'Win and you&rsquo;re into a Preliminary Final. Lose and your season is over.';
      case 'pf': return 'Win and you&rsquo;re into the Grand Final.';
      default: return 'Win and you&rsquo;re the 2026 Premiers.';
    }
  }
  function formLine(g) {
    var lad = F.s.ladder || [], i = -1;
    lad.forEach(function (t, n) { if (t.name === g.opp) i = n; });
    var t = lad[i];
    return t ? '<b>' + esc(g.opp) + '</b> finished ' + (i + 1) + ordinal(i + 1) + ' on the ladder (' + t.wins + '-' + (24 - t.wins) + ').' : '';
  }
  // Your plate carries your team's rating (the owner: yours only; the clubs' stay hidden, as in the season)
  function plate(side) { return '<div class="wc-plate">' + badge(side, 'wc-badge-xl') + '<b>' + esc(nameOf(side)) + '</b>' + (side === 'me' && F.s.rating ? '<small>Rating ' + F.s.rating + '</small>' : '') + '</div>'; }
  function feedRow(e, g) {
    var side = e.me ? 'me' : g.opp, pts = ptsOf(e), what;
    if (e.p) what = '<b>' + esc(e.p.name) + '</b><small>Try' + (e.p.pos ? ' &middot; ' + e.p.pos : '') + '</small>';
    else what = '<b>' + esc(e.k || nameOf(side)) + '</b><small>' + (e.pen ? 'Penalty Goal' : e.fg ? (e.gp ? 'Golden Point Field Goal' : 'Field Goal') : e.fgMiss ? 'Missed Field Goal' : e.goal ? 'Goal' : 'Missed Goal') + '</small>';
    return '<li class="' + (e.me ? 'is-me' : 'is-them') + (pts ? '' : ' is-miss') + '"><span class="wc-min">' + e.min + '&prime;</span>' + badge(side) +
      '<span class="wc-fe">' + what + '</span>' + (pts ? '<span class="wc-pts">+' + pts + '</span>' : '') + '</li>';
  }
  function scorersText(list) {
    var c = {}, order = [];
    list.forEach(function (e) { var n = surname(e.p.name); if (!c[n]) { c[n] = 0; order.push(n); } c[n]++; });
    return order.map(function (n) { return n + (c[n] > 1 ? ' ' + c[n] : ''); }).join(', ');
  }
  function kicksText(ev, me) {
    var by = {}, order = [], fg = [];
    ev.forEach(function (e) {
      if (e.me !== me || !e.k || e.fgMiss) return;
      var n = surname(e.k);
      if (e.fg) { fg.push(n); return; }
      if (!by[n]) { by[n] = [0, 0]; order.push(n); }
      by[n][1]++;
      if (e.pen || e.goal) by[n][0]++;
    });
    var out = order.length ? '<b>Goals:</b> ' + esc(order.map(function (n) { return n + ' ' + by[n][0] + '/' + by[n][1]; }).join(', ')) : '';
    return out + (fg.length ? (out ? ' &middot; ' : '') + '<b>Field Goal:</b> ' + esc(fg.join(', ')) : '');
  }
  function gpOf(i) { return (F.ev[i] || []).some(function (e) { return e.min > 80; }); }
  function ftHtml(i) {
    var g = F.games[i], ev = F.ev[i] || [], pm = F.potm[i], gf = g.round.kind === 'gf';
    var mine = ev.filter(function (e) { return e.me && e.p; }), theirs = ev.filter(function (e) { return !e.me && e.p; });
    var line = function (label, tries, me) {
      var k = kicksText(ev, me), t = tries.length ? esc(scorersText(tries)) : '';
      return t || k ? '<span><b>' + label + '</b> ' + (t || 'No tries') + (k ? ' &middot; ' + k : '') + '</span>' : '';
    };
    var word = g.won ? (gf ? 'PREMIERS' : 'WIN') : 'LOSS';
    return '<div class="wc-match wc-ft ' + (g.won ? 'is-win' : 'is-loss') + (gf ? ' is-ko' : '') + '"><div class="wc-kick">Full Time &middot; ' + (gpOf(i) ? 'Golden Point &middot; ' : '') + esc(g.round.name) + '</div>' +
      '<div class="wc-ft-word">' + word + '</div>' +
      '<div class="wc-ft-score">' + badge('me', 'wc-badge-xl') + '<b>' + g.my + '</b><i>-</i><b>' + g.their + '</b>' + badge(g.opp, 'wc-badge-xl') + '</div>' +
      '<div class="wc-ft-names"><span>' + esc(nameOf('me')) + '</span><span>' + esc(nameOf(g.opp)) + '</span></div>' +
      '<div class="wc-tries">' + line('Tries:', mine, true) + line(esc(short(g.opp)) + ':', theirs, false) + '</div>' +
      (gf && g.won ? '<div class="wc-ft-share"><button type="button" class="btn btn-outline" onclick="flShareWin()">&#x1F4F8; Share This Win</button></div>' : '') +
      (pm ? '<div class="wc-potm"><span class="wc-potm-i" aria-hidden="true">&#x1F3C5;</span><span><small>Player of the Match</small><b>' + esc(pm.name) + '</b><em>' +
        esc(pm.me ? nameOf('me') : nameOf(g.opp)) + (pm.pos ? ' &middot; ' + pm.pos : '') + ' &middot; ' + pm.tries + ' tr' + (pm.tries === 1 ? 'y' : 'ies') + '</em></span></div>' : '') + '</div>';
  }
  function matchHtml() {
    var i = F.i, g = F.games[i];
    if (F.phase === 'ft') return ftHtml(i);
    var gf = g.round.kind === 'gf';
    var h = '<div class="wc-match' + (gf ? ' is-ko' : '') + '"><div class="wc-kick">' + (gf ? '&#x1F3C6; ' : '') + esc(g.round.name) + '</div>' +
      '<div class="wc-plates">' + plate('me') + '<span class="wc-v">v</span>' + plate(g.opp) + '</div>';
    if (F.phase === 'live') {
      return h + '<div class="wc-live"><div class="wc-live-top"><span class="wc-live-dot" aria-hidden="true"></span>LIVE <b id="flClock">0&prime;</b></div>' +
        '<div class="wc-board"><div class="wc-big-score"><b id="flSMe">0</b><i>-</i><b id="flSThem">0</b></div>' +
        '<div class="wc-banner" id="flBanner" role="status" aria-live="assertive"></div></div>' +
        '<ol class="wc-feed" id="flFeed" aria-live="polite"></ol></div></div>';
    }
    return h + '<p class="wc-form">' + formLine(g) + '</p><p class="wc-stakes">' + stakes(g) + '</p></div>' +
      '<div class="fl-skip"><button type="button" class="btn btn-outline fl-skip-btn" onclick="flSkipFinals()">' + (skipArm ? 'Tap Again to Skip the Finals' : '&#x23ED; Skip the Finals') + '</button></div>';
  }
  function nextLabel() {
    var g = F.games[F.i], n = F.games[F.i + 1];
    if (!n) return g.won && g.round.kind === 'gf' ? '&#x1F3C6; See Your Premiership' : '&#x1F4CA; See Your Season';
    return '&#x25B6; On to the ' + esc(n.round.name);
  }
  function actsHtml() {
    var b = function (cls, on, label) { return '<button type="button" class="btn' + cls + '" onclick="' + on + '">' + label + '</button>'; };
    // Every final starts on Watch It, as World Cup 8-0's knockouts do; Quick Result is one tap away
    if (F.phase === 'pre') return b('', 'flWatch()', '&#x25B6; Watch It') + b(' btn-outline', 'flQuick()', '&#x26A1; Quick Result');
    if (F.phase === 'live') return b(' btn-outline', 'flFull()', '&#x23ED; Skip to Full Time');
    return b('', 'flNext()', nextLabel());
  }
  /* ---------- The road: the four finals weeks as chips (World Cup 8-0's road) ----------
     Played: the score, green or red. The game up next: lit. A week off after a Qualifying Final win: Bye, once that win
     is on screen. Weeks never reached: greyed only once the last game is on screen (nothing gives away where it ends) */
  var WEEK_CODE = ['W1', 'SF', 'PF', 'GF'];
  // Each chip names its round (9 Oct 2026, the owner: "Semi Final, Prelim Final, Grand Final"); week 1 is yours: Qual or Elim
  function roundName(wk) { return wk ? ['', 'Semi Final', 'Prelim Final', 'Grand Final'][wk] : F.games[0] && F.games[0].round.kind === 'qf' ? 'Qual Final' : 'Elim Final'; }
  function shown() { return F.phase === 'ft' ? F.i + 1 : F.i; }
  function stripHtml() {
    var s = F.s, n = shown(), done = F.games.slice(0, n), w = done.filter(function (g) { return g.won; }).length, end = n >= F.games.length;
    var chip = function (b, cls, sub) { return '<li class="wc-chip' + (cls ? ' ' + cls : '') + '">' + b + '<small>' + sub + '</small></li>'; };
    var ko = function (t) { return '<span class="wc-badge is-ko">' + t + '</span>'; };
    var chips = WEEK_CODE.map(function (code, wk) {
      var at = -1;
      F.games.forEach(function (g, i) { if (g.wk === wk) at = i; });
      if (at >= 0 && at < n) { var g = F.games[at]; return chip(badge(g.opp), g.won ? 'is-w' : 'is-l', g.my + '-' + g.their); }
      if (at >= 0 && at === F.i) return chip(badge(F.games[at].opp), 'is-now', roundName(wk));
      if (at < 0 && F.games.some(function (g, i) { return g.wk > wk && i <= F.i && (i < n || i === F.i); })) return chip(ko(code), 'is-bye', 'Bye');
      if (at < 0 && end) return chip(ko(code), 'is-gone', '-');
      return chip(ko(code), '', roundName(wk));
    }).join('');
    return '<div class="wc-strip-h"><b>2026 Finals</b><span>' + w + '-' + (done.length - w) + '</span></div><ol class="wc-chips fl-chips">' + chips + '</ol>' +
      '<p class="fl-season">Season ' + s.wins + '-' + s.losses + ' &middot; ' + s.myLadderPos + ordinal(s.myLadderPos) + ' on the ladder</p>';
  }
  /* ---------- Finals So Far: every result up to the game on screen, then who's still in ----------
     The week's other finals show once your game is at full time; after your last game, the rest of the finals */
  function weekName(label) { return label === 'GRAND FINAL' ? 'Grand Final' : label; } // the season keeps it in capitals
  function sideHtml() {
    var weeks = (F.s.finals && F.s.finals.weeks) || [], g = F.games[F.i], me = myTeam(), lad = F.s.ladder || [];
    var upTo = F.phase === 'ft' && F.i === F.games.length - 1 ? weeks.length - 1 : g ? (F.phase === 'ft' ? g.wk : g.wk - 1) : -1;
    var posOf = function (n) { for (var i = 0; i < lad.length; i++) if (lad[i].name === n) return i + 1; return 99; };
    var sideOf = function (n) { return n === me ? 'me' : n; };
    var alive = [];
    (weeks[0] ? weeks[0].games : []).forEach(function (x) { alive.push(x.winner.name, x.loser.name); });
    alive.sort(function (a, b) { return posOf(a) - posOf(b); });
    var rows = '';
    weeks.forEach(function (wk, wi) {
      if (wi > upTo) return;
      rows += '<div class="wc-sub-h">' + esc(weekName(wk.label)) + '</div>' + wk.games.map(function (x) {
        // Week 1's Qualifying Finals (both sides top 4) give the loser a second chance; every other loser is out
        if (wi > 0 || posOf(x.loser.name) > 4) alive = alive.filter(function (n) { return n !== x.loser.name; });
        var ws = x.wPts != null ? x.wPts : x.wTries * 6, ls = x.lPts != null ? x.lPts : x.lTries * 6, a = sideOf(x.winner.name), b = sideOf(x.loser.name);
        return '<div class="wc-also-g' + (a === 'me' || b === 'me' ? ' is-me' : '') + '">' + badge(a) + ' <span>' + esc(nameOf(a)) + '</span> <b>' + ws + '-' + ls + '</b> <span>' + esc(nameOf(b)) + '</span> ' + badge(b) + '</div>';
      }).join('');
    });
    var champ = upTo >= weeks.length - 1 && alive.length === 1;
    return '<div class="wc-panel fl-panel"><div class="wc-panel-h">Finals So Far <small>' + (upTo < 0 ? 'Before Week 1' : 'After ' + (upTo ? 'the ' : '') + esc(weekName(weeks[upTo].label))) + '</small></div>' + rows +
      '<div class="wc-sub-h">' + (champ ? '2026 Premiers' : 'Still In') + '</div><div class="fl-left">' + alive.map(function (n) {
        var k = sideOf(n);
        return '<span class="fl-left-t' + (k === 'me' ? ' is-me' : '') + '">' + badge(k) + '<small>' + esc(nameOf(k)) + '</small></span>';
      }).join('') + '</div></div>';
  }
  function render() {
    var root = $('flRoot');
    if (!root || !F) return;
    root.innerHTML = stripHtml() + '<div id="flMatch">' + matchHtml() + '</div>' + sideHtml();
    var acts = $('flActs');
    if (acts) acts.innerHTML = actsHtml();
  }

  /* ---------- Playing it ---------- */
  // Watch It: about 9 seconds a game; each try's conversion a moment after it; golden point runs the clock past 80
  window.flWatch = function () {
    if (!F || F.phase !== 'pre') return;
    skipArm = 0; // a Skip the Finals tap just before no longer counts (its timer would redraw the screen mid-game)
    var i = F.i, g = F.games[i];
    play(i);
    F.phase = 'live';
    render();
    var ev = F.ev[i], n = 0, min = 0, me = 0, them = 0, step = 80 / 90, hold = 0, beat = 0, ht = false, ftAt = 0;
    var gpAt = ev.length && ev[ev.length - 1].min > 80 ? ev[ev.length - 1].min : 0, end = 80;
    var clock = $('flClock'), feed = $('flFeed'), sMe = $('flSMe'), sThem = $('flSThem'), banner = $('flBanner');
    var show = function (title) { if (banner) { banner.innerHTML = '<b>' + title + '</b><span>' + me + '-' + them + '</span>'; banner.classList.add('is-on'); } };
    var hide = function () { if (banner) banner.classList.remove('is-on'); };
    stopLive();
    liveTimer = setInterval(function () {
      if (!F || F.phase !== 'live' || F.i !== i) { stopLive(); return; }
      var now = Date.now();
      if (ftAt) { if (now >= ftAt) { fullTime(i); render(); } return; }
      if (hold) { if (now < hold) return; hold = 0; hide(); }
      if (beat) { if (now < beat) return; beat = 0; } else min = Math.min(end, min + step);
      while (n < ev.length && ev[n].min <= min) {
        var e = ev[n++];
        if (e.me) me += ptsOf(e); else them += ptsOf(e);
        if (sMe) sMe.textContent = me;
        if (sThem) sThem.textContent = them;
        if (feed) { feed.insertAdjacentHTML('afterbegin', feedRow(e, g)); var li = feed.firstChild; if (li && li.classList) li.classList.add('is-new'); }
        if (n < ev.length && ev[n].after) { beat = now + 800; break; } // the conversion a moment after its try
      }
      if (clock) clock.innerHTML = min >= end && n >= ev.length ? 'FT' : ht && min < 41 ? 'HT' : Math.floor(min) + '&prime;';
      if (beat) return;
      if (!ht && min >= 40) { ht = true; if (clock) clock.innerHTML = 'HT'; show('Half Time'); hold = now + 1500; return; }
      if (min >= 80 && gpAt && end === 80) { end = gpAt; show('Golden Point'); hold = now + 1800; return; }
      if (min >= end) { show('Full Time'); ftAt = now + 1500; }
    }, 100);
  };
  window.flQuick = function () {
    if (!F || F.phase !== 'pre') return;
    skipArm = 0;
    fullTime(F.i);
    render();
  };
  window.flFull = function () { if (F && F.phase === 'live') { fullTime(F.i); render(); } };
  // Share This Win (a Grand Final won): the season's picture, premiership and all (js/game-data-sim.js showShareCard)
  window.flShareWin = function () {
    track('share_click', { mode: 'finals_win' });
    if (typeof window.showShareCard === 'function') window.showShareCard();
  };
  function fullTime(i) {
    play(i);
    stopLive();
    F.phase = 'ft';
    skipArm = 0;
    var g = F.games[i];
    track('finals_game', { round: g.round.kind, won: g.won ? 1 : 0, golden_point: gpOf(i) ? 1 : 0 });
    window.scrollTo(0, 0);
  }
  window.flNext = function () {
    if (!F || F.phase !== 'ft') return;
    if (F.i + 1 >= F.games.length) { leave(); return; }
    F.i++;
    F.phase = 'pre';
    render();
    window.scrollTo(0, 0);
  };
  // Skip the Finals: a second tap within 3 seconds (the old viewer asked first too)
  window.flSkipFinals = function () {
    if (!F) return;
    if (!skipArm || Date.now() - skipArm > 3000) { skipArm = Date.now(); render(); setTimeout(function () { if (skipArm && Date.now() - skipArm >= 3000) { skipArm = 0; if (F && F.phase === 'pre') render(); } }, 3100); return; }
    skipArm = 0;
    track('finals_skip', { at: F.games[F.i].round.kind });
    leave();
  };
  function leave() {
    stopLive();
    F = null;
    var acts = $('flActs');
    if (acts) acts.innerHTML = '';
    showResults();
  }

  /* ---------- Taking over from the old viewer ---------- */
  window.launchFinalsViewer = function () {
    var s = STATE.season, f = s && s.finals;
    if (!f || !f.myTeamInFinals) { showResults(); return; }
    var games = myGames(f, s.myLadderPos);
    if (!games.length) { showResults(); return; }
    stopLive();
    skipArm = 0;
    F = { s: s, games: games, i: 0, phase: 'pre', ev: [], potm: [] };
    showScreen('finals-viewer');
    render();
    window.scrollTo(0, 0);
    try { fvShowMadeFinalsPopup(); } catch (e) { /* the popup is a nicety */ }
  };
  // Quick Draft (js/theme-fx.js) skips straight to the results
  window.fvSkipFinals = function () { var p = $('fvMadeFinalsPopup'); if (p) p.style.display = 'none'; leave(); };
  window.fvNextGame = window.flNext;
  // Leaving for a new game (New Game, the logo, Change Mode) stops the clock
  var origReset = window.resetGame;
  if (typeof origReset === 'function') window.resetGame = function () { stopLive(); F = null; return origReset.apply(this, arguments); };
})();
