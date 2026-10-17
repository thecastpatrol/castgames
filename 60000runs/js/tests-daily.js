  










(function (root) {
  'use strict';
  var shared = (typeof module !== 'undefined' && module.exports && typeof require === 'function') ? require('./cast-daily.js') : (root.CAST_DAILY || {});

  var NICK = { aus: 'Australia', eng: 'England', ind: 'India', sa: 'South Africa', nz: 'New Zealand', wi: 'West Indies', pak: 'Pakistan',
    sl: 'Sri Lanka', ban: 'Bangladesh' };
  var MASCOT = { aus: '🇦🇺', eng: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', ind: '🇮🇳', sa: '🇿🇦', nz: '🇳🇿', wi: '🌴', pak: '🇵🇰', sl: '🇱🇰' };
  
  var FIRST = { aus: 1877, eng: 1877, sa: 1889, wi: 1928, nz: 1930, ind: 1932, pak: 1952, sl: 1982 };
  function dayName(c) { return NICK[c]; }
  var CLUBS = ['aus', 'eng', 'ind', 'sa', 'nz', 'wi', 'pak', 'sl'];
  var RIVALS = { ashes: ['aus', 'eng'], sub: ['ind', 'pak', 'sl', 'ban'] };
  function anySeason(clubs) { var o = {}; clubs.forEach(function (c) { o[c] = []; }); return o; }

  

  var TARGETS = {
    'nation:aus': [46250, 50000], 'nation:eng': [48750, 53500], 'nation:ind': [44000, 48250], 'nation:sa': [32250, 34750],
    'nation:nz': [44250, 47750], 'nation:wi': [43750, 47250], 'nation:pak': [39000, 42000], 'nation:sl': [48500, 51750],
    'rival:ashes': [49250, 54250], 'rival:sub': [45750, 50000],
    'era:pre1946': [23000, 26500], 'era:1946': [43750, 47500], 'era:1980': [52750, 56750], 'era:2000': [54000, 59250]
  };
  


  var AR_FROM = '2026-10-18';
  var TARGETS_AR = {
    'nation:aus': [45750, 49450], 'nation:eng': [48225, 52900], 'nation:ind': [43525, 47725], 'nation:sa': [31900, 34375],
    'nation:nz': [43775, 47225], 'nation:wi': [43275, 46725], 'nation:pak': [38575, 41550], 'nation:sl': [47200, 49325],
    'rival:ashes': [48700, 53650], 'rival:sub': [45250, 49450],
    'era:pre1946': [22750, 26200], 'era:1946': [43275, 46975], 'era:1980': [52175, 56125], 'era:2000': [53400, 58600]
  };
  function tgt(key, hard, date) { var t = date >= AR_FROM && TARGETS_AR[key] || TARGETS[key]; return t ? (hard ? t[1] : t[0]) : (hard ? 50000 : 46000); }

  var REWARDS = { keys: { tests: { legend: 1 } }, wild: { tests: { reveals: 1 } }, freeze: { tests: { freezes: 1 } }, reroll: { tests: { left: 1 } } };
  var WEEK_REWARD = ['reroll', 'freeze', 'keys', 'wild', 'freeze', 'keys', 'wild']; 
  function weekday(date) { var p = date.split('-'); return new Date(Date.UTC(+p[0], p[1] - 1, +p[2])).getUTCDay(); }
  function dayNum(date) { var p = date.split('-'); return Math.round(Date.UTC(+p[0], p[1] - 1, +p[2]) / 864e5); }

  
  var DAYS = {};

  var WEEK = ['nation', 'nation', 'rival', 'nation', 'era', 'nation', 'nation']; 
  var RIVAL_ORDER = ['ashes', 'sub'];
  
  var ERAS = [['pre1946', 'Before 1946', '', 1877, 1945, 'from the first Test in 1877 to the Second World War, the age of Victor Trumper, Jack Hobbs and Wally Hammond'],
    ['1946', '1946 to 1979', 'From ', 1946, 1979, 'from Ray Lindwall and the post-war Australians to Dennis Lillee and Clive Lloyd’s West Indies'],
    ['1980', '1980 to 1999', 'From ', 1980, 1999, 'the age of Malcolm Marshall, Imran Khan, Kapil Dev and Richard Hadlee, and the rise of Shane Warne'],
    ['2000', 'Since 2000', '', 2000, 2026, 'from Muttiah Muralitharan and James Anderson to Joe Root, Steve Smith and Virat Kohli']];
  function list(a) { return a.length > 1 ? a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1] : a.join(''); }
  function orList(a) { return a.length > 1 ? a.slice(0, -1).join(', ') + ' or ' + a[a.length - 1] : a.join(''); }
  function auto(date) {
    var n = dayNum(date), wd = weekday(date), kind = WEEK[wd], week = Math.floor((n + 3) / 7);
    if (kind === 'rival') {
      var r = RIVAL_ORDER[week % RIVAL_ORDER.length], clubs = RIVALS[r], names = clubs.map(function (k) { return NICK[k]; });
      var ashes = r === 'ashes', nm = ashes ? 'Ashes Day' : 'Subcontinent Day';
      return { key: 'rival:' + r, name: nm, short: ashes ? 'The Ashes' : 'The Subcontinent', lead: 'From ', icon: ashes ? '🏺' : '🌏',
        title: ashes ? 'Ashes Players Only' : 'Subcontinent Players Only', who: list(names) + ' players',
        story: ashes ? 'It’s Ashes Day, the oldest rivalry in cricket. Every player you can draft today has played Tests for Australia or England, from the first Test in 1877 to now.'
          : 'Spin, heat and big hundreds. Every player you can draft today has played Tests for ' + orList(names) + '.',
        g1000: { only: anySeason(clubs) } };
    }
    if (kind === 'era') {
      var e = ERAS[week % ERAS.length];
      return { key: 'era:' + e[0], name: e[1], short: e[1], lead: e[2], icon: '🕰️', title: e[1] + ' Only', who: 'players from ' + (e[0] === 'pre1946' ? 'before 1946' : e[0] === '2000' ? '2000 on' : e[1]),
        story: 'How well do you know your Test history? Every player you can draft today played Tests ' + (e[0] === 'pre1946' ? 'before 1946' : e[0] === '2000' ? 'since 2000' : 'from ' + e[1]) + ', ' + e[5] + '.',
        g1000: { years: [e[3], e[4]] } };
    }
    
    var slot = [0, 1, -1, 2, -1, 3, 4][wd], k = CLUBS[(week * 5 + slot) % CLUBS.length];
    return { key: 'nation:' + k, name: dayName(k) + ' Day', short: dayName(k), lead: 'With ', icon: MASCOT[k] || '🏏', title: dayName(k) + ' Players Only',
      who: dayName(k) + ' players',
      story: [
        'Think you know your ' + dayName(k) + ' Test history? Every player you can draft today has played Tests for them, from their first Test in ' + FIRST[k] + ' to now.',
        'It’s ' + dayName(k) + ' Day. Can you build a winner from every ' + dayName(k) + ' Test player in history?',
        dayName(k) + ' fans, this one’s for you. Every player you can draft today has worn the Test cap, so how high can you go?'
      ][week % 3] + (wd === 0 ? ' It’s Sunday, the hard day, so the bar is higher than usual.' : ''),
      g1000: { only: anySeason([k]) } };
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

  
  var ITEM_USE = { legend: 'Use it in 60000+ to swap an offer for a Legends Pick.', reveals: 'Use it in your next draft to see the hidden runs.',
    freezes: 'If you miss a day, it keeps your streak alive by itself.', left: 'Use it in your next draft for a fresh roll.', removes: 'Use it to take a player out of your XI.' };
  function useText(items) {
    var k = Object.keys(items || {})[0], n = 0;
    Object.keys(items || {}).forEach(function (x) { if (x !== 'freezes') n += +items[x] || 0; });
    return ((k && ITEM_USE[k]) || 'It is in your Vault for your next game.') + (n > 1 ? ' They last 24 hours.' : n ? ' It lasts 24 hours.' : '');
  }

  var api = Object.assign({}, shared, { day: day, finals: [], nick: NICK, mascot: MASCOT, clubs: CLUBS, rivals: RIVALS,
    useText: useText, TARGETS: TARGETS, TARGETS_HARDER: TARGETS });
  if (typeof module !== 'undefined' && module.exports) module.exports = api; 
  else root.CAST_DAILY = api;
})(typeof window !== 'undefined' ? window : globalThis);
