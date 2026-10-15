/* global require */ // only on the server, where this file is loaded with require (see below)
/* 777 TDS Daily calendar (15 Oct 2026): the NFL twin of the shared CAST Daily calendar (js/cast-daily.js, loaded first).
   It keeps the shared rewards, item names and streak ladder, and swaps in NFL days: division days taking turns through
   the 8 divisions, a rivalry day (the Packers and the Bears, or the Cowboys and the Eagles), an era day (1999 to 2009,
   2010 to 2019, since 2020; before 1999 is Legends only, so it has no day), and Sunday as the hard division day, the
   same weekly pattern as 1000TRIES. Each player gets their own random draft within the theme. A team counts by
   franchise (the St. Louis Rams are the Rams), any season.

   CAST_DAILY.day('YYYY-MM-DD') gives the same shape as the shared calendar:
     { date, key, name, short, lead, icon, title, story, who, hard, planned, onThisDay: null,
       g1000: { target, only, years }, reward, rewardKind } */
(function (root) {
  'use strict';
  var shared = (typeof module !== 'undefined' && module.exports && typeof require === 'function') ? require('./cast-daily.js') : (root.CAST_DAILY || {});

  // The 8 divisions as they are today, each franchise by its game slug (js/data.js T.CLUBS)
  var DIVS = {
    afce: ['AFC East', ['bills', 'dolphins', 'patriots', 'jets']],
    afcn: ['AFC North', ['ravens', 'bengals', 'browns', 'steelers']],
    afcs: ['AFC South', ['texans', 'colts', 'jaguars', 'titans']],
    afcw: ['AFC West', ['broncos', 'chiefs', 'raiders', 'chargers']],
    nfce: ['NFC East', ['cowboys', 'giants', 'eagles', 'commanders']],
    nfcn: ['NFC North', ['bears', 'lions', 'packers', 'vikings']],
    nfcs: ['NFC South', ['falcons', 'panthers', 'saints', 'buccaneers']],
    nfcw: ['NFC West', ['cardinals', 'rams', '49ers', 'seahawks']]
  };
  var NICK = { bills: 'Bills', dolphins: 'Dolphins', patriots: 'Patriots', jets: 'Jets', ravens: 'Ravens', bengals: 'Bengals', browns: 'Browns',
    steelers: 'Steelers', texans: 'Texans', colts: 'Colts', jaguars: 'Jaguars', titans: 'Titans', broncos: 'Broncos', chiefs: 'Chiefs',
    raiders: 'Raiders', chargers: 'Chargers', cowboys: 'Cowboys', giants: 'Giants', eagles: 'Eagles', commanders: 'Commanders', bears: 'Bears',
    lions: 'Lions', packers: 'Packers', vikings: 'Vikings', falcons: 'Falcons', panthers: 'Panthers', saints: 'Saints', buccaneers: 'Buccaneers',
    cardinals: 'Cardinals', rams: 'Rams', '49ers': '49ers', seahawks: 'Seahawks' };
  var MASCOT = { afce: '🏈', afcn: '🏈', afcs: '🏈', afcw: '🏈', nfce: '🏈', nfcn: '🏈', nfcs: '🏈', nfcw: '🏈' };
  var CLUBS = ['afce', 'nfcn', 'afcw', 'nfce', 'afcn', 'nfcw', 'afcs', 'nfcs']; // the turn order, AFC and NFC in turn
  var RIVALS = { packbears: ['packers', 'bears'], dalphi: ['cowboys', 'eagles'] };
  function anySeason(clubs) { var o = {}; clubs.forEach(function (c) { o[c] = []; }); return o; }

  /* Targets (15 Oct 2026): [normal, hard (Sundays)], set with the real-engine smart-fan simulator on each theme's own
     pool, no Legends and no wildcards as the Daily deals (~/cast-dev/nfl/tools/strat.js, MODE=daily PCT=1; run by
     ~/cast-dev/nfl/tools/daily_targets.sh): the 75th percentile of its totals on a normal day, the 90th on Sunday,
     rounded to 5. Run again for 10 players on 17 Oct 2026 (777 TDS: a 4th receiver), the same percentiles */
  var TARGETS = {
    'div:afce': [670, 735], 'div:afcn': [615, 665], 'div:afcs': [630, 690], 'div:afcw': [635, 705],
    'div:nfce': [600, 650], 'div:nfcn': [580, 635], 'div:nfcs': [580, 625], 'div:nfcw': [700, 755],
    'rival:packbears': [545, 585], 'rival:dalphi': [610, 655],
    'era:1999': [680, 740], 'era:2010': [675, 745], 'era:2020': [630, 685]
  };
  function tgt(key, hard) { var t = TARGETS[key]; return t ? (hard ? t[1] : t[0]) : (hard ? 690 : 630); }

  var REWARDS = { keys: { nfl: { legend: 1 } }, wild: { nfl: { reveals: 1 } }, freeze: { nfl: { freezes: 1 } }, reroll: { nfl: { left: 1 } } };
  var WEEK_REWARD = ['reroll', 'freeze', 'keys', 'wild', 'freeze', 'keys', 'wild']; // Sun ... Sat, as the shared calendar
  function weekday(date) { var p = date.split('-'); return new Date(Date.UTC(+p[0], p[1] - 1, +p[2])).getUTCDay(); }
  function dayNum(date) { var p = date.split('-'); return Math.round(Date.UTC(+p[0], p[1] - 1, +p[2]) / 864e5); }

  // The planned days (edit here): { key, name, short, lead, icon, title, who, story, t (target), g1000: { only | years } }
  var DAYS = {};

  var WEEK = ['div', 'div', 'rival', 'div', 'era', 'div', 'div']; // Sun ... Sat
  var RIVAL_ORDER = ['packbears', 'dalphi'];
  // NFL seasons by the year they kicked off in
  var ERAS = [['1999', '1999 to 2009', 'From ', 1999, 2009, 'from Marshall Faulk and Randy Moss to LaDainian Tomlinson and Terrell Owens'],
    ['2010', '2010 to 2019', 'From ', 2010, 2019, 'from Calvin Johnson and Rob Gronkowski to Adrian Peterson and Marshawn Lynch'],
    ['2020', 'Since 2020', '', 2020, 2026, 'from Derrick Henry and Travis Kelce to Josh Allen and Ja’Marr Chase']];
  function list(a) { return a.length > 1 ? a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1] : a.join(''); }
  function orList(a) { return a.length > 1 ? a.slice(0, -1).join(', ') + ' or ' + a[a.length - 1] : a.join(''); }
  function auto(date) {
    var n = dayNum(date), wd = weekday(date), kind = WEEK[wd], week = Math.floor((n + 3) / 7);
    if (kind === 'rival') {
      var r = RIVAL_ORDER[week % RIVAL_ORDER.length], clubs = RIVALS[r], names = clubs.map(function (k) { return NICK[k]; });
      var gb = r === 'packbears';
      return { key: 'rival:' + r, name: gb ? 'Packers and Bears Day' : 'Cowboys and Eagles Day', short: gb ? 'Packers and Bears' : 'Cowboys and Eagles', lead: 'With ', icon: '⚔️',
        title: names.join(' and ') + ' Players Only', who: list(names) + ' players',
        story: gb ? 'It’s Packers and Bears Day, the NFL’s oldest rivalry. Every player you can draft today has played for Green Bay or Chicago.'
          : 'Dallas and Philadelphia, the NFC East’s fiercest rivalry. Every player you can draft today has played for the ' + orList(names) + '.',
        g1000: { only: anySeason(clubs) } };
    }
    if (kind === 'era') {
      var e = ERAS[week % ERAS.length];
      return { key: 'era:' + e[0], name: e[1], short: e[1], lead: e[2], icon: '🕰️', title: e[1] + ' Only', who: 'players from ' + (e[0] === '2020' ? '2020 on' : e[1]),
        story: 'How well do you know your NFL history? Every player you can draft today played ' + (e[0] === '2020' ? 'since 2020' : 'from ' + e[1]) + ', ' + e[5] + '.',
        g1000: { years: [e[3], e[4]] } };
    }
    // Division days: five a week, taking turns through the 8 divisions
    var slot = [0, 1, -1, 2, -1, 3, 4][wd], k = CLUBS[(week * 5 + slot) % CLUBS.length], dv = DIVS[k], teams = dv[1].map(function (c) { return NICK[c]; });
    return { key: 'div:' + k, name: dv[0] + ' Day', short: dv[0], lead: 'With ', icon: MASCOT[k] || '🏈', title: dv[0] + ' Players Only',
      who: dv[0] + ' players',
      story: [
        'Think you know the ' + dv[0] + '? Every player you can draft today has played for the ' + orList(teams) + '.',
        'It’s ' + dv[0] + ' Day. Can you build a winner from every ' + list(teams) + ' player?',
        dv[0] + ' fans, this one’s for you. Every player you can draft today has played in the division, so how high can you go?'
      ][week % 3] + (wd === 0 ? ' It’s Sunday, the hard day, so the bar is higher than usual.' : ''),
      g1000: { only: anySeason(dv[1]) } };
  }

  function day(date) {
    var plan = DAYS[date], t = plan ? JSON.parse(JSON.stringify(plan)) : auto(date);
    t.date = date;
    t.planned = !!plan;
    t.hard = !!(t.hard || (!plan && weekday(date) === 0));
    t.onThisDay = null;
    t.g1000.target = (plan && plan.t) || tgt(t.key, t.hard);
    t.g270 = {};
    var rk = t.hard ? 'reroll' : WEEK_REWARD[weekday(date)];
    t.rewardKind = rk;
    t.reward = JSON.parse(JSON.stringify(REWARDS[rk]));
    return t;
  }

  // Where a reward item is used, in 777 TDS's words
  var ITEM_USE = { legend: 'Use it in 777+ to swap an offer for a Legends Pick.', reveals: 'Use it in your next draft to see the hidden TDs.',
    freezes: 'If you miss a day, it keeps your streak alive by itself.', left: 'Use it in your next draft for a fresh roll.', removes: 'Use it to take a player out of your team.' };
  function useText(items) {
    var k = Object.keys(items || {})[0], n = 0;
    Object.keys(items || {}).forEach(function (x) { if (x !== 'freezes') n += +items[x] || 0; });
    return ((k && ITEM_USE[k]) || 'It is in your Vault for your next game.') + (n > 1 ? ' They last 24 hours.' : n ? ' It lasts 24 hours.' : '');
  }

  var api = Object.assign({}, shared, { day: day, finals: [], nick: NICK, mascot: MASCOT, clubs: CLUBS, divisions: DIVS, rivals: RIVALS,
    useText: useText, TARGETS: TARGETS, TARGETS_HARDER: TARGETS });
  if (typeof module !== 'undefined' && module.exports) module.exports = api; // the server: its own copy, the shared one untouched
  else root.CAST_DAILY = api;
})(typeof window !== 'undefined' ? window : globalThis);
