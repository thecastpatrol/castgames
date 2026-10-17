  










(function (root) {
  'use strict';
  var shared = (typeof module !== 'undefined' && module.exports && typeof require === 'function') ? require('./cast-daily.js') : (root.CAST_DAILY || {});

  
  var DIVS = {
    atl: ['Atlantic', ['celtics', 'nets', 'knicks', '76ers', 'raptors']],
    cen: ['Central', ['bulls', 'cavaliers', 'pistons', 'pacers', 'bucks']],
    se: ['Southeast', ['hawks', 'hornets', 'heat', 'magic', 'wizards']],
    nw: ['Northwest', ['nuggets', 'timberwolves', 'thunder', 'blazers', 'jazz']],
    pac: ['Pacific', ['warriors', 'clippers', 'lakers', 'suns', 'kings']],
    sw: ['Southwest', ['mavericks', 'rockets', 'grizzlies', 'pelicans', 'spurs']]
  };
  var NICK = { celtics: 'Celtics', nets: 'Nets', knicks: 'Knicks', '76ers': '76ers', raptors: 'Raptors', bulls: 'Bulls', cavaliers: 'Cavaliers',
    pistons: 'Pistons', pacers: 'Pacers', bucks: 'Bucks', hawks: 'Hawks', hornets: 'Hornets', heat: 'Heat', magic: 'Magic', wizards: 'Wizards',
    nuggets: 'Nuggets', timberwolves: 'Timberwolves', thunder: 'Thunder', blazers: 'Trail Blazers', jazz: 'Jazz', warriors: 'Warriors',
    clippers: 'Clippers', lakers: 'Lakers', suns: 'Suns', kings: 'Kings', mavericks: 'Mavericks', rockets: 'Rockets', grizzlies: 'Grizzlies',
    pelicans: 'Pelicans', spurs: 'Spurs' };
  var MASCOT = { atl: '🏀', cen: '🏀', se: '🏀', nw: '🏀', pac: '🏀', sw: '🏀' };
  var CLUBS = ['atl', 'nw', 'cen', 'pac', 'se', 'sw']; 
  var RIVALS = { bosla: ['celtics', 'lakers'], chidet: ['bulls', 'pistons'] };
  function anySeason(clubs) { var o = {}; clubs.forEach(function (c) { o[c] = []; }); return o; }

  

  var TARGETS = {
    'div:atl': [81500, 89500], 'div:cen': [81500, 92500], 'div:se': [79000, 90000], 'div:nw': [82500, 91000], 'div:pac': [84000, 95500], 'div:sw': [83500, 92000],
    'rival:bosla': [86500, 100500], 'rival:chidet': [79500, 87000],
    'era:1946': [79000, 85000], 'era:1980': [84000, 89500], 'era:2000': [90500, 101000], 'era:2015': [89000, 101500]
  };
  

  var GOAT_FROM = '2026-10-18';
  var TARGETS_GOAT = { 'rival:bosla': [82000, 89000], 'div:cen': [79500, 86000], 'div:pac': [81500, 90000], 'div:se': [76000, 83500], 'era:2000': [87000, 94000], 'era:2015': [83500, 93000] };
  function tgt(key, hard, date) { var t = date >= GOAT_FROM && TARGETS_GOAT[key] || TARGETS[key]; return t && t[0] ? (hard ? t[1] : t[0]) : (hard ? 100000 : 90000); }

  var REWARDS = { keys: { nba: { legend: 1 } }, wild: { nba: { reveals: 1 } }, freeze: { nba: { freezes: 1 } }, reroll: { nba: { left: 1 } } };
  var WEEK_REWARD = ['reroll', 'freeze', 'keys', 'wild', 'freeze', 'keys', 'wild']; 
  function weekday(date) { var p = date.split('-'); return new Date(Date.UTC(+p[0], p[1] - 1, +p[2])).getUTCDay(); }
  function dayNum(date) { var p = date.split('-'); return Math.round(Date.UTC(+p[0], p[1] - 1, +p[2]) / 864e5); }

  
  var DAYS = {};

  var WEEK = ['div', 'div', 'rival', 'div', 'era', 'div', 'div']; 
  var RIVAL_ORDER = ['bosla', 'chidet'];
  
  var ERAS = [['1946', 'Before 1980', '', 1946, 1979, 'from Bob Pettit and Elgin Baylor to Rick Barry and Bob McAdoo'],
    ['1980', '1980 to 1999', 'From ', 1980, 1999, 'from Larry Bird and Magic Johnson to Charles Barkley and Allen Iverson'],
    ['2000', '2000 to 2014', 'From ', 2000, 2014, 'from Allen Iverson and Tracy McGrady to Dwyane Wade and Chris Paul'],
    ['2015', 'Since 2015', '', 2015, 2025, 'from Stephen Curry and James Harden to Nikola Jokić and Luka Dončić']];
  function list(a) { return a.length > 1 ? a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1] : a.join(''); }
  function orList(a) { return a.length > 1 ? a.slice(0, -1).join(', ') + ' or ' + a[a.length - 1] : a.join(''); }
  function auto(date) {
    var n = dayNum(date), wd = weekday(date), kind = WEEK[wd], week = Math.floor((n + 3) / 7);
    if (kind === 'rival') {
      var r = RIVAL_ORDER[week % RIVAL_ORDER.length], clubs = RIVALS[r], names = clubs.map(function (k) { return NICK[k]; });
      var bl = r === 'bosla';
      return { key: 'rival:' + r, name: bl ? 'Celtics and Lakers Day' : 'Bulls and Pistons Day', short: bl ? 'Celtics and Lakers' : 'Bulls and Pistons', lead: 'With ', icon: '⚔️',
        title: names.join(' and ') + ' Players Only', who: list(names) + ' players',
        story: bl ? 'It’s Celtics and Lakers Day, the NBA’s biggest rivalry. Every player you can draft today has played for Boston or Los Angeles.'
          : 'Chicago and Detroit, the rivalry that ruled the late 1980s. Every player you can draft today has played for the ' + orList(names) + '.',
        g1000: { only: anySeason(clubs) } };
    }
    if (kind === 'era') {
      var e = ERAS[week % ERAS.length], open = e[0] === '2015' ? 'since 2015' : e[0] === '1946' ? 'before 1980' : 'from ' + e[1];
      return { key: 'era:' + e[0], name: e[1], short: e[1], lead: e[2], icon: '🕰️', title: e[1] + ' Only', who: 'players from ' + (e[0] === '2015' ? '2015 on' : e[0] === '1946' ? 'before 1980' : e[1]),
        story: 'How well do you know your NBA history? Every player you can draft today played ' + open + ', ' + e[5] + '.',
        g1000: { years: [e[3], e[4]] } };
    }
    
    var slot = [0, 1, -1, 2, -1, 3, 4][wd], k = CLUBS[(week + slot) % CLUBS.length], dv = DIVS[k], teams = dv[1].map(function (c) { return NICK[c]; });
    return { key: 'div:' + k, name: dv[0] + ' Division Day', short: dv[0] + ' Division', lead: 'With the ', icon: MASCOT[k] || '🏀', title: dv[0] + ' Division Players Only',
      who: dv[0] + ' Division players',
      story: [
        'Think you know the ' + dv[0] + ' Division? Every player you can draft today has played for the ' + orList(teams) + '.',
        'It’s ' + dv[0] + ' Division Day. Can you build a winner from every ' + list(teams) + ' player?',
        dv[0] + ' Division fans, this one’s for you. Every player you can draft today has played in the division, so how high can you go?'
      ][week % 3] + (wd === 0 ? ' It’s Sunday, the hard day, so the bar is higher than usual.' : ''),
      g1000: { only: anySeason(dv[1]) } };
  }

  function day(date) {
    var plan = DAYS[date], t = plan ? JSON.parse(JSON.stringify(plan)) : auto(date);
    t.date = date;
    t.planned = !!plan;
    t.hard = !!(t.hard || (!plan && weekday(date) === 0));
    t.onThisDay = null;
    t.g1000.target = (plan && plan.t) || tgt(t.key, t.hard, date);
    t.g270 = {};
    var rk = t.hard ? 'reroll' : WEEK_REWARD[weekday(date)];
    t.rewardKind = rk;
    t.reward = JSON.parse(JSON.stringify(REWARDS[rk]));
    return t;
  }

  
  var ITEM_USE = { legend: 'Use it in the main mode to swap an offer for a Legends Pick.', reveals: 'Use it in your next draft to see the hidden points.',
    freezes: 'If you miss a day, it keeps your streak alive by itself.', left: 'Use it in your next draft for a fresh roll.', removes: 'Use it to take a player out of your team.' };
  function useText(items) {
    var k = Object.keys(items || {})[0], n = 0;
    Object.keys(items || {}).forEach(function (x) { if (x !== 'freezes') n += +items[x] || 0; });
    return ((k && ITEM_USE[k]) || 'It is in your Vault for your next game.') + (n > 1 ? ' They last 24 hours.' : n ? ' It lasts 24 hours.' : '');
  }

  var api = Object.assign({}, shared, { day: day, finals: [], nick: NICK, mascot: MASCOT, clubs: CLUBS, divisions: DIVS, rivals: RIVALS,
    useText: useText, TARGETS: TARGETS, TARGETS_HARDER: TARGETS });
  if (typeof module !== 'undefined' && module.exports) module.exports = api; 
  else root.CAST_DAILY = api;
})(typeof window !== 'undefined' ? window : globalThis);
