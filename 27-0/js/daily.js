











(function () {
  'use strict';

  var LAUNCH = '2026-09-24'; 
  var MAX_GOES = 3;
  var KEY = '270_daily_';

   
  
  var CALENDAR = {
    '2026-09-24': { type: 'same' },
    '2026-09-25': { type: 'match', clubs: ['dolphins', 'roosters'], note: 'Preliminary final, Friday night',
      story: 'The Dolphins and Roosters meet in tonight\u2019s preliminary final, with a grand final spot on the line.' },
    '2026-09-27': { type: 'match', clubs: ['panthers', 'knights'], note: 'Preliminary final, Sunday',
      story: 'Penrith and Newcastle fight for the last grand final spot in Sunday\u2019s preliminary final.' },
    
    
    
    '2026-09-28': { type: 'club', clubs: ['knights'], goal: 81, story: 'Newcastle stunned Penrith 22-14 at Accor Stadium to set up a Grand Final against the Roosters. To mark the upset, every spin today is a Knights season from 1998 to now.' },
    '2026-09-29': { type: 'club', clubs: ['storm'], goal: 86 },
    
    
    
    '2026-09-30': { type: 'teams', clubs: ['roosters', 'knights'], teams: { roosters: [2002, 2013, 2018, 2019], knights: [2001] }, goal: 86,
      name: 'Premiership Teams', story: 'Grand Final week: the Roosters and the Knights meet on Sunday. Every spin today is one of their premiership-winning teams: the Knights of 2001 and the Roosters of 2002, 2013, 2018 and 2019.' },
    '2026-10-01': { type: 'club', clubs: ['roosters'], goal: 85 },
    '2026-10-02': { type: 'club', clubs: ['cowboys'], goal: 85 },
    '2026-10-03': { type: 'club', clubs: ['panthers'], goal: 84 },
    '2026-10-04': { type: 'same', goal: 'premiers', name: 'Grand Final Day', story: 'Grand Final Day. The same spins for everyone: win the premiership and the Daily is yours.' }
  };
  
  
  
  var MASCOT = { broncos: '\uD83D\uDC0E', bulldogs: '\uD83D\uDC36', cowboys: '\uD83E\uDD20', dolphins: '\uD83D\uDC2C', dragons: '\uD83D\uDC09',
    eels: '\uD83D\uDC0D', knights: '\uD83C\uDFF0', panthers: '\uD83D\uDC06', rabbitohs: '\uD83D\uDC07', raiders: '\uD83E\uDE93',
    roosters: '\uD83D\uDC13', seaeagles: '\uD83E\uDD85', sharks: '\uD83E\uDD88', storm: '\u26C8\uFE0F', tigers: '\uD83D\uDC2F',
    titans: '\uD83D\uDD31', warriors: '\u2694\uFE0F' };
  
  
  var WEEK = ['same', 'club', 'target', 'club', 'same', 'same', 'target'];
  var CLUB_ROTATION = ['rabbitohs', 'broncos', 'roosters', 'storm', 'eels', 'panthers', 'dragons', 'bulldogs', 'sharks',
    'knights', 'cowboys', 'raiders', 'seaeagles', 'warriors', 'tigers', 'titans', 'dolphins'];
  var TARGETS = [84, 86, 82, 88, 85, 83, 87];
  var NICK = { broncos: 'Broncos', bulldogs: 'Bulldogs', cowboys: 'Cowboys', dolphins: 'Dolphins', dragons: 'Dragons', eels: 'Eels',
    knights: 'Knights', panthers: 'Panthers', rabbitohs: 'Rabbitohs', raiders: 'Raiders', roosters: 'Roosters', seaeagles: 'Sea Eagles',
    sharks: 'Sharks', storm: 'Storm', tigers: 'Wests Tigers', titans: 'Titans', warriors: 'Warriors' };

  var NEW_FORMAT = '2026-09-29';
  
  function sharedTheme(date) {
    var d = CAST_DAILY.day(date), g = d.g270, era = d.key.indexOf('era:') === 0, region = d.key === 'sydney' || d.key === 'queensland';
    return { type: g.type, clubs: g.clubs || null, teams: g.teams || null, from: g.from || null, to: g.to || null, nations: g.nations || null, goal: g.goal, wins: g.wins,
      key: d.key, name: d.name, short: d.short, seasons: d.seasons, icon: d.icon, title: d.title, story: d.story, onThisDay: d.onThisDay,
      hard: d.hard, planned: d.planned, random: true, reward: d.reward['27-0'], rewardKind: d.rewardKind,
      head: (era ? d.short.replace(/^The /, '') : region ? d.short.replace(/ Clubs$/, '') : d.short) + (g.wins ? ' 13 with ' + g.wins + '+ wins' : ' 13 rated ' + g.goal + '+') };
  }
  function themeFor(date) {
    if (date >= NEW_FORMAT && window.CAST_DAILY) return sharedTheme(date);
    var n = dayNo(date);
    var t = CALENDAR[date] ? JSON.parse(JSON.stringify(CALENDAR[date])) : null;
    if (!t) {
      var p = date.split('-'), wd = new Date(Date.UTC(+p[0], p[1] - 1, +p[2])).getUTCDay();
      t = { type: WEEK[wd] };
      if (t.type === 'club') t.clubs = [CLUB_ROTATION[n % CLUB_ROTATION.length]];
    }
    if (t.type === 'target' && !t.target) t.target = TARGETS[hash('target|' + date) % TARGETS.length];
    if (t.type === 'match') {
      t.name = 'Match Day'; t.icon = '\uD83C\uDFDF\uFE0F';
      t.title = NICK[t.clubs[0]] + ' v ' + NICK[t.clubs[1]];
      t.sub = 'Spins alternate: ' + NICK[t.clubs[0]] + ', ' + NICK[t.clubs[1]] + ', ' + NICK[t.clubs[0]] + ' and so on, any season.' + (t.note ? ' ' + t.note + '.' : '');
    } else if (t.type === 'club') {
      t.name = NICK[t.clubs[0]] + ' Day'; t.icon = MASCOT[t.clubs[0]] || '\uD83C\uDFC9';
      t.title = t.goal ? 'Build a ' + NICK[t.clubs[0]] + ' 13 rated ' + t.goal + '+' : 'Every spin is the ' + NICK[t.clubs[0]];
      t.sub = t.goal ? 'Every spin is the ' + NICK[t.clubs[0]] + '. Get your squad to ' + t.goal + ' or more and the Daily is yours.' : 'Build the best ' + NICK[t.clubs[0]] + ' team of the NRL era, 1998 to 2026.';
    } else if (t.type === 'teams') {
      t.name = t.name || 'Chosen Teams'; t.icon = t.icon || '\uD83C\uDFC6';
      t.title = t.goal ? 'Build a premiership 13 rated ' + t.goal + '+' : 'Build the best premiership 13';
      t.sub = 'Every spin is a ' + t.clubs.map(function (c) { return NICK[c]; }).join(' or ') + ' premiership team.' + (t.goal ? ' Get your squad to ' + t.goal + ' or more and the Daily is yours.' : '');
    } else if (t.type === 'target') {
      t.name = 'Target Rating'; t.icon = '\uD83C\uDFAF';
      t.title = 'Build a squad rated ' + t.target;
      t.sub = 'Closest to ' + t.target + ' wins. Exactly ' + t.target + ' is perfect.';
    } else {
      t.type = 'same'; t.name = t.name || 'Same Spins'; t.icon = t.goal === 'premiers' ? '\uD83C\uDFC6' : '\uD83D\uDCC5';
      t.title = t.goal === 'premiers' ? 'Win the premiership' : 'Same 13 spins for everyone';
      t.sub = t.goal === 'premiers' ? 'Same 13 spins for everyone. Win the grand final and the Daily is yours.' : 'Build the best team you can, then chase the best record.';
    }
    return t;
  }

  
  
  



  var NAT = null, natLoading = null, natIdx = {};
  function loadNat() {
    if (NAT) return Promise.resolve(NAT);
    return natLoading || (natLoading = fetch('data/nations-nrl.json', { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error('nations ' + r.status);
      return r.json();
    }).then(function (m) { NAT = m; return m; }, function (e) { natLoading = null; throw e; }));
  }
  function natOk(name, keys) {
    var n = typeof playerKey === 'function' ? playerKey(name) : name; 
    return ((NAT && NAT[n]) || []).some(function (k) { return keys.indexOf(k) >= 0; });
  }
  
  function natIndex(keys) {
    var key = keys.join('-');
    if (!natIdx[key]) {
      var at = {};
      RAW_PLAYERS.forEach(function (r) {
        if (!natOk(r[0], keys)) return;
        r[1].forEach(function (st) {
          for (var y = st[1]; y <= st[2]; y++) { var l = at[st[0] + '|' + y] || (at[st[0] + '|' + y] = []); if (l[l.length - 1] !== r) l.push(r); }
        });
      });
      natIdx[key] = at;
    }
    return natIdx[key];
  }
  function natPool(theme, base) {
    var at = natIndex(theme.nations), open = SLOTS.filter(function (s) { return !STATE.team[s.i]; });
    function fits(r) {
      return !STATE.takenNames.has(r[0]) && r[2].some(function (pos) {
        return (ELIGIBLE_SLOTS[pos] || [pos]).some(function (type) { return open.some(function (s) { return s.type === type; }); });
      });
    }
    var set = base.filter(function (x) { var l = at[x.cid + '|' + x.year]; return !!l && l.length >= 2 && l.some(fits); });
    return set.length ? set : base;
  }
  var origSquad = window.getSquadForClubYear;
  if (typeof origSquad === 'function') {
    window.getSquadForClubYear = function () {
      var list = origSquad.apply(this, arguments);
      return active && active.theme.type === 'nations' && NAT ? list.filter(function (p) { return natOk(p.name, active.theme.nations); }) : list;
    };
  }

  function poolFor(theme, base, spinNo) {
    if (theme && theme.type === 'nations') return NAT ? natPool(theme, base) : base;
    if (theme && (theme.from || theme.to)) base = base.filter(function (x) { return (!theme.from || x.year >= theme.from) && (!theme.to || x.year <= theme.to); });
    if (theme && theme.type === 'clubs') { 
      var set = theme.clubs ? base.filter(function (x) { return theme.clubs.indexOf(x.cid) !== -1; }) : base;
      return set.length ? set : base;
    }
    if (!theme || !theme.clubs) return base;
    
    if (theme.teams) {
      var picked = base.filter(function (x) { return (theme.teams[x.cid] || []).indexOf(+x.year) !== -1; });
      if (!picked.length) return base;
      if (typeof spinNo === 'number') {
        var turn = picked.filter(function (x) { return x.cid === theme.clubs[spinNo % theme.clubs.length]; });
        if (turn.length) return turn;
      }
      return picked;
    }
    if ((theme.type === 'match' || theme.type === 'final') && typeof spinNo === 'number') {
      var one = base.filter(function (x) { return x.cid === theme.clubs[spinNo % theme.clubs.length]; });
      if (one.length) return one;
    }
    var by = {};
    base.forEach(function (x) { if (theme.clubs.indexOf(x.cid) !== -1) (by[x.cid] = by[x.cid] || []).push(x); });
    var lists = theme.clubs.map(function (c) { return by[c] || []; }).filter(function (l) { return l.length; });
    if (!lists.length) return base;
    var max = Math.max.apply(null, lists.map(function (l) { return l.length; }));
    var out = [];
    lists.forEach(function (l) { for (var i = 0; i < max; i++) out.push(l[i % l.length]); });
    return out;
  }

   
  function sydneyParts(d) {
    var f = new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Sydney', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
    var o = {};
    f.formatToParts(d || new Date()).forEach(function (p) { o[p.type] = p.value; });
    return o;
  }
  
  var TEST_DATE = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) && (location.search.match(/[?&]dailydate=(\d{4}-\d{2}-\d{2})/) || [])[1];
  function today() { if (TEST_DATE) return TEST_DATE; var p = sydneyParts(); return p.year + '-' + p.month + '-' + p.day; }
  function dayNo(date) {
    var a = date.split('-'), b = LAUNCH.split('-');
    return Math.round((Date.UTC(+a[0], a[1] - 1, +a[2]) - Date.UTC(+b[0], b[1] - 1, +b[2])) / 864e5) + 1;
  }
  function prettyDate(date) { var p = date.split('-'); return new Date(Date.UTC(+p[0], p[1] - 1, +p[2])).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }); }
  function msToReset() {
    var p = sydneyParts();
    return ((23 - +p.hour) * 3600 + (59 - +p.minute) * 60 + (60 - +p.second)) * 1000;
  }
  function countdown() {
    var m = Math.ceil(msToReset() / 60000), h = Math.floor(m / 60);
    return h ? h + 'h ' + (m % 60) + 'm' : m + 'm';
  }

   
  function hash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

   
  function load(date) {
    try { var r = JSON.parse(localStorage.getItem(KEY + date) || 'null'); if (r && Array.isArray(r.goes)) return r; } catch (e) {   }
    return { goes: [] };
  }
  function save(date, rec) { try { localStorage.setItem(KEY + date, JSON.stringify(rec)); } catch (e) {   } }
  function track(e, p) { if (typeof gtag !== 'undefined') gtag('event', e, p || {}); }

  function better(a, b) { 
    if (!b) return true;
    if (a.type === 'target') {
      if (a.diff !== b.diff) return a.diff < b.diff;
      return a.w > b.w;
    }
    
    if (typeof a.winGoal === 'number') { var wa = hitGoal(a), wb = hitGoal(b); if (wa !== wb) return wa; }
    
    if (typeof a.goal === 'number') {
      var ha = hitGoal(a), hb = hitGoal(b);
      if (ha !== hb) return ha;
      if ((a.rating || 0) !== (b.rating || 0)) return (a.rating || 0) > (b.rating || 0);
    }
    if (a.w !== b.w) return a.w > b.w;
    return (a.premiers ? 1 : 0) > (b.premiers ? 1 : 0);
  }
  function bestOf(rec) {
    var best = null;
    rec.goes.forEach(function (g) { if (g.done && better(g, best)) best = g; });
    return best;
  }
  
  
  function hitGoal(g) {
    if (typeof g.winGoal === 'number') return (g.w || 0) >= g.winGoal || g.perfect;
    if (typeof g.goal === 'number') return (g.rating || 0) >= g.goal || g.perfect;
    if (g.goal === 'premiers') return g.premiers || g.perfect;
    return g.type === 'target' ? g.diff === 0 : g.perfect;
  }
  function wonGo(rec) { return rec.goes.filter(function (g) { return g.done && hitGoal(g); })[0] || null; }
  
  function wonLine(won) {
    return won.type === 'target' ? '&#x1F3AF; Target hit. ' : won.perfect ? '&#x1F451; Perfect. ' : won.goal === 'premiers' ? '&#x1F3C6; Premiers! ' : typeof won.winGoal === 'number' ? '&#x2705; ' + won.w + ' wins. ' : '&#x2705; Rated ' + won.rating + '. ';
  }
  function goesLeft(rec) { return wonGo(rec) ? 0 : MAX_GOES - rec.goes.length; }
  function record(g) { return g.w + '-' + g.l + (g.perfect ? ' \uD83D\uDC51 Perfect Season' : g.premiers ? ' \uD83C\uDFC6 Premiers' : ''); }
  function label(g) {
    if (!g) return '';
    if (g.type === 'target') return (g.diff === 0 ? '\uD83C\uDFAF Hit ' + g.rating + ' exactly' : 'Rating ' + g.rating + ' (' + g.diff + ' off)') + ' \u00B7 ' + g.w + '-' + g.l;
    if (typeof g.winGoal === 'number') return (hitGoal(g) ? '\u2705 ' : '') + record(g) + ' \u00B7 Rated ' + g.rating; 
    if (typeof g.goal === 'number') return (hitGoal(g) ? '\u2705 ' : '') + 'Rated ' + g.rating + ' \u00B7 ' + record(g); 
    return record(g);
  }

   
  var active = null; 

  
  function spinNo() {
    return typeof STATE !== 'undefined' && STATE.team ? STATE.team.filter(function (p) { return p; }).length : 0;
  }

  
  var origPool = window.getSpinPool;
  if (typeof origPool === 'function') {
    window.getSpinPool = function () {
      var base = origPool.apply(this, arguments);
      return active ? poolFor(active.theme, base, spinNo()) : base;
    };
  }

  
  var origFinal = window.finalSpin;
  if (typeof origFinal === 'function') {
    window.finalSpin = function () {
      if (!active || active.theme.random) return origFinal.apply(this, arguments); 
      var rng = mulberry32(hash('27-0|' + active.date + '|' + active.go + '|' + (active.k++)));
      var origRand = window.rand;
      window.rand = function (min, max) { return Math.floor(rng() * (max - min + 1)) + min; };
      try { return origFinal.apply(this, arguments); } finally { window.rand = origRand; }
    };
  }

   
  
  function story(th) {
    if (th.story) return esc(th.story);
    if (th.type === 'match') return 'Every spin today is a ' + NICK[th.clubs[0]] + ' or ' + NICK[th.clubs[1]] + ' season from 1998 to now.';
    if (th.type === 'club') return NICK[th.clubs[0]] + ' Day. Every spin today is a ' + NICK[th.clubs[0]] + ' season from 1998 to now.';
    if (th.type === 'target') return 'No stacking today. Too strong or too weak both cost you: land your squad as close to ' + th.target + ' as you can.';
    return 'Today\u2019s spins are the same for every player, so it all comes down to who picks best.';
  }
  
  function challenge(th) {
    if (th.random) return th.wins ? 'Build a 13 from <b>' + esc(th.seasons) + '</b> and win <b>' + th.wins + '+</b> games.' : 'Build a 13 rated <b>' + th.goal + '+</b> from <b>' + esc(th.seasons) + '</b>.';
    if (th.type === 'match') return 'Build the best <b>' + NICK[th.clubs[0]] + '</b> and <b>' + NICK[th.clubs[1]] + '</b> 13.';
    if (th.type === 'club') return th.goal ? 'Build a <b>' + NICK[th.clubs[0]] + '</b> 13 rated <b>' + th.goal + '+</b>.' : 'Build the best <b>' + NICK[th.clubs[0]] + '</b> 13.';
    if (th.type === 'teams') return th.goal ? 'Build a <b>premiership 13</b> rated <b>' + th.goal + '+</b>.' : 'Build the best <b>premiership 13</b>.';
    if (th.goal === 'premiers') return 'Win the <b>premiership</b> with <b>today&rsquo;s spins</b>.';
    if (th.type === 'target') return 'Build a 13 rated exactly <b>' + th.target + '</b>.';
    return 'Build the best 13 from <b>today&rsquo;s spins</b>.';
  }
  function howModal() {
    var m = document.getElementById('cpDailyHow');
    if (m) return m;
    m = document.createElement('div');
    m.id = 'cpDailyHow';
    m.className = 'cp-confirm';
    m.style.display = 'none';
    document.body.appendChild(m);
    m.addEventListener('click', function (e) {
      var a = e.target.closest('[data-dh]');
      if (!a) return;
      m.style.display = 'none';
      if (a.getAttribute('data-dh') === 'go') startDaily();
      if (a.getAttribute('data-dh') === 'replay') startReplay(a.getAttribute('data-date'));
      if (a.getAttribute('data-dh') === 'archive') showArchive();
      if (a.getAttribute('data-dh') === 'signin' && window.CastAccount) CastAccount.open('profile');
      if (a.getAttribute('data-dh') === 'pass' && window.CastAccount && CastAccount.openPass) CastAccount.openPass('archive');
      if (a.getAttribute('data-dh') === 'boards' && window.CastAccount) CastAccount.openBoards(['270daily', 'today']);
      if (a.getAttribute('data-dh') === 'share') share(dayNo(today()), bestOf(load(today())));
    });
    return m;
  }
  function showHow(playable) {
    var date = today(), th = themeFor(date), rec = load(date), left = goesLeft(rec);
    var m = howModal(), playNow = playable && left > 0;
    var main = playNow ? '<button type="button" class="cp-btn cp-btn-primary" data-dh="go">' + (signInFirst() ? 'Sign In Free to Play' : 'Start Go ' + (rec.goes.length + 1) + ' of ' + MAX_GOES) + '</button>'
      : left <= 0 && bestOf(rec) ? '<button type="button" class="cp-btn cp-btn-primary" data-dh="share">&#x1F4E4; Share My Best</button>' : '';
    m.innerHTML = '<div class="cp-confirm-backdrop" data-dh="close"></div>' +
      '<div class="cp-confirm-body" role="dialog" aria-modal="true" aria-labelledby="cpDailyHowTitle">' +
        '<button type="button" class="cp-confirm-x" data-dh="close" aria-label="Close">&#x2715;</button>' +
        '<div class="cp-confirm-grab" aria-hidden="true"></div>' +
        '<div class="cp-confirm-ico" aria-hidden="true">' + th.icon + '</div>' +
        '<div class="cp-confirm-kicker">Daily Challenge' + (th.hard ? ' &middot; Hard Day' : '') + '</div>' +
        '<h2 class="cp-confirm-title" id="cpDailyHowTitle">' + scores(esc(th.title)) + '</h2>' +
        '<p class="cp-confirm-sub cp-daily-story">' + scores(story(th)) + '</p>' + alsoLine(th) +
        taskBox(th, rec) +
        (rec.goes.length ? '<div class="cp-how-goes-h">Your Goes Today</div>' + goesRow(rec) : '') +
        (window.CastAccount && CastAccount.dailyRank ? '<button type="button" class="cp-daily-rank" id="cpDailyRank" data-dh="boards">' + rankLine(null) + '</button>' : '') +
        '<div class="cp-dh-acts">' + main +
          '<div class="cp-dh-row">' + (archiveOn() ? '<button type="button" class="cp-btn cp-btn-ghost" data-dh="archive">&#x1F4DA; Past Dailies</button>' : '') +
          '<button type="button" class="cp-btn cp-btn-ghost" data-dh="close">' + (playNow ? 'Not Now' : main ? 'Back' : 'Got It') + '</button></div></div>' +
      '</div>';
    m.style.display = 'flex';
    fillRank();
  }
  
  
  
  function taskBox(th, rec, replay, playing) {
    var won = !!wonGo(rec), missed = !won && !goesLeft(rec) && !playing;
    return '<div class="cp-dh-task"><p class="cp-daily-challenge">' + challenge(th) + '</p>' +
      '<div class="cp-daily-facts"><div><b>' + (typeof th.wins === 'number' ? th.wins + '+ wins' : typeof th.goal === 'number' ? th.goal + '+ squad' : th.goal === 'premiers' ? 'Premiers' : th.type === 'target' ? 'Closest to ' + th.target : 'Best record') + '</b><span>' + (th.wins ? 'takes the Daily' : th.goal ? 'wins the Daily' : 'of the day wins') + '</span></div><div><b>3 goes</b><span>your best one counts</span></div></div>' +
      (!replay && rewardsOn() && rewardText(th) ? '<div class="cp-daily-reward' + (missed ? ' is-missed' : '') + '"><span class="cp-daily-reward-ico" aria-hidden="true">' + (missed ? '&#x274C;' : rewardIcon(th)) + '</span><span><b>' +
        (missed ? 'Missed Out: ' : 'Reward: ') + esc(rewardText(th)) + '</b><small>' + (won ? 'Earned today. It&rsquo;s in your Vault.' : missed ? 'Not won today, so no reward. A new Daily Challenge starts tomorrow.'
          : 'Win today&rsquo;s Daily to earn it. It goes straight to your Vault.') + '</small>' + streakBit() + '</span></div>' : '') + '</div>';
  }
  

  function showReminder() {
    if (!active) return;
    var th = active.theme, m = howModal(), rec = load(active.date), cur = rec.goes[active.go - 1];
    m.innerHTML = '<div class="cp-confirm-backdrop" data-dh="close"></div>' +
      '<div class="cp-confirm-body" role="dialog" aria-modal="true" aria-labelledby="cpDailyHowTitle">' +
        '<button type="button" class="cp-confirm-x" data-dh="close" aria-label="Close">&#x2715;</button>' +
        '<div class="cp-confirm-grab" aria-hidden="true"></div>' +
        '<div class="cp-confirm-ico" aria-hidden="true">' + th.icon + '</div>' +
        '<div class="cp-confirm-kicker">' + (active.replay ? 'Replay &middot; ' + prettyDate(active.date) : 'Daily Challenge &middot; Go ' + active.go + ' of ' + MAX_GOES) + '</div>' +
        '<h2 class="cp-confirm-title" id="cpDailyHowTitle">' + scores(esc(th.title)) + '</h2>' +
        '<p class="cp-confirm-sub cp-daily-story">' + scores(story(th)) + '</p>' +
        taskBox(th, rec, active.replay, !!(cur && !cur.done)) +
        '<div class="cp-dh-acts"><button type="button" class="cp-btn cp-btn-primary" data-dh="close">Back to My Game</button></div>' +
      '</div>';
    m.style.display = 'flex';
    track('daily_reminder', { game: '27-0', daily: active.n, go: active.go });
  }
  document.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('[data-daily-remind]')) showReminder(); });

  
  function rewardsOn() { return !!(window.CastAccount && CastAccount.rewardsOn && CastAccount.rewardsOn()); }
  function rewardText(th) { return th.reward && window.CAST_DAILY ? CAST_DAILY.itemsText(th.reward) : ''; }
  
  function streakBit() {
    var s = window.CastAccount && CastAccount.streakRewardNext && CastAccount.streakRewardNext();
    return s ? '<small class="cp-daily-reward-streak">&#x1F525; ' + s.left + ' more day' + (s.left === 1 ? '' : 's') + ' to your <span class="cp-nw">' + s.days + '-day</span> streak reward: ' + esc(s.text) + '</small>' : '';
  }
  
  function scores(html) { return String(html).replace(/(\d+)-(\d+)/g, '<span class="cp-nw">$1-$2</span>'); }
  function rewardIcon(th) { var k = th.reward && Object.keys(th.reward)[0]; return (k && window.CAST_DAILY && CAST_DAILY.itemIcons[k]) || '&#x1F381;'; }
  
  
  function alsoLine(th) {
    var o = th.onThisDay;
    if (!o || !window.CAST_DAILY) return '';
    var fin = CAST_DAILY.finals.filter(function (f) { return f.d.slice(5) === o.date.slice(5) && f.d !== o.date && (f.w === o.w || f.w === o.l); });
    return fin.length ? '<p class="cp-daily-also">Also on this day: ' + fin.map(function (f) { return esc(CAST_DAILY.nick[f.w]) + ' ' + f.d.slice(0, 4); }).join(', ') + '</p>' : '';
  }
  
  function rankLine(r) {
    
    return '<span class="cp-daily-rank-t">' + rankText(r) + '&nbsp;<span class="cp-daily-rank-go" aria-hidden="true">&rsaquo;</span></span>';
  }
  function rankText(r) {
    if (!r) return '<span class="cp-daily-rank-a">&#x1F3C6; Today&rsquo;s Leaderboard</span> <small>Checking your rank&hellip;</small>';
    if (r.who === 'player' && r.rank) return '&#x1F3C6; You are <b>#' + r.rank + '</b> of ' + r.players + ' today';
    if (r.who === 'player') return '<span class="cp-daily-rank-a">&#x1F3C6; Not ranked yet today</span> <small>See the leaderboard</small>';
    if (r.who === 'guest') return '&#x1F3C6; Sign in free to get on today&rsquo;s leaderboard';
    if (r.who === 'noname') return '&#x1F3C6; Pick a name to get on today&rsquo;s leaderboard';
    return '&#x1F3C6; Today&rsquo;s Leaderboard';
  }
  function fillRank() {
    var el = document.getElementById('cpDailyRank');
    if (!el) return;
    CastAccount.dailyRank().then(function (r) {
      if (r.who === 'off') el.remove(); else if (el.isConnected) el.innerHTML = rankLine(r);
    }, function () { if (el.isConnected) el.innerHTML = rankLine({ who: 'failed' }); });
  }

  function startDaily() {
    if (signInFirst()) { CastAccount.requireSignIn(startDaily, 'daily'); return; } 
    var date = today(), rec = load(date);
    if (goesLeft(rec) <= 0) { renderBanner(); return; }
    
    if (themeFor(date).type === 'nations' && !NAT) { loadNat().then(startDaily, function () {   }); return; }
    active = { date: date, n: dayNo(date), go: rec.goes.length + 1, k: 0, theme: themeFor(date) };
    rec.goes.push({ started: Date.now(), done: false });
    save(date, rec);
    noteStarts(date, rec);
    track('daily_start', { game: '27-0', daily: active.n, go: active.go, theme: active.theme.type });
    launch();
  }

  
  
  function signInFirst() { return !!(window.CastAccount && CastAccount.needsSignIn && CastAccount.needsSignIn()); }
  function tierNow() { return window.CastAccount && CastAccount.tier ? CastAccount.tier() : null; }
  function canReplay() { var t = tierNow(); return t ? t === 'pass' : !!(window.CastAccount && CastAccount.isSignedIn && CastAccount.isSignedIn()); }
  function startReplay(date) {
    if (!date || date >= today() || dayNo(date) < 1) return;
    if (!canReplay()) { if (window.CastAccount && CastAccount.openPass) CastAccount.openPass('archive'); return; }
    if (themeFor(date).type === 'nations' && !NAT) { loadNat().then(function () { startReplay(date); }, function () {   }); return; }
    active = { date: date, n: dayNo(date), go: 1, k: 0, theme: themeFor(date), replay: true };
    track('daily_replay', { game: '27-0', daily: active.n, theme: active.theme.type });
    launch();
  }

  function launch() {
    if (typeof selectMode === 'function') selectMode('classic');
    if (typeof setEraPreset === 'function') setEraPreset(1998); 
    
    
    var tog = document.getElementById('ratingsToggle');
    if (savedRatings === null && tog) savedRatings = tog.dataset.val || 'on';
    if (typeof setRatings === 'function') setRatings('off');
    document.body.classList.add('cp-daily-on');
    setPill();
    startSelectedMode();
  }

  var savedRatings = null;
  function stopDaily() {
    active = null;
    document.body.classList.remove('cp-daily-on');
    if (savedRatings !== null && typeof setRatings === 'function') { setRatings(savedRatings); savedRatings = null; }
  }

  
  
  function setPill() {
    var top = active && active.replay ? '&#x1F4DA; Replay &middot; ' + prettyDate(active.date) + ' &middot; just for fun'
      : active ? '&#x1F4C5; Daily Challenge &middot; Go ' + active.go + ' of ' + MAX_GOES : '';
    var text = active ? '<button type="button" class="cp-daily-strip-btn" data-daily-remind aria-label="See today&rsquo;s Daily Challenge">' +
      '<span class="cp-ds-top">' + top + '<i aria-hidden="true">&#x24D8;</i></span><span class="cp-ds-task">' + (active.theme.icon ? active.theme.icon + ' ' : '') + challenge(active.theme) + '</span></button>' : '';
    Array.prototype.forEach.call(document.querySelectorAll('.screen'), function (sc) {
      if (sc.id === 'setup') return;
      var strip = sc.querySelector(':scope > .cp-daily-strip');
      if (!strip) {
        strip = document.createElement('div');
        strip.className = 'cp-daily-strip';
        sc.insertBefore(strip, sc.firstChild);
      }
      strip.innerHTML = text;
    });
  }

  
  function afterFn(name, fx) {
    var orig = window[name];
    if (typeof orig !== 'function') return;
    window[name] = function () {
      var out = orig.apply(this, arguments);
      try { fx.apply(this, arguments); } catch (e) {   }
      return out;
    };
  }

  var lastCard = null; 
  afterFn('showResults', function () {
    if (!active && lastCard && typeof STATE !== 'undefined' && lastCard.season === STATE.season) {
      if (!document.querySelector('#resultsBody .cp-daily-result')) { if (lastCard.replay) replayCard.apply(null, lastCard.replay); else resultCard.apply(null, lastCard.args); }
      return;
    }
    if (!active || typeof STATE === 'undefined' || !STATE.season) return;
    var s = STATE.season, f = s.finals || {};
    var journey = f.myTeamInFinals ? (f.myJourney || []) : [];
    var fw = journey.filter(function (j) { return j.won; }).length;
    var perfect = s.wins === 24 && s.losses === 0 && f.isChampion && journey.every(function (j) { return j.won; }) && (s.wins + fw) === 27;
    var th = active.theme;
    if (active.replay) {
      var rp = { type: th.type, w: s.wins + fw, l: s.losses + (journey.length - fw), premiers: !!f.isChampion, perfect: perfect, rating: s.rating };
      if (th.type === 'target') rp.diff = Math.abs((s.rating || 0) - th.target);
      var rdate = active.date;
      stopDaily();
      lastCard = { season: STATE.season, args: null, replay: [rdate, rp, th] };
      replayCard(rdate, rp, th);
      return;
    }
    var g = { done: true, type: th.type, w: s.wins + fw, l: s.losses + (journey.length - fw), premiers: !!f.isChampion, perfect: perfect, ladder: s.myLadderPos, rating: s.rating };
    if (th.type === 'target') g.diff = Math.abs((s.rating || 0) - th.target);
    if (th.goal) g.goal = th.goal;
    if (th.wins) g.winGoal = th.wins;
    var date = active.date, rec = load(date);
    var prevBest = bestOf(rec);
    rec.goes[active.go - 1] = Object.assign(rec.goes[active.go - 1] || {}, g);
    save(date, rec);
    track('daily_complete', { game: '27-0', daily: active.n, go: active.go, theme: th.type, wins: g.w, premiers: g.premiers ? 'yes' : 'no' });
    var n = active.n, go = active.go;
    dailyTrophies(date, rec);
    stopDaily();
    lastCard = { season: STATE.season, args: [n, go, g, rec, prevBest, th] };
    resultCard(n, go, g, rec, prevBest, th);
  });
  
  afterFn('resetGame', function () { if (active) stopDaily(); });

  function shareText(n, best, th) {
    return '27-0 Daily Challenge, ' + prettyDate(today()) + ' ' + th.icon + ' ' + th.title +
      '\nMy best: ' + label(best) + '\nCan you beat it?\nhttps://castgames.com.au/27-0/';
  }
  function share(n, best) {
    var text = shareText(n, best, themeFor(today()));
    if (window.CastAccount && window.CastAccount.inviteText) text = window.CastAccount.inviteText(text); 
    track('daily_share', { game: '27-0', daily: n });
    
    var CA = window.CastAccount, th = themeFor(today());
    if (CA && CA.sharePick && CA.shareDraw) {
      CA.sharePick({ title: 'Share Your Daily', text: text, name: '27-0-daily', where: 'daily',
        card: { kicker: '27-0 Daily Challenge', title: th.title, who: prettyDate(today()), big: label(best), unit: 'My Best Today', cta: 'Can you beat it?', logo: 'assets/img/27-0-logo.png' } });
      return;
    }
    if (navigator.share) { navigator.share({ text: text }).catch(function () {}); return; }
    try { navigator.clipboard.writeText(text).then(function () { flash('Copied. Paste it anywhere.'); }); } catch (e) { flash(text); }
  }
  function flash(msg) {
    var t = document.createElement('div');
    t.className = 'cp-daily-toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2400);
  }

  


  function dailyButtons(body, again, share) {
    var a = body.querySelector('.cp-res-again'), sh = body.querySelector('.cp-res-share');
    if (a && again) { a.innerHTML = again[0]; a.onclick = again[1]; }
    if (sh && share) { sh.innerHTML = share[0]; sh.onclick = share[1]; }
  }
  function resultCard(n, go, g, rec, prevBest, th) {
    var body = document.getElementById('resultsBody');
    if (!body) return;
    var best = bestOf(rec), left = goesLeft(rec), won = wonGo(rec);
    var isBest = better(g, prevBest);
    var box = document.createElement('div');
    box.className = 'cp-daily-result';
    
    var signedIn = !!(window.CastAccount && CastAccount.isSignedIn && CastAccount.isSignedIn()), rt = rewardText(th), justWon = !!won && rec.goes.indexOf(won) === go - 1; 
    var reward = justWon && rewardsOn() && rt ? '<div class="cp-daily-reward is-earned"><span class="cp-daily-reward-ico" aria-hidden="true">' + rewardIcon(th) + '</span><span><b>' +
      (signedIn ? esc(rt) + ' added to your Vault' : 'You earned ' + esc(rt)) + '</b><small>' + (signedIn ? 'Daily Challenge complete. ' + esc(CAST_DAILY.useText(th.reward)) : 'Sign in free today to claim it.') + '</small></span>' +
      (signedIn ? '' : '<button type="button" class="cp-btn cp-btn-primary cp-daily-claim" data-daily="claim">Sign In Free to Claim</button>') + '</div>' : '';
    if (reward && signedIn && CastAccount.rewardShown) CastAccount.rewardShown(today(), '27-0');
    box.innerHTML =
      '<div class="cp-daily-kicker">' + th.icon + ' Daily Challenge &middot; Go ' + go + ' of ' + MAX_GOES + '</div>' +
      '<div class="cp-daily-score">' + label(g) + (isBest && rec.goes.filter(function (x) { return x.done; }).length > 1 ? ' <span class="cp-daily-pb">New best</span>' : '') + '</div>' +
      '<div class="cp-daily-best">' + (typeof th.wins === 'number' && !won ? 'Goal <b>' + th.wins + '+ wins</b> &middot; ' : typeof th.goal === 'number' && !won ? 'Goal <b>' + th.goal + '+</b> &middot; ' : '') + 'Best today: <b>' + label(best) + '</b></div>' +
      goesRow(rec, go) + reward +
      
      (left > 0 ? '' : won ? '<div class="cp-daily-done is-won">' + wonLine(won) + 'Daily complete! New Daily in ' + countdown() + '.</div>'
                  : '<div class="cp-daily-done">All ' + MAX_GOES + ' goes used. New Daily in ' + countdown() + '.</div>');
    body.insertBefore(box, body.firstChild);
    dailyButtons(body,
      left > 0 ? ['&#x1F504; Go Again (' + left + ' left)', function () { if (typeof resetGame === 'function') resetGame(); setTimeout(startDaily, 60); }]
        : ['&#x26A1; Play Classic', function () {
          track('daily_to_classic', { game: '27-0', daily: n });
          if (typeof resetGame === 'function') resetGame();
          setTimeout(function () { (window.cpPlay || function (m) { selectMode(m); startSelectedMode(); })('classic'); }, 60); 
        }],
      ['&#x1F4E4; Share My Best', function () { share(n, bestOf(load(today())) || g); }]);
    box.addEventListener('click', function (e) {
      var a = e.target.closest('[data-daily]');
      if (a && a.getAttribute('data-daily') === 'claim' && window.CastAccount && CastAccount.requireSignIn) CastAccount.requireSignIn(null, 'daily-reward');
    });
  }

  function replayCard(date, g, th) {
    var body = document.getElementById('resultsBody');
    if (!body) return;
    var box = document.createElement('div');
    box.className = 'cp-daily-result';
    box.innerHTML = '<div class="cp-daily-kicker">&#x1F4DA; Replay &middot; ' + esc(prettyDate(date)) + ' &middot; ' + th.name + '</div>' +
      '<div class="cp-daily-score">' + label(g) + '</div>' +
      '<div class="cp-daily-best">Just for fun: replays never count on the leaderboards, your streak or your trophies.</div>' +
      '<div class="cp-daily-actions"><button type="button" class="cp-btn cp-btn-ghost" data-rp="archive">&#x1F4DA; Past Dailies</button></div>';
    body.insertBefore(box, body.firstChild);
    dailyButtons(body, ['&#x1F504; Replay Again', function () { if (typeof resetGame === 'function') resetGame(); setTimeout(function () { startReplay(date); }, 60); }], null);
    box.addEventListener('click', function (e) {
      var a = e.target.closest('[data-rp]');
      if (!a) return;
      if (typeof resetGame === 'function') resetGame();
      if (a.getAttribute('data-rp') === 'again') setTimeout(function () { startReplay(date); }, 60);
      else setTimeout(showArchive, 60);
    });
  }

  function dailyTrophies(date, rec) {
    if (!window.CastAccount || !CastAccount.unlock) return;
    var ids = [];
    if (rec.goes.length >= MAX_GOES && rec.goes.every(function (x) { return x.done; })) ids.push('dfull');
    
    var run = 0, p = date.split('-'), t = Date.UTC(+p[0], p[1] - 1, +p[2]);
    for (var i = 0; i < 30; i++) {
      var d = new Date(t - i * 864e5).toISOString().slice(0, 10);
      if (!load(d).goes.some(function (x) { return x.done; })) break;
      run++;
    }
    if (run >= 7) ids.push('dstreak7');
    if (ids.length) CastAccount.unlock(ids);
  }

   
  function archiveOn() { return !!(window.CastAccount && CastAccount.open); }
  function showArchive() {
    if (!archiveOn()) return;
    var m = howModal(), signed = CastAccount.isSignedIn && CastAccount.isSignedIn(), tiers = tierNow() !== null, can = canReplay();
    var days = [], t = today(), p = LAUNCH.split('-'), start = Date.UTC(+p[0], p[1] - 1, +p[2]);
    var q = t.split('-'), end = Date.UTC(+q[0], q[1] - 1, +q[2]);
    for (var ms = end - 864e5; ms >= start; ms -= 864e5) days.push(new Date(ms).toISOString().slice(0, 10));
    var rows = days.map(function (d) {
      var th = themeFor(d), best = bestOf(load(d));
      return '<li class="cp-arch-row"><span class="cp-arch-ico" aria-hidden="true">' + th.icon + '</span>' +
        '<span class="cp-arch-mid"><small>' + esc(prettyDate(d)) + ' &middot; ' + esc(th.name) + '</small><b>' + esc(th.random ? th.title : th.type === 'match' ? th.title : th.type === 'target' ? 'Target ' + th.target : th.type === 'club' ? NICK[th.clubs[0]] + ' Only' : th.type === 'teams' ? th.name : 'Same Spins') + '</b>' +
        '<em class="' + (best ? 'is-played' : '') + '">' + (best ? 'Your best: ' + label(best) : 'Missed it') + '</em></span>' +
        (can ? '<button type="button" class="cp-btn cp-btn-ghost cp-arch-play" data-dh="replay" data-date="' + d + '">Play</button>'
             : '<span class="cp-arch-lock" aria-label="' + (tiers ? 'Comes with CAST Pass' : 'Sign in to play') + '">&#x1F512;</span>') + '</li>';
    }).join('');
    m.innerHTML = '<div class="cp-confirm-backdrop" data-dh="close"></div>' +
      '<div class="cp-confirm-body" role="dialog" aria-modal="true" aria-labelledby="cpArchTitle">' +
        '<button type="button" class="cp-confirm-x" data-dh="close" aria-label="Close">&#x2715;</button>' +
        '<div class="cp-confirm-grab" aria-hidden="true"></div>' +
        '<div class="cp-confirm-kicker">&#x1F4DA; The Daily archive</div>' +
        '<h2 class="cp-confirm-title" id="cpArchTitle">Past Dailies</h2>' +
        '<p class="cp-confirm-sub">' + (can ? 'Play any past Daily again, with the same theme. Replays are just for fun and never count on the leaderboards, your streak or trophies.'
          : tiers ? 'Past Dailies come with <b>CAST Pass</b>: replay any Daily you missed, with the same spins everyone got. Today&rsquo;s Daily stays free with a CAST Profile.'
          : 'Today&rsquo;s Daily is free for everyone. <b>Sign in free</b> to play every past Daily too.') + '</p>' +
        (rows ? '<ol class="cp-arch">' + rows + '</ol>' : '<p class="cp-confirm-sub">Past Dailies appear here from tomorrow.</p>') +
        (can ? '' : tiers ? '<button type="button" class="cp-btn cp-btn-primary" data-dh="pass">Get CAST Pass</button>' : signed ? '' : '<button type="button" class="cp-btn cp-btn-primary" data-dh="signin">Sign in free</button>') +
        '<button type="button" class="cp-btn cp-btn-ghost" data-dh="close">Close</button>' +
      '</div>';
    m.style.display = 'flex';
    track('daily_archive_open', { game: '27-0', signed_in: signed ? 'yes' : 'no' });
  }

  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  
  function goalLine(th) {
    if (th.random) return th.wins ? 'Only <b>' + esc(th.seasons) + '</b>. Win <b>' + th.wins + '+</b> games.' : 'Only <b>' + esc(th.seasons) + '</b>. Get your squad to <b>' + th.goal + '+</b>.';
    if (th.type === 'target') return 'Build a squad rated <b>' + th.target + '</b>. Closest wins.';
    if (th.type === 'match') return 'Only <b>' + NICK[th.clubs[0]] + '</b> and <b>' + NICK[th.clubs[1]] + '</b> players. Most wins takes it.';
    if (th.type === 'club') return 'Only <b>' + NICK[th.clubs[0]] + '</b> players, 1998 to 2026. Most wins takes it.';
    if (th.type === 'teams') return 'Only <b>' + th.clubs.map(function (c) { return NICK[c]; }).join('</b> and <b>') + '</b> premiership teams. Most wins takes it.';
    return 'Same 13 spins for everyone. Most wins takes it.';
  }

  
  function goesRow(rec, justPlayed) {
    var best = bestOf(rec), won = wonGo(rec);
    var tiles = [];
    for (var i = 0; i < MAX_GOES; i++) {
      var g = rec.goes[i], cls = 'cp-go', main = '', sub = '';
      if (!g && won) { cls += ' is-skip'; main = '&#x2713;'; sub = 'Not needed'; }
      else if (!g) { cls += ' is-empty'; main = '-'; sub = 'To play'; }
      else if (!g.done) { cls += ' is-left'; main = '&times;'; sub = 'Left early'; }
      else {
        if (g.type === 'target') { main = String(g.rating); sub = g.diff === 0 ? 'Target hit' : g.diff + ' off'; }
        else if (typeof g.winGoal === 'number') { var sh = Math.max(1, g.winGoal - (g.w || 0)); main = g.w + '-' + g.l; sub = hitGoal(g) ? 'Goal hit' : sh + (sh === 1 ? ' win short' : ' wins short'); }
        else if (typeof g.goal === 'number') { main = String(g.rating); sub = hitGoal(g) ? 'Goal hit' : Math.max(1, g.goal - (g.rating || 0)) + ' short'; }
        else { main = g.w + '-' + g.l; sub = g.perfect ? 'Perfect Season' : g.premiers ? 'Premiers' : g.ladder ? ordinal(g.ladder) + ' place' : ''; }
        if (g === best) cls += ' is-best';
      }
      if (justPlayed === i + 1) cls += ' is-new';
      tiles.push('<div class="' + cls + '"><span class="cp-go-n">' + (g === best && g && g.done ? '&#x2B50; ' : '') + 'Go ' + (i + 1) + '</span>' +
        '<span class="cp-go-main">' + main + '</span><span class="cp-go-sub">' + sub + '</span></div>');
    }
    return '<div class="cp-goes" aria-label="Your goes today">' + tiles.join('') + '</div>';
  }
  function ordinal(n) { var s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }

   
  function renderBanner() {
    var el = document.getElementById('cpDaily');
    if (!el) return;
    var date = today(), n = dayNo(date), rec = load(date), best = bestOf(rec), used = rec.goes.length, th = themeFor(date);
    var won = wonGo(rec), left = goesLeft(rec), target = th.type === 'target', winsDay = typeof th.wins === 'number', goalDay = target || winsDay || typeof th.goal === 'number';
    
    
    var failed = !won && !left && goalDay;
    var dots = '';
    for (var i = 0; i < MAX_GOES; i++) {
      var g = rec.goes[i], cls = '', mark = '';
      if (!g) cls = won ? ' is-skip' : '';
      else if (g === won) { cls = ' is-win'; mark = '&#x2713;'; }
      else if (!g.done || (target && g.diff > 0) || (goalDay && !target && !hitGoal(g))) { cls = ' is-miss'; mark = '&#x2715;'; }
      else cls = g === best ? ' is-best' : ' is-done';
      dots += '<i class="cp-dot' + cls + '">' + mark + '</i>';
    }
    var head = th.head || (th.type === 'teams' ? (typeof th.goal === 'number' ? 'Premiership 13 rated ' + th.goal + '+' : 'Best premiership 13') : typeof th.goal === 'number' ? NICK[th.clubs[0]] + ' 13 rated ' + th.goal + '+' : th.goal === 'premiers' ? 'Win the premiership'
      : th.type === 'target' ? 'Hit a squad rating of ' + th.target : th.type === 'same' ? 'Best record wins' : th.type === 'club' ? NICK[th.clubs[0]] + ' only' : th.title);
    
    
    var missed = !won && !left;
    var rw = rewardsOn() && rewardText(th) ? '<span class="cp-daily-reward-chip' + (won ? ' is-won' : missed ? ' is-missed' : '') + '">' +
      (won ? '&#x2705; Reward Earned' : missed ? '&#x274C; Missed Out: ' + esc(rewardText(th)) : rewardIcon(th) + ' ' + esc(rewardText(th))) + '</span>' : '';
    el.innerHTML =
      '<div class="cp-daily-card is-compact' + (left ? '' : ' is-done') + (won ? ' is-won' : '') + (failed ? ' is-failed' : '') + '" data-daily-home="how" role="button" tabindex="0" aria-label="Today\'s Daily Challenge: ' + esc(head) + '">' +
        '<div class="cp-daily-ico" aria-hidden="true">' + th.icon + '</div>' +
        '<div class="cp-daily-mid">' +
          '<div class="cp-daily-theme">Daily Challenge</div>' +
          '<div class="cp-daily-title">' + esc(head) + '</div>' +
          '<div class="cp-daily-meta"><span class="cp-dots" aria-label="' + used + ' of ' + MAX_GOES + ' goes played">' + dots + '</span><span>' +
            (won ? '<b>' + (won.type === 'target' ? 'Target hit: ' + won.rating + ' &#x1F3AF;' : won.perfect ? '27-0 &#x1F451;' : won.goal === 'premiers' ? 'Premiers &#x1F3C6;' : winsDay ? won.w + ' Wins &#x2705;' : 'Rated ' + won.rating + ' &#x2705;') + '</b>' : failed ? '<b>Missed</b> &middot; best ' + (best ? (winsDay ? best.w + '-' + best.l : best.rating) : '-') : best ? 'Best <b>' + (best.type === 'target' ? best.rating + (best.diff ? ' (' + best.diff + ' off)' : ' &#x1F3AF;') : winsDay ? best.w + '-' + best.l : goalDay ? 'rated ' + best.rating : best.w + '-' + best.l) + '</b>' : used ? left + (left === 1 ? ' go left' : ' goes left') : MAX_GOES + ' goes &middot; ' + countdown() + ' left') + '</span></div>' + rw +
        '</div>' +
        '<button type="button" class="cp-btn ' + (left ? 'cp-btn-primary' : 'cp-btn-ghost') + (won ? ' is-won' : failed ? ' is-failed' : '') + ' cp-daily-go" data-daily-home="' + (left ? 'play' : 'how') + '">' + (left ? (signInFirst() ? 'Sign In' : used ? 'Go Again' : 'Play') : won ? 'Done &#x2713;' : failed ? 'Failed &#x2715;' : 'Results') + '</button>' +
      '</div>';
    fitTitle(el.querySelector('.cp-daily-title'));
  }
  
  
  
  function fitTitle(t) {
    if (!t) return;
    var n = t.firstChild;
    if (n && n.nodeType === 3) n.nodeValue = n.nodeValue.replace(/\u00A0/g, ' '); 
    t.style.fontSize = '';
    for (var fs = 15; fs >= 12 && t.scrollHeight > t.clientHeight + 1; fs--) t.style.fontSize = fs + 'px';
    var fit = t.style.fontSize;
    for (var f2 = Math.min(15, parseFloat(getComputedStyle(t).fontSize) - 1); f2 >= 13 && lonelyEnd(t); f2--) t.style.fontSize = f2 + 'px';
    
    
    if (lonelyEnd(t)) { t.style.fontSize = fit; n.nodeValue = n.nodeValue.replace(/\s+(\S+\s*)$/, '\u00A0$1'); }
  }
  
  function lonelyEnd(el) {
    var n = el.firstChild, m = n && n.nodeType === 3 && /(\S+)\s+(\S+)\s*$/.exec(n.nodeValue);
    if (!m || !document.createRange) return false;
    var r = document.createRange(), i = m.index + m[0].length - m[0].replace(/^\S+\s+/, '').length, a, b;
    r.setStart(n, m.index); r.setEnd(n, m.index + m[1].length); a = r.getBoundingClientRect();
    r.setStart(n, i); r.setEnd(n, i + m[2].length); b = r.getBoundingClientRect();
    return b.top > a.top + 2;
  }
  window.addEventListener('resize', function () { fitTitle(document.querySelector('.cp-daily-card.is-compact .cp-daily-title')); }); 

  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-daily-home]');
    if (!a) return;
    var act = a.getAttribute('data-daily-home');
    if (act === 'play' || act === 'how') showHow(true);
    else { var rec = load(today()); share(dayNo(today()), bestOf(rec)); }
  });

  window.CastDaily = {
    isActive: function () { return !!active; },
    current: function () { return active && !active.replay ? { n: active.n, date: active.date, go: active.go, theme: active.theme } : null; },
    isReplay: function () { return !!(active && active.replay); },
    archive: showArchive, replay: startReplay,
    start: startDaily, themeFor: themeFor, poolFor: poolFor,
    
    upcoming: function (n) {
      var out = [], p = today().split('-'), d0 = Date.UTC(+p[0], p[1] - 1, +p[2]);
      for (var i = 0; i < (n || 14); i++) {
        var date = new Date(d0 + i * 864e5).toISOString().slice(0, 10), th = themeFor(date);
        out.push({ date: date, n: dayNo(date), pretty: prettyDate(date), icon: th.icon, name: th.name, title: th.random ? th.title + (th.wins ? ' (' + th.wins + '+ wins)' : ' (' + th.goal + '+ squad)') : th.title,
          planned: !!(th.planned || CALENDAR[date]), story: th.story || '', hard: !!th.hard, reward: rewardText(th) });
      }
      return out;
    }
  };

  



  
  function noteStarts(date, rec) {
    if (window.CastAccount && CastAccount.dailyStarted) CastAccount.dailyStarted(date, '27-0', rec.goes.length, rec.goes.map(function (g) { return g.started; }));
  }
  function syncFromAccount() {
    if (!window.CastAccount || !CastAccount.dailyAccount || !(CastAccount.isSignedIn && CastAccount.isSignedIn())) return;
    if (active) return; 
    var date = today(), th = themeFor(date);
    CastAccount.dailyAccount(date, '27-0').then(function (acc) {
      if (!acc || date !== today() || active) return;
      var rec = load(date), mine = rec.goes.filter(function (g) { return g.done; }).length, theirs = acc.slots.filter(function (s) { return s.g; }).length;
      if (acc.n > rec.goes.length || theirs > mine) {
        
        var goes = acc.slots.map(function (s) {
          if (!s.g) return { started: s.started, done: false, synced: true };
          var r = s.g, g = { done: true, type: th.type, w: r.w, l: r.l, premiers: !!r.premiers, perfect: !!r.perfect, rating: r.rating, started: s.started || undefined, synced: true };
          if (th.type === 'target') g.diff = typeof r.diff === 'number' ? r.diff : Math.abs((r.rating || 0) - th.target);
          if (th.goal) g.goal = th.goal;
          if (th.wins) g.winGoal = th.wins;
          return g;
        });
        while (goes.length < acc.n) goes.push({ started: null, done: false, synced: true });
        rec.goes = goes.slice(0, MAX_GOES);
        save(date, rec);
        renderBanner();
        track('daily_synced', { goes: rec.goes.length });
      } else if (rec.goes.length > acc.n) noteStarts(date, rec); 
    });
  }
  
  window.addEventListener('cast-account', function (e) { if (!active) renderBanner(); if (e.detail && e.detail.status === 'signed-in') syncFromAccount(); });
  
  window.addEventListener('cast:rewards', function () { if (!active) renderBanner(); });
  window.addEventListener('cast:daily-open', function () { if (!active) showHow(true); });
  
  window.addEventListener('cast:tier', function () {
    if (active) return;
    renderBanner();
    var m = document.getElementById('cpDailyHow');
    if (m && m.style.display !== 'none' && m.querySelector('[data-dh="go"]')) showHow(true);
  });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) syncFromAccount(); });

  function boot() {
    renderBanner();
    syncFromAccount();
    setInterval(renderBanner, 60000); 
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  
  afterFn('showScreen', function (id) { if (id === 'setup') { renderBanner(); syncFromAccount(); } });
})();
