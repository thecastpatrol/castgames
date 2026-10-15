/* global require */ // only on the server, where this file is loaded with require (see below)
/* The racing game's Daily calendar (15 Oct 2026): the racing twin of the shared CAST Daily calendar (js/cast-daily.js,
   loaded first), from the cricket twin's Daily calendar. It keeps the shared rewards, item names and streak ladder, and swaps in
   racing days: jurisdiction days taking turns through the six (NSW, VIC, QLD, SA, WA, NZ), an era day (1983 to 1999,
   2000 to 2012, Since 2013), a Spring Carnival day on Saturdays (Victorian Group 1 wins only), and Sunday as the hard
   jurisdiction day, the same weekly pattern as 1000TRIES. Each player gets their own random draft within the theme.

   CAST_DAILY.day('YYYY-MM-DD') gives the same shape as the shared calendar:
     { date, key, name, short, icon, title, story, who, hard, planned, onThisDay: null,
       g1000: { target, only, years, ds, unit }, reward, rewardKind } */
(function (root) {
  'use strict';
  var shared = (typeof module !== 'undefined' && module.exports && typeof require === 'function') ? require('./cast-daily.js') : (root.CAST_DAILY || {});

  var NICK = { nsw: 'NSW', vic: 'Victoria', qld: 'Queensland', sa: 'South Australia', wa: 'WA', nz: 'New Zealand' };
  var DAY = { nsw: 'Sydney', vic: 'Melbourne', qld: 'Brisbane', sa: 'Adelaide', wa: 'Perth', nz: 'Kiwi' };
  var TRACKS = { nsw: 'Randwick and Rosehill', vic: 'Flemington, Caulfield and Moonee Valley', qld: 'Eagle Farm and Doomben',
    sa: 'Morphettville', wa: 'Ascot', nz: 'Ellerslie, Trentham and Riccarton' };
  var MASCOT = { nsw: '🌉', vic: '🏙️', qld: '☀️', sa: '🍷', wa: '🌅', nz: '🥝' };
  function dayName(c) { return DAY[c]; }
  var CLUBS = ['nsw', 'vic', 'qld', 'nz', 'sa', 'wa'];
  function anySeason(clubs) { var o = {}; clubs.forEach(function (c) { o[c] = []; }); return o; }

  /* Targets (15 Oct 2026): [normal, hard (Sundays)], set like 1000TRIES' Daily since 7 Oct from the real engine with each theme's pool
     (a thoughtful fan's 75th and 90th percentile totals, rounded to 5; the notes stay off the site) */
  var TARGETS = {
    'jur:nsw': [535, 565], 'jur:vic': [520, 560], 'jur:qld': [505, 535], 'jur:sa': [530, 550], 'jur:wa': [320, 330], 'jur:nz': [400, 415],
    'era:1983': [275, 290], 'era:2000': [520, 560], 'era:2013': [530, 565],
    'spring': [185, 195]
  };
  function tgt(key, hard) { var t = TARGETS[key]; return t ? (hard ? t[1] : t[0]) : (hard ? 520 : 500); }

  var REWARDS = { keys: { racing: { legend: 1 } }, wild: { racing: { reveals: 1 } }, freeze: { racing: { freezes: 1 } }, reroll: { racing: { left: 1 } } };
  var WEEK_REWARD = ['reroll', 'freeze', 'keys', 'wild', 'freeze', 'keys', 'wild']; // Sun ... Sat, as the shared calendar
  function weekday(date) { var p = date.split('-'); return new Date(Date.UTC(+p[0], p[1] - 1, +p[2])).getUTCDay(); }
  function dayNum(date) { var p = date.split('-'); return Math.round(Date.UTC(+p[0], p[1] - 1, +p[2]) / 864e5); }

  // The planned days (edit here): { key, name, short, icon, title, who, story, t (target), g1000: { only | years | ds } }
  var DAYS = {};

  var WEEK = ['jur', 'jur', 'jur', 'era', 'jur', 'jur', 'spring']; // Sun ... Sat
  var ERAS = [['1983', '1983 to 1999', 1983, 1999, 'the years of Dittman, Dye, Beadman and the young Damien Oliver'],
    ['2000', '2000 to 2012', 2000, 2012, 'from Northerly and Sunline to Black Caviar'],
    ['2013', 'Since 2013', 2013, 2026, 'the Winx years and the jockeys riding today']];
  function auto(date) {
    var n = dayNum(date), wd = weekday(date), kind = WEEK[wd], week = Math.floor((n + 4) / 7); // weeks run Sunday to Saturday
    if (kind === 'spring') {
      return { key: 'spring', name: 'Spring Carnival', short: 'Spring Carnival', icon: '🌸', title: 'Victorian Wins Only',
        who: 'jockeys with a Victorian Group 1',
        story: 'It’s Spring Carnival day. Every jockey you can draft has won a Group 1 in Victoria, and only their Victorian Group 1 wins count.',
        g1000: { only: anySeason(['vic']), ds: 'vic', unit: 'Victorian Group 1 wins' } };
    }
    if (kind === 'era') {
      var e = ERAS[week % ERAS.length];
      return { key: 'era:' + e[0], name: e[1], short: e[1], icon: '🕰️', title: e[1] + ' Only', who: 'Group 1 winners from ' + e[1],
        story: 'How well do you remember ' + e[1] + '? Every jockey you can draft today won a Group 1 in those years, ' + e[4] + '.',
        g1000: { years: [e[2], e[3]] } };
    }
    // Jurisdiction days: five a week, taking turns through the six
    var slot = [0, 1, 2, -1, 3, 4, -1][wd], k = CLUBS[(week * 5 + slot) % CLUBS.length];
    return { key: 'jur:' + k, name: dayName(k) + ' Day', short: NICK[k], icon: MASCOT[k] || '🏇', title: NICK[k] + ' Group 1 Winners Only',
      who: 'jockeys who have won a Group 1 in ' + NICK[k],
      story: [
        'Think you know your ' + NICK[k] + ' racing? Every jockey you can draft today has won a Group 1 there since 1983.',
        'It’s ' + dayName(k) + ' Day. Can you build a winning card from the jockeys who have won Group 1s at ' + TRACKS[k] + '?',
        NICK[k] + ' racing fans, this one’s for you. Every jockey you can draft has won a Group 1 there, so how high can you go?'
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

  // Where a reward item is used, in the racing game's words
  var ITEM_USE = { legend: 'Use it in the main mode to swap an offer for a Legends Pick.', reveals: 'Use it in your next draft to see the hidden wins.',
    freezes: 'If you miss a day, it keeps your streak alive by itself.', left: 'Use it in your next draft for a fresh roll.', removes: 'Use it to take a jockey off your card.' };
  function useText(items) {
    var k = Object.keys(items || {})[0], n = 0;
    Object.keys(items || {}).forEach(function (x) { if (x !== 'freezes') n += +items[x] || 0; });
    return ((k && ITEM_USE[k]) || 'It is in your Vault for your next game.') + (n > 1 ? ' They last 24 hours.' : n ? ' It lasts 24 hours.' : '');
  }

  var api = Object.assign({}, shared, { day: day, finals: [], nick: NICK, mascot: MASCOT, clubs: CLUBS, cities: {},
    useText: useText, TARGETS: TARGETS, TARGETS_HARDER: TARGETS });
  if (typeof module !== 'undefined' && module.exports) module.exports = api; // the server: its own copy, the shared one untouched
  else root.CAST_DAILY = api;
})(typeof window !== 'undefined' ? window : globalThis);
