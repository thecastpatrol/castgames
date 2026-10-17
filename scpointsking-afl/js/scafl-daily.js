/* global require */ // only on the server, where this file is loaded with require (see below)
/* SC POINTS KING: AFL Daily calendar (17 Oct 2026): the AFL twin of SC POINTS KING's (js/sc-daily.js there), on top of the
   shared CAST Daily calendar (js/cast-daily.js, loaded first). It keeps the shared rewards, item names and streak ladder,
   and swaps in AFL SC days: club days taking turns through the 18 clubs, a season day (one season, every club), a derby
   day (two clubs), an era day, and Sunday as the hard club day, the same weekly pattern as SC POINTS KING. The spins are
   seeded, so everyone's go 1 is the same draft. No Legend Key or GOAT in a Daily.

   CAST_DAILY.day('YYYY-MM-DD') gives the same shape as the shared calendar:
     { date, key, name, short, lead, icon, title, story, who, hard, planned, onThisDay: null,
       g1000: { target, only, years }, reward, rewardKind } */
(function (root) {
  'use strict';
  var shared = (typeof module !== 'undefined' && module.exports && typeof require === 'function') ? require('./cast-daily.js') : (root.CAST_DAILY || {});

  // The 18 clubs' nicknames and emojis (as 4000 GOALS' AFL calendar)
  var NICK = { ad: 'Crows', bl: 'Lions', ca: 'Blues', cw: 'Magpies', es: 'Bombers', fr: 'Dockers', ge: 'Cats', gc: 'Suns', gw: 'Giants',
    hw: 'Hawks', me: 'Demons', nm: 'Kangaroos', pa: 'Power', ri: 'Tigers', sk: 'Saints', sy: 'Swans', wc: 'Eagles', wb: 'Bulldogs' };
  var MASCOT = { ad: '🐦‍⬛', bl: '🦁', ca: '💙', cw: '🖤', es: '🔴', fr: '⚓', ge: '🐱', gc: '☀️', gw: '🧡', hw: '🤎', me: '😈',
    nm: '🦘', pa: '⚡', ri: '🐯', sk: '😇', sy: '🦢', wc: '🦅', wb: '🐶' };
  // A club day's name where the nickname reads badly as a day (as 4000 GOALS: "Bombers Day" sounds like a hijack)
  var DAY_NAME = { es: 'Essendon' };
  function dayName(c) { return DAY_NAME[c] || NICK[c]; }
  // Club days in turn
  var CLUBS = ['cw', 'ca', 'es', 'ri', 'hw', 'ge', 'sy', 'bl', 'wc', 'ad', 'pa', 'fr', 'me', 'nm', 'sk', 'wb', 'gw', 'gc'];
  var DERBIES = [['ad', 'pa', 'The Showdown'], ['wc', 'fr', 'The Western Derby'], ['cw', 'ca', 'The Old Rivals'], ['sy', 'gw', 'The Sydney Derby'],
    ['es', 'cw', 'The Anzac Day Rivals'], ['bl', 'gc', 'The QClash'], ['ge', 'hw', 'Cats and Hawks'], ['ri', 'ca', 'The Season Openers']];
  // One season a day, in turn (every season in the data)
  var SEASONS = [2021, 2012, 2024, 2016, 2009, 2023, 2010, 2018, 2026, 2014, 2007, 2019, 2022, 2011, 2017, 2025, 2008, 2015, 2013, 2020];
  var FIRST = 2007; // the first season in the data (data/seasons.json)
  var ERAS = [['2007', '2007 to 2012', 2007, 2012, 'the first six seasons on the spinner'], ['2013', '2013 to 2019', 2013, 2019, 'through the middle of the 2010s'],
    ['2020', 'Since 2020', 2020, 2026, 'from the short 2020 season to 2026']];
  function anySeason(clubs) { var o = {}; clubs.forEach(function (c) { o[c] = []; }); return o; }
  function orList(a) { return a.length > 1 ? a.slice(0, -1).join(', ') + ' or ' + a[a.length - 1] : a.join(''); }

  /* Targets: [normal, hard (Sundays)], set with the real-engine smart-fan simulator on each theme's own pool, no
     wildcards, as the Daily deals (kept with the game's private notes) */
  var TARGETS = {
    'club:ad': [34500, 35300], 'club:bl': [34050, 34900], 'club:ca': [33600, 34300], 'club:cw': [34050, 34950], 'club:es': [32050, 32850], 'club:fr': [34000, 34700], 'club:gc': [32300, 33350], 'club:ge': [35850, 36550], 'club:gw': [33100, 34200], 'club:hw': [34650, 35550], 'club:me': [32900, 33400], 'club:nm': [34200, 34950], 'club:pa': [33750, 34600], 'club:ri': [33650, 34400], 'club:sk': [35200, 36350], 'club:sy': [36100, 36450], 'club:wb': [35350, 36050], 'club:wc': [32950, 33600],
    'derby:ad-pa': [34500, 35350], 'derby:bl-gc': [34200, 35050], 'derby:cw-ca': [34750, 35600], 'derby:es-cw': [34250, 35100], 'derby:ge-hw': [35800, 36700], 'derby:ri-ca': [34150, 35200], 'derby:sy-gw': [35150, 36050], 'derby:wc-fr': [34100, 34950],
    'season:2007': [36150, 37200], 'season:2008': [35500, 36100], 'season:2009': [34950, 35750], 'season:2010': [34600, 35400], 'season:2011': [35300, 36100], 'season:2012': [34750, 35300], 'season:2013': [34600, 35050], 'season:2014': [34000, 34800], 'season:2015': [34750, 35400], 'season:2016': [34300, 35100], 'season:2017': [34050, 34850], 'season:2018': [34600, 35250], 'season:2019': [35050, 36100], 'season:2020': [28000, 28700], 'season:2021': [35100, 35750], 'season:2022': [34650, 35700], 'season:2023': [35600, 36450], 'season:2024': [36650, 37650], 'season:2025': [37050, 37950], 'season:2026': [35950, 36950],
    'era:2007': [35250, 36450], 'era:2013': [34300, 35150], 'era:2020': [35600, 36200]
  };
  function tgt(key, hard) { var t = TARGETS[key]; return t && t[0] ? (hard ? t[1] : t[0]) : (hard ? 35300 : 34500); }

  var REWARDS = { keys: { scafl: { legend: 1 } }, wild: { scafl: { reveals: 1 } }, freeze: { scafl: { freezes: 1 } }, reroll: { scafl: { left: 1 } } };
  var WEEK_REWARD = ['reroll', 'freeze', 'keys', 'wild', 'freeze', 'keys', 'wild']; // Sun ... Sat, as the shared calendar
  function weekday(date) { var p = date.split('-'); return new Date(Date.UTC(+p[0], p[1] - 1, +p[2])).getUTCDay(); }
  function dayNum(date) { var p = date.split('-'); return Math.round(Date.UTC(+p[0], p[1] - 1, +p[2]) / 864e5); }

  // The planned days (edit here): { key, name, short, lead, icon, title, who, story, t (target), g1000: { only | years } }
  var DAYS = {};

  var WEEK = ['club', 'club', 'club', 'season', 'club', 'era', 'derby']; // Sun ... Sat
  function auto(date) {
    var n = dayNum(date), wd = weekday(date), kind = WEEK[wd], week = Math.floor((n + 3) / 7);
    if (kind === 'derby') {
      var dv = DERBIES[week % DERBIES.length], names = [NICK[dv[0]], NICK[dv[1]]];
      return { key: 'derby:' + dv[0] + '-' + dv[1], name: dv[2], short: names.join(' and '), lead: 'With ', icon: '⚔️',
        title: names.join(' and ') + ' Seasons Only', who: names.join(' and ') + ' seasons',
        story: dv[2] + ': every season you can draft today was played for the ' + orList(names) + '. Pick the best of both.',
        g1000: { only: anySeason([dv[0], dv[1]]) } };
    }
    if (kind === 'season') {
      var y = SEASONS[week % SEASONS.length];
      return { key: 'season:' + y, name: 'The ' + y + ' Season', short: y + ' Only', lead: 'From ', icon: '📅', title: 'The ' + y + ' Season Only',
        who: y + ' seasons', story: 'One season, every club: every player you can draft today played in ' + y + '. How well do you remember it?',
        g1000: { years: [y, y] } };
    }
    if (kind === 'era') {
      var e = ERAS[week % ERAS.length], since = e[0] === '2020';
      return { key: 'era:' + e[0], name: e[1], short: e[1], lead: since ? '' : 'From ', icon: '🕰️', title: e[1] + ' Only', who: 'seasons ' + (since ? 'since 2020' : 'from ' + e[1]),
        story: 'Every season you can draft today was played ' + (since ? 'since 2020' : 'from ' + e[1]) + ', ' + e[4] + '.',
        g1000: { years: [e[2], e[3]] } };
    }
    // Club days: four a week, taking turns through the clubs (a week starts one club on, so a Sunday and the Monday
    // after never share one)
    var slot = [0, 1, 2, -1, 3, -1, -1][wd], k = CLUBS[(week * 4 + slot) % CLUBS.length], nick = NICK[k], dn = dayName(k);
    return { key: 'club:' + k, name: dn + ' Day', short: dn, lead: 'With ', icon: MASCOT[k] || '🏉', title: nick + ' Seasons Only',
      who: nick + ' seasons',
      story: [
        'It’s ' + dn + ' Day. Every season you can draft today was played for the ' + nick + ', from ' + FIRST + ' to 2026.',
        'Think you know your ' + nick + '? Every season on the spinner today was played for the ' + nick + '.',
        nick + ' fans, this one’s for you. Every season you can draft today was played for the ' + nick + ', so how high can you go?'
      ][week % 3] + (wd === 0 ? ' It’s Sunday, the hard day, so the bar is higher than usual.' : ''),
      g1000: { only: anySeason([k]) } };
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

  var ITEM_USE = { legend: 'Use it in Classic to swap a spin for a Legends Pick.', reveals: 'Use it in your next draft to see the SC points for a whole spin.',
    freezes: 'If you miss a day, it keeps your streak alive by itself.', left: 'Use it in your next draft for a fresh spin.', removes: 'Use it to take a player out of your 18.' };
  function useText(items) {
    var k = Object.keys(items || {})[0], n = 0;
    Object.keys(items || {}).forEach(function (x) { if (x !== 'freezes') n += +items[x] || 0; });
    return ((k && ITEM_USE[k]) || 'It is in your Vault for your next game.') + (n > 1 ? ' They last 24 hours.' : n ? ' It lasts 24 hours.' : '');
  }

  var api = Object.assign({}, shared, { day: day, finals: [], nick: NICK, mascot: MASCOT, clubs: CLUBS, derbies: DERBIES, seasons: SEASONS, eras: ERAS,
    useText: useText, TARGETS: TARGETS, TARGETS_HARDER: TARGETS });
  if (typeof module !== 'undefined' && module.exports) module.exports = api; // the server: its own copy, the shared one untouched
  else root.CAST_DAILY = api;
})(typeof window !== 'undefined' ? window : globalThis);
