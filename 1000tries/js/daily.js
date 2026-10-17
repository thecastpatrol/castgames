



(function (T) {
  'use strict';

  var LAUNCH = '2026-09-28'; 
  var MAX_GOES = 3;
  var KEY = '1000_daily_';

  


  var NEW_FORMAT = '2026-09-29';
  var LEGACY = {
    '2026-09-28': { target: 700, club: 'knights', clubName: 'Knights', icon: '🏰', name: 'Knights Day',
      title: '700+ Tries With a Knight in Your 13', head: '700+ With a Knight',
      story: 'Newcastle stunned Penrith 22-14 to set up a Grand Final against the Roosters. To mark it, the target drops to 700, but your 13 needs at least one player who has played for the Knights.' }
  };
  function themeFor(date) {
    if (date >= NEW_FORMAT && window.CAST_DAILY) {
      var d = CAST_DAILY.day(date), g = d.g1000, era = d.key.indexOf('era:') === 0;
      return { key: d.key, name: d.name, short: d.short, who: d.who, icon: d.icon, title: d.title, story: d.story, onThisDay: d.onThisDay,
        target: g.target, only: g.only || null, years: g.years || null, nations: g.nations || null, hard: d.hard, planned: d.planned, random: true,
        reward: d.reward['1000tries'], rewardKind: d.rewardKind,
        head: fmt(g.target) + '+ ' + (era ? 'From ' : 'With ') + d.short,
        task: 'Get <b>' + fmt(g.target) + '+</b> tries using only <b>' + esc(d.who) + '</b>.' };
    }
    var t = LEGACY[date] ? JSON.parse(JSON.stringify(LEGACY[date])) : {};
    t.target = t.target || 1000;
    t.icon = t.icon || '&#x1F4C5;';
    t.title = t.title || 'The Same Draft for Everyone';
    t.head = t.head || t.title; 
    t.story = t.story || 'Every player gets the same drafts today, so it all comes down to who picks best.';
    
    t.task = t.task || (t.club ? 'Get <b>' + fmt(t.target) + '+</b> tries with at least one <b>' + esc(t.clubName) + '</b> player in your 13.' : 'Get your 13 to <b>' + fmt(t.target) + '</b> tries.');
    return t;
  }
  
  function rewardsOn() { return !!(window.CastAccount && CastAccount.rewardsOn && CastAccount.rewardsOn()); }
  function rewardText(th) { return th.reward && window.CAST_DAILY ? CAST_DAILY.itemsText(th.reward) : ''; }
  
  function streakBit() {
    var s = window.CastAccount && CastAccount.streakRewardNext && CastAccount.streakRewardNext();
    return s ? '<small class="dly-reward-streak">&#x1F525; ' + s.left + ' more day' + (s.left === 1 ? '' : 's') + ' to your <span class="dly-nw">' + s.days + '-day</span> streak reward: ' + esc(s.text) + '</small>' : '';
  }
  
  function scores(html) { return String(html).replace(/(\d+)-(\d+)/g, '<span class="dly-nw">$1-$2</span>'); }
  function rewardIcon(th) { var k = th.reward && Object.keys(th.reward)[0]; return (k && window.CAST_DAILY && CAST_DAILY.itemIcons[k]) || '&#x1F381;'; }
  
  
  function alsoLine(th) {
    var o = th.onThisDay;
    if (!o || !o.also || !o.also.length || !window.CAST_DAILY) return '';
    var nick = CAST_DAILY.nick, fin = CAST_DAILY.finals.filter(function (f) { return f.d.slice(5) === o.date.slice(5) && f.d !== o.date && (f.w === o.w || f.w === o.l); });
    if (!fin.length) return '';
    return '<p class="dly-also">Also on this day: ' + fin.map(function (f) { return esc(nick[f.w]) + ' ' + f.d.slice(0, 4); }).join(', ') + '</p>';
  }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fmt(n) { return Number(n || 0).toLocaleString('en-AU', { useGrouping: false }); } 
  function track(e, p) { if (T.track) T.track(e, p || {}); }

   
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
  function countdown() {
    var p = sydneyParts(), s = (23 - +p.hour) * 3600 + (59 - +p.minute) * 60 + (60 - +p.second), m = Math.ceil(s / 60), h = Math.floor(m / 60);
    return h ? h + 'h ' + (m % 60) + 'm' : m + 'm';
  }

   
  function load(date) {
    try { var r = JSON.parse(localStorage.getItem(KEY + date) || 'null'); if (r && Array.isArray(r.goes)) return r; } catch (e) {   }
    return { goes: [] };
  }
  function save(date, rec) { try { localStorage.setItem(KEY + date, JSON.stringify(rec)); } catch (e) {   } }
  function bestOf(rec) { return rec.goes.filter(function (g) { return g.done; }).reduce(function (a, g) { return !a || (g.win && !a.win) || (!!g.win === !!a.win && g.total > a.total) ? g : a; }, null); }
  function goesLeft(rec) { return Math.max(0, MAX_GOES - rec.goes.length); }
  
  function seedFor(date, go) { return 'daily' + date.replace(/-/g, '') + 'g' + go; }
  function signInFirst() { return !!(window.CastAccount && CastAccount.needsSignIn && CastAccount.needsSignIn()); }
  function live() { return today() >= LAUNCH; }

   
  T.dailyStart = function () {
    if (!live() || !T.play || !(T.players && T.players.length)) return; 
    var date = today(), rec = load(date);
    if (!goesLeft(rec)) { T.dailyRender(); return; }
    if (signInFirst()) { CastAccount.requireSignIn(T.dailyStart, 'daily'); return; }
    var go = rec.goes.length + 1, th = themeFor(date);
    
    if (th.nations && !T.NAT) { T.loadNat().then(T.dailyStart, function () {   }); return; }
    rec.goes.push({ started: Date.now() }); 
    save(date, rec);
    noteStarts(date, rec);
    track('daily_start', { daily: dayNo(date), go: go });
    T.play('daily', { seed: th.random ? null : seedFor(date, go), daily: { date: date, n: dayNo(date), go: go,
      target: th.random || th.target !== 1000 ? th.target : null, club: th.club || null, only: th.only || null, years: th.years || null, nations: th.nations || null,
      clubName: th.clubName || '', icon: th.icon, name: th.name || '', task: th.task, of: MAX_GOES } });
  };
  T.dailyDone = function (S, out) {
    var dd = S.daily;
    if (!dd) return;
    var rec = load(dd.date);
    rec.goes[dd.go - 1] = { done: true, total: out.total, win: !!out.win, started: (rec.goes[dd.go - 1] || {}).started };
    save(dd.date, rec);
    track('daily_complete', { daily: dd.n, go: dd.go, total: out.total, win: out.win ? 'yes' : 'no' });
    resultCard(dd, out, rec);
    T.dailyRender();
  };

   
  function goesRow(rec) {
    var out = '';
    for (var i = 0; i < MAX_GOES; i++) {
      var g = rec.goes[i];
      var cls = !g ? '' : !g.done ? ' is-left' : g.win ? ' is-win' : ' is-miss';
      out += '<span class="dly-go' + cls + '"><b>' + (!g ? '-' : !g.done ? '&#x2715;' : fmt(g.total)) + '</b><small>' + (!g ? 'Go ' + (i + 1) : !g.done ? 'Left' : g.win ? 'Won' : 'Tries') + '</small></span>';
    }
    return '<div class="dly-goes">' + out + '</div>';
  }

   
  function dots(rec) {
    var out = '';
    for (var i = 0; i < MAX_GOES; i++) {
      var g = rec.goes[i], cls = '', mark = '';
      
      
      if (g && g.done && g.win) { cls = ' is-win'; mark = '&#x2713;'; }
      else if (g) { cls = ' is-miss'; mark = '&#x2715;'; }
      out += '<i class="dly-dot' + cls + '">' + mark + '</i>';
    }
    return '<span class="dly-dots" aria-label="' + rec.goes.length + ' of ' + MAX_GOES + ' goes played">' + out + '</span>';
  }
  T.dailyRender = function () {
    var box = document.getElementById('dailyCard');
    if (!box) return;
    if (!live()) { box.hidden = true; return; }
    var date = today(), rec = load(date), left = goesLeft(rec), best = bestOf(rec), th = themeFor(date), used = rec.goes.length, won = !!(best && best.win);
    var meta = won ? '<b>Won: ' + fmt(best.total) + ' tries</b>'
      : best ? 'Best <b>' + fmt(best.total) + '</b> tries'
      : used ? left + (left === 1 ? ' go left' : ' goes left') : MAX_GOES + ' goes &middot; ' + countdown() + ' left';
    
    
    var missed = !won && !left;
    var rw = rewardsOn() && rewardText(th) ? '<span class="dly-reward-chip' + (won ? ' is-won' : missed ? ' is-missed' : '') + '">' +
      (won ? '&#x2705; Reward Earned' : missed ? '&#x274C; Missed Out: ' + esc(rewardText(th)) : rewardIcon(th) + ' ' + esc(rewardText(th))) + '</span>' : '';
    box.hidden = false;
    box.innerHTML = '<div class="dly-card is-compact' + (left ? '' : ' is-done') + (won ? ' is-won' : '') + '" data-dly="how" role="button" tabindex="0" aria-label="Today’s Daily Challenge: ' + esc(th.head) + '">' +
      '<span class="dly-ico" aria-hidden="true">' + th.icon + '</span>' +
      '<span class="dly-mid"><span class="dly-kicker">Daily Challenge</span><b class="dly-title">' + esc(th.head) + '</b>' +
        '<span class="dly-meta">' + dots(rec) + '<span>' + meta + '</span></span>' + rw + '</span>' +
      '<button type="button" class="btn ' + (left ? 'btn-primary' : 'btn-ghost') + (won ? ' is-won' : '') + ' dly-go-btn" data-dly="how">' +
        (left ? (signInFirst() ? 'Sign In' : used ? 'Go Again' : 'Play') : won ? 'Done &#x2713;' : 'Results') + '</button>' +
      '</div>';
    fitTitle(box.querySelector('.dly-title'));
    if (pop && !pop.hidden && pop.getAttribute('data-kind') !== 'remind') showHow(); 
  };
  
  
  
  function fitTitle(el) {
    if (!el) return;
    var n = el.firstChild;
    if (n && n.nodeType === 3) n.nodeValue = n.nodeValue.replace(/\u00A0/g, ' '); 
    el.style.fontSize = '';
    for (var fs = 15; fs >= 12 && el.scrollHeight > el.clientHeight + 1; fs--) el.style.fontSize = fs + 'px';
    var fit = el.style.fontSize;
    for (var f2 = Math.min(15, parseFloat(getComputedStyle(el).fontSize) - 1); f2 >= 13 && lonelyEnd(el); f2--) el.style.fontSize = f2 + 'px';
    
    
    if (lonelyEnd(el)) { el.style.fontSize = fit; n.nodeValue = n.nodeValue.replace(/\s+(\S+\s*)$/, '\u00A0$1'); }
  }
  
  function lonelyEnd(el) {
    var n = el.firstChild, m = n && n.nodeType === 3 && /(\S+)\s+(\S+)\s*$/.exec(n.nodeValue);
    if (!m || !document.createRange) return false;
    var r = document.createRange(), i = m.index + m[0].length - m[0].replace(/^\S+\s+/, '').length, a, b;
    r.setStart(n, m.index); r.setEnd(n, m.index + m[1].length); a = r.getBoundingClientRect();
    r.setStart(n, i); r.setEnd(n, i + m[2].length); b = r.getBoundingClientRect();
    return b.top > a.top + 2;
  }

   
  var pop = null;
  function showHow() {
    var date = today(), th = themeFor(date), rec = load(date), left = goesLeft(rec), best = bestOf(rec), opening = !pop || pop.hidden;
    if (!pop) { pop = document.createElement('div'); pop.className = 'dly-pop'; pop.id = 'dlyPop'; pop.hidden = true; document.body.appendChild(pop); }
    var main = left ? '<button type="button" class="btn btn-primary" data-dly="play">' + (signInFirst() ? 'Sign In Free to Play' : 'Start Go ' + (rec.goes.length + 1) + ' of ' + MAX_GOES) + '</button>'
      : best ? '<button type="button" class="btn btn-primary" data-dly="share">&#x1F4E4; Share My Best</button>' : '';
    pop.innerHTML = '<div class="dly-pop-backdrop" data-dly="close"></div>' +
      '<div class="dly-pop-body" role="dialog" aria-modal="true" aria-labelledby="dlyPopTitle">' +
        '<button type="button" class="dly-pop-x" data-dly="close" aria-label="Close">&#x2715;</button>' +
        '<div class="dly-pop-grab" aria-hidden="true"></div>' +
        '<div class="dly-pop-ico" aria-hidden="true">' + th.icon + '</div>' +
        '<div class="dly-kicker">Daily Challenge' + (th.hard ? ' &middot; Hard Day' : '') + '</div>' +
        '<h2 class="dly-pop-title" id="dlyPopTitle">' + scores(esc(th.title)) + '</h2>' +
        '<p class="dly-pop-story">' + scores(esc(th.story)) + '</p>' + alsoLine(th) +
        taskBox(th, rec) +
        (rec.goes.length ? '<div class="dly-goes-h">Your Goes Today</div>' + goesRow(rec) : '') +
        (left ? '' : '<p class="dly-done">All ' + MAX_GOES + ' goes played. New Daily in ' + countdown() + '.</p>') +
        (window.CastAccount && CastAccount.dailyRank ? '<button type="button" class="dly-rank" id="dlyRank" data-dly="board">' + rankLine(null) + '</button>' : '') +
        '<div class="dly-pop-acts">' + main +
          '<div class="dly-pop-row">' + (best && left ? '<button type="button" class="btn btn-ghost" data-dly="share">Share</button>' : '') +
          '<button type="button" class="btn btn-ghost" data-dly="close">' + (left ? 'Not Now' : 'Got It') + '</button></div></div>' +
      '</div>';
    pop.setAttribute('data-kind', 'how');
    pop.hidden = false;
    document.body.classList.add('is-locked');
    if (opening) track('daily_open', { daily: dayNo(date) });
    fillRank();
  }
  
  
  function taskBox(th, rec, playing) {
    var won = !!(bestOf(rec) && bestOf(rec).win), missed = !won && !goesLeft(rec) && !playing;
    return '<div class="dly-task"><p class="dly-task-line">' + th.task + '</p>' +
      '<div class="dly-facts"><div><b>' + fmt(th.target) + '+ tries</b><span>' + (th.club ? 'with a ' + esc(th.clubName) + ' player wins' : 'wins the Daily') + '</span></div>' +
      '<div><b>' + MAX_GOES + ' goes</b><span>your best one counts</span></div></div>' +
      (rewardsOn() && rewardText(th) ? '<div class="dly-reward' + (missed ? ' is-missed' : '') + '"><span class="dly-reward-ico" aria-hidden="true">' + (missed ? '&#x274C;' : rewardIcon(th)) + '</span><span><b>' +
        (missed ? 'Missed Out: ' : 'Reward: ') + esc(rewardText(th)) + '</b><small>' + (won ? 'Earned today. It&rsquo;s in your Vault.' : missed ? 'Not won today, so no reward. A new Daily Challenge starts tomorrow.'
          : 'Win today&rsquo;s Daily to earn it. It goes straight to your Vault.') + '</small>' + streakBit() + '</span></div>' : '') + '</div>';
  }
  

  function remind() {
    var S = T.state && T.state(), dd = S && S.daily;
    if (!dd) return;
    var th = themeFor(dd.date), rec = load(dd.date), cur = rec.goes[dd.go - 1];
    if (!pop) { pop = document.createElement('div'); pop.className = 'dly-pop'; pop.id = 'dlyPop'; pop.hidden = true; document.body.appendChild(pop); }
    pop.innerHTML = '<div class="dly-pop-backdrop" data-dly="close"></div>' +
      '<div class="dly-pop-body" role="dialog" aria-modal="true" aria-labelledby="dlyPopTitle">' +
        '<button type="button" class="dly-pop-x" data-dly="close" aria-label="Close">&#x2715;</button>' +
        '<div class="dly-pop-grab" aria-hidden="true"></div>' +
        '<div class="dly-pop-ico" aria-hidden="true">' + th.icon + '</div>' +
        '<div class="dly-kicker">Daily Challenge &middot; Go ' + dd.go + ' of ' + MAX_GOES + '</div>' +
        '<h2 class="dly-pop-title" id="dlyPopTitle">' + scores(esc(th.title)) + '</h2>' +
        '<p class="dly-pop-story">' + scores(esc(th.story)) + '</p>' +
        taskBox(th, rec, !!(cur && !cur.done)) +
        '<div class="dly-pop-acts"><button type="button" class="btn btn-primary" data-dly="close">Back to My Game</button></div>' +
      '</div>';
    pop.setAttribute('data-kind', 'remind');
    pop.hidden = false;
    document.body.classList.add('is-locked');
    track('daily_reminder', { daily: dd.n, go: dd.go });
  }
  function closeHow() {
    if (!pop || pop.hidden) return;
    pop.hidden = true; pop.innerHTML = '';
    document.body.classList.remove('is-locked');
  }
  
  function rankLine(r) {
    
    return '<span class="dly-rank-t">' + rankText(r) + '&nbsp;<span class="dly-rank-go" aria-hidden="true">&rsaquo;</span></span>';
  }
  function rankText(r) {
    if (!r) return '<span class="dly-rank-a">&#x1F3C6; Today&rsquo;s Leaderboard</span> <small>Checking your rank&hellip;</small>';
    if (r.who === 'player' && r.rank) return '&#x1F3C6; You are <b>#' + fmt(r.rank) + '</b> of ' + fmt(r.players) + ' today';
    if (r.who === 'player') return '<span class="dly-rank-a">&#x1F3C6; Not ranked yet today</span> <small>See the leaderboard</small>';
    if (r.who === 'guest') return '&#x1F3C6; Sign in free to get on today&rsquo;s leaderboard';
    if (r.who === 'noname') return '&#x1F3C6; Pick a name to get on today&rsquo;s leaderboard';
    return '&#x1F3C6; Today&rsquo;s Leaderboard';
  }
  function fillRank() {
    var el = document.getElementById('dlyRank');
    if (!el) return;
    CastAccount.dailyRank('1000daily').then(function (r) {
      if (!el.isConnected) return;
      if (r.who === 'off') el.remove(); else el.innerHTML = rankLine(r);
    }, function () { if (el.isConnected) el.innerHTML = rankLine({ who: 'failed' }); });
  }

   
  function resultCard(dd, out, rec) {
    var host = document.getElementById('results');
    if (!host) return;
    var best = bestOf(rec), left = goesLeft(rec), box = document.createElement('div');
    box.className = 'dly-result' + (out.win ? ' is-won' : '');
    var th = themeFor(dd.date), rule = dd.club
      ? '<div class="dly-rules"><span class="' + (out.total >= th.target ? 'is-ok' : 'is-no') + '">' + (out.total >= th.target ? '&#x2705;' : '&#x274C;') + ' ' + fmt(th.target) + '+ tries</span>' +
        '<span class="' + (T.hasDailyClub() ? 'is-ok' : 'is-no') + '">' + (T.hasDailyClub() ? '&#x2705;' : '&#x274C;') + ' A ' + esc(dd.clubName) + ' player</span></div>' : '';
    
    
    
    var signedIn = !!(window.CastAccount && CastAccount.isSignedIn && CastAccount.isSignedIn()), rt = rewardText(th);
    var firstWin = out.win && !rec.goes.some(function (g, i) { return i !== dd.go - 1 && g && g.done && g.win; });
    var reward = firstWin && rewardsOn() && rt ? '<div class="dly-reward is-earned"><span class="dly-reward-ico" aria-hidden="true">' + rewardIcon(th) + '</span><span><b>' +
      (signedIn ? esc(rt) + ' added to your Vault' : 'You earned ' + esc(rt)) + '</b><small>' + (signedIn ? 'Daily Challenge complete. ' + esc(CAST_DAILY.useText(th.reward)) : 'Sign in free today to claim it.') + '</small></span>' +
      (signedIn ? '' : '<button type="button" class="btn btn-primary dly-claim" data-dly="claim">Sign In Free to Claim</button>') + '</div>' : '';
    if (reward && signedIn && window.CastAccount && CastAccount.rewardShown) CastAccount.rewardShown(dd.date, '1000tries');
    box.innerHTML = '<div class="dly-kicker">' + th.icon + ' Daily Challenge &middot; Go ' + dd.go + ' of ' + MAX_GOES + '</div>' +
      '<div class="dly-score">' + fmt(out.total) + ' <small>tries</small>' + (out.win ? ' &#x2705;' : '') + '</div>' + rule + reward +
      '<div class="dly-best">Best today: <b>' + fmt(best ? best.total : out.total) + '</b></div>' + goesRow(rec) +
      (left ? '' : '<span class="dly-done">All 3 goes played. New Daily in ' + countdown() + '.</span>');
    host.insertBefore(box, host.firstChild);
    dailyButtons(host, left);
  }
  


  function dailyButtons(host, left) {
    var again = host.querySelector('[data-action="play-again"]'), share = host.querySelector('.btn-res-share');
    if (again) {
      if (left) again.innerHTML = '<span aria-hidden="true">&#x2699;&#xFE0F;</span> Go Again (' + left + ' left)';
      else { again.removeAttribute('data-action'); again.setAttribute('data-dly', 'plus'); again.innerHTML = '<span aria-hidden="true">&#x26A1;</span> Play 1000+'; }
    }
    if (share) { share.removeAttribute('data-action'); share.setAttribute('data-dly', 'share'); share.innerHTML = '<span aria-hidden="true">&#x1F4E4;</span> Share My Best'; }
  }

  function share() {
    var date = today(), rec = load(date), best = bestOf(rec);
    if (!best) return;
    var th = themeFor(date);
    var text = '1000TRIES Daily Challenge · ' + prettyDate(date) + (th.name ? ' · ' + th.name : '') + '\n🏉 ' + fmt(best.total) + ' tries' + (best.win ? ' ✅' : '') + ' (best of ' + rec.goes.filter(function (g) { return g.done; }).length + ')\n1000tries.com.au';
    if (window.CastAccount && window.CastAccount.inviteText) text = window.CastAccount.inviteText(text); 
    track('daily_share', { daily: dayNo(date) });
    
    
    var CA = window.CastAccount;
    if (CA && CA.sharePick && CA.shareDraw) {
      var L = text.split('\n'), head = L[0].split(' \u00B7 ')[0], played = rec.goes.filter(function (g) { return g && g.done; });
      var unit = (L[1] || '').replace(/^\S+\s+\d+\s*/, '').replace(/\s*\u2705/, '').replace(/\s*\(best of \d+\)\s*$/, '');
      CA.sharePick({ title: 'Share Your Daily', text: text, name: head.toLowerCase().replace(/[^a-z0-9]+/g, '-'), where: 'daily',
        card: { kicker: head, title: th.name || prettyDate(date), who: th.name ? prettyDate(date) : '', big: fmt(best.total), unit: unit,
          marks: played.map(function (g) { return g.win ? '\u2705' : '\u274C'; }), lines: ['Best of ' + played.length + (played.length === 1 ? ' go' : ' goes')], cta: 'Can you beat it?' } });
      return;
    }
    if (navigator.share) { navigator.share({ text: text }).catch(function () {   }); return; }
    try { navigator.clipboard.writeText(text); } catch (e) {   }
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-dly]');
    if (!a) return;
    var what = a.getAttribute('data-dly');
    if (what === 'how') showHow();
    else if (what === 'remind') remind();
    else if (what === 'close') closeHow();
    else if (what === 'play') { closeHow(); T.dailyStart(); }
    else if (what === 'share') share();
    else if (what === 'board' && window.CastAccount) { closeHow(); CastAccount.openBoards(['1000daily', 'today']); }
    else if (what === 'plus') window.dispatchEvent(new CustomEvent('cast:play', { detail: { game: '1000tries', mode: 'plus' } }));
    else if (what === 'claim' && window.CastAccount && CastAccount.requireSignIn) CastAccount.requireSignIn(null, 'daily-reward');
  });
  



  var syncing = false;
  
  function noteStarts(date, rec) {
    if (window.CastAccount && CastAccount.dailyStarted) CastAccount.dailyStarted(date, '1000tries', rec.goes.length, rec.goes.map(function (g) { return g.started; }));
  }
  function syncFromAccount() {
    if (syncing || !live() || !window.CastAccount || !CastAccount.dailyAccount || !(CastAccount.isSignedIn && CastAccount.isSignedIn())) return;
    var S = T.state && T.state();
    if (S && S.daily && !S.finished) return; 
    var date = today();
    syncing = true;
    CastAccount.dailyAccount(date, '1000tries').then(function (acc) {
      syncing = false;
      var S2 = T.state && T.state();
      if (!acc || date !== today() || (S2 && S2.daily && !S2.finished)) return;
      var rec = load(date), mine = rec.goes.filter(function (g) { return g.done; }).length, theirs = acc.slots.filter(function (s) { return s.g; }).length;
      if (acc.n > rec.goes.length || theirs > mine) {
        
        var goes = acc.slots.map(function (s) { return s.g ? { done: true, total: s.g.total, win: !!s.g.win, started: s.started || undefined, synced: true } : { started: s.started, synced: true }; });
        while (goes.length < acc.n) goes.push({ started: null, synced: true });
        rec.goes = goes.slice(0, MAX_GOES);
        save(date, rec);
        T.dailyRender();
        track('daily_synced', { goes: rec.goes.length });
      } else if (rec.goes.length > acc.n) noteStarts(date, rec); 
    }, function () { syncing = false; });
  }
  document.addEventListener('visibilitychange', function () { if (!document.hidden) syncFromAccount(); });

  
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && pop && !pop.hidden) { closeHow(); return; }
    var c = e.target.closest && e.target.closest('.dly-card[data-dly="how"]');
    if (c && e.target === c && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); showHow(); }
  });
  
  window.addEventListener('cast-account', function (e) { T.dailyRender(); if (e.detail && e.detail.status === 'signed-in') syncFromAccount(); });
  
  window.addEventListener('cast:rewards', function () { T.dailyRender(); });
  window.addEventListener('cast:daily-open', function () { if (live()) showHow(); });
  window.addEventListener('resize', function () { fitTitle(document.querySelector('.dly-card .dly-title')); }); 
  function boot() { T.dailyRender(); syncFromAccount(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  
  window.CastDaily = window.CastDaily || {};
  window.CastDaily.note = 'Every day is themed, with a random draft for each player. Days not planned follow the weekly pattern (club days, a region, an era, Sunday a hard day), and Grand Final anniversaries become On This Day.';
  window.CastDaily.otherTag = 'Standard';
  window.CastDaily.upcoming = function (n) {
    var out = [], p = today().split('-'), d0 = Date.UTC(+p[0], p[1] - 1, +p[2]);
    for (var i = 0; i < (n || 14); i++) {
      var date = new Date(d0 + i * 864e5).toISOString().slice(0, 10), th = themeFor(date);
      out.push({ date: date, n: dayNo(date), pretty: prettyDate(date), icon: th.icon, name: th.name || 'Same Draft', planned: !!th.planned,
        title: th.title + ' (' + fmt(th.target) + '+ tries)', story: th.story || '', hard: !!th.hard, reward: rewardText(th) });
    }
    return out;
  };
})(window.T = window.T || {});
